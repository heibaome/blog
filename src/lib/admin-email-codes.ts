/**
 * 管理员邮箱绑定验证码 — 内存存储
 * 低频操作，服务重启后需重新发送，不需要持久化
 */
interface CodeEntry {
  code: string;
  email: string;
  expires: number; // Date.now() + 5min
}

declare global {
  var __adminEmailCodes: Map<string, CodeEntry> | undefined;
}

if (!globalThis.__adminEmailCodes) {
  globalThis.__adminEmailCodes = new Map();
}

import { registerCleanup } from "@/shared/cleanup-registry";

export const adminEmailCodes = globalThis.__adminEmailCodes;

registerCleanup("admin-email-codes-cleanup", () => {
  const now = Date.now();
  for (const [key, entry] of adminEmailCodes) {
    if (entry.expires < now) {
      adminEmailCodes.delete(key);
    }
  }
}, 60_000);

// 定期清理过期条目（由 cleanup-registry 管理）
