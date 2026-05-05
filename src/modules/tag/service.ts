import { prisma } from "@/shared/db";
import { AppError } from "@/shared/errors";
import { handlePrismaUniqueError } from "@/shared/prisma-helpers";

export class TagService {
  async getAllTags() {
    return prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { posts: true } } },
    });
  }

  async createTag(data: { name: string; slug: string }) {
    try {
      return await prisma.tag.create({ data });
    } catch (error) {
      handlePrismaUniqueError(error, "标签名或 slug 已存在");
    }
  }

  async updateTag(id: string, data: { name?: string; slug?: string }) {
    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) throw new AppError("标签不存在", 404);
    try {
      return await prisma.tag.update({ where: { id }, data });
    } catch (error) {
      handlePrismaUniqueError(error, "标签名或 slug 已存在");
    }
  }

  async deleteTag(id: string) {
    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) throw new AppError("标签不存在", 404);
    await prisma.tag.delete({ where: { id } });
  }
}

export const tagService = new TagService();
