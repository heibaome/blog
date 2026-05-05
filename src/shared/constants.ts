/**
 * 项目级常量 — 集中管理散落在各文件中的硬编码值
 */

/** 站点主域名（用于 403 页面链接等） */
export const SITE_HOST = "www.inklog.cn";

/** Referer 校验允许的域名列表（包含 www 和非 www） */
export const ALLOWED_SITE_HOSTS = ["www.inklog.cn", "inklog.cn"] as const;

/** 允许评论的邮箱域名白名单 */
export const ALLOWED_EMAIL_DOMAINS = ["@qq.com", "@gmail.com", "@163.com"] as const;

// ---- Auth & CSRF ----
export const TOKEN_NAME = "moji_token";
export const CSRF_COOKIE = "moji_csrf";
export const CSRF_HEADER = "x-csrf-token";

// ---- Disclaimer ----
/** 客户端可读的免责声明标记（仅作 UI 提示，真正的鉴权靠 httpOnly cookie） */
export const DISCLAIMER_CLIENT_COOKIE = "disc_ok";

// ---- Protected Image 403 Page ----
export const PROTECTED_IMAGE_HTML = `<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>提示</title><style>*{margin:0;padding:0;box-sizing:border-box}body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#1c1917;font-family:system-ui,-apple-system,sans-serif;color:#e7e5e4}.card{text-align:center;padding:3rem 2rem;background:#292524;border-radius:1rem;border:1px solid #44403c;max-width:420px}.icon{font-size:3rem;margin-bottom:1rem}h1{font-size:1.25rem;margin-bottom:.5rem;color:#fafaf9}p{font-size:.875rem;color:#a8a29e;line-height:1.6;margin-bottom:1.5rem}a{color:#f87171;text-decoration:none;font-weight:500}a:hover{text-decoration:underline}</style></head><body><div class="card"><div class="icon">🔒</div><h1>图片受保护</h1><p>该图片仅限在官方网站内查看<br>请前往 <a href="https://${SITE_HOST}">${SITE_HOST}</a> 访问</p></div></body></html>`;
