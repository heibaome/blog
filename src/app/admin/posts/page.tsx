"use client";
import { getCsrfHeaders } from "@/lib/csrf-client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/date";
import { PenLine, Trash2, Eye, Edit3, Pin, Star, Image as ImageIcon } from "lucide-react";
import { adminTheme as c } from "@/shared/admin-theme";

interface Post {
  id: string; slug: string; title: string; status: string;
  coverImage: string | null; isTop: boolean; isEssence: boolean;
  publishedAt: string | null; createdAt: string;
  viewCount: number; author: { username: string };
  category: { name: string } | null;
  _count: { comments: number };
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  async function fetchPosts(p = 1) {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts?all=true&page=${p}&pageSize=20`);
      const data = await res.json();
      if (data.data) {
        setPosts(data.data.posts);
        setTotalPages(data.data.totalPages);
      }
    } catch { } finally { setLoading(false); }
  }

  useEffect(() => { fetchPosts(page); }, [page]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`确定删除「${title}」吗？此操作不可恢复。`)) return;
    try {
      await fetch(`/api/posts/${id}`, { method: "DELETE", headers: { "X-Requested-With": "XMLHttpRequest", ...getCsrfHeaders() } });
      fetchPosts(page);
    } catch { }
  }

  const statusColors: Record<string, { bg: string; color: string }> = {
    published: { bg: "rgba(34,197,94,0.1)", color: "#4ade80" },
    draft: { bg: "rgba(234,179,8,0.1)", color: "#facc15" },
    archived: { bg: "rgba(163,163,163,0.1)", color: "#a3a3a3" },
  };

  const statusLabels: Record<string, string> = { published: "已发布", draft: "草稿", archived: "归档" };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: c.white }}>文章管理</h1>
        <Link href="/admin/editor/new"><Button size="sm"><PenLine size={14} /> 写文章</Button></Link>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 w-full rounded-xl animate-pulse" style={{ background: c.card }} />)}</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="mb-4" style={{ color: c.muted }}>还没有文章</p>
          <Link href="/admin/editor/new"><Button>写第一篇文章</Button></Link>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: c.card }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                <th className="text-left px-4 py-3 text-xs uppercase" style={{ color: c.muted }}>文章</th>
                <th className="text-left px-4 py-3 text-xs uppercase hidden sm:table-cell" style={{ color: c.muted }}>状态</th>
                <th className="text-left px-4 py-3 text-xs uppercase hidden md:table-cell" style={{ color: c.muted }}>分类</th>
                <th className="text-right px-4 py-3 text-xs uppercase hidden sm:table-cell" style={{ color: c.muted }}>浏览</th>
                <th className="text-right px-4 py-3 text-xs uppercase w-24" style={{ color: c.muted }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post, idx) => (
                <tr key={post.id} className="transition-colors hover:bg-white/[0.02]"
                  style={{ borderBottom: idx < posts.length - 1 ? `1px solid ${c.border}` : "none" }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* 封面缩略图 */}
                      <div className="w-12 h-8 rounded overflow-hidden flex-shrink-0" style={{ background: c.border }}>
                        {post.coverImage ? (
                          <img src={post.coverImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon size={14} style={{ color: c.muted }} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {post.isTop && <Pin size={12} style={{ color: c.accent }} className="flex-shrink-0" />}
                          {post.isEssence && <Star size={12} style={{ color: "#facc15" }} className="flex-shrink-0" />}
                          <Link href={`/admin/editor/${post.id}`} className="text-sm truncate transition-colors hover:text-white" style={{ color: c.white }}>
                            {post.title}
                          </Link>
                        </div>
                        <p className="text-xs mt-0.5 sm:hidden" style={{ color: c.muted }}>
                          {statusLabels[post.status]} · {formatDate(post.createdAt)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="px-2 py-0.5 rounded text-xs"
                      style={{ background: statusColors[post.status]?.bg, color: statusColors[post.status]?.color }}>
                      {statusLabels[post.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm hidden md:table-cell" style={{ color: c.secondary }}>
                    {post.category?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-right hidden sm:table-cell" style={{ color: c.secondary }}>
                    <Eye size={12} className="inline mr-1" />{post.viewCount}
                    <span className="mx-1" style={{ color: c.border }}>|</span>
                    💬{post._count.comments}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {post.status === "published" && (
                        <a href={`/post/${post.slug}`} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.06]" style={{ color: c.muted }} title="查看">
                          <Eye size={14} />
                        </a>
                      )}
                      <Link href={`/admin/editor/${post.id}`}
                        className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.06]" style={{ color: c.muted }} title="编辑">
                        <Edit3 size={14} />
                      </Link>
                      <button onClick={() => handleDelete(post.id, post.title)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10" style={{ color: c.muted }} title="删除">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className="w-9 h-9 rounded-lg text-sm transition-colors"
              style={p === page ? { background: c.accent, color: "white" } : { color: c.secondary }}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
