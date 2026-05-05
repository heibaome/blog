import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/shared/security";
import { authService } from "@/modules/auth/service";
import { errorResponse, successResponse, AppError } from "@/shared/errors";
import { adminEmailCodes } from "@/lib/admin-email-codes";

// POST /api/auth/bind-email — 验证验证码并绑定邮箱
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const email = z.string().email().parse(body.email);
    const code = z.string().min(6).max(6).parse(body.code);

    // 检查验证码
    const entry = adminEmailCodes.get(user.id);
    if (!entry) {
      return errorResponse(new AppError("请先发送验证码"));
    }

    if (entry.email !== email) {
      return errorResponse(new AppError("邮箱与发送验证码时填写的不一致"));
    }

    if (entry.expires < Date.now()) {
      adminEmailCodes.delete(user.id);
      return errorResponse(new AppError("验证码已过期，请重新发送"));
    }

    if (entry.code !== code) {
      return errorResponse(new AppError("验证码错误"));
    }

    // 验证通过，清除验证码，绑定邮箱
    adminEmailCodes.delete(user.id);
    const updated = await authService.updateProfile(user.id, { email });

    return successResponse({ email: updated.email });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(new AppError("参数不正确"));
    }
    return errorResponse(error);
  }
}
