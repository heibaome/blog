import { prisma } from "@/shared/db";
import { requireAdmin } from "@/shared/security";
import { errorResponse, successResponse } from "@/shared/errors";
import { NextRequest } from "next/server";

// GET /api/stats - 仪表盘统计数据（需登录）
export async function GET() {
  try {
    await requireAdmin();

    const [
      totalPosts, publishedPosts, draftPosts,
      totalViews, totalComments, pendingComments,
      totalCategories, totalTags, totalUsers,
    ] = await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { status: "published" } }),
      prisma.post.count({ where: { status: "draft" } }),
      prisma.post.aggregate({ _sum: { viewCount: true } }),
      prisma.comment.count(),
      prisma.comment.count({ where: { status: "pending" } }),
      prisma.category.count(),
      prisma.tag.count(),
      prisma.user.count(),
    ]);

    // 最近 7 天每日新增文章数
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentPosts = await prisma.post.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    });

    // 按日期分组
    const trendMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      trendMap[key] = 0;
    }
    for (const p of recentPosts) {
      const key = p.createdAt.toISOString().slice(0, 10);
      if (key in trendMap) trendMap[key]++;
    }
    const postTrend = Object.entries(trendMap).map(([date, count]) => ({ date, count }));

    // 分类文章数统计
    const categories = await prisma.category.findMany({
      select: {
        name: true,
        _count: { select: { posts: { where: { status: "published" } } } },
      },
      orderBy: { sortOrder: "asc" },
    });
    const categoryStats = categories.map((c) => ({
      name: c.name,
      count: c._count.posts,
    }));

    // 标签文章数统计（Top 15）
    const tags = await prisma.tag.findMany({
      select: {
        name: true,
        _count: { select: { posts: true } },
      },
      orderBy: { posts: { _count: "desc" } },
      take: 15,
    });
    const tagStats = tags.map((t) => ({
      name: t.name,
      count: t._count.posts,
    }));

    // 最近 5 篇文章
    const recentArticles = await prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, title: true, status: true,
        viewCount: true, createdAt: true,
        _count: { select: { comments: true } },
      },
    });

    // 最近 5 条评论
    const recentComments = await prisma.comment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, status: true, authorName: true,
        createdAt: true,
        post: { select: { title: true } },
      },
    });

    return successResponse({
      totalPosts, publishedPosts, draftPosts,
      totalViews: totalViews._sum.viewCount || 0,
      totalComments, pendingComments,
      totalCategories, totalTags, totalUsers,
      postTrend, categoryStats, tagStats,
      recentArticles, recentComments,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
