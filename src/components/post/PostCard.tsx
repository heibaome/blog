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
    <article className="post-card group">
      <Link href={`/post/${post.slug}`} className="block">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
          {post.coverImage && (
            <div className="hidden sm:block w-32 h-24 flex-shrink-0 overflow-hidden rounded-md">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* 顶部信息栏：分类 + 日期 + 置顶标识 */}
            <div className="flex items-center gap-3 mb-3">
              {post.category && (
                <span className="category-stamp">
                  <FolderOpen size={10} className="mr-1" />
                  {post.category.name}
                </span>
              )}
              {post.publishedAt && (
                <time className="post-date">
                  {formatRelative(post.publishedAt, locale)}
                </time>
              )}
              {/* 置顶标识 */}
              {(post as any).isTop && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-sans bg-accent/10 text-accent border border-accent/20">
                  <span className="text-[10px]">📌</span>
                  置顶
                </span>
              )}
            </div>

            {/* 标题 */}
            <h2 className="post-title mb-2">
              {post.title}
            </h2>

            {/* 摘要 */}
            {post.summary && (
              <p className="post-excerpt mb-3">
                {post.summary}
              </p>
            )}

            {/* 底部标签和统计 */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {post.tags && post.tags.length > 0 && (
                <div className="flex items-center gap-2">
                  <Tag size={10} className="text-ink-mist" />
                  {post.tags.slice(0, 3).map(({ tag }) => (
                    <Link
                      key={tag.id}
                      href={`/tag/${tag.slug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="tag-ink"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              )}

              <div className="post-meta ml-auto">
                <span className="post-meta-item">
                  <Eye size={12} />
                  {post.viewCount}
                </span>
                {post._count && (
                  <span className="post-meta-item">
                    <MessageCircle size={12} />
                    {post._count.comments}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
