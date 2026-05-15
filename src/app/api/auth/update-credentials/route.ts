import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, hashPassword, verifyPassword } from "@/shared/security";
import { updateCredentialsSchema, updateUsernameSchema, updatePasswordSchema } from "@/shared/types";
import { prisma } from "@/shared/db";
import { errorResponse, successResponse, AppError } from "@/shared/errors";
import { adminEmailCodes } from "@/lib/admin-email-codes";
import { blacklistAllUserTokens } from "@/lib/token-blacklist";

// 已通过邮箱验证的用户集合（验证后5分钟内可免码修改）
// 格式: userId -> expiresAt
declare global {
  var __verifiedUsers: Map<string, number> | undefined;
}

if (!globalThis.__verifiedUsers) {
  globalThis.__verifiedUsers = new Map();
}

const verifiedUsers = globalThis.__verifiedUsers;

// 注册定时清理（1分钟间隔，防止内存泄漏）
import { registerCleanup } from "@/shared/cleanup-registry";
registerCleanup("verified-users-cleanup", () => {
  const now = Date.now();
  for (const [key, expiresAt] of verifiedUsers) {
    if (expiresAt < now) verifiedUsers.delete(key);
  }
}, 60_000);

// POST /api/auth/update-credentials — 修改用户名或密码
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    // 模式1：仅验证邮箱验证码（前端统一验证入口）
    if (body.type === "verify-email") {
      const code = z.string().length(6).parse(body.code);
      const entry = adminEmailCodes.get(user.id);

      if (!entry) {
        return errorResponse(new AppError("请先发送验证码"));
      }
      if (entry.expires < Date.now()) {
        adminEmailCodes.delete(user.id);
        return errorResponse(new AppError("验证码已过期，请重新发送"));
      }
      if (entry.code !== code) {
        return errorResponse(new AppError("验证码错误"));
      }

      // 标记为已验证，不清除验证码（保留邮箱信息）
      verifiedUsers.set(user.id, entry.expires);
      return successResponse({ verified: true });
    }

    // 模式2：实际修改用户名或密码
    const input = updateCredentialsSchema.parse(body);

    // 检查邮箱验证状态：要么本次带了正确验证码，要么之前已验证过
    const entry = adminEmailCodes.get(user.id);
    const sessionVerified = body.sessionVerified === true
      && verifiedUsers.has(user.id)
      && (verifiedUsers.get(user.id) as number) > Date.now();

    if (!sessionVerified) {
      // 没有会话验证，走传统验证码校验
      if (!entry) {
        return errorResponse(new AppError("请先发送验证码"));
      }
      if (entry.expires < Date.now()) {
        adminEmailCodes.delete(user.id);
        verifiedUsers.delete(user.id);
        return errorResponse(new AppError("验证码已过期，请重新发送"));
      }
      if (entry.code !== input.code) {
        return errorResponse(new AppError("验证码错误"));
      }
      // 首次验证通过，标记为已验证
      verifiedUsers.set(user.id, entry.expires);
    }

    // 会话验证过期检查
    if (sessionVerified && entry && entry.expires < Date.now()) {
      adminEmailCodes.delete(user.id);
      verifiedUsers.delete(user.id);
      return errorResponse(new AppError("验证已过期，请重新验证"));
    }

    if (input.type === "username") {
      // 检查用户名唯一性
      const existing = await prisma.user.findUnique({
        where: { username: input.username },
      });
      if (existing && existing.id !== user.id) {
        return errorResponse(new AppError("该用户名已被使用"));
      }
      if (existing && existing.id === user.id) {
        return errorResponse(new AppError("新用户名与当前相同"));
      }

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { username: input.username },
        select: { id: true, username: true, email: true, role: true, displayName: true },
      });

      return successResponse(updated);
    }

    if (input.type === "password") {
      // 验证旧密码
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { password: true },
      });
      if (!dbUser) {
        return errorResponse(new AppError("用户不存在", 404));
      }

      const oldValid = await verifyPassword(input.oldPassword, dbUser.password);
      if (!oldValid) {
        return errorResponse(new AppError("旧密码不正确"));
      }

      // 检查新旧密码不能相同
      const samePassword = await verifyPassword(input.newPassword, dbUser.password);
      if (samePassword) {
        return errorResponse(new AppError("新密码不能与旧密码相同"));
      }

      const hashed = await hashPassword(input.newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashed },
      });

      // 清除验证状态
      adminEmailCodes.delete(user.id);
      verifiedUsers.delete(user.id);

      // 踢掉所有旧会话
      await blacklistAllUserTokens(user.id);

      return successResponse({ message: "密码修改成功，请重新登录" });
    }

    return errorResponse(new AppError("未知的操作类型"));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(new AppError(error.errors[0].message));
    }
    return errorResponse(error);
  }
}
