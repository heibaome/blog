"use client";

import Link from "next/link";
import { formatRelative } from "@/lib/date";
import { Eye, MessageCircle, FolderOpen, Tag } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";

interface PostCardProps {
  post: {
    id: string;
    slug: string;
    title: string;
    summary: string;
    publishedAt: Date | string | null;
    viewCount: number;
    coverImage?: string | null;
    category?: { name: string; slug: string } | null;
    tags?: { tag: { id: string; name: string; slug: string } }[];
    _count?: { comments: number };
  };
}

export function PostCard({ post }: PostCardProps) {
  const { locale } = useLocale();

  return (
    <article className="group">
      <Link href={`/post/${post.slug}`} className="block">
        <div className="py-6 border-b border-border group-hover:border-accent/30 transition-all duration-300">
          {/* 分类和日期 */}
          <div className="flex items-center gap-3 mb-2 text-xs font-sans text-ink-lighter">
            {post.category && (
              <span className="flex items-center gap-1 text-jade">
                <FolderOpen size={12} />
                {post.category.name}
              </span>
            )}
            {post.publishedAt && (
              <time>{formatRelative(post.publishedAt, locale)}</time>
            )}
          </div>

          {/* 标题 */}
          <h2 className="text-lg sm:text-xl font-sans font-semibold text-ink group-hover:text-accent transition-colors duration-200 mb-2 group-hover:translate-x-0.5 transition-transform">
            {post.title}
          </h2>

          {/* 摘要 */}
          {post.summary && (
            <p className="text-sm text-ink-light line-clamp-2 leading-relaxed mb-3">
              {post.summary}
            </p>
          )}

          {/* 底部元信息 */}
          <div className="flex items-center gap-4 text-xs font-sans text-ink-lighter">
            {post.tags && post.tags.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Tag size={12} />
                {post.tags.slice(0, 3).map(({ tag }) => (
                  <Link
                    key={tag.id}
                    href={`/tag/${tag.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="px-1.5 py-0.5 rounded bg-paper-warm text-ink-light hover:text-accent group-hover:bg-accent/5 transition-colors duration-300"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 ml-auto">
              <span className="flex items-center gap-1">
                <Eye size={12} />
                {post.viewCount}
              </span>
              {post._count && (
                <span className="flex items-center gap-1">
                  <MessageCircle size={12} />
                  {post._count.comments}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
