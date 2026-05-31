import { notFound } from "next/navigation";
import { sanitizeHtml } from "@/lib/sanitize";
import { postService } from "@/modules/post/service";
import { prisma } from "@/shared/db";
import { formatDate } from "@/lib/date";
import { buildMetadata } from "@/lib/seo";
import { CommentSection } from "@/components/comment/CommentSection";
import { ViewCounter } from "@/components/post/ViewCounter";
import Link from "next/link";
import { MessageCircle, Calendar, FolderOpen, Tag, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { ImageZoom } from "@/components/motion/ImageZoom";
import { getServerLocale, getServerTranslations } from "@/lib/i18n-server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, "").replace(/\s+/g, "");
  const cjkCount = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  const nonCjk = text.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, "");
  const wordCount = nonCjk.trim() ? nonCjk.trim().split(/\s+/).length : 0;
  const minutes = cjkCount / 400 + wordCount / 250;
  return Math.max(1, Math.ceil(minutes));
}

export const revalidate = 300;

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
  const { t, locale } = await getServerTranslations();
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
      authors: [post.author.displayName || t.site_default_author],
      siteName: t.site_blog_name,
      locale,
    });
  } catch {
    return buildMetadata({ title: t.post_not_found, siteName: t.site_blog_name, locale });
  }
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const { t, locale } = await getServerTranslations();
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

  const authorName = post.author.displayName || t.site_default_author;

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
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: t.site_blog_name,
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
      <article>
      <header className="mb-8 pb-6 border-b border-border">
        <h1 className="text-2xl sm:text-3xl font-sans font-bold text-ink leading-tight mb-4">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-sans text-ink-lighter">
          <span className="flex items-center gap-1.5">
            {post.author.avatar && (
              <img
                src={post.author.avatar}
                alt={authorName}
                className="w-5 h-5 rounded-full"
              />
            )}
            {authorName}
            {post.author.role === "admin" && (
              <span title={t.post_author_badge} className="text-sm">👑</span>
            )}
          </span>

          {post.publishedAt && (
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {formatDate(post.publishedAt, locale)}
            </span>
          )}

          <ViewCounter slug={slug} initialCount={post.viewCount} />

          <span className="flex items-center gap-1">
            <Clock size={14} />
            {readingTime} {t.post_reading_time_suffix}
          </span>

          <span className="flex items-center gap-1">
            <MessageCircle size={14} />
            {post._count.comments}
          </span>

          {post.category && (
            <Link
              href={`/category/${post.category.slug}`}
              className="flex items-center gap-1 text-jade hover:text-jade-light transition-colors"
            >
              <FolderOpen size={14} />
              {post.category.name}
            </Link>
          )}
        </div>

        {post.tags.length > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <Tag size={14} className="text-ink-lighter" />
            {post.tags.map(({ tag }) => (
              <Link
                key={tag.id}
                href={`/tag/${tag.slug}`}
                className="px-2 py-0.5 rounded text-xs font-sans bg-paper-warm text-ink-light hover:text-accent hover:bg-accent/5 transition-colors"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
      />
      <ImageZoom />

      {(prev || next) && (
        <nav className="mt-12 pt-8 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
          {prev ? (
            <Link
              href={`/post/${prev.slug}`}
              className="group flex flex-col gap-1 p-4 rounded-xl hover:bg-paper-warm transition-colors"
            >
              <span className="text-xs font-sans text-ink-lighter flex items-center gap-1">
                <ChevronLeft size={14} /> {t.post_prev}
              </span>
              <span className="text-sm font-sans font-medium text-ink group-hover:text-accent transition-colors line-clamp-1">
                {prev.title}
              </span>
            </Link>
          ) : <div />}
          {next ? (
            <Link
              href={`/post/${next.slug}`}
              className="group flex flex-col gap-1 p-4 rounded-xl hover:bg-paper-warm transition-colors sm:text-right"
            >
              <span className="text-xs font-sans text-ink-lighter flex items-center gap-1 sm:justify-end">
                {t.post_next} <ChevronRight size={14} />
              </span>
              <span className="text-sm font-sans font-medium text-ink group-hover:text-accent transition-colors line-clamp-1">
                {next.title}
              </span>
            </Link>
          ) : <div />}
        </nav>
      )}

      <section className="mt-12 pt-8 border-t border-border">
        <CommentSection postId={post.id} />
      </section>
    </article>
    </>
  );
}
