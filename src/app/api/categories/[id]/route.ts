import { NextRequest } from "next/server";
import { categoryService } from "@/modules/category/service";
import { createCategorySchema } from "@/shared/types";
import { errorResponse, successResponse } from "@/shared/errors";
import { requireAdmin } from "@/shared/security";

const updateCategorySchema = createCategorySchema.partial();

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const input = updateCategorySchema.parse(body);
    const category = await categoryService.updateCategory(id, input);
    return successResponse(category);
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
    await categoryService.deleteCategory(id);
    return successResponse({ message: "已删除" });
  } catch (error) {
    return errorResponse(error);
  }
}
