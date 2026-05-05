import { NextRequest } from "next/server";
import { prisma } from "@/shared/db";
import { errorResponse, successResponse } from "@/shared/errors";
import { requireAdmin } from "@/shared/security";
import { postImageUrlSchema } from "@/shared/types";
import { AppError } from "@/shared/errors";
import { deleteUploadFile } from "@/shared/files";

// GET /api/posts/[id]/images - 获取文章的所有图片
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // 验证文章存在
    const post = await prisma.post.findUnique({ where: { id }, select: { id: true } });
    if (!post) throw new AppError("文章不存在", 404);

    const images = await prisma.postImage.findMany({
      where: { postId: id },
      orderBy: { sortOrder: "asc" },
    });

    return successResponse(images);
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/posts/[id]/images - 为文章添加图片
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // 验证文章存在
    const post = await prisma.post.findUnique({ where: { id }, select: { id: true } });
    if (!post) throw new AppError("文章不存在", 404);

    const body = await req.json();
    const input = postImageUrlSchema.parse(body);

    // 获取当前最大 sortOrder
    const maxOrder = await prisma.postImage.findFirst({
      where: { postId: id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const image = await prisma.postImage.create({
      data: {
        postId: id,
        url: input.url,
        sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
      },
    });

    return successResponse(image, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/posts/[id]/images - 删除指定图片（body: { imageId }）
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await req.json();
    const { imageId } = body;

    if (!imageId || typeof imageId !== "string") {
      throw new AppError("缺少图片 ID", 400);
    }

    // 查找图片，验证属于该文章
    const image = await prisma.postImage.findUnique({
      where: { id: imageId },
    });

    if (!image || image.postId !== id) {
      throw new AppError("图片不存在", 404);
    }

    // 删除文件
    await deleteUploadFile(image.url);

    // 删除数据库记录
    await prisma.postImage.delete({ where: { id: imageId } });

    return successResponse({ message: "已删除" });
  } catch (error) {
    return errorResponse(error);
  }
}

// 注：排序功能由 /api/posts/[id]/images/reorder 处理
