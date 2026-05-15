import { prisma } from "@/shared/db";
import { buildSearchWhere } from "@/modules/post/service";

export class SearchService {
  async search(query: string, limit = 20) {
    if (!query.trim()) return [];

    return prisma.post.findMany({
      where: {
        status: "published",
        ...buildSearchWhere(query),
      },
      take: limit,
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        publishedAt: true,
        category: { select: { name: true, slug: true } },
      },
    });
  }
}

export const searchService = new SearchService();
