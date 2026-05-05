import { NextRequest } from "next/server";
import { z } from "zod";
import { commentService } from "@/modules/comment/service";
import { errorResponse, successResponse, AppError } from "@/shared/errors";
import { requireAdmin } from "@/shared/security";

const updateCommentStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
});

// PATCH /api/comments/[id] - 修改评论状态（仅管理员）
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { status } = updateCommentStatusSchema.parse(body);
    const comment = await commentService.updateCommentStatus(id, status);
    return successResponse(comment);
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/comments/[id] - 删除评论（仅管理员）
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await commentService.deleteComment(id);
    return successResponse({ message: "已删除" });
  } catch (error) {
    return errorResponse(error);
  }
}
