"use client";

import { adminTheme as c } from "@/shared/admin-theme";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText, MessageCircle, Eye, PenLine, FolderOpen, Tag,
  Users, AlertCircle, TrendingUp, Clock,
} from "lucide-react";
import { formatDate } from "@/lib/date";

interface Stats {
  totalPosts: number; publishedPosts: number; draftPosts: number;
  totalViews: number; totalComments: number; pendingComments: number;
  totalCategories: number; totalTags: number; totalUsers: number;
  postTrend: { date: string; count: number }[];
  categoryStats: { name: string; count: number }[];
  tagStats: { name: string; count: number }[];
  recentArticles: { id: string; title: string; status: string; viewCount: number; createdAt: string; _count: { comments: number } }[];
  recentComments: { id: string; status: string; authorName: string | null; createdAt: string; post: { title: string } }[];
}

const statusColors: Record<string, { bg: string; color: string }> = {
  published: { bg: "rgba(16, 185, 129, 0.12)", color: "#4ade80" },
  draft: { bg: "rgba(245, 158, 11, 0.12)", color: "#facc15" },
  pending: { bg: "rgba(245, 158, 11, 0.12)", color: "#facc15" },
  approved: { bg: "rgba(16, 185, 129, 0.12)", color: "#4ade80" },
  rejected: { bg: "rgba(239, 68, 68, 0.12)", color: "#f87171" },
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats");
        const json = await res.json();
        if (json.data) setStats(json.data);
      } catch { } finally { setLoading(false); }
    }
    fetchStats();
  }, []);

  const maxTrend = stats ? Math.max(...stats.postTrend.map((d) => d.count), 1) : 1;
  const maxCategory = stats ? Math.max(...stats.categoryStats.map((d) => d.count), 1) : 1;
  const maxTag = stats ? Math.max(...stats.tagStats.map((d) => d.count), 1) : 1;

  const cardStyle = {
    background: c.card,
    border: `1px solid ${c.border}`,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)"
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-64 rounded-2xl" style={{ background: c.card }} />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 rounded-2xl" style={{ background: c.card }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: c.white }}>仪表盘</h1>
          <p className="text-sm mt-2" style={{ color: c.secondary }}>欢迎回来，这是您的站点概览</p>
        </div>
        <Link
          href="/admin/editor/new"
          className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm text-white transition-all hover:opacity-90 hover:translate-y-[-1px] shadow-lg"
          style={{ background: "linear-gradient(135deg, #c0483e 0%, #ef4444 100%)" }}
        >
          <PenLine size={18} />
          写文章
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "文章", value: stats?.totalPosts, sub: `${stats?.publishedPosts} 已发 / ${stats?.draftPosts} 草稿`, icon: FileText, gradient: "linear-gradient(135deg, #c0483e 0%, #ef4444 100%)" },
          { label: "浏览量", value: stats?.totalViews, sub: "总浏览", icon: Eye, gradient: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)" },
          { label: "评论", value: stats?.totalComments, sub: `${stats?.pendingComments} 待审`, icon: MessageCircle, gradient: "linear-gradient(135deg, #10b981 0%, #6ab884 100%)" },
          { label: "分类", value: stats?.totalCategories, icon: FolderOpen, gradient: "linear-gradient(135deg, #f59e0b 0%, #d4a84b 100%)" },
          { label: "标签", value: stats?.totalTags, icon: Tag, gradient: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl p-5 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-xl" style={cardStyle}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: card.gradient }}>
                  <Icon size={20} className="text-white" />
                </div>
                <span className="text-xs" style={{ color: c.muted }}>{card.label}</span>
              </div>
              <p className="text-3xl font-bold tracking-tight" style={{ color: c.white }}>
                {typeof card.value === "number" ? card.value.toLocaleString() : "-"}
              </p>
              {card.sub && <p className="text-xs mt-2" style={{ color: c.muted }}>{card.sub}</p>}
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Post Trend */}
        <div className="rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-1px] hover:shadow-xl" style={cardStyle}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #c0483e 0%, #ef4444 100%)" }}>
              <TrendingUp size={18} className="text-white" />
            </div>
            <div>
              <span className="text-sm font-semibold" style={{ color: c.white }}>近 7 天发文趋势</span>
              <p className="text-xs mt-0.5" style={{ color: c.muted }}>共 {stats?.postTrend.reduce((sum, d) => sum + d.count, 0)} 篇文章</p>
            </div>
          </div>
          <div className="flex items-end gap-2 h-36">
            {stats?.postTrend.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[11px] font-medium" style={{ color: c.muted }}>{d.count}</span>
                <div
                  className="w-full rounded-t-xl transition-all duration-500"
                  style={{
                    height: `${Math.max((d.count / maxTrend) * 100, 5)}%`,
                    minHeight: 8,
                    background: d.count > 0
                      ? `linear-gradient(180deg, #c0483e 0%, rgba(192, 72, 62, 0.3) 100%)`
                      : c.border,
                  }}
                />
                <span className="text-[10px]" style={{ color: c.muted }}>
                  {d.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-1px] hover:shadow-xl" style={cardStyle}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d4a84b 100%)" }}>
              <FolderOpen size={18} className="text-white" />
            </div>
            <div>
              <span className="text-sm font-semibold" style={{ color: c.white }}>分类分布</span>
              <p className="text-xs mt-0.5" style={{ color: c.muted }}>共 {stats?.categoryStats.length} 个分类</p>
            </div>
          </div>
          {stats && stats.categoryStats.length > 0 ? (
            <div className="space-y-4">
              {stats.categoryStats.map((cat) => (
                <div key={cat.name} className="flex items-center gap-4">
                  <span className="text-sm w-24 truncate font-medium" style={{ color: c.secondary }}>{cat.name}</span>
                  <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: c.border }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(cat.count / maxCategory) * 100}%`,
                        background: `linear-gradient(90deg, #f59e0b 0%, #d4a84b 100%)`,
                      }}
                    />
                  </div>
                  <span className="text-sm w-10 text-right font-medium" style={{ color: c.muted }}>{cat.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FolderOpen size={40} className="mx-auto mb-3 opacity-30" style={{ color: c.muted }} />
              <p className="text-sm" style={{ color: c.muted }}>暂无分类数据</p>
            </div>
          )}
        </div>
      </div>

      {/* Tags & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Tag Cloud */}
        <div className="rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-1px] hover:shadow-xl" style={cardStyle}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)" }}>
              <Tag size={18} className="text-white" />
            </div>
            <div>
              <span className="text-sm font-semibold" style={{ color: c.white }}>热门标签</span>
              <p className="text-xs mt-0.5" style={{ color: c.muted }}>共 {stats?.tagStats.length} 个标签</p>
            </div>
          </div>
          {stats && stats.tagStats.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {stats.tagStats.map((tag) => (
                <span
                  key={tag.name}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, rgba(236, 72, 153, ${0.12 + (tag.count / maxTag) * 0.18}) 0%, rgba(244, 114, 182, ${0.08 + (tag.count / maxTag) * 0.12}) 100%)`,
                    color: "#f472b6",
                    fontSize: `${11 + (tag.count / maxTag) * 4}px`,
                  }}
                >
                  {tag.name} ({tag.count})
                </span>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Tag size={40} className="mx-auto mb-3 opacity-30" style={{ color: c.muted }} />
              <p className="text-sm" style={{ color: c.muted }}>暂无标签数据</p>
            </div>
          )}
        </div>

        {/* Recent Articles */}
        <div className="rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-1px] hover:shadow-xl" style={cardStyle}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #10b981 0%, #6ab884 100%)" }}>
              <Clock size={18} className="text-white" />
            </div>
            <div>
              <span className="text-sm font-semibold" style={{ color: c.white }}>最近文章</span>
              <p className="text-xs mt-0.5" style={{ color: c.muted }}>最新的 5 篇文章</p>
            </div>
          </div>
          <div className="space-y-3">
            {stats?.recentArticles.map((article) => (
              <Link
                key={article.id}
                href={`/admin/editor/${article.id}`}
                className="flex items-center justify-between gap-3 group p-3 rounded-xl transition-all hover:bg-white/[0.04]"
              >
                <span className="text-sm truncate flex-1 group-hover:text-white transition-colors font-medium" style={{ color: c.secondary }}>
                  {article.title}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="px-2 py-0.5 rounded-lg text-[11px] font-medium"
                    style={{ background: statusColors[article.status]?.bg, color: statusColors[article.status]?.color }}
                  >
                    {article.status === "published" ? "已发" : "草稿"}
                  </span>
                  <span className="text-[11px]" style={{ color: c.muted }}>
                    <Eye size={12} className="inline mr-0.5" />{article.viewCount}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Comments */}
        <div className="rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-1px] hover:shadow-xl" style={cardStyle}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #c0483e 0%, #ef4444 100%)" }}>
              <MessageCircle size={18} className="text-white" />
            </div>
            <div>
              <span className="text-sm font-semibold" style={{ color: c.white }}>最近评论</span>
              <p className="text-xs mt-0.5" style={{ color: c.muted }}>最新的评论活动</p>
            </div>
          </div>
          <div className="space-y-4">
            {stats?.recentComments.map((comment) => (
              <div key={comment.id} className="flex items-start justify-between gap-3 p-3 rounded-xl transition-all hover:bg-white/[0.04]">
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate font-medium" style={{ color: c.secondary }}>
                    {comment.authorName || "匿名"} <span style={{ color: c.muted }}>→</span> {comment.post.title}
                  </p>
                  <p className="text-xs mt-1" style={{ color: c.muted }}>
                    {formatDate(comment.createdAt)}
                  </p>
                </div>
                <span
                  className="px-2 py-0.5 rounded-lg text-[11px] font-medium flex-shrink-0"
                  style={{ background: statusColors[comment.status]?.bg, color: statusColors[comment.status]?.color }}
                >
                  {comment.status === "approved" ? "已审" : comment.status === "pending" ? "待审" : "拒绝"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
