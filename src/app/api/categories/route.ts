import { NextRequest } from "next/server";
import { categoryService } from "@/modules/category/service";
import { createCategorySchema } from "@/shared/types";
import { errorResponse, successResponse } from "@/shared/errors";
import { requireAdmin } from "@/shared/security";

export async function GET() {
  try {
    const categories = await categoryService.getAllCategories();
    return successResponse(categories);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const input = createCategorySchema.parse(body);
    const category = await categoryService.createCategory(input);
    return successResponse(category, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
