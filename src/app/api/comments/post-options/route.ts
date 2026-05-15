import { commentService } from "@/modules/comment/service";
import { errorResponse, successResponse } from "@/shared/errors";
import { requireAuth } from "@/shared/security";

// GET /api/comments/post-options - 获取文章列表（用于评论筛选下拉框，需登录）
export async function GET() {
  try {
    await requireAuth();
    const posts = await commentService.getPostOptions();
    return successResponse(posts);
  } catch (error) {
    return errorResponse(error);
  }
}
