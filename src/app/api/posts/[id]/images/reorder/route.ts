import { NextRequest } from "next/server";
import { prisma } from "@/shared/db";
import { errorResponse, successResponse } from "@/shared/errors";
import { requireAdmin } from "@/shared/security";

// PUT /api/posts/[id]/images/reorder - 更新图片排列顺序
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await req.json();
    const { imageIds } = body as { imageIds: string[] };

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return errorResponse(new Error("请提供图片 ID 列表"));
    }

    // 验证这些图片确实属于该文章
    const postImages = await prisma.postImage.findMany({
      where: { postId: id },
      select: { id: true },
    });
    const postImageIdSet = new Set(postImages.map((img) => img.id));

    for (const imgId of imageIds) {
      if (!postImageIdSet.has(imgId)) {
        return errorResponse(new Error(`图片 ${imgId} 不属于该文章`));
      }
    }

    // 批量更新 sortOrder
    await Promise.all(
      imageIds.map((imgId, index) =>
        prisma.postImage.update({
          where: { id: imgId },
          data: { sortOrder: index },
        })
      )
    );

    return successResponse({ message: "排序已更新" });
  } catch (error) {
    return errorResponse(error);
  }
}
