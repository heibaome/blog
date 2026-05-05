/**
 * CSRF token 客户端工具
 * Double-Submit Cookie 模式：
 * 1. 客户端生成随机 token
 * 2. 写入 cookie（非 httpOnly，sameSite=lax）
 * 3. 同时放入 X-CSRF-Token 请求头
 * 4. 中间件校验 header 与 cookie 是否一致
 */

const CSRF_COOKIE = "moji_csrf";
const CSRF_HEADER = "x-csrf-token";

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

/**
 * 获取或生成 CSRF token
 * 如果 cookie 中已有 token 则复用，否则生成新的
 */
export function ensureCsrfToken(): string {
  let token = getCookie(CSRF_COOKIE);
  if (!token) {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    token = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
    setCookie(CSRF_COOKIE, token, 3);
  }
  return token;
}

/**
 * 获取 CSRF 请求头
 * 用于 fetch 请求中自动附加
 */
export function getCsrfHeaders(): Record<string, string> {
  return { [CSRF_HEADER]: ensureCsrfToken() };
}
