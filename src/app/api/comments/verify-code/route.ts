import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/db";
import { rateLimit, getClientIP } from "@/lib/ratelimit";
import { errorResponse, successResponse, AppError } from "@/shared/errors";
import { setEmailVerifiedCookie } from "@/lib/email-session";

// POST /api/comments/verify-code - 校验邮箱验证码
export async function POST(req: NextRequest) {
  try {
    // 限速：同一 IP 1 分钟内最多 10 次
    const ip = getClientIP(req);
    const rl = rateLimit(req, {
      max: 10,
      windowMs: 60 * 1000,
      keyFn: () => "verify-code:" + ip,
    });
    if (!rl.success) {
      return errorResponse(new AppError("尝试过于频繁，请稍后再试", 429));
    }

    const body = await req.json();
    const email = z.string().email().parse(body.email);
    const code = z.string().min(6).max(6).parse(body.code);

    const record = await prisma.emailVerification.findFirst({
      where: { email, code, expires: { gt: new Date() } },
    });

    if (!record) {
      return errorResponse(new AppError("验证码错误"));
    }

    if (record.expires < new Date()) {
      await prisma.emailVerification.delete({ where: { id: record.id } });
      return errorResponse(new AppError("验证码已过期，请重新发送"));
    }

    // 验证通过，删除记录
    await prisma.emailVerification.delete({ where: { id: record.id } });

    // 设置长期有效的验证 cookie（7天），后续评论免验证
    await setEmailVerifiedCookie(email);

    return successResponse({ verified: true, email });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(new AppError("参数不正确"));
    }
    return errorResponse(error);
  }
}
