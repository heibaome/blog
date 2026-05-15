"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { formatRelative } from "@/lib/date";
import { MessageCircle, Send, User } from "lucide-react";
import { getCsrfHeaders } from "@/lib/csrf-client";
import { useLocale } from "@/components/providers/LocaleProvider";
import { ALLOWED_EMAIL_DOMAINS } from "@/shared/constants";
import { StaggerList, StaggerItem } from "@/components/motion/ScrollReveal";

interface Comment {
  id: string;
  content: string;
  authorName: string | null;
  createdAt: string;
  user: { id: string; displayName: string | null; username: string; avatar: string | null; role: string } | null;
  replies: Comment[];
}

/** 最大可视嵌套深度（两级：顶级 + 回复） */
const MAX_DEPTH = 1;

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { t, locale } = useLocale();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [replyTarget, setReplyTarget] = useState<{ id: string; authorName: string } | null>(null);

  // 邮箱验证状态
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emailError, setEmailError] = useState("");

  // 图形验证码状态
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaSvg, setCaptchaSvg] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch("/api/comments?postId=" + postId);
      const json = await res.json();
      if (json.data) { setComments(json.data); setLoadError(false); }
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  async function loadCaptcha() {
    try {
      const res = await fetch("/api/auth/captcha");
      const data = await res.json();
      setCaptchaToken(data.token);
      setCaptchaSvg(data.svg);
      setCaptchaAnswer("");
      setCaptchaError("");
    } catch {
      setCaptchaError("验证码加载失败，点击图片重试");
    }
  }

  useEffect(() => {
    fetchComments();
    loadCaptcha();
    checkExistingSession();
  }, [fetchComments]);

  async function checkExistingSession() {
    try {
      const res = await fetch("/api/comments/verify-status");
      if (res.ok) {
        const data = await res.json();
        if (data.data?.verified && data.data?.email) {
          setAuthorEmail(data.data.email);
          setEmailVerified(true);
        }
      }
    } catch { /* 静默失败 */ }
  }

  useEffect(() => {
    if (emailVerified && authorEmail) return;
    setEmailVerified(false);
    setVerifyCode("");
    setCodeSent(false);
    setEmailError("");
  }, [authorEmail]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  async function handleSendCode() {
    const email = authorEmail.trim();
    if (!email) { setEmailError("请先填写邮箱"); return; }
    if (!ALLOWED_EMAIL_DOMAINS.some((d) => email.toLowerCase().endsWith(d))) {
      setEmailError("仅支持 QQ邮箱、Gmail、网易163邮箱");
      return;
    }
    setSendingCode(true);
    setEmailError("");
    try {
      const res = await fetch("/api/comments/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest", ...getCsrfHeaders() },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (res.ok) { setCodeSent(true); setCountdown(60); }
      else { setEmailError(json.error || "发送失败"); }
    } catch { setEmailError("网络错误"); }
    finally { setSendingCode(false); }
  }

  async function handleVerifyCode() {
    if (verifyCode.length !== 6) { setEmailError("请输入6位验证码"); return; }
    setVerifying(true);
    setEmailError("");
    try {
      const res = await fetch("/api/comments/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest", ...getCsrfHeaders() },
        body: JSON.stringify({ email: authorEmail.trim(), code: verifyCode }),
      });
      const json = await res.json();
      if (res.ok && json.data?.verified) { setEmailVerified(true); setCodeSent(false); }
      else { setEmailError(json.error || "验证失败"); }
    } catch { setEmailError("网络错误"); }
    finally { setVerifying(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    if (!emailVerified) { setSubmitError("请先验证邮箱"); return; }
    setSubmitting(true);
    setCaptchaError("");
    setSubmitError("");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest", ...getCsrfHeaders() },
        body: JSON.stringify({
          postId, content: content.trim(), parentId: replyTarget?.id ?? null,
          authorName: authorName.trim() || undefined, authorEmail: authorEmail.trim(),
          captchaToken, captchaAnswer,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setContent(""); setReplyTarget(null); setCaptchaAnswer("");
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 5000);
        await fetchComments();
        await loadCaptcha();
      } else if (res.status === 429) { setSubmitError("评论过于频繁，请稍后再试"); }
      else if (json.error?.includes?.("验证码") || json.error?.includes?.("captcha")) {
        setCaptchaError(json.error); await loadCaptcha();
      } else if (json.error?.includes?.("邮箱验证")) { setEmailError(json.error); setEmailVerified(false); }
      else { setSubmitError(json.error || "提交失败"); await loadCaptcha(); }
    } catch { setSubmitError("网络错误"); }
    finally { setSubmitting(false); }
  }

  /** 计算所有评论总数（含嵌套） */
  function countAll(arr: Comment[]): number {
    let n = 0;
    for (const c of arr) { n += 1 + countAll(c.replies); }
    return n;
  }

  return (
    <div>
      <h3 className="font-sans font-semibold text-lg text-ink mb-6 flex items-center gap-2">
        <MessageCircle size={20} />
        {t.comment_title} ({countAll(comments)})
      </h3>

      {/* 评论表单 */}
      <form onSubmit={handleSubmit} className="mb-8 space-y-3">
        {replyTarget && (
          <div className="flex items-center gap-2 text-sm text-ink-lighter">
            <span>{t.comment_reply_to} @{replyTarget.authorName}</span>
            <button type="button" onClick={() => setReplyTarget(null)} className="text-accent hover:underline">{t.comment_cancel}</button>
          </div>
        )}
        <Input placeholder={t.comment_name_placeholder} value={authorName} onChange={(e) => setAuthorName(e.target.value)} maxLength={10} aria-label={t.comment_name_placeholder} />
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input type="email" placeholder={t.comment_email_placeholder} value={authorEmail}
              onChange={(e) => { setAuthorEmail(e.target.value); }} required disabled={emailVerified} className="flex-1" aria-label={t.comment_email_placeholder} />
            {emailVerified ? (
              <span className="flex items-center text-sm text-green-600 whitespace-nowrap px-2">{t.comment_email_verified}</span>
            ) : (
              <Button type="button" variant="secondary" size="sm" onClick={handleSendCode}
                disabled={sendingCode || countdown > 0 || !authorEmail.trim()}>
                {sendingCode ? t.comment_email_sending : countdown > 0 ? `重新发送 (${countdown}s)` : (codeSent ? t.comment_email_resend : t.comment_email_send_code)}
              </Button>
            )}
          </div>
          {codeSent && !emailVerified && (
            <div className="flex gap-2">
              <input type="text" value={verifyCode}
                onChange={(e) => { setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setEmailError(""); }}
                placeholder={t.comment_email_code_placeholder} maxLength={6} inputMode="numeric"
                aria-label={t.comment_email_code_placeholder}
                className="flex-1 max-w-[180px] px-3 py-2 rounded-lg text-sm border border-border bg-paper focus:outline-none focus:border-accent transition-colors text-ink" />
              <Button type="button" size="sm" onClick={handleVerifyCode} disabled={verifying || verifyCode.length !== 6}>
                {verifying ? t.comment_email_verifying : t.comment_email_verify}
              </Button>
            </div>
          )}
          {emailError && <p className="text-xs text-red-500">{emailError}</p>}
        </div>
        <Textarea placeholder={t.comment_placeholder} value={content}
          onChange={(e) => { setContent(e.target.value); setSubmitSuccess(false); }} rows={3} required aria-label={t.comment_placeholder} />
        <div className="flex gap-2 items-center">
          <input type="text" value={captchaAnswer}
            onChange={(e) => { setCaptchaAnswer(e.target.value); setCaptchaError(""); }}
            placeholder={t.comment_captcha_placeholder} maxLength={5} required
            aria-label={t.comment_captcha_placeholder}
            className="flex-1 max-w-[180px] px-3 py-2 rounded-lg text-sm border border-border bg-paper focus:outline-none focus:border-accent transition-colors text-ink" />
          {captchaSvg && (
            <img src={captchaSvg} alt="captcha" onClick={loadCaptcha} title={t.comment_captcha_refresh}
              className="cursor-pointer rounded-lg select-none" width={180} height={56} draggable={false} />
          )}
        </div>
        {captchaError && <p className="text-xs text-red-500">{captchaError}</p>}
        {submitError && <p className="text-xs text-red-500">{submitError}</p>}
        {submitSuccess && (
          <p className="text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{t.comment_success}</p>
        )}
        <div className="flex justify-end">
          <Button type="submit" loading={submitting} size="sm" disabled={!emailVerified}>
            <Send size={14} /> {t.comment_submit}
          </Button>
        </div>
      </form>

      {/* 评论列表 */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (<div key={i} className="skeleton h-20 w-full" />))}
        </div>
      ) : loadError ? (
        <div className="text-center py-8 space-y-3">
          <p className="text-sm text-ink-lighter">加载评论失败</p>
          <button onClick={() => { setLoading(true); setLoadError(false); fetchComments(); }}
            className="text-xs text-accent hover:underline">点击重试</button>
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-ink-lighter text-sm py-8">{t.comment_empty}</p>
      ) : (
        <StaggerList stagger={0.08} className="space-y-6">
          {comments.map((comment) => (
            <StaggerItem key={comment.id}>
              <CommentItem
                comment={comment}
                depth={0}
                onReply={(id, name) => {
                  if (!emailVerified) {
                    setEmailError(t.comment_reply_need_verify);
                    return;
                  }
                  setReplyTarget({ id, authorName: name });
                }}
                t={t}
                locale={locale}
              />
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </div>
  );
}

/** 获取评论的显示名称 */
function getAuthorName(
  comment: Comment,
  t: ReturnType<typeof useLocale>["t"],
): string {
  return comment.user?.displayName || comment.user?.username || comment.authorName || t.comment_anonymous;
}

/** 每组最多显示的回复数，超过则折叠 */
const VISIBLE_REPLIES = 2;

/** 递归渲染评论及其子回复 */
function CommentItem({
  comment, depth, onReply, t, locale,
}: {
  comment: Comment;
  depth: number;
  onReply: (commentId: string, authorName: string) => void;
  t: ReturnType<typeof useLocale>["t"];
  locale: string;
}) {
  const authorName = getAuthorName(comment, t);
  const isTopLevel = depth === 0;
  const canNest = depth < MAX_DEPTH;
  const [expanded, setExpanded] = useState(false);

  const replies = comment.replies || [];
  const hasMore = replies.length > VISIBLE_REPLIES;
  const visibleReplies = hasMore && !expanded ? replies.slice(0, VISIBLE_REPLIES) : replies;

  return (
    <div>
      <div className="flex gap-3">
        <div className={`flex-shrink-0 rounded-full bg-paper-warm flex items-center justify-center ${isTopLevel ? "w-8 h-8" : "w-6 h-6"}`}>
          {comment.user?.avatar ? (
            <img src={comment.user.avatar} alt="" className={`rounded-full ${isTopLevel ? "w-8 h-8" : "w-6 h-6"}`} />
          ) : (
            <User size={isTopLevel ? 16 : 12} className="text-ink-lighter" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`${isTopLevel ? "text-sm" : "text-xs"} font-sans font-medium text-ink`}>
              {authorName}
              {comment.user?.role === "admin" && (<span title="博主" className="ml-1">👑</span>)}
            </span>
            <span className="text-xs text-ink-lighter">{formatRelative(comment.createdAt, locale)}</span>
          </div>
          <p className="text-sm text-ink-light leading-relaxed whitespace-pre-wrap">{comment.content}</p>
          {canNest && (
            <button
              onClick={() => onReply(comment.id, authorName)}
              className="mt-1 text-xs text-ink-lighter hover:text-accent transition-colors font-sans"
            >
              {t.comment_reply}
            </button>
          )}
          {/* 递归渲染子评论 */}
          {replies.length > 0 && (
            <div className={`mt-4 space-y-4 ${depth < MAX_DEPTH - 1 ? "ml-2 pl-4 border-l-2 border-border" : ""}`}>
              {visibleReplies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  depth={depth + 1}
                  onReply={onReply}
                  t={t}
                  locale={locale}
                />
              ))}
              {hasMore && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="text-xs text-accent hover:underline font-sans"
                >
                  {expanded
                    ? t.comment_collapse
                    : `${t.comment_expand_prefix}${replies.length - VISIBLE_REPLIES}${t.comment_expand_suffix}`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
