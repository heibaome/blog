import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "email_verified";
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 天

/**
 * 获取邮箱验证 cookie 签名密钥（与 JWT_SECRET 分离）
 * 使用独立密钥避免一个泄露导致全部沦陷
 */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET or JWT_SECRET environment variable is required in production");
    }
    return "fallback-dev-session-secret";
  }
  // 加盐区分，即使 SESSION_SECRET 复用 JWT_SECRET 也能生成不同的签名
  return "email-verify:" + secret;
}

/**
 * 生成签名 cookie 值
 * 格式: base64(email).hmac_signature
 */
function sign(email: string): string {
  const payload = Buffer.from(email.toLowerCase().trim()).toString("base64url");
  const sig = crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("hex").slice(0, 32);
  return `${payload}.${sig}`;
}

/**
 * 验证签名 cookie，返回邮箱或 null
 */
export function verifyCookieValue(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payload, sig] = parts;
  const expectedSig = crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("hex").slice(0, 32);

  // 常量时间比较防止时序攻击
  if (sig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;

  try {
    return Buffer.from(payload, "base64url").toString("utf-8");
  } catch {
    return null;
  }
}

/**
 * 设置邮箱验证 cookie（HttpOnly, 7天有效）
 */
export async function setEmailVerifiedCookie(email: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sign(email), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

/**
 * 读取并验证 cookie，返回已验证的邮箱或 null
 */
export async function getVerifiedEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie?.value) return null;
  return verifyCookieValue(cookie.value);
}

/**
 * 清除邮箱验证 cookie
 */
export async function clearEmailVerifiedCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}
