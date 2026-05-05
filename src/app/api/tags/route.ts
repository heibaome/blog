import { NextRequest } from "next/server";
import { tagService } from "@/modules/tag/service";
import { createTagSchema } from "@/shared/types";
import { errorResponse, successResponse } from "@/shared/errors";
import { requireAdmin } from "@/shared/security";

export async function GET() {
  try {
    const tags = await tagService.getAllTags();
    return successResponse(tags);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const input = createTagSchema.parse(body);
    const tag = await tagService.createTag(input);
    return successResponse(tag, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
