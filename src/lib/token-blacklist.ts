/**
 * JWT Token 黑名单
 * 使用 Prisma + SQLite 持久化存储，PM2 重启后仍然有效
 * 存储 token 的 SHA-256 哈希而非明文 token
 * 支持按 userId 批量拉黑（单地登录）
 *
 * 单地登录原理：
 * - 登录时写入一条 tokenHash="reset:<userId>" 的标记记录
 * - 验证 token 时，检查其 iat（签发时间）是否早于该标记的创建时间
 * - 如果早于 → 说明 token 是旧会话签发的，已失效
 */

import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "@/shared/db";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * 将 token 加入黑名单
 */
export async function blacklistToken(token: string, userId?: string): Promise<void> {
  const tokenHash = hashToken(token);
  let exp: number;

  try {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    exp = decoded?.exp ?? Math.floor(Date.now() / 1000) + 60;
  } catch {
    exp = Math.floor(Date.now() / 1000) + 60;
  }

  await prisma.tokenBlacklist.upsert({
    where: { tokenHash },
    update: {},
    create: { tokenHash, userId, exp },
  });
}

/**
 * 拉黑指定用户的所有旧 token（单地登录）
 * 写入一条 session-reset 标记，所有在该标记之前签发的 token 均视为失效
 */
export async function blacklistAllUserTokens(userId: string): Promise<void> {
  // 清除该用户之前的 reset 标记（保留明确拉黑的单个 token）
  await prisma.tokenBlacklist.deleteMany({
    where: {
      userId,
      tokenHash: { startsWith: "reset:" },
    },
  });

  // 写入新的 reset 标记，有效期 7 天（覆盖 JWT 最长有效期 3 天 + 冗余）
  const resetHash = "reset:" + userId;
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

  await prisma.tokenBlacklist.create({
    data: { tokenHash: resetHash, userId, exp },
  }).catch(async () => {
    // 并发冲突时更新
    await prisma.tokenBlacklist.update({
      where: { tokenHash: resetHash },
      data: { createdAt: new Date(), exp },
    });
  });
}

/**
 * 检查 token 是否在黑名单中
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const tokenHash = hashToken(token);
  const nowSec = Math.floor(Date.now() / 1000);

  // 1) 直接查 token 是否被明确拉黑
  const entry = await prisma.tokenBlacklist.findUnique({
    where: { tokenHash },
  });

  if (entry) {
    if (entry.exp <= nowSec) {
      await prisma.tokenBlacklist.delete({ where: { tokenHash } }).catch(() => {});
      return false;
    }
    return true;
  }

  // 2) 检查 session-reset：该 token 是否签发于用户重置之前
  try {
    const decoded = jwt.decode(token) as { userId?: string; iat?: number } | null;
    if (decoded?.userId && decoded?.iat) {
      const resetEntry = await prisma.tokenBlacklist.findUnique({
        where: { tokenHash: "reset:" + decoded.userId },
      });

      if (resetEntry && resetEntry.exp > nowSec) {
        // reset 标记的 createdAt 即为重置时间
        const resetTimeSec = Math.floor(resetEntry.createdAt.getTime() / 1000);
        if (decoded.iat < resetTimeSec) {
          return true; // token 签发早于重置 → 已失效
        }
      }
    }
  } catch {
    // token 解码失败，交给上层 verifyToken 处理
  }

  return false;
}

/**
 * 清理已过期的黑名单条目
 */
import { registerCleanup } from "@/shared/cleanup-registry";

// 注册定时清理（5分钟间隔）
registerCleanup("token-blacklist-cleanup", () => { cleanupExpiredTokens().catch(() => {}); }, 5 * 60 * 1000);

export async function cleanupExpiredTokens(): Promise<number> {
  const nowSec = Math.floor(Date.now() / 1000);
  const result = await prisma.tokenBlacklist.deleteMany({
    where: { exp: { lte: nowSec } },
  });
  return result.count;
}

// 清理任务已移至 cleanup-registry 统一管理
