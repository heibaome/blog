/**
 * 基于内存的简易速率限制器
 * 适用于单实例部署（当前 Next.js 单进程场景）
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// 全局存储，跨路由共享
declare global {
  var __rateLimitStore: Map<string, RateLimitEntry> | undefined;
}

if (!globalThis.__rateLimitStore) {
  globalThis.__rateLimitStore = new Map();
}

const store = globalThis.__rateLimitStore;

// 定期清理过期条目（由 cleanup-registry 管理）

import { registerCleanup } from "@/shared/cleanup-registry";

registerCleanup("ratelimit-cleanup", () => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 60_000);

export interface RateLimitOptions {
  /** 窗口内允许的最大请求数 */
  max: number;
  /** 窗口时长（毫秒） */
  windowMs: number;
  /** 自定义 key 生成函数，默认按 IP */
  keyFn?: (request: Request) => string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

function isValidIP(ip: string): boolean {
  // IPv4
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    return ip.split(".").every((octet) => Number(octet) <= 255);
  }
  // IPv6 (简略校验)
  if (/^[0-9a-fA-F:]+$/.test(ip) && ip.includes(":")) {
    return true;
  }
  return false;
}

export function getClientIP(request: Request): string {
  // Nginx 设置 X-Real-IP 为 $remote_addr（真实客户端 IP），不可伪造
  const realIP = request.headers.get("x-real-ip");
  if (realIP && isValidIP(realIP.trim())) return realIP.trim();

  // X-Forwarded-For 可被客户端伪造，仅作为兜底，取最左侧（最早客户端）
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIP = forwarded.split(",")[0].trim();
    if (isValidIP(firstIP)) return firstIP;
  }

  return "unknown";
}

export function rateLimit(request: Request, options: RateLimitOptions): RateLimitResult {
  const { max, windowMs, keyFn } = options;
  const key = keyFn ? keyFn(request) : getClientIP(request);
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // 新窗口
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: max - 1, resetAt };
  }

  if (entry.count >= max) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { success: true, remaining: max - entry.count, resetAt: entry.resetAt };
}

// 预设配置
export const rateLimitPresets = {
  /** 登录：15分钟内最多5次 */
  login: { max: 5, windowMs: 15 * 60 * 1000 },
  /** 注册：1小时内最多3次 */
  register: { max: 3, windowMs: 60 * 60 * 1000 },
  /** 评论：1分钟内最多5次 */
  comment: { max: 5, windowMs: 60 * 1000 },
  /** 通用：1分钟内最多30次 */
  general: { max: 30, windowMs: 60 * 1000 },
};
