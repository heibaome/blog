import { NextRequest } from "next/server";
import { postService } from "@/modules/post/service";
import { paginationSchema, createPostSchema } from "@/shared/types";
import { errorResponse, successResponse } from "@/shared/errors";
import { requireAuth, requireAdmin } from "@/shared/security";
import { revalidatePostPages } from "@/lib/revalidate";

// GET /api/posts - 获取公开文章列表
export async function GET(req: NextRequest) {
  try {
    const params = paginationSchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const result = await postService.getPublishedPosts(params);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/posts - 创建文章（仅管理员）
export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await req.json();
    const input = createPostSchema.parse(body);
    const post = await postService.createPost(input, user.id);
    // 发布文章时刷新相关页面缓存
    if (input.status === "published") {
      revalidatePostPages(input.slug);
    }
    return successResponse(post, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
