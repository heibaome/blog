import { requireAuth } from "@/shared/security";
import { prisma } from "@/shared/db";
import { errorResponse, successResponse } from "@/shared/errors";

// GET /api/comments/stats - 获取评论统计数据（需登录）
export async function GET() {
  try {
    await requireAuth();

    const [total, pending, approved, rejected] = await Promise.all([
      prisma.comment.count(),
      prisma.comment.count({ where: { status: "pending" } }),
      prisma.comment.count({ where: { status: "approved" } }),
      prisma.comment.count({ where: { status: "rejected" } }),
    ]);

    return successResponse({ total, pending, approved, rejected });
  } catch (error) {
    return errorResponse(error);
  }
}
