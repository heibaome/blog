import { prisma } from "@/shared/db";
import { AppError } from "@/shared/errors";
import { type CreatePostInput, type UpdatePostInput, type PaginationInput } from "@/shared/types";
import { deleteUploadFile, cleanupPostImages } from "@/shared/files";
import { buildPaginationParams, paginateResult } from "@/shared/paginate";

// 共用 Prisma select 常量
export const AUTHOR_PUBLIC_SELECT = { displayName: true, avatar: true, role: true } as const;
export const AUTHOR_ADMIN_SELECT = { id: true, username: true } as const;

/**
 * 构建文章搜索的 where 条件
 * PostService 和 SearchService 共用，避免重复定义
 * @param search 搜索关键词
 * @param fields 搜索范围，默认搜全部（title/content/summary）
 */
export function buildSearchWhere(search: string, fields: ("title" | "content" | "summary")[] = ["title", "content", "summary"]) {
  return {
    OR: fields.map((field) => ({ [field]: { contains: search } })),
  };
}

export class PostService {
  // 获取公开文章列表（前台）
  async getPublishedPosts(params: PaginationInput) {
    const { page, pageSize, search } = params;
    const { skip, take } = buildPaginationParams(page, pageSize);

    const where = {
      status: "published" as const,
      ...(search ? buildSearchWhere(search) : {}),
    };

    const results = await prisma.post.findMany({
      where,
      skip,
      take,
      orderBy: [
        { isTop: "desc" },
        { publishedAt: "desc" },
      ],
      include: {
        author: { select: AUTHOR_PUBLIC_SELECT },
        category: { select: { name: true, slug: true } },
        tags: { include: { tag: true } },
        _count: { select: { comments: true } },
      },
    });

    const { items: posts, hasMore } = paginateResult(results, pageSize);
    return { posts, page, pageSize, hasMore };
  }


