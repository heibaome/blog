import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/shared/db";
import { sendVerificationEmail } from "@/lib/mailer";
import { rateLimit, getClientIP } from "@/lib/ratelimit";
import { errorResponse, AppError } from "@/shared/errors";
import { ALLOWED_EMAIL_DOMAINS } from "@/shared/constants";

// POST /api/comments/verify-email - 发送邮箱验证码
export async function POST(req: NextRequest) {
  try {
    // 获取客户端 IP 和地理位置
    const ip = getClientIP(req);

    // 限速：同一 IP 1 分钟内最多 3 次
    const rl = rateLimit(req, {
      max: 3,
      windowMs: 60 * 1000,
      keyFn: () => "verify-email:" + ip,
    });
    if (!rl.success) {
      return NextResponse.json(
        { error: "发送过于频繁，请稍后再试" },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rl.resetAt - Date.now()) / 1000)
            ),
          },
        }
      );
    }

    const body = await req.json();
    const emailSchema = z.string().email("邮箱格式不正确");
    const email = emailSchema.parse(body.email);

    // 域名限制
    if (!ALLOWED_EMAIL_DOMAINS.some((d) => email.toLowerCase().endsWith(d))) {
      return errorResponse(
        new AppError("仅支持 QQ邮箱、Gmail、网易163邮箱")
      );
    }

    // 同一邮箱 1 分钟内不能重复发送
    const recent = await prisma.emailVerification.findFirst({
      where: {
        email,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) },
      },
    });
    if (recent) {
      return errorResponse(new AppError("验证码已发送，请1分钟后再试"));
    }

    // 生成 6 位验证码
    const code = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 分钟

    // 清理该邮箱的旧验证码
    await prisma.emailVerification.deleteMany({ where: { email } });

    // 存储新验证码
    await prisma.emailVerification.create({
      data: { email, code, expires },
    });

    // 发送邮件
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
