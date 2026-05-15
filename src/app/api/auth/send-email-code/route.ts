import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { requireAuth } from "@/shared/security";
import { sendVerificationEmail } from "@/lib/mailer";
import { errorResponse, AppError } from "@/shared/errors";
import { adminEmailCodes } from "@/lib/admin-email-codes";
import { prisma } from "@/shared/db";
import { getClientIP } from "@/lib/ratelimit";
import { ALLOWED_EMAIL_DOMAINS } from "@/shared/constants";

// POST /api/auth/send-email-code — 发送邮箱绑定验证码
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const emailSchema = z.string().email("邮箱格式不正确");
    const email = emailSchema.parse(body.email);

    // 域名限制（与评论验证保持一致）
    if (!ALLOWED_EMAIL_DOMAINS.some((d) => email.toLowerCase().endsWith(d))) {
      return errorResponse(new AppError("仅支持 QQ邮箱、Gmail、网易163邮箱"));
    }

    // 检查邮箱是否已被其他用户绑定
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== user.id) {
      return errorResponse(new AppError("该邮箱已被其他用户绑定"));
    }

    // 60 秒内不能重复发送
    const prev = adminEmailCodes.get(user.id);
    if (prev && prev.expires > Date.now() && prev.email === email && prev.expires - Date.now() > 4 * 60 * 1000) {
      return errorResponse(new AppError("验证码已发送，请稍后再试"));
    }

    // 生成验证码
    const code = crypto.randomInt(100000, 999999).toString();
    adminEmailCodes.set(user.id, {
      code,
      email,
      expires: Date.now() + 5 * 60 * 1000,
    });

    const ip = getClientIP(req);
    await sendVerificationEmail({
      to: email,
      code,
      ip: ip !== "unknown" ? ip : undefined,
    });

    return NextResponse.json({ message: "验证码已发送" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(new AppError("邮箱格式不正确"));
    }
    return errorResponse(error);
  }
}
