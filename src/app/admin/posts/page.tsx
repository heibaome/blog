"use client";
import { getCsrfHeaders } from "@/lib/csrf-client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/date";
import { PenLine, Trash2, Eye, Edit3, Pin, Star, Image as ImageIcon, FileText, MessageCircle } from "lucide-react";
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
    published: { bg: "rgba(16, 185, 129, 0.12)", color: "#4ade80" },
    draft: { bg: "rgba(245, 158, 11, 0.12)", color: "#facc15" },
    archived: { bg: "rgba(163, 163, 163, 0.12)", color: "#a3a3a3" },
  };

  const statusLabels: Record<string, string> = { published: "已发布", draft: "草稿", archived: "归档" };

  const cardStyle = {
    background: c.card,
    border: `1px solid ${c.border}`,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)"
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: c.white }}>文章管理</h1>
          <p className="text-sm mt-1" style={{ color: c.secondary }}>管理您的所有文章内容</p>
        </div>
        <Link href="/admin/editor/new">
          <Button size="md" className="gap-2" style={{ background: "linear-gradient(135deg, #c0483e 0%, #ef4444 100%)" }}>
            <PenLine size={16} /> 写文章
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 w-full rounded-2xl animate-pulse" style={{ background: c.card }} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20" style={cardStyle}>
          <FileText size={48} className="mx-auto mb-4 opacity-30" style={{ color: c.muted }} />
          <p className="mb-4 text-lg" style={{ color: c.muted }}>还没有文章</p>
          <Link href="/admin/editor/new">
            <Button>写第一篇文章</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${c.border}`, background: "rgba(0,0,0,0.1)" }}>
                <th className="text-left px-6 py-4 text-xs uppercase font-semibold" style={{ color: c.muted }}>文章</th>
                <th className="text-left px-6 py-4 text-xs uppercase font-semibold hidden sm:table-cell" style={{ color: c.muted }}>状态</th>
                <th className="text-left px-6 py-4 text-xs uppercase font-semibold hidden md:table-cell" style={{ color: c.muted }}>分类</th>
                <th className="text-right px-6 py-4 text-xs uppercase font-semibold hidden sm:table-cell" style={{ color: c.muted }}>数据</th>
                <th className="text-right px-6 py-4 text-xs uppercase font-semibold w-28" style={{ color: c.muted }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post, idx) => (
                <tr key={post.id} className="transition-all duration-200 hover:bg-white/[0.04]"
                  style={{ borderBottom: idx < posts.length - 1 ? `1px solid ${c.border}` : "none" }}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      {/* 封面缩略图 */}
                      <div className="w-14 h-10 rounded-xl overflow-hidden flex-shrink-0" style={{ background: c.border }}>
                        {post.coverImage ? (
                          <img src={post.coverImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon size={16} style={{ color: c.muted }} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {post.isTop && <Pin size={14} style={{ color: c.accent }} className="flex-shrink-0" />}
                          {post.isEssence && <Star size={14} style={{ color: "#facc15" }} className="flex-shrink-0" />}
                          <Link href={`/admin/editor/${post.id}`} className="text-base truncate transition-colors hover:text-white font-medium" style={{ color: c.white }}>
                            {post.title}
                          </Link>
                        </div>
                        <p className="text-xs" style={{ color: c.muted }}>
                          {formatDate(post.createdAt)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 hidden sm:table-cell">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{ background: statusColors[post.status]?.bg, color: statusColors[post.status]?.color }}>
                      {statusLabels[post.status]}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm hidden md:table-cell" style={{ color: c.secondary }}>
                    {post.category?.name || "—"}
                  </td>
                  <td className="px-6 py-5 text-sm text-right hidden sm:table-cell" style={{ color: c.secondary }}>
                    <Eye size={14} className="inline mr-1" style={{ color: c.muted }} />{post.viewCount}
                    <span className="mx-2" style={{ color: c.border }}>|</span>
                    <MessageCircle size={14} className="inline mr-1" style={{ color: c.muted }} />{post._count.comments}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">
                      {post.status === "published" && (
                        <a href={`/post/${post.slug}`} target="_blank" rel="noopener noreferrer"
                          className="p-2.5 rounded-xl transition-all hover:bg-white/[0.06] hover:scale-105" style={{ color: c.muted }} title="查看">
                          <Eye size={16} />
                        </a>
                      )}
                      <Link href={`/admin/editor/${post.id}`}
                        className="p-2.5 rounded-xl transition-all hover:bg-white/[0.06] hover:scale-105" style={{ color: c.muted }} title="编辑">
                        <Edit3 size={16} />
                      </Link>
                      <button onClick={() => handleDelete(post.id, post.title)}
                        className="p-2.5 rounded-xl transition-all hover:bg-red-500/10 hover:text-red-400 hover:scale-105" style={{ color: c.muted }} title="删除">
                        <Trash2 size={16} />
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
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className="w-10 h-10 rounded-xl text-sm font-medium transition-all duration-200"
              style={p === page
                ? {
                  background: "linear-gradient(135deg, #c0483e 0%, #ef4444 100%)",
                  color: "white",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.3)"
                }
                : { color: c.secondary, background: c.card, border: `1px solid ${c.border}` }
              }>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
