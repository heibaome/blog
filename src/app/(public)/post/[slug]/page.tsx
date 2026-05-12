import { notFound } from "next/navigation";
import { sanitizeHtml } from "@/lib/sanitize";
import { postService } from "@/modules/post/service";
import { prisma } from "@/shared/db";
import { formatDate } from "@/lib/date";
import { buildMetadata } from "@/lib/seo";
import { CommentSection } from "@/components/comment/CommentSection";
import { ViewCounter } from "@/components/post/ViewCounter";
import Link from "next/link";
import { Calendar, FolderOpen, Tag, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { ImageZoom } from "@/components/motion/ImageZoom";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/** 估算阅读时间（中文 ~400字/分钟，英文 ~250词/分钟） */
function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, "").replace(/\s+/g, "");
  const cjkCount = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  const nonCjk = text.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, "");
  const wordCount = nonCjk.trim() ? nonCjk.trim().split(/\s+/).length : 0;
  const minutes = cjkCount / 400 + wordCount / 250;
  return Math.max(1, Math.ceil(minutes));
}

// ISR：页面静态缓存，每 5 分钟自动检查更新
// 几乎始终返回静态 HTML（无 __NEXT_DATA__），安全优势不变
// 发布/修改文章后最多 5 分钟自动生效，无需手动 build
export const revalidate = 300;

// 构建时预生成所有已发布文章的页面
export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    where: { status: "published" },
    select: { slug: true },
  });
  return posts.map((p) => ({ slug: p.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const post = await postService.getPostBySlugStatic(slug);
    return buildMetadata({
      title: post.title,
      description: post.summary || post.title,
      path: `/post/${slug}`,
      image: post.coverImage || undefined,
      type: "article",
      publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      modifiedTime: new Date(post.updatedAt).toISOString(),
      authors: [post.author.displayName || "墨迹"],
    });
  } catch {
    return buildMetadata({ title: "文章不存在" });
  }
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  let post;
  try {
    post = await postService.getPostBySlugStatic(slug);
  } catch {
    notFound();
  }

  const readingTime = estimateReadingTime(post.content);
  const { prev, next } = post.publishedAt
    ? await postService.getAdjacentPosts(post.publishedAt, post.id)
    : { prev: null, next: null };

  // JSON-LD 结构化数据（Article）
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary || post.title,
    url: `${SITE_URL}/post/${slug}`,
    datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    dateModified: new Date(post.updatedAt).toISOString(),
    author: {
      "@type": "Person",
      name: post.author.displayName || "墨迹",
    },
    publisher: {
      "@type": "Organization",
      name: "墨迹博客",
      url: SITE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/post/${slug}`,
    },
    ...(post.coverImage ? { image: post.coverImage } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="relative">
      {/* 文章头部 */}
      <header className="mb-8 pb-6 border-b border-border">
        {/* 文章标题 */}
        <h1 className="text-2xl sm:text-3xl font-sans font-bold text-ink leading-tight mb-6">
          {post.title}
        </h1>

        {/* 元信息卡片 */}
        <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-paper-warm border border-border">
          {/* 作者 */}
          <div className="flex items-center gap-2">
            {post.author.avatar ? (
              <img
                src={post.author.avatar}
                alt={post.author.displayName || "墨迹"}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-medium">
                {(post.author.displayName || "墨迹")[0]}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-ink">
                {post.author.displayName || "墨迹"}
              </span>
              {post.author.role === "admin" && (
                <span className="text-xs text-accent">博主</span>
              )}
            </div>
          </div>

          <div className="w-px h-8 bg-border hidden sm:block" />

          {/* 日期 */}
          {post.publishedAt && (
            <div className="flex items-center gap-2 text-sm text-ink-light">
              <Calendar size={14} className="text-ink-lighter" />
              <span>{formatDate(post.publishedAt)}</span>
            </div>
          )}

          <div className="w-px h-8 bg-border hidden sm:block" />

          {/* 浏览量 */}
          <ViewCounter slug={slug} initialCount={post.viewCount} />

          {/* 阅读时间 */}
          <div className="flex items-center gap-2 text-sm text-ink-light">
            <Clock size={14} className="text-ink-lighter" />
            <span>{readingTime} 分钟阅读</span>
          </div>

          {/* 分类 */}
          {post.category && (
            <>
              <div className="w-px h-8 bg-border hidden sm:block" />
              <Link
                href={`/category/${post.category.slug}`}
                className="flex items-center gap-1 text-sm text-jade hover:text-jade-light transition-colors"
              >
                <FolderOpen size={14} />
                {post.category.name}
              </Link>
            </>
          )}
        </div>

        {/* 标签 */}
        {post.tags.length > 0 && (
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <Tag size={14} className="text-ink-lighter" />
            {post.tags.map(({ tag }) => (
              <Link
                key={tag.id}
                href={`/tag/${tag.slug}`}
                className="tag-ink"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* 文章正文 */}
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
      />
      <ImageZoom />

      {/* 上一篇 / 下一篇 */}
      {(prev || next) && (
        <nav className="mt-12 pt-8 border-t border-border">
          <h3 className="text-xs font-sans text-ink-lighter mb-4 text-center">— 继续阅读 —</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prev ? (
              <Link
                href={`/post/${prev.slug}`}
                className="group flex flex-col gap-1 p-4 rounded-xl bg-paper-warm border border-border hover:border-accent/30 hover:shadow-md transition-all duration-200"
              >
                <span className="text-xs font-sans text-ink-lighter flex items-center gap-1">
                  <ChevronLeft size={14} /> 上一篇
                </span>
                <span className="text-sm font-sans font-medium text-ink group-hover:text-accent transition-colors line-clamp-2">
                  {prev.title}
                </span>
              </Link>
            ) : <div />}
            {next ? (
              <Link
                href={`/post/${next.slug}`}
                className="group flex flex-col gap-1 p-4 rounded-xl bg-paper-warm border border-border hover:border-accent/30 hover:shadow-md transition-all duration-200 sm:text-right"
              >
                <span className="text-xs font-sans text-ink-lighter flex items-center gap-1 sm:justify-end">
                  下一篇 <ChevronRight size={14} />
                </span>
                <span className="text-sm font-sans font-medium text-ink group-hover:text-accent transition-colors line-clamp-2">
                  {next.title}
                </span>
              </Link>
            ) : <div />}
          </div>
        </nav>
      )}

      {/* 评论区 */}
      <section className="mt-12 pt-8 border-t border-border">
        <CommentSection postId={post.id} />
      </section>
    </article>
    </>
  );
}
