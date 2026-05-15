import { NextRequest, NextResponse } from "next/server";
import { TOKEN_NAME, CSRF_COOKIE, CSRF_HEADER, SITE_HOST, ALLOWED_SITE_HOSTS, PROTECTED_IMAGE_HTML } from "@/shared/constants";

import {
  SITE_VERIFY_COOKIE,
  DISCLAIMER_COOKIE,
  createSiteVerifyToken,
  verifySiteToken,
  verifyDisclaimerToken,
  timingSafeEqual,
  isAllowedCrawler,
} from "@/shared/site-secret";

const PROTECTED_PREFIXES = ["/admin"];

/**
 * Base64URL 解码（JWT 使用 base64url 编码）
 */
function base64UrlDecode(str: string): Uint8Array {
  // base64url → base64
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + "=".repeat(padLen);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * 恒定时间比较（Uint8Array 版本，用于 JWT 签名验证）
 */
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a[i] ^ b[i];
  }
  return mismatch === 0;
}

/**
 * Edge Runtime 中验证 JWT 签名（HMAC-SHA256）
 * - 使用 Web Crypto API，与服务端 jsonwebtoken 库的签名算法完全一致
 * - 同时校验签名有效性、过期时间、必需字段（userId, role）
 * - 攻击者无法伪造签名，除非知道 JWT_SECRET
 */
async function verifyTokenEdge(token: string): Promise<boolean> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  // 校验各段为合法 base64url 字符
  for (const part of parts) {
    if (!/^[A-Za-z0-9_-]+$/.test(part)) return false;
  }

  try {
    // 解码并验证 payload
    const payloadBytes = base64UrlDecode(parts[1]);
    const payloadJson = new TextDecoder().decode(payloadBytes);
    const payload = JSON.parse(payloadJson);

    if (typeof payload.exp === "number") {
      const nowSec = Math.floor(Date.now() / 1000);
      if (payload.exp < nowSec) return false;
    }

    if (!payload.userId || !payload.role) return false;

    // 验证 HMAC-SHA256 签名
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const data = encoder.encode(`${parts[0]}.${parts[1]}`);
    const computedSig = new Uint8Array(
      await crypto.subtle.sign("HMAC", key, data)
    );
    const providedSig = base64UrlDecode(parts[2]);

    return constantTimeEqual(computedSig, providedSig);
  } catch {
    return false;
  }
}

/**
 * CSRF 防护 - 双重校验：
 * 1. 自定义请求头检查：浏览器跨站请求无法携带自定义 header
 * 2. Double-Submit Cookie：header 中的 CSRF token 必须与 cookie 中的一致
 *
 * 这两层组合防御：
 * - 阻止跨站表单提交（无自定义 header）
 * - 阻止 CORS 错误配置下的跨域 AJAX（即使能加 header，也拿不到 CSRF token）
 * - 阻止直接 curl 攻击（需要同时知道 cookie 和 token）
 */
function checkCsrf(request: NextRequest): boolean {
  // 第一层：自定义请求头检查
  const xRequestedWith = request.headers.get("x-requested-with");
  if (xRequestedWith !== "XMLHttpRequest") {
    return false;
  }

  // 第二层：Double-Submit Cookie 校验
  const csrfFromCookie = request.cookies.get(CSRF_COOKIE)?.value;
  const csrfFromHeader = request.headers.get(CSRF_HEADER);

  if (!csrfFromCookie || !csrfFromHeader) {
    return false;
  }

  // 恒定时间比较，防止时序攻击
  if (csrfFromCookie.length !== csrfFromHeader.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < csrfFromCookie.length; i++) {
    mismatch |= csrfFromCookie.charCodeAt(i) ^ csrfFromHeader.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * 生成密码学安全的随机 nonce（Edge Runtime 兼容，使用 Web Crypto API）
 */
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  // 转为 base64
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * 构建页面路由的 CSP（nonce 模式）
 * - script-src 使用 nonce 替代 unsafe-inline，阻止 XSS 注入脚本
 * - style-src 保留 unsafe-inline（Tailwind CSS 和 next/font 需要）
 * - Next.js 读取 x-nonce 请求头后，自动为其生成的脚本标签注入 nonce
 */
function buildPageCsp(nonce: string): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  return directives.join("; ");
}

/** API 路由的 CSP（严格模式，禁止一切资源加载） */
const API_CSP = "default-src 'none'; frame-ancestors 'none'";

/**
 * 获取真实的基础 URL（处理反向代理场景）
 * 当 Next.js 运行在 Nginx 等反向代理后面时，request.nextUrl.origin 是内部地址 (如 http://127.0.0.1:3000)
 * 需要从代理转发的 header 还原真实域名
 */
function getOrigin(request: NextRequest): string {
  const proto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (proto && host) {
    return `${proto}://${host}`;
  }
  return request.nextUrl.origin;
}

// ==================== 站点访问验证 Cookie ====================

/**
 * 设置站点访问验证 Cookie 到响应
 */
async function setSiteVerifyCookie(response: NextResponse): Promise<void> {
  const token = await createSiteVerifyToken();
  response.cookies.set(SITE_VERIFY_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 86400, // 24 小时
  });
}

