import { prisma } from "@/shared/db";
import { AppError } from "@/shared/errors";
import { handlePrismaUniqueError } from "@/shared/prisma-helpers";

export class CategoryService {
  async getAllCategories() {
    return prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { posts: true } },
        children: { orderBy: { sortOrder: "asc" } },
      },
    });
  }

  async createCategory(data: { name: string; slug: string; parentId?: string | null; sortOrder?: number }) {
    try {
      return await prisma.category.create({ data });
    } catch (error) {
      handlePrismaUniqueError(error, "分类名或 slug 已存在");
    }
  }

  async updateCategory(id: string, data: { name?: string; slug?: string; parentId?: string | null; sortOrder?: number }) {
    const cat = await prisma.category.findUnique({ where: { id } });
    if (!cat) throw new AppError("分类不存在", 404);
    try {
      return await prisma.category.update({ where: { id }, data });
    } catch (error) {
      handlePrismaUniqueError(error, "分类名或 slug 已存在");
    }
  }

  async deleteCategory(id: string) {
    const cat = await prisma.category.findUnique({ where: { id }, include: { children: true } });
    if (!cat) throw new AppError("分类不存在", 404);
    if (cat.children.length > 0) throw new AppError("请先删除子分类", 400);
    await prisma.category.delete({ where: { id } });
  }
}

export const categoryService = new CategoryService();
