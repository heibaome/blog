"use client";
import { getCsrfHeaders } from "@/lib/csrf-client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";
import { Button } from "@/components/ui/Button";
import { LogIn, RefreshCw, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaSvg, setCaptchaSvg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadCaptcha() {
    try {
      const res = await fetch("/api/auth/captcha");
      const data = await res.json();
      setCaptchaToken(data.token);
      setCaptchaSvg(data.svg);
      setCaptchaAnswer("");
    } catch {}
  }

  useEffect(() => {
    loadCaptcha();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest", ...getCsrfHeaders() },
        body: JSON.stringify({ username, password, captchaToken, captchaAnswer }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.data.user);
        window.location.href = "/admin/dashboard";
      } else {
        setError(data.error || "登录失败");
        loadCaptcha();
      }
    } catch {
      setError("网络错误");
      loadCaptcha();
    } finally {
      setLoading(false);
    }
  }

  const bgPage = "#1c1917";
  const bgCard = "#242019";
  const bgInput = "#2c2824";
  const border = "#3d3733";
  const textWhite = "#fafaf9";
  const textMuted = "#78716c";
  const accent = "#c0483e";

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bgPage, fontFamily: '"Source Han Sans SC", "Noto Sans SC", sans-serif' }}>
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-5"
            style={{ background: "rgba(192, 72, 62, 0.1)" }}
          >
            <Shield size={26} style={{ color: accent }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: textWhite }}>后台管理</h1>
          <p className="text-sm mt-1.5" style={{ color: textMuted }}>登录以管理你的博客</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl p-6 space-y-5" style={{ background: bgCard }}>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: textMuted }}>用户名或邮箱</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="用户名 / 邮箱地址" autoComplete="username"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors"
              style={{ background: bgInput, border: `1px solid ${border}`, color: textWhite }}
              required
            />
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: textMuted }}>密码</label>
            <input
              type="password" autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors"
              style={{ background: bgInput, border: `1px solid ${border}`, color: textWhite }}
              required
            />
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: textMuted }}>验证码</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                placeholder="输入验证码"
                maxLength={5}
                className="flex-1 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors"
                style={{ background: bgInput, border: `1px solid ${border}`, color: textWhite }}
                required
              />
              {captchaSvg && (
                <img
                  src={captchaSvg}
                  alt="验证码"
                  onClick={loadCaptcha}
                  className="cursor-pointer rounded-xl flex-shrink-0"
                  style={{ border: `1px solid ${border}` }}
                  width={140}
                  height={48}
                />
              )}
              <button
                type="button"
                onClick={loadCaptcha}
                className="p-2 transition-colors"
                style={{ color: textMuted }}
                title="刷新验证码"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            <p className="text-xs mt-1.5" style={{ color: "#57534e" }}>点击图片或刷新按钮更换验证码</p>
          </div>

          {error && (
            <div className="text-sm px-3.5 py-2.5 rounded-xl" style={{ color: "#fca5a5", background: "rgba(220, 38, 38, 0.1)" }}>
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full rounded-xl py-2.5">
            <LogIn size={14} />
            登录
          </Button>
        </form>
      </div>
    </div>
  );
}
