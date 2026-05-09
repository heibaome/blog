import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/modules/auth/service";
import { loginSchema } from "@/shared/types";
import { errorResponse, successResponse, AppError } from "@/shared/errors";
import { setAuthCookie } from "@/shared/security";
import { setCsrfCookie } from "@/lib/csrf";
import { rateLimit, rateLimitPresets, getClientIP } from "@/lib/ratelimit";
import { verifyCaptcha } from "@/lib/captcha";
import { checkLockout, recordFailure, clearFailures } from "@/lib/account-lockout";
import { prisma } from "@/shared/db";

/**
 * 根据用户名或邮箱解析出用户名，用于账号锁定 key。
 * 查不到返回原始输入（锁定仍然生效，只是 key 不统一但不影响安全）。
 */
async function resolveUsername(input: string): Promise<string> {
  if (!input.includes("@")) return input;
  const user = await prisma.user.findUnique({
    where: { email: input },
    select: { username: true },
  });
  return user?.username ?? input;
}

export async function POST(req: NextRequest) {
  try {
    // 速率限制：IP 级，15分钟内最多5次登录尝试
    const rl = rateLimit(req, { ...rateLimitPresets.login, keyFn: () => 'login:' + getClientIP(req) });
    if (!rl.success) {
      return NextResponse.json(
        { error: "登录尝试过于频繁，请稍后再试" },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    // Content-Type 校验：仅接受 JSON，防止意外解析或 CSRF 利用
    const contentType = req.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        { error: "Unsupported Media Type" },
        { status: 415 }
      );
    }

    const body = await req.json();
    const { captchaToken, captchaAnswer, ...loginData } = body;
    const input = loginSchema.parse(loginData);

    // 邮箱登录时，先解析出用户名，统一锁定 key
    const lockKey = await resolveUsername(input.username);
    const clientIP = getClientIP(req);

    // 账号级锁定检查：同一用户名连续失败 5 次后锁定 30 分钟
    const lockStatus = checkLockout(lockKey, clientIP);
    if (lockStatus.isLocked) {
      const minutes = Math.ceil(lockStatus.remainingSeconds / 60);
      return NextResponse.json(
        { error: `账号已锁定，请 ${minutes} 分钟后再试` },
        { status: 429, headers: { "Retry-After": String(lockStatus.remainingSeconds) } }
      );
    }

    if (!captchaToken || !captchaAnswer) {
      return errorResponse(new AppError("请输入验证码"));
    }
    if (!(await verifyCaptcha(captchaToken, captchaAnswer))) {
      return errorResponse(new AppError("验证码错误或已过期"));
    }

    try {
      const result = await authService.login(input);
      // 登录成功，清除失败计数
      clearFailures(lockKey, clientIP);
      await setAuthCookie(result.token);
      await setCsrfCookie();
      return successResponse(result);
    } catch (loginError) {
      // 登录失败，记录失败次数
      const { usernameLocked } = recordFailure(lockKey, clientIP);
      if (usernameLocked) {
        return NextResponse.json(
          { error: "登录失败次数过多，账号已锁定30分钟" },
          { status: 429 }
        );
      }
      // 统一返回"用户名或密码错误"，不泄露具体原因
      throw loginError;
    }
  } catch (error) {
    return errorResponse(error);
  }
}
