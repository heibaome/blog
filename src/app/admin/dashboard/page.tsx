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
  published: { bg: "rgba(34,197,94,0.1)", color: "#4ade80" },
  draft: { bg: "rgba(234,179,8,0.1)", color: "#facc15" },
  pending: { bg: "rgba(234,179,8,0.1)", color: "#facc15" },
  approved: { bg: "rgba(34,197,94,0.1)", color: "#4ade80" },
  rejected: { bg: "rgba(239,68,68,0.1)", color: "#f87171" },
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

  const cardStyle = { background: c.card, border: `1px solid ${c.border}` };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded" style={{ background: c.card }} />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 rounded-xl" style={{ background: c.card }} />
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
          <h1 className="text-xl font-bold" style={{ color: c.white }}>仪表盘</h1>
          <p className="text-sm mt-1" style={{ color: c.secondary }}>站点数据概览</p>
        </div>
        <Link
          href="/admin/editor/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-white transition-colors hover:opacity-90"
          style={{ background: c.accent }}
        >
          <PenLine size={16} /> 写文章
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "文章", value: stats?.totalPosts, sub: `${stats?.publishedPosts} 已发布 / ${stats?.draftPosts} 草稿`, icon: FileText, color: c.accent },
          { label: "浏览量", value: stats?.totalViews, sub: "总浏览", icon: Eye, color: "#818cf8" },
          { label: "评论", value: stats?.totalComments, sub: `${stats?.pendingComments} 待审`, icon: MessageCircle, color: c.jade },
          { label: "分类", value: stats?.totalCategories, icon: FolderOpen, color: c.gold },
          { label: "标签", value: stats?.totalTags, icon: Tag, color: "#f472b6" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl p-4" style={cardStyle}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} style={{ color: card.color }} />
                <span className="text-xs" style={{ color: c.muted }}>{card.label}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: c.white }}>
                {typeof card.value === "number" ? card.value.toLocaleString() : "-"}
              </p>
              {card.sub && <p className="text-[10px] mt-1" style={{ color: c.muted }}>{card.sub}</p>}
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Post Trend */}
        <div className="rounded-xl p-5" style={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} style={{ color: c.accent }} />
            <span className="text-sm font-medium" style={{ color: c.white }}>近 7 天发文趋势</span>
          </div>
          <div className="flex items-end gap-2 h-32">
            {stats?.postTrend.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px]" style={{ color: c.muted }}>{d.count}</span>
                <div
                  className="w-full rounded-t transition-all"
                  style={{
                    height: `${(d.count / maxTrend) * 100}%`,
                    minHeight: d.count > 0 ? 8 : 2,
                    background: d.count > 0 ? c.accent : c.border,
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
        <div className="rounded-xl p-5" style={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <FolderOpen size={16} style={{ color: c.gold }} />
            <span className="text-sm font-medium" style={{ color: c.white }}>分类分布</span>
          </div>
          {stats && stats.categoryStats.length > 0 ? (
            <div className="space-y-3">
              {stats.categoryStats.map((cat) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <span className="text-xs w-20 truncate" style={{ color: c.secondary }}>{cat.name}</span>
                  <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: c.border }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(cat.count / maxCategory) * 100}%`,
                        background: `linear-gradient(90deg, ${c.gold}, #f59e0b)`,
                      }}
                    />
                  </div>
                  <span className="text-xs w-8 text-right" style={{ color: c.muted }}>{cat.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-8" style={{ color: c.muted }}>暂无分类数据</p>
          )}
        </div>
      </div>

      {/* Tags & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tag Cloud */}
        <div className="rounded-xl p-5" style={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <Tag size={16} style={{ color: "#f472b6" }} />
            <span className="text-sm font-medium" style={{ color: c.white }}>热门标签</span>
          </div>
          {stats && stats.tagStats.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {stats.tagStats.map((tag) => (
                <span
                  key={tag.name}
                  className="px-2.5 py-1 rounded-lg text-xs"
                  style={{
                    background: `rgba(244,114,182,${0.08 + (tag.count / maxTag) * 0.15})`,
                    color: "#f472b6",
                    fontSize: `${11 + (tag.count / maxTag) * 4}px`,
                  }}
                >
                  {tag.name} ({tag.count})
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-8" style={{ color: c.muted }}>暂无标签数据</p>
          )}
        </div>

        {/* Recent Articles */}
        <div className="rounded-xl p-5" style={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} style={{ color: c.jade }} />
            <span className="text-sm font-medium" style={{ color: c.white }}>最近文章</span>
          </div>
          <div className="space-y-3">
            {stats?.recentArticles.map((article) => (
              <Link
                key={article.id}
                href={`/admin/editor/${article.id}`}
                className="flex items-center justify-between gap-2 group"
              >
                <span className="text-sm truncate flex-1 group-hover:text-white transition-colors" style={{ color: c.secondary }}>
                  {article.title}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px]"
                    style={{ background: statusColors[article.status]?.bg, color: statusColors[article.status]?.color }}
                  >
                    {article.status === "published" ? "已发" : "草稿"}
                  </span>
                  <span className="text-[10px]" style={{ color: c.muted }}>
                    <Eye size={10} className="inline mr-0.5" />{article.viewCount}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Comments */}
        <div className="rounded-xl p-5" style={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle size={16} style={{ color: c.accent }} />
            <span className="text-sm font-medium" style={{ color: c.white }}>最近评论</span>
          </div>
          <div className="space-y-3">
            {stats?.recentComments.map((comment) => (
              <div key={comment.id} className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate" style={{ color: c.secondary }}>
                    {comment.authorName || "匿名"} → {comment.post.title}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: c.muted }}>
                    {formatDate(comment.createdAt)}
                  </p>
                </div>
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] flex-shrink-0"
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