/**
 * 检查是否有有效的站点访问验证 Cookie
 */
async function hasSiteVerifyCookie(request: NextRequest): Promise<boolean> {
  const cookie = request.cookies.get(SITE_VERIFY_COOKIE)?.value;
  if (!cookie) return false;
  return verifySiteToken(cookie);
}

// ==================== 免责声明 Cookie 验证 ====================

/**
 * 验证免责声明 Cookie 是否由本站签发
 */
async function checkDisclaimerCookie(request: NextRequest): Promise<boolean> {
  const cookie = request.cookies.get(DISCLAIMER_COOKIE)?.value;
  if (!cookie) return false;
  return verifyDisclaimerToken(cookie);
}

// ==================== 中间件主逻辑 ====================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CSRF 防护：对所有 /api 的写操作校验
  // 排除免责声明接口（公开表单提交，无需 CSRF）
  const CSRF_EXEMPT = ["/api/disclaimer/accept"];

  if (pathname.startsWith("/api/")) {
    const method = request.method;
    if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
      const isExempt = CSRF_EXEMPT.some((p) => pathname === p || pathname.startsWith(p + "/"));
      if (!isExempt && !checkCsrf(request)) {
        return NextResponse.json(
          { error: "非法请求" },
          { status: 403 }
        );
      }
    }

    // API 路由：设置严格的 CSP
    const response = NextResponse.next();
    response.headers.set("Content-Security-Policy", API_CSP);
    return response;
  }

  // 上传图片鉴权：Referer + 爬虫 UA 验证
  // 不依赖 cookie（避免首次加载时 cookie 时序问题导致图片无法显示）
  // API 路由 (/api/uploads/) 作为第二道防线，同样校验 Referer
  if (pathname.startsWith("/uploads/")) {
    const referer = request.headers.get("referer");
    const userAgent = request.headers.get("user-agent") || "";

    // Referer 检查：请求来自本站 → 放行
    const fromSite = (() => {
      if (!referer) return false;
      try {
        const u = new URL(referer);
        return (ALLOWED_SITE_HOSTS as readonly string[]).includes(u.hostname);
      } catch {
        return false;
      }
    })();

    // 搜索引擎/微信爬虫 UA 白名单
    const crawlerOk = isAllowedCrawler(userAgent);

    if (!fromSite && !crawlerOk) {
      return new NextResponse(PROTECTED_IMAGE_HTML, { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    // 通过鉴权，继续走 rewrite 到 /api/uploads/
    return NextResponse.next();
  }

  // 静态资源（_next/static, favicon 等）不设 CSP，直接放行
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|webp|svg|woff2?|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // 检查是否是受保护的路由（admin 页面）
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtected) {
    // 登录页本身不需要认证
    if (pathname !== "/admin/login") {
      const token = request.cookies.get(TOKEN_NAME)?.value;

      if (!token || !(await verifyTokenEdge(token))) {
        const loginUrl = new URL("/admin/login", getOrigin(request));
        loginUrl.searchParams.set("redirect", pathname);
        const response = NextResponse.redirect(loginUrl);

        if (token) {
          response.cookies.delete(TOKEN_NAME);
        }

        return response;
      }
    }
  }

  // 免责声明检查已移至客户端 DisclaimerGate 组件统一处理
  // middleware 不再跳转到 /disclaimer 页面，由弹窗组件控制展示
  // 此处保留 cookie 检查逻辑，便于将来需要时使用

  // 页面路由：种站点访问验证 Cookie
  // 注意：页面路由不设 CSP，因为 ISR 缓存的 HTML 中脚本标签没有 nonce，
  // 强制 CSP 会拦截 Next.js 的内联脚本导致页面功能异常。
  // XSS 防护由 sanitizeHtml (DOMPurify) 白名单机制保障。
  // API 路由已有严格的 CSP（default-src 'none'）。
  const response = NextResponse.next();

  // 仅在没有有效 Cookie 时才设置（减少不必要的 Set-Cookie）
  const hasCookie = await hasSiteVerifyCookie(request);
  if (!hasCookie) {
    await setSiteVerifyCookie(response);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径（包括 /api 和页面），但排除：
     * - _next/static（静态资源）
     * - _next/image（图片优化）
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
