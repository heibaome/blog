/**
 * 站点访问验证共享密钥
 * 用于签发和验证 site_v cookie（middleware + API 路由）
 * 以及免责声明 cookie 签名
 *
 * 注意：middleware 运行在 Edge Runtime，不能使用 Node.js crypto，
 * 所以此模块仅导出常量，各处自行选择 crypto 实现。
 */

function getSiteSecret(): string {
  const secret = process.env.SITE_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SITE_SECRET environment variable is required in production");
    }
    return "moji-blog-site-verify-dev";
  }
  return secret;
}

export const SITE_SECRET = getSiteSecret();
export const SITE_VERIFY_COOKIE = "site_v";
export const DISCLAIMER_COOKIE = "moji_disc";

// ========== 站点验证 Token 工具（Edge Runtime + Node.js 兼容） ==========

/**
 * 使用 Web Crypto API 计算 HMAC-SHA256（Edge Runtime 兼容）
 */
export async function hmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * 恒定时间比较，防止时序攻击
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * 获取当前日期字符串（UTC），用于 token 轮转
 */
function getDayString(date?: Date): string {
  const d = date || new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/**
 * 生成站点访问验证 token（按日轮转）
 * 同一天内所有访客 token 相同，但每天自动更换，
 * 防止单一静态 token 被获取后永久有效
 */
export async function createSiteVerifyToken(): Promise<string> {
  const day = getDayString();
  return hmacSha256(`moji-blog-visitor:${day}`, SITE_SECRET);
}

/**
 * 验证站点访问 token 是否有效
 * 接受当天和前一天的 token（防止跨天边界时 cookie 突然失效）
 */
export async function verifySiteToken(token: string): Promise<boolean> {
  // 当天
  const expectedToday = await createSiteVerifyToken();
  if (timingSafeEqual(token, expectedToday)) return true;

  // 前一天（处理跨 UTC 日边界）
  const yesterday = new Date(Date.now() - 86400000);
  const dayStr = getDayString(yesterday);
  const expectedYesterday = await hmacSha256(`moji-blog-visitor:${dayStr}`, SITE_SECRET);
  return timingSafeEqual(token, expectedYesterday);
}

/**
 * 生成免责声明签名 token
 */
export async function createDisclaimerToken(): Promise<string> {
  return hmacSha256("moji-disclaimer-accepted", SITE_SECRET);
}

/**
 * 验证免责声明 token 是否有效
 */
export async function verifyDisclaimerToken(token: string): Promise<boolean> {
  const expected = await createDisclaimerToken();
  return timingSafeEqual(token, expected);
}

// ========== 爬虫 UA 白名单（统一管理） ==========

export const ALLOWED_CRAWLERS = [
  "googlebot",
  "bingbot",
  "baiduspider",
  "sogou",
  "360spider",
  "bytespider",
  "micromessenger",
  "wechat",
  "yandexbot",
  "duckduckbot",
  "applebot",
  "semrushbot",
  "ahrefsbot",
  "dotbot",
  "petalbot",
];

/**
 * 检查 UA 是否为允许的爬虫
 */
export function isAllowedCrawler(userAgent: string): boolean {
  const lower = userAgent.toLowerCase();
  return ALLOWED_CRAWLERS.some((c) => lower.includes(c));
}
