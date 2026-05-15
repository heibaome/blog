import { NextRequest } from "next/server";
import { getCurrentUser } from "@/shared/security";
import { AppError, errorResponse, successResponse } from "@/shared/errors";
import { authService } from "@/modules/auth/service";
import { updateProfileSchema } from "@/shared/types";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return successResponse(user);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse(new AppError("未登录", 401));
    }
    const body = await req.json();
    // 路由层 Zod 白名单校验：拒绝未知字段，防止字段注入
    const input = updateProfileSchema.parse(body);
    const result = await authService.updateProfile(user.id, input);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
