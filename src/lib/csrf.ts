import crypto from "crypto";
import { cookies } from "next/headers";
import { CSRF_COOKIE, CSRF_HEADER } from "@/shared/constants";

/**
 * 生成 CSRF token 并写入 cookie
 * Double-Submit Cookie 模式：
 * - cookie 不设 httpOnly，前端 JS 可读取
 * - 前端发起写请求时，将 token 放入 X-CSRF-Token header
 * - 中间件校验 header 与 cookie 是否一致
 */
export async function setCsrfCookie() {
  const token = crypto.randomBytes(32).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE, token, {
    httpOnly: false, // 前端需要读取
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 3, // 与 auth token 一致，3 天
    path: "/",
  });
  return token;
}

/**
 * 从 cookie 读取当前 CSRF token
 */
export async function getCsrfTokenFromCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE)?.value;
}

/**
 * 清除 CSRF cookie（登出时调用）
 */
export async function clearCsrfCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(CSRF_COOKIE);
}

export { CSRF_COOKIE, CSRF_HEADER };
