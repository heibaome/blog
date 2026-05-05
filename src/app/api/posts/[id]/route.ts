import { NextRequest } from "next/server";
import { postService } from "@/modules/post/service";
import { updatePostSchema } from "@/shared/types";
import { errorResponse, successResponse } from "@/shared/errors";
import { requireAdmin } from "@/shared/security";
import { revalidatePostPages } from "@/lib/revalidate";

// GET /api/posts/[id] - 获取文章详情（后台编辑用，仅管理员）
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const post = await postService.getPostById(id);
    return successResponse(post);
  } catch (error) {
    return errorResponse(error);
  }
}

// PUT /api/posts/[id] - 更新文章（仅管理员）
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const input = updatePostSchema.parse(body);
    // 记录旧 slug，用于刷新旧页面缓存
    const oldPost = await postService.getPostById(id);
    const post = await postService.updatePost(id, input);
    // 刷新相关页面缓存（含旧 slug）
    revalidatePostPages(post.slug, oldPost.slug);
    return successResponse(post);
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/posts/[id] - 删除文章（仅管理员）
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    // 记录旧 slug，用于刷新已删除文章的缓存
    const oldPost = await postService.getPostById(id);
    await postService.deletePost(id);
    // 刷新相关页面缓存
    revalidatePostPages(undefined, oldPost.slug);
    return successResponse({ message: "已删除" });
  } catch (error) {
    return errorResponse(error);
  }
}
