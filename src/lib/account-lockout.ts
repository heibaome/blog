/**
 * 基于用户名的账号登录失败锁定
 * 与 IP 级限速互补：IP 限速防分布式扫描，账号锁定防针对单一账号的暴力破解
 */

interface LockoutEntry {
  /** 累计失败次数（跨锁定周期保留，用于指数递增） */
  failures: number;
  /** 锁定截止时间戳（毫秒），0 表示未锁定 */
  lockedUntil: number;
}

declare global {
  var __accountLockoutStore: Map<string, LockoutEntry> | undefined;
}

if (!globalThis.__accountLockoutStore) {
  globalThis.__accountLockoutStore = new Map();
}

const store = globalThis.__accountLockoutStore;

/** 最大连续失败次数 */
const MAX_FAILURES = 5;
/** 锁定基础时长（毫秒）：5 分钟 */
const LOCKOUT_BASE_MS = 5 * 60 * 1000;
/** 最大锁定时长（毫秒）：6 小时 */
const LOCKOUT_MAX_MS = 6 * 60 * 60 * 1000;

/**
 * 计算锁定时长（指数递增）
 * 每轮失败次数增加 1，锁定时间翻倍
 * 第1轮锁定 5min → 第2轮锁定 10min → 第3轮 20min → ... → 最大 6h
 */
function getLockoutDuration(totalFailures: number): number {
  const rounds = Math.floor(totalFailures / MAX_FAILURES);
  const duration = LOCKOUT_BASE_MS * Math.pow(2, rounds - 1);
  return Math.min(duration, LOCKOUT_MAX_MS);
}

// 定期清理过期条目（由 cleanup-registry 管理）

import { registerCleanup } from "@/shared/cleanup-registry";

registerCleanup("account-lockout-cleanup", () => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.lockedUntil > 0 && entry.lockedUntil < now) {
      store.delete(key);
    }
  }
}, 5 * 60_000);

/**
 * 检查账号是否被锁定
 * @param username 用户名（小写）
 * @returns 剩余锁定秒数，0 表示未锁定
 */
export function checkAccountLockout(username: string): number {
  const key = username.toLowerCase().trim();
  const entry = store.get(key);

  if (!entry || entry.lockedUntil === 0) return 0;

  const now = Date.now();
  if (entry.lockedUntil <= now) {
    // 锁定已过期，重置
    entry.failures = 0;
    entry.lockedUntil = 0;
    return 0;
  }

  return Math.ceil((entry.lockedUntil - now) / 1000);
}

/**
 * 记录一次登录失败
 * 达到最大失败次数时触发锁定
 * @param username 用户名（小写）
 * @returns 是否触发了锁定
 */
export function recordLoginFailure(username: string): boolean {
  const key = username.toLowerCase().trim();
  const now = Date.now();

  let entry = store.get(key);
  if (!entry) {
    entry = { failures: 0, lockedUntil: 0 };
    store.set(key, entry);
  }

  // 如果还在锁定期内，不增加计数
  if (entry.lockedUntil > now) return true;

  // 锁定已过期：保留 failures 累计值（用于指数递增），重置锁定状态
  entry.lockedUntil = 0;
  entry.failures++;

  if (entry.failures >= MAX_FAILURES) {
    entry.lockedUntil = now + getLockoutDuration(entry.failures);
    return true;
  }

  return false;
}

/**
 * 登录成功，清除失败计数
 */
export function clearLoginFailures(username: string): void {
  const key = username.toLowerCase().trim();
  store.delete(key);
}
