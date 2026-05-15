"use client";
import { getCsrfHeaders } from "@/lib/csrf-client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks";
import { Button } from "@/components/ui/Button";
import { Save, User, Mail, KeyRound, AtSign, ShieldCheck } from "lucide-react";

import { adminTheme as c } from "@/shared/admin-theme";

const inputStyle = { background: c.input, border: `1px solid ${c.border}`, color: c.white };
const inputClass = "w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none";

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // 邮箱绑定状态
  const [boundEmail, setBoundEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [sendingEmailCode, setSendingEmailCode] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");
  const [emailMsgType, setEmailMsgType] = useState<"success" | "error">("error");
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);

  // 安全验证状态（统一验证入口）
  const [securityVerified, setSecurityVerified] = useState(false);
  const [securityCode, setSecurityCode] = useState("");
  const [sendingSecurityCode, setSendingSecurityCode] = useState(false);
  const [verifyingSecurity, setVerifyingSecurity] = useState(false);
  const [securityMsg, setSecurityMsg] = useState("");
  const [securityMsgType, setSecurityMsgType] = useState<"success" | "error">("error");
  const [securityCodeSent, setSecurityCodeSent] = useState(false);
  const [securityCountdown, setSecurityCountdown] = useState(0);

  // 修改用户名状态
  const [newUsername, setNewUsername] = useState("");
  const [updatingUsername, setUpdatingUsername] = useState(false);
  const [usernameMsg, setUsernameMsg] = useState("");
  const [usernameMsgType, setUsernameMsgType] = useState<"success" | "error">("error");
  const [usernameError, setUsernameError] = useState("");

  // 修改密码状态
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordMsgType, setPasswordMsgType] = useState<"success" | "error">("error");

  useEffect(() => {
    if (user?.displayName) setDisplayName(user.displayName);
    if (user?.email) setBoundEmail(user.email);
  }, [user]);

  // 通用倒计时
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    if (emailCountdown > 0) {
      const t = setInterval(() => setEmailCountdown((p) => p <= 1 ? (clearInterval(t), 0) : p - 1), 1000);
      timers.push(t);
    }
    if (securityCountdown > 0) {
      const t = setInterval(() => setSecurityCountdown((p) => p <= 1 ? (clearInterval(t), 0) : p - 1), 1000);
      timers.push(t);
    }
    return () => timers.forEach(clearInterval);
  }, [emailCountdown, securityCountdown]);

  // ===== 邮箱绑定 =====
  async function handleSendEmailCode() {
    const email = newEmail.trim();
    if (!email) { setEmailMsg("请先填写邮箱"); setEmailMsgType("error"); return; }
    setSendingEmailCode(true);
    setEmailMsg("");
    try {
      const res = await fetch("/api/auth/send-email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest", ...getCsrfHeaders() },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (res.ok) { setEmailCodeSent(true); setEmailCountdown(60); setEmailMsg("验证码已发送"); setEmailMsgType("success"); }
      else { setEmailMsg(json.error || "发送失败"); setEmailMsgType("error"); }
    } catch { setEmailMsg("网络错误"); setEmailMsgType("error"); }
    finally { setSendingEmailCode(false); }
  }

  async function handleVerifyAndBind() {
    if (emailCode.length !== 6) { setEmailMsg("请输入6位验证码"); setEmailMsgType("error"); return; }
    setVerifyingEmail(true);
    setEmailMsg("");
    try {
      const res = await fetch("/api/auth/bind-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest", ...getCsrfHeaders() },
        body: JSON.stringify({ email: newEmail.trim(), code: emailCode }),
      });
      const json = await res.json();
      if (res.ok) {
        setBoundEmail(json.data.email);
        setNewEmail(""); setEmailCode(""); setEmailCodeSent(false); setEmailCountdown(0);
        setEmailMsg("邮箱绑定成功！"); setEmailMsgType("success");
        setUser((prev: any) => prev ? { ...prev, email: json.data.email } : prev);
      } else { setEmailMsg(json.error || "验证失败"); setEmailMsgType("error"); }
    } catch { setEmailMsg("网络错误"); setEmailMsgType("error"); }
    finally { setVerifyingEmail(false); }
  }

  // ===== 安全验证（统一入口） =====
  async function handleSendSecurityCode() {
    if (!boundEmail) { setSecurityMsg("请先绑定邮箱"); setSecurityMsgType("error"); return; }
    setSendingSecurityCode(true);
    setSecurityMsg("");
    try {
      const res = await fetch("/api/auth/send-email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest", ...getCsrfHeaders() },
        body: JSON.stringify({ email: boundEmail }),
      });
      const json = await res.json();
      if (res.ok) { setSecurityCodeSent(true); setSecurityCountdown(60); setSecurityMsg("验证码已发送至 " + boundEmail); setSecurityMsgType("success"); }
      else { setSecurityMsg(json.error || "发送失败"); setSecurityMsgType("error"); }
    } catch { setSecurityMsg("网络错误"); setSecurityMsgType("error"); }
    finally { setSendingSecurityCode(false); }
  }

  async function handleVerifySecurity() {
    if (securityCode.length !== 6) { setSecurityMsg("请输入6位验证码"); setSecurityMsgType("error"); return; }
    setVerifyingSecurity(true);
    setSecurityMsg("");
    try {
      const res = await fetch("/api/auth/update-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest", ...getCsrfHeaders() },
        body: JSON.stringify({ type: "verify-email", code: securityCode }),
      });
      const json = await res.json();
      if (res.ok) {
        setSecurityVerified(true);
        setSecurityMsg("验证通过，你现在可以修改用户名和密码"); setSecurityMsgType("success");
      } else { setSecurityMsg(json.error || "验证失败"); setSecurityMsgType("error"); }
    } catch { setSecurityMsg("网络错误"); setSecurityMsgType("error"); }
    finally { setVerifyingSecurity(false); }
  }

  // ===== 保存显示名称 =====
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest", ...getCsrfHeaders() },
        body: JSON.stringify({ displayName }),
      });
      const data = await res.json();
      if (res.ok) { setUser((prev: any) => prev ? { ...prev, displayName: data.data.displayName } : prev); setMessage("保存成功！"); }
      else { setMessage(data.error || "保存失败"); }
    } catch { setMessage("保存失败"); } finally { setSaving(false); }
  }

  // ===== 修改用户名 =====
  function validateUsernameInput(value: string) {
    if (!value) return "";
    if (value.length < 2) return "用户名至少2位";
    if (value.length > 30) return "用户名不能超过30位";
    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(value)) return "只能包含字母、数字、下划线和中文";
    return "";
  }

  async function handleUpdateUsername() {
    if (!newUsername.trim()) { setUsernameMsg("请输入新用户名"); setUsernameMsgType("error"); return; }
    if (usernameError) return;
    setUpdatingUsername(true);
    setUsernameMsg("");
    try {
      const res = await fetch("/api/auth/update-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest", ...getCsrfHeaders() },
        body: JSON.stringify({ type: "username", sessionVerified: true, username: newUsername.trim() }),
      });
      const json = await res.json();
      if (res.ok) {
        setUser((prev: any) => prev ? { ...prev, username: json.data.username } : prev);
        setNewUsername(""); setUsernameMsg("用户名修改成功！"); setUsernameMsgType("success");
      } else { setUsernameMsg(json.error || "修改失败"); setUsernameMsgType("error"); }
    } catch { setUsernameMsg("网络错误"); setUsernameMsgType("error"); }
    finally { setUpdatingUsername(false); }
  }

  // ===== 修改密码 =====
  async function handleUpdatePassword() {
    if (!oldPassword) { setPasswordMsg("请输入旧密码"); setPasswordMsgType("error"); return; }
    if (newPassword.length < 6) { setPasswordMsg("新密码至少6位"); setPasswordMsgType("error"); return; }
    if (newPassword !== confirmPassword) { setPasswordMsg("两次输入的新密码不一致"); setPasswordMsgType("error"); return; }
    setUpdatingPassword(true);
    setPasswordMsg("");
    try {
      const res = await fetch("/api/auth/update-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest", ...getCsrfHeaders() },
        body: JSON.stringify({ type: "password", sessionVerified: true, oldPassword, newPassword }),
      });
      const json = await res.json();
      if (res.ok) {
        setPasswordMsg("密码修改成功，即将跳转到登录页..."); setPasswordMsgType("success");
        setOldPassword(""); setNewPassword(""); setConfirmPassword("");
        setSecurityVerified(false); setSecurityCodeSent(false); setSecurityCode("");
        setTimeout(() => { window.location.href = "/admin/login"; }, 3000);
      } else { setPasswordMsg(json.error || "修改失败"); setPasswordMsgType("error"); }
    } catch { setPasswordMsg("网络错误"); setPasswordMsgType("error"); }
    finally { setUpdatingPassword(false); }
  }

  const VerifiedBadge = () => (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: "#16a34a20", color: "#4ade80" }}>
      <ShieldCheck size={12} /> 已验证
    </span>
  );

  return (
    <div className="animate-fade-in max-w-lg">
      <h1 className="text-xl font-bold mb-6" style={{ color: c.white }}>个人设置</h1>

      <form onSubmit={handleSaveProfile} className="space-y-5">
        {/* 账户信息 */}
        <div className="rounded-xl p-5" style={{ background: c.card }}>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: c.secondary }}>
            <User size={16} /> 账户信息
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: c.muted }}>用户名</label>
              <div className="px-3.5 py-2.5 rounded-xl text-sm font-mono" style={{ ...inputStyle, opacity: 0.6 }}>{user?.username || "—"}</div>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: c.muted }}>角色</label>
              <div className="px-3.5 py-2.5 rounded-xl text-sm" style={{ ...inputStyle, opacity: 0.6 }}>
                {user?.role === "admin" ? "👑 管理员" : user?.role || "—"}
              </div>
            </div>
          </div>
        </div>

        {/* 邮箱绑定 */}
        <div className="rounded-xl p-5" style={{ background: c.card }}>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: c.secondary }}>
            <Mail size={16} /> 邮箱绑定
          </h2>

          {boundEmail ? (
            <>
              <div className="mb-3">
                <label className="block text-xs mb-1.5" style={{ color: c.muted }}>当前绑定邮箱</label>
                <div className="px-3.5 py-2.5 rounded-xl text-sm font-mono" style={{ ...inputStyle, opacity: 0.6 }}>{boundEmail}</div>
              </div>
              {!emailCodeSent ? (
                <div className="space-y-2">
                  <label className="block text-xs mb-1.5" style={{ color: c.muted }}>新邮箱地址</label>
                  <div className="flex gap-2">
                    <input type="email" value={newEmail} onChange={(e) => { setNewEmail(e.target.value); setEmailMsg(""); }}
                      placeholder="输入新的邮箱地址" className={inputClass + " flex-1"} style={inputStyle} />
                    <Button type="button" variant="secondary" size="sm" onClick={handleSendEmailCode}
                      disabled={sendingEmailCode || !newEmail.trim()}>
                      {sendingEmailCode ? "发送中..." : "发送验证码"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input type="text" value={emailCode}
                      onChange={(e) => { setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setEmailMsg(""); }}
                      placeholder="输入6位验证码" maxLength={6} inputMode="numeric"
                      className={inputClass + " flex-1 max-w-[180px]"} style={inputStyle} />
                    <Button type="button" size="sm" onClick={handleVerifyAndBind}
                      disabled={verifyingEmail || emailCode.length !== 6}>
                      {verifyingEmail ? "验证中..." : "验证并换绑"}
                    </Button>
                    {emailCountdown > 0 && <span className="flex items-center text-xs" style={{ color: c.muted }}>{emailCountdown}s</span>}
                  </div>
                  {emailCountdown === 0 && (
                    <button type="button" onClick={handleSendEmailCode} className="text-xs hover:underline" style={{ color: c.accent }}>重新发送</button>
                  )}
                  <button type="button" onClick={() => { setNewEmail(""); setEmailCode(""); setEmailCodeSent(false); setEmailCountdown(0); setEmailMsg(""); }}
                    className="text-xs hover:underline ml-3" style={{ color: c.muted }}>取消</button>
                </div>
              )}
            </>
          ) : (
            <>
              {!emailCodeSent ? (
                <div className="space-y-2">
                  <label className="block text-xs mb-1.5" style={{ color: c.muted }}>邮箱地址</label>
                  <div className="flex gap-2">
                    <input type="email" value={newEmail} onChange={(e) => { setNewEmail(e.target.value); setEmailMsg(""); }}
                      placeholder="your@email.com" className={inputClass + " flex-1"} style={inputStyle} />
                    <Button type="button" variant="secondary" size="sm" onClick={handleSendEmailCode}
                      disabled={sendingEmailCode || !newEmail.trim()}>
                      {sendingEmailCode ? "发送中..." : "发送验证码"}
                    </Button>
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: "#57534e" }}>绑定邮箱后可用于邮箱登录和安全验证（支持 QQ、Gmail、163 邮箱）</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input type="text" value={emailCode}
                      onChange={(e) => { setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setEmailMsg(""); }}
                      placeholder="输入6位验证码" maxLength={6} inputMode="numeric"
                      className={inputClass + " flex-1 max-w-[180px]"} style={inputStyle} />
                    <Button type="button" size="sm" onClick={handleVerifyAndBind}
                      disabled={verifyingEmail || emailCode.length !== 6}>
                      {verifyingEmail ? "验证中..." : "验证并绑定"}
                    </Button>
                    {emailCountdown > 0 && <span className="flex items-center text-xs" style={{ color: c.muted }}>{emailCountdown}s</span>}
                  </div>
                  {emailCountdown === 0 && (
                    <button type="button" onClick={handleSendEmailCode} className="text-xs hover:underline" style={{ color: c.accent }}>重新发送</button>
                  )}
                  <button type="button" onClick={() => { setNewEmail(""); setEmailCode(""); setEmailCodeSent(false); setEmailCountdown(0); setEmailMsg(""); }}
                    className="text-xs hover:underline ml-3" style={{ color: c.muted }}>取消</button>
                </div>
              )}
            </>
          )}
          {emailMsg && <p className="text-xs mt-2" style={{ color: emailMsgType === "success" ? "#4ade80" : "#f87171" }}>{emailMsg}</p>}
        </div>

        {/* 安全验证（统一入口） */}
        {!boundEmail ? (
          <div className="rounded-xl p-5" style={{ background: c.card }}>
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: c.secondary }}>
              <ShieldCheck size={16} /> 安全验证
            </h2>
            <p className="text-xs" style={{ color: c.muted }}>请先绑定邮箱后再修改用户名或密码</p>
          </div>
        ) : !securityVerified ? (
          <div className="rounded-xl p-5" style={{ background: c.card, borderColor: "#c0483e30", borderWidth: 1 }}>
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: c.secondary }}>
              <ShieldCheck size={16} /> 安全验证
            </h2>
            <p className="text-xs mb-3" style={{ color: c.muted }}>
              修改用户名或密码前，需要先验证你的邮箱身份
            </p>
            {!securityCodeSent ? (
              <Button type="button" variant="secondary" size="sm" onClick={handleSendSecurityCode}
                disabled={sendingSecurityCode || !boundEmail}>
                {sendingSecurityCode ? "发送中..." : "发送验证码到 " + boundEmail}
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input type="text" value={securityCode}
                    onChange={(e) => { setSecurityCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setSecurityMsg(""); }}
                    placeholder="输入6位验证码" maxLength={6} inputMode="numeric"
                    className={inputClass + " flex-1 max-w-[180px]"} style={inputStyle} />
                  <Button type="button" size="sm" onClick={handleVerifySecurity}
                    disabled={verifyingSecurity || securityCode.length !== 6}>
                    {verifyingSecurity ? "验证中..." : "验证"}
                  </Button>
                  {securityCountdown > 0 && <span className="flex items-center text-xs" style={{ color: c.muted }}>{securityCountdown}s</span>}
                </div>
                {securityCountdown === 0 && (
                  <button type="button" onClick={handleSendSecurityCode} className="text-xs hover:underline" style={{ color: c.accent }}>重新发送</button>
                )}
              </div>
            )}
            {securityMsg && <p className="text-xs mt-2" style={{ color: securityMsgType === "success" ? "#4ade80" : "#f87171" }}>{securityMsg}</p>}
          </div>
        ) : (
          <>
            {/* 已验证：显示修改用户名和密码 */}
            <div className="rounded-xl p-5" style={{ background: c.card }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: c.secondary }}>
                  <AtSign size={16} /> 修改用户名
                </h2>
                <VerifiedBadge />
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: c.muted }}>新用户名</label>
                  <input type="text" value={newUsername}
                    onChange={(e) => {
                      setNewUsername(e.target.value);
                      setUsernameMsg("");
                      setUsernameError(validateUsernameInput(e.target.value));
                    }}
                    placeholder="输入新用户名（2-30位）" maxLength={30}
                    className={inputClass} style={{ ...inputStyle, borderColor: usernameError ? "#f87171" : c.border }} />
                  {usernameError && <p className="text-xs mt-1" style={{ color: "#f87171" }}>{usernameError}</p>}
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={handleUpdateUsername}
                  disabled={updatingUsername || !newUsername.trim() || !!usernameError}>
                  {updatingUsername ? "提交中..." : "确认修改"}
                </Button>
                {usernameMsg && <p className="text-xs mt-1" style={{ color: usernameMsgType === "success" ? "#4ade80" : "#f87171" }}>{usernameMsg}</p>}
              </div>
            </div>

            <div className="rounded-xl p-5" style={{ background: c.card }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: c.secondary }}>
                  <KeyRound size={16} /> 修改密码
                </h2>
                <VerifiedBadge />
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: c.muted }}>旧密码</label>
                  <input type="password" value={oldPassword}
                    onChange={(e) => { setOldPassword(e.target.value); setPasswordMsg(""); }}
                    placeholder="输入当前密码"
                    className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: c.muted }}>新密码</label>
                  <input type="password" value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPasswordMsg(""); }}
                    placeholder="至少6位" maxLength={100}
                    className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: c.muted }}>确认新密码</label>
                  <input type="password" value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setPasswordMsg(""); }}
                    placeholder="再次输入新密码" maxLength={100}
                    className={inputClass} style={inputStyle} />
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={handleUpdatePassword}
                  disabled={updatingPassword}>
                  {updatingPassword ? "提交中..." : "确认修改"}
                </Button>
                {passwordMsg && <p className="text-xs mt-1" style={{ color: passwordMsgType === "success" ? "#4ade80" : "#f87171" }}>{passwordMsg}</p>}
              </div>
            </div>
          </>
        )}

        {/* 对外展示 */}
        <div className="rounded-xl p-5" style={{ background: c.card }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: c.secondary }}>对外展示</h2>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: c.muted }}>显示名称</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              placeholder="对外展示的名称（如：博主）" maxLength={20}
              className={inputClass} style={inputStyle} />
            <p className="text-xs mt-1.5" style={{ color: "#57534e" }}>文章和评论中将显示此名称，管理员会自动附加 👑 标识</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving}>
            <Save size={14} /> 保存
          </Button>
          {message && (
            <span className="text-sm" style={{ color: message.includes("成功") ? "#4ade80" : "#f87171" }}>
              {message}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
