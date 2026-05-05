import { prisma } from "@/shared/db";

// ── CJK 大二元分词 ──────────────────────────────────────
// SQLite FTS5 unicode61 在此环境不支持 CJK，需要预先分词
// "欢迎来到墨迹" → "欢迎 迎来 来到 墨迹 欢 迎 来 到 墨 迹"

function segmentCJK(text: string): string {
  return text.replace(
    /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]+/g,
    (match) => {
      if (match.length <= 1) return match;
      const parts: string[] = [];
      for (let i = 0; i < match.length - 1; i++) {
        parts.push(match.substring(i, i + 2));
      }
      for (let i = 0; i < match.length; i++) {
        parts.push(match[i]);
      }
      return parts.join(" ");
    }
  );
}

// ── FTS5 查询清洗 ───────────────────────────────────────

function sanitizeFts5Query(raw: string): string {
  return raw
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export class SearchService {
  /**
   * 全文搜索（基于 FTS5 + CJK 二元分词）
   */
  async search(query: string, limit = 20) {
    const trimmed = query.trim();

    if (!trimmed || trimmed.length < 2) return [];
    if (trimmed.length > 200) return [];

    const cleaned = sanitizeFts5Query(trimmed);
    if (!cleaned) return [];

    const fts5Query = segmentCJK(cleaned);

    try {
      const results = await prisma.$queryRawUnsafe<
        Array<{
          id: string;
          title: string;
          slug: string;
          summary: string;
          published_at: Date | null;
          categoryName: string | null;
          categorySlug: string | null;
        }>
      >(
        `SELECT
          p.id, p.title, p.slug, p.summary, p.published_at,
          c.name AS categoryName,
          c.slug AS categorySlug
        FROM post_fts f
        JOIN posts p ON f.post_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'published'
          AND post_fts MATCH ?
        ORDER BY bm25(post_fts), p.published_at DESC
        LIMIT ?`,
        fts5Query,
        limit
      );

      return results.map((r) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        summary: r.summary,
        publishedAt: r.published_at,
        category: r.categoryName
          ? { name: r.categoryName, slug: r.categorySlug }
          : null,
      }));
    } catch (error: any) {
      if (error?.message?.includes("fts5")) {
        console.warn("[SearchService] FTS5 error:", error.message);
        return [];
      }
      throw error;
    }
  }

  /**
   * 同步文章到 FTS 索引
   */
  async syncPost(postId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        status: true,
        title: true,
        summary: true,
        content: true,
      },
    });
    if (!post) return;

    await prisma.$executeRawUnsafe(
      "DELETE FROM post_fts WHERE post_id = ?",
      postId
    );

    if (post.status === "published") {
      await prisma.$executeRawUnsafe(
        "INSERT INTO post_fts(title, summary, content, post_id) VALUES (?, ?, ?, ?)",
        segmentCJK(post.title),
        segmentCJK(post.summary || ""),
        segmentCJK(post.content || ""),
        post.id
      );
    }
  }

  /**
   * 从 FTS 索引中移除文章
   */
  async removeFromIndex(postId: string) {
    await prisma.$executeRawUnsafe(
      "DELETE FROM post_fts WHERE post_id = ?",
      postId
    );
  }

  /**
   * 全量重建索引
   */
  async rebuildIndex() {
    await prisma.$executeRawUnsafe("DELETE FROM post_fts");
    const published = await prisma.post.findMany({
      where: { status: "published" },
      select: { id: true, title: true, summary: true, content: true },
    });
    for (const post of published) {
      await prisma.$executeRawUnsafe(
        "INSERT INTO post_fts(title, summary, content, post_id) VALUES (?, ?, ?, ?)",
        segmentCJK(post.title),
        segmentCJK(post.summary || ""),
        segmentCJK(post.content || ""),
        post.id
      );
    }
    return published.length;
  }
}

export const searchService = new SearchService();
