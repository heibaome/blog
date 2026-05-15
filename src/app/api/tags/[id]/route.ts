import { NextRequest } from "next/server";
import { tagService } from "@/modules/tag/service";
import { createTagSchema } from "@/shared/types";
import { errorResponse, successResponse } from "@/shared/errors";
import { requireAdmin } from "@/shared/security";

const updateTagSchema = createTagSchema.partial();

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const input = updateTagSchema.parse(body);
    const tag = await tagService.updateTag(id, input);
    return successResponse(tag);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await tagService.deleteTag(id);
    return successResponse({ message: "已删除" });
  } catch (error) {
    return errorResponse(error);
  }
}
