import { NextRequest } from "next/server";
import { z } from "zod";
import { commentService } from "@/modules/comment/service";
import { errorResponse, successResponse, AppError } from "@/shared/errors";
import { requireAdmin } from "@/shared/security";

const batchActionSchema = z.object({
  action: z.enum(["approve", "reject", "delete"]),
  ids: z.array(z.string().min(1)).min(1, "请选择至少一条评论").max(100, "单次最多操作 100 条"),
});

// POST /api/comments/batch - 批量操作评论（仅管理员）
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { action, ids } = batchActionSchema.parse(body);

    if (action === "delete") {
      const result = await commentService.batchDelete(ids);
      return successResponse(result);
    }

    const status = action === "approve" ? "approved" : "rejected";
    const result = await commentService.batchUpdateStatus(ids, status);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