  // 获取单篇文章（静态渲染用，不递增浏览量）
  async getPostBySlugStatic(slug: string) {
    const post = await prisma.post.findUnique({
      where: { slug, status: "published" },
      include: {
        author: { select: AUTHOR_PUBLIC_SELECT },
        category: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: true } },
        images: { orderBy: { sortOrder: "asc" } },
        _count: { select: { comments: true } },
      },
    });

    if (!post) throw new AppError("文章不存在", 404);
    return post;
  }

  // 异步递增浏览量（客户端调用）
  async incrementViewCount(slug: string) {
    try {
      const post = await prisma.post.update({
        where: { slug, status: "published" },
        data: { viewCount: { increment: 1 } },
        select: { viewCount: true },
      });
      return { viewCount: post.viewCount };
    } catch (error) {
      // P2025: where 条件不匹配（文章不存在或未发布）
      if (error && typeof error === "object" && "code" in error && (error as any).code === "P2025") {
        throw new AppError("文章不存在", 404);
      }
      throw error;
    }
  }

  // 获取文章浏览量（客户端读取用）
  async getViewCount(slug: string) {
    const post = await prisma.post.findUnique({
      where: { slug, status: "published" },
      select: { viewCount: true },
    });
    if (!post) throw new AppError("文章不存在", 404);
    return { viewCount: post.viewCount };
  }

  // 获取所有文章（后台管理）
  async getAllPosts(params: PaginationInput & { status?: string }) {
    const { page, pageSize, search, status } = params;
    const skip = (page - 1) * pageSize;

    const where = {
      ...(status ? { status } : {}),
      ...(search ? buildSearchWhere(search, ["title", "summary"]) : {}),
    };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [
          { isTop: "desc" },
          { createdAt: "desc" },
        ],
        include: {
          author: { select: AUTHOR_ADMIN_SELECT },
          category: { select: { id: true, name: true } },
          tags: { include: { tag: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);

    return { posts, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  // 获取单篇文章（后台编辑）
  async getPostById(id: string) {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
        images: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!post) throw new AppError("文章不存在", 404);
    return post;
  }

  // 创建文章
  async createPost(input: CreatePostInput, authorId: string) {
    // 检查 slug 唯一性
    const existing = await prisma.post.findUnique({ where: { slug: input.slug } });
    if (existing) throw new AppError("该 slug 已存在", 409);

    const post = await prisma.post.create({
      data: {
        title: input.title,
        slug: input.slug,
        content: input.content,
        summary: input.summary,
        coverImage: input.coverImage,
        status: input.status,
        isTop: input.isTop ?? false,
        isEssence: input.isEssence ?? false,
        isOutdated: input.isOutdated ?? false,
        aiSummary: input.aiSummary,
        categoryId: input.categoryId,
        authorId,
        publishedAt: input.status === "published" ? new Date() : null,
        tags: {
          create: input.tagIds.map((tagId) => ({ tagId })),
        },
      },
      include: { tags: { include: { tag: true } }, category: true },
    });

    return post;
  }

  // 更新文章
  async updatePost(id: string, input: UpdatePostInput) {
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) throw new AppError("文章不存在", 404);

    // 如果改了 slug，检查唯一性
    if (input.slug && input.slug !== existing.slug) {
      const slugExists = await prisma.post.findUnique({ where: { slug: input.slug } });
      if (slugExists) throw new AppError("该 slug 已存在", 409);
    }

    // 显式白名单：只传递允许更新的字段，防止意外写入（如 id、createdAt 等）
    const {
      tagIds,
      title,
      slug,
      content,
      summary,
      coverImage,
      status,
      categoryId,
      isTop,
      isEssence,
      isOutdated,
      aiSummary,
    } = input;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (content !== undefined) updateData.content = content;
    if (summary !== undefined) updateData.summary = summary;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (status !== undefined) updateData.status = status;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (isTop !== undefined) updateData.isTop = isTop;
    if (isEssence !== undefined) updateData.isEssence = isEssence;
    if (isOutdated !== undefined) updateData.isOutdated = isOutdated;
    if (aiSummary !== undefined) updateData.aiSummary = aiSummary;

    // 如果状态变为 published，设置发布时间
    if (status === "published" && existing.status !== "published") {
      updateData.publishedAt = new Date();
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...updateData,
        ...(tagIds !== undefined
          ? {
              tags: {
                deleteMany: {},
                create: tagIds.map((tagId) => ({ tagId })),
              },
            }
          : {}),
      },
      include: { tags: { include: { tag: true } }, category: true },
    });

    return post;
  }

  // 删除文章（同时清理关联的图片文件和 PostImage 记录）
  async deletePost(id: string) {
    const existing = await prisma.post.findUnique({
      where: { id },
      include: { images: true },
    });
    if (!existing) throw new AppError("文章不存在", 404);

    // 先删除数据库记录（PostImage 由 onDelete: Cascade 自动清理）
    // 确保数据库操作成功后再清理文件，避免文件删了但数据库回滚的情况
    await prisma.post.delete({ where: { id } });

    // 再清理 PostImage 关联的文件（文件可能已被 Cascade 删除记录，但文件仍在磁盘上）
    await Promise.all(existing.images.map((img) => deleteUploadFile(img.url)));

    // 清理旧 HTML 中嵌入的图片和封面图
    await cleanupPostImages(existing);
  }

  // 按分类获取文章
  async getPostsByCategory(categorySlug: string, params: PaginationInput) {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
    });
    if (!category) throw new AppError("分类不存在", 404);

    const { page, pageSize } = params;
    const { skip, take } = buildPaginationParams(page, pageSize);

    const results = await prisma.post.findMany({
      where: { categoryId: category.id, status: "published" },
      skip,
      take,
      orderBy: { publishedAt: "desc" },
      include: {
        author: { select: AUTHOR_PUBLIC_SELECT },
        category: { select: { name: true, slug: true } },
        tags: { include: { tag: true } },
      },
    });

    const { items: posts, hasMore } = paginateResult(results, pageSize);
    return { posts, page, pageSize, hasMore, category };
  }

  // 按标签获取文章
  async getPostsByTag(tagSlug: string, params: PaginationInput) {
    const tag = await prisma.tag.findUnique({ where: { slug: tagSlug } });
    if (!tag) throw new AppError("标签不存在", 404);

    const { page, pageSize } = params;
    const { skip, take } = buildPaginationParams(page, pageSize);

    const results = await prisma.post.findMany({
      where: {
        status: "published",
        tags: { some: { tagId: tag.id } },
      },
      skip,
      take,
      orderBy: { publishedAt: "desc" },
      include: {
        author: { select: AUTHOR_PUBLIC_SELECT },
        category: { select: { name: true, slug: true } },
        tags: { include: { tag: true } },
      },
    });

    const { items: posts, hasMore } = paginateResult(results, pageSize);
    return { posts, page, pageSize, hasMore, tag };
  }

  // 归档：按月分组
  async getArchive() {
    const posts = await prisma.post.findMany({
      where: { status: "published" },
      orderBy: { publishedAt: "desc" },
      take: 1000, // 上限保护，防止文章数量过多导致内存溢出
      select: {
        id: true,
        title: true,
        slug: true,
        publishedAt: true,
        category: { select: { name: true, slug: true } },
      },
    });

    // 按年月分组
    const archive: Record<string, typeof posts> = {};
    for (const post of posts) {
      if (!post.publishedAt) continue;
      const key = `${post.publishedAt.getFullYear()}-${String(post.publishedAt.getMonth() + 1).padStart(2, "0")}`;
      if (!archive[key]) archive[key] = [];
      archive[key].push(post as (typeof posts)[0]);
    }

    return archive;
  }

  // 获取相邻文章（上一篇/下一篇）
  async getAdjacentPosts(publishedAt: Date, currentId: string) {
    const [prev, next] = await Promise.all([
      // 上一篇：发布时间更早的最近一篇
      prisma.post.findFirst({
        where: { status: "published", publishedAt: { lt: publishedAt }, id: { not: currentId } },
        orderBy: { publishedAt: "desc" },
        select: { title: true, slug: true },
      }),
      // 下一篇：发布时间更晚的最早一篇
      prisma.post.findFirst({
        where: { status: "published", publishedAt: { gt: publishedAt }, id: { not: currentId } },
        orderBy: { publishedAt: "asc" },
        select: { title: true, slug: true },
      }),
    ]);
    return { prev, next };
  }
}

export const postService = new PostService();
