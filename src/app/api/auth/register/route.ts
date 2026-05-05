import { NextRequest } from "next/server";
import { authService } from "@/modules/auth/service";
import { registerSchema } from "@/shared/types";
import { errorResponse, successResponse, AppError } from "@/shared/errors";

export async function POST(req: NextRequest) {
  try {
    // 注册已关闭 — 仅管理员可通过后台创建用户
    return errorResponse(new AppError("注册已关闭", 403));
  } catch (error) {
    return errorResponse(error);
  }
}
