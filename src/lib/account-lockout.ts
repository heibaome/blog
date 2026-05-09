/**
 * 增强型账号登录失败锁定机制
 *
 * 安全特性：
 * 1. 基于用户名的账号锁定（防止针对单一账号的暴力破解）
 * 2. 基于 IP 的失败计数（防止分布式暴力破解）
 * 3. 双重锁定：用户名或 IP 任一达到阈值都会触发锁定
 */

interface LockoutEntry {
  failures: number;
  lockedUntil: number;
}

interface IPLockoutEntry {
  failures: number;
  lockedUntil: number;
  lastFailureAt: number;
}

declare global {
  var __accountLockoutStore: Map<string, LockoutEntry> | undefined;
  var __ipLockoutStore: Map<string, IPLockoutEntry> | undefined;
}

if (!globalThis.__accountLockoutStore) {
  globalThis.__accountLockoutStore = new Map();
}

if (!globalThis.__ipLockoutStore) {
  globalThis.__ipLockoutStore = new Map();
}

const usernameStore = globalThis.__accountLockoutStore!;
const ipStore = globalThis.__ipLockoutStore!;

const MAX_FAILURES = 5;
const LOCKOUT_BASE_MS = 5 * 60 * 1000;
const LOCKOUT_MAX_MS = 6 * 60 * 60 * 1000;

const IP_MAX_FAILURES = 10;
const IP_LOCKOUT_MS = 30 * 60 * 1000;
const IP_WINDOW_MS = 60 * 60 * 1000;

function getLockoutDuration(totalFailures: number): number {
  const rounds = Math.floor(totalFailures / MAX_FAILURES);
  const duration = LOCKOUT_BASE_MS * Math.pow(2, rounds - 1);
  return Math.min(duration, LOCKOUT_MAX_MS);
}

import { registerCleanup } from "@/shared/cleanup-registry";

registerCleanup("account-lockout-cleanup", () => {
  const now = Date.now();
  for (const [key, entry] of usernameStore) {
    if (entry.lockedUntil > 0 && entry.lockedUntil < now) {
      usernameStore.delete(key);
    }
  }
}, 5 * 60_000);

registerCleanup("ip-lockout-cleanup", () => {
  const now = Date.now();
  for (const [key, entry] of ipStore) {
    if (entry.lockedUntil > 0 && entry.lockedUntil < now) {
      ipStore.delete(key);
    } else if (entry.lastFailureAt + IP_WINDOW_MS < now) {
      ipStore.delete(key);
    }
  }
}, 5 * 60_000);

export interface LockoutStatus {
  isLocked: boolean;
  lockedUntil: number;
  remainingSeconds: number;
  reason: "username" | "ip" | null;
}

export function checkLockout(username: string, ip: string): LockoutStatus {
  const now = Date.now();

  const usernameResult = checkUsernameLockout(username, now);
  if (usernameResult.isLocked) {
    return usernameResult;
  }

  const ipResult = checkIpLockout(ip, now);
  if (ipResult.isLocked) {
    return ipResult;
  }

  return { isLocked: false, lockedUntil: 0, remainingSeconds: 0, reason: null };
}

function checkUsernameLockout(username: string, now: number): LockoutStatus {
  const key = username.toLowerCase().trim();
  const entry = usernameStore.get(key);

  if (!entry || entry.lockedUntil === 0) {
    return { isLocked: false, lockedUntil: 0, remainingSeconds: 0, reason: null };
  }

  if (entry.lockedUntil <= now) {
    entry.failures = 0;
    entry.lockedUntil = 0;
    return { isLocked: false, lockedUntil: 0, remainingSeconds: 0, reason: null };
  }

  return {
    isLocked: true,
    lockedUntil: entry.lockedUntil,
    remainingSeconds: Math.ceil((entry.lockedUntil - now) / 1000),
    reason: "username"
  };
}

function checkIpLockout(ip: string, now: number): LockoutStatus {
  const entry = ipStore.get(ip);

  if (!entry || entry.lockedUntil === 0) {
    return { isLocked: false, lockedUntil: 0, remainingSeconds: 0, reason: null };
  }

  if (entry.lockedUntil <= now) {
    entry.failures = 0;
    entry.lockedUntil = 0;
    return { isLocked: false, lockedUntil: 0, remainingSeconds: 0, reason: null };
  }

  return {
    isLocked: true,
    lockedUntil: entry.lockedUntil,
    remainingSeconds: Math.ceil((entry.lockedUntil - now) / 1000),
    reason: "ip"
  };
}

export function recordFailure(username: string, ip: string): { usernameLocked: boolean; ipLocked: boolean } {
  const now = Date.now();
  let usernameLocked = false;
  let ipLocked = false;

  const usernameKey = username.toLowerCase().trim();
  let usernameEntry = usernameStore.get(usernameKey);
  if (!usernameEntry) {
    usernameEntry = { failures: 0, lockedUntil: 0 };
    usernameStore.set(usernameKey, usernameEntry);
  }

  if (usernameEntry.lockedUntil <= now) {
    usernameEntry.lockedUntil = 0;
    usernameEntry.failures++;
    if (usernameEntry.failures >= MAX_FAILURES) {
      usernameEntry.lockedUntil = now + getLockoutDuration(usernameEntry.failures);
      usernameLocked = true;
    }
  } else {
    usernameLocked = true;
  }

  let ipEntry = ipStore.get(ip);
  if (!ipEntry) {
    ipEntry = { failures: 0, lockedUntil: 0, lastFailureAt: 0 };
    ipStore.set(ip, ipEntry);
  }

  if (ipEntry.lockedUntil > now) {
    ipLocked = true;
  } else {
    if (ipEntry.lastFailureAt + IP_WINDOW_MS < now) {
      ipEntry.failures = 0;
    }
    ipEntry.lastFailureAt = now;
    ipEntry.failures++;
    if (ipEntry.failures >= IP_MAX_FAILURES) {
      ipEntry.lockedUntil = now + IP_LOCKOUT_MS;
      ipLocked = true;
    }
  }

  return { usernameLocked, ipLocked };
}

export function clearFailures(username: string, ip: string): void {
  const usernameKey = username.toLowerCase().trim();
  usernameStore.delete(usernameKey);
  ipStore.delete(ip);
}

export function getLockoutInfo(username: string, ip: string): {
  username: { failures: number; locked: boolean };
  ip: { failures: number; locked: boolean };
} {
  const now = Date.now();

  const usernameKey = username.toLowerCase().trim();
  const usernameEntry = usernameStore.get(usernameKey);
  const usernameLocked = usernameEntry?.lockedUntil ? usernameEntry.lockedUntil > now : false;

  const ipEntry = ipStore.get(ip);
  const ipLocked = ipEntry?.lockedUntil ? ipEntry.lockedUntil > now : false;

  return {
    username: {
      failures: usernameEntry?.failures ?? 0,
      locked: usernameLocked
    },
    ip: {
      failures: ipEntry?.failures ?? 0,
      locked: ipLocked
    }
  };
}


