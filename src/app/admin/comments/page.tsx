"use client";
import { getCsrfHeaders } from "@/lib/csrf-client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { formatRelative } from "@/lib/date";
import {
  Check, X, Trash2, MessageCircle, ChevronDown, ChevronLeft, ChevronRight,
  Search, CheckSquare, Square, MinusSquare,
} from "lucide-react";

import { adminTheme as c } from "@/shared/admin-theme";

interface Comment {
  id: string;
  content: string;
  status: string;
  authorName: string | null;
  createdAt: string;
  post: { id: string; title: string; slug: string };
  user: { id: string; username: string } | null;
}

interface CommentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface PostOption {
  id: string;
  title: string;
}

const PAGE_SIZE = 15;

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CommentStats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [statusFilter, setStatusFilter] = useState("");
  const [loadError, setLoadError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 搜索
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // 文章筛选（后端）
  const [postFilter, setPostFilter] = useState("");
  const [showPostDropdown, setShowPostDropdown] = useState(false);
  const [postOptions, setPostOptions] = useState<PostOption[]>([]);

  // 批量选择
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);

  // 获取统计数据
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/comments/stats", {
        headers: { ...getCsrfHeaders() },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data) setStats(data.data);
      }
    } catch { /* 静默失败 */ }
  }, []);

  // 获取文章列表（用于筛选下拉框）
  const fetchPostOptions = useCallback(async () => {
    try {
      const res = await fetch("/api/comments/post-options");
      if (res.ok) {
        const data = await res.json();
        if (data.data) setPostOptions(data.data);
      }
    } catch { /* 静默失败 */ }
  }, []);

  // 获取评论列表（后端搜索+筛选）
  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        all: "true",
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      if (postFilter) params.set("filterPostId", postFilter);

      const res = await fetch(`/api/comments?${params}`);
      const data = await res.json();
      if (data.data) {
        setComments(data.data.comments);
        setTotalPages(data.data.totalPages || 1);
        setLoadError(false);
      }
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, postFilter, page]);

  useEffect(() => { fetchStats(); fetchPostOptions(); }, []);
  useEffect(() => { fetchComments(); }, [fetchComments]);

  // 筛选变化时重置页码和选择
  function handleStatusChange(status: string) {
    setStatusFilter(status);
    setPage(1);
    setSelectedIds(new Set());
  }

  function handleSearch() {
    setSearch(searchInput.trim());
    setPage(1);
    setSelectedIds(new Set());
  }

  function handlePostFilter(postId: string) {
    setPostFilter(postId);
    setPage(1);
    setSelectedIds(new Set());
    setShowPostDropdown(false);
  }

  // 批量选择逻辑
  const currentPageIds = useMemo(() => comments.map(c => c.id), [comments]);
  const allSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedIds.has(id));
  const someSelected = currentPageIds.some(id => selectedIds.has(id)) && !allSelected;

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        currentPageIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        currentPageIds.forEach(id => next.add(id));
        return next;
      });
    }
  }

  // 批量操作
  async function batchAction(action: "approve" | "reject" | "delete") {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (action === "delete" && !confirm(`确定删除 ${ids.length} 条评论？`)) return;

    setBatchLoading(true);
    setActionError(null);
    try {
      const res = await fetch("/api/comments/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest", ...getCsrfHeaders() },
        body: JSON.stringify({ action, ids }),
      });
      if (!res.ok) {
        const d = await res.json();
        setActionError(d.error || "批量操作失败");
        return;
      }
      setSelectedIds(new Set());
      fetchComments();
      fetchStats();
    } catch {
      setActionError("网络错误，批量操作失败");
    } finally {
      setBatchLoading(false);
    }
  }

  // 单条评论操作
  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch("/api/comments/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest", ...getCsrfHeaders() },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const d = await res.json();
        setActionError(d.error || "操作失败");
        return;
      }
      fetchComments();
      fetchStats();
    } catch {
      setActionError("网络错误，操作失败");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除此评论？")) return;
    try {
      const res = await fetch("/api/comments/" + id, {
        method: "DELETE",
        headers: { "X-Requested-With": "XMLHttpRequest", ...getCsrfHeaders() },
      });
      if (!res.ok) {
        const d = await res.json();
        setActionError(d.error || "删除失败");
        return;
      }
      setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
      fetchComments();
      fetchStats();
    } catch {
      setActionError("网络错误，删除失败");
    }
  }

  // 按文章分组
  const groupedComments = useMemo(() => {
    const groups: Record<string, { post: Comment["post"]; comments: Comment[] }> = {};
    comments.forEach(c => {
      if (!groups[c.post.id]) groups[c.post.id] = { post: c.post, comments: [] };
      groups[c.post.id].comments.push(c);
    });
    return Object.values(groups);
  }, [comments]);

  const statusStyles: Record<string, { bg: string; color: string }> = {
    approved: { bg: "rgba(34, 197, 94, 0.1)", color: "#4ade80" },
    pending: { bg: "rgba(234, 179, 8, 0.1)", color: "#facc15" },
    rejected: { bg: "rgba(220, 38, 38, 0.1)", color: "#f87171" },
  };

  return (
    <div className="animate-fade-in">
      {/* 错误提示 */}
      {actionError && (
        <div className="mb-4 px-4 py-3 rounded-xl flex items-center justify-between" style={{ background: "rgba(220, 38, 38, 0.1)", border: "1px solid rgba(220, 38, 38, 0.3)" }}>
          <span className="text-sm" style={{ color: "#f87171" }}>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-xs" style={{ color: "#f87171" }}>关闭</button>
        </div>
      )}

      {/* 标题 + 统计面板 */}
      <div className="mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2 mb-4" style={{ color: c.white }}>
          <MessageCircle size={20} /> 评论管理
        </h1>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "全部", value: stats.total, filter: "", color: c.secondary },
            { label: "待审核", value: stats.pending, filter: "pending", color: "#facc15" },
            { label: "已通过", value: stats.approved, filter: "approved", color: "#4ade80" },
            { label: "已拒绝", value: stats.rejected, filter: "rejected", color: "#f87171" },
          ].map((item) => (
            <button
              key={item.filter}
              onClick={() => handleStatusChange(item.filter)}
              className="rounded-xl p-4 text-left transition-all"
              style={{
                background: statusFilter === item.filter ? "rgba(192, 72, 62, 0.08)" : c.card,
                border: `1px solid ${statusFilter === item.filter ? c.accent : c.border}`,
              }}
            >
              <p className="text-xs mb-1" style={{ color: c.muted }}>{item.label}</p>
              <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 工具栏：搜索 + 文章筛选 */}
      <div className="flex items-center gap-2 mb-4">
        {/* 搜索框 */}
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 flex items-center rounded-lg overflow-hidden" style={{ border: `1px solid ${c.border}` }}>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              placeholder="搜索评论内容或昵称..."
              className="flex-1 px-3 py-1.5 text-xs bg-transparent outline-none"
              style={{ color: c.primary }}
            />
            <button
              onClick={handleSearch}
              className="px-3 py-1.5 transition-colors"
              style={{ color: c.muted }}
              title="搜索"
            >
              <Search size={14} />
            </button>
          </div>
          {search && (
            <button
              onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
              className="text-xs px-2 py-1 rounded-lg transition-colors"
              style={{ color: c.accent, border: `1px solid ${c.accent}` }}
            >
              清除搜索
            </button>
          )}
        </div>

        {/* 文章筛选 */}
        <div className="relative">
          <button onClick={() => setShowPostDropdown(!showPostDropdown)}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs transition-colors max-w-[200px]"
            style={{ color: c.secondary, border: `1px solid ${c.border}` }}>
            <span className="truncate">
              {postFilter ? (postOptions.find(p => p.id === postFilter)?.title || "筛选文章") : "按文章筛选"}
            </span>
            <ChevronDown size={12} className="flex-shrink-0" />
          </button>
          {showPostDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowPostDropdown(false)} />
              <div className="absolute right-0 top-full mt-1 w-72 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto"
                style={{ background: c.card, border: `1px solid ${c.border}` }}>
                <button onClick={() => handlePostFilter("")}
                  className="w-full text-left px-3.5 py-2.5 text-xs transition-colors hover:bg-white/5"
                  style={{ color: !postFilter ? c.accent : c.secondary }}>
                  全部文章
                </button>
                {postOptions.map(p => (
                  <button key={p.id} onClick={() => handlePostFilter(p.id)}
                    className="w-full text-left px-3.5 py-2.5 text-xs truncate transition-colors hover:bg-white/5"
                    style={postFilter === p.id ? { color: c.accent, background: "rgba(192,72,62,0.1)" } : { color: c.primary }}>
                    {p.title}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 批量操作栏 */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 rounded-xl"
          style={{ background: "rgba(192, 72, 62, 0.06)", border: `1px solid ${c.accent}33` }}>
          <span className="text-xs" style={{ color: c.secondary }}>
            已选择 {selectedIds.size} 条评论
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => batchAction("approve")}
              disabled={batchLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-green-500/10 disabled:opacity-50"
              style={{ color: "#4ade80", border: "1px solid #4ade8033" }}
            >
              <Check size={12} /> 批量通过
            </button>
            <button
              onClick={() => batchAction("reject")}
              disabled={batchLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-yellow-500/10 disabled:opacity-50"
              style={{ color: "#facc15", border: "1px solid #facc1533" }}
            >
              <X size={12} /> 批量拒绝
            </button>
            <button
              onClick={() => batchAction("delete")}
              disabled={batchLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-red-500/10 disabled:opacity-50"
              style={{ color: "#f87171", border: "1px solid #f8717133" }}
            >
              <Trash2 size={12} /> 批量删除
            </button>
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs ml-auto"
            style={{ color: c.muted }}
          >
            取消选择
          </button>
        </div>
      )}

      {/* 评论列表 */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="skeleton h-20 w-full" style={{ background: c.card }} />)}</div>
      ) : loadError ? (
        <div className="text-center py-20 space-y-3">
          <p style={{ color: c.muted }}>加载评论失败</p>
          <button onClick={() => { setLoading(true); setLoadError(false); fetchComments(); }}
            className="text-xs px-3 py-1.5 rounded-lg" style={{ color: c.accent, border: "1px solid " + c.accent }}>
            点击重试
          </button>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-20"><p style={{ color: c.muted }}>暂无评论</p></div>
      ) : (
        <div className="space-y-6">
          {/* 全选按钮 */}
          <div className="flex items-center gap-2">
            <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs transition-colors" style={{ color: c.muted }}>
              {allSelected ? <CheckSquare size={14} style={{ color: c.accent }} /> : someSelected ? <MinusSquare size={14} style={{ color: c.accent }} /> : <Square size={14} />}
              {allSelected ? "取消全选" : "全选本页"}
            </button>
          </div>

          {groupedComments.map(group => (
            <div key={group.post.id}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1 h-5 rounded-full" style={{ background: c.accent }} />
                <a href={"/post/" + group.post.slug} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-semibold transition-colors" style={{ color: c.white }}>
                  {group.post.title}
                </a>
                <span className="text-xs" style={{ color: c.muted }}>({group.comments.length} 条评论)</span>
              </div>
              <div className="space-y-2 ml-4">
                {group.comments.map(comment => (
                  <div key={comment.id} className="rounded-xl p-4 transition-all"
                    style={{
                      background: selectedIds.has(comment.id) ? "rgba(192, 72, 62, 0.06)" : c.card,
                      border: selectedIds.has(comment.id) ? `1px solid ${c.accent}44` : "1px solid transparent",
                    }}>
                    <div className="flex items-start gap-3">
                      {/* 勾选框 */}
                      <button
                        onClick={() => toggleSelect(comment.id)}
                        className="mt-1 flex-shrink-0 transition-colors"
                        style={{ color: selectedIds.has(comment.id) ? c.accent : c.muted }}
                      >
                        {selectedIds.has(comment.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded-lg text-xs"
                            style={{ background: statusStyles[comment.status]?.bg, color: statusStyles[comment.status]?.color }}>
                            {comment.status === "pending" ? "待审核" : comment.status === "approved" ? "已通过" : "已拒绝"}
                          </span>
                          <span className="text-sm" style={{ color: c.white }}>
                            {comment.user?.username || comment.authorName || "匿名"}
                          </span>
                          <span className="text-xs" style={{ color: c.muted }}>{formatRelative(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap" style={{ color: c.primary }}>{comment.content}</p>
                      </div>

                      {/* 单条操作按钮 */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {comment.status !== "approved" && (
                          <button onClick={() => updateStatus(comment.id, "approved")}
                            className="p-2 rounded-lg transition-colors hover:bg-green-500/10" style={{ color: c.muted }} title="通过">
                            <Check size={16} />
                          </button>
                        )}
                        {comment.status !== "rejected" && (
                          <button onClick={() => updateStatus(comment.id, "rejected")}
                            className="p-2 rounded-lg transition-colors hover:bg-yellow-500/10" style={{ color: c.muted }} title="拒绝">
                            <X size={16} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(comment.id)}
                          className="p-2 rounded-lg transition-colors hover:bg-red-500/10" style={{ color: c.muted }} title="删除">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分页控件 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-lg transition-colors"
            style={{
              color: page <= 1 ? c.muted : c.secondary,
              cursor: page <= 1 ? "not-allowed" : "pointer",
            }}
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className="w-8 h-8 rounded-lg text-xs transition-colors"
              style={{
                background: page === p ? c.accent : "transparent",
                color: page === p ? "white" : c.secondary,
              }}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-2 rounded-lg transition-colors"
            style={{
              color: page >= totalPages ? c.muted : c.secondary,
              cursor: page >= totalPages ? "not-allowed" : "pointer",
            }}
          >
            <ChevronRight size={16} />
          </button>
          <span className="text-xs ml-2" style={{ color: c.muted }}>
            第 {page} / {totalPages} 页
          </span>
        </div>
      )}
    </div>
  );
}
