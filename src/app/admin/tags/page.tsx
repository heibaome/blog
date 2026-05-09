"use client";
import { getCsrfHeaders } from "@/lib/csrf-client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2, Tag as TagIcon } from "lucide-react";
import { adminTheme as c } from "@/shared/admin-theme";

interface Tag {
  id: string;
  name: string;
  slug: string;
  _count: { posts: number };
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchTags() {
    try {
      const res = await fetch("/api/tags");
      const data = await res.json();
      if (data.data) setTags(data.data);
    } catch {
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchTags(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest", ...getCsrfHeaders() },
        body: JSON.stringify({ name, slug: slug || name.toLowerCase().replace(/\s+/g, "-") }),
      });
      if (res.ok) { setName(""); setSlug(""); setShowForm(false); fetchTags(); }
    } catch {
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除此标签？")) return;
    try { await fetch(`/api/tags/${id}`, { method: "DELETE", headers: { "X-Requested-With": "XMLHttpRequest", ...getCsrfHeaders() } }); fetchTags(); } catch {}
  }

  const cardStyle = {
    background: c.card,
    border: `1px solid ${c.border}`,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)"
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-col sm:flex-row mb-6">
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: c.white }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)" }}>
              <TagIcon size={18} className="text-white" />
            </div>
            标签管理
          </h1>
          <p className="text-sm mt-2" style={{ color: c.secondary }}>管理您的文章标签</p>
        </div>
        <Button size="md" onClick={() => setShowForm(!showForm)} className="gap-2 w-full sm:w-auto">
          <Plus size={18} /> 新建标签
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl p-5 sm:p-6 mb-6 animate-fade-in" style={cardStyle}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: c.muted }}>标签名称</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="JavaScript" required
                       className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all focus:ring-2 focus:ring-[#c0483e]/50"
                       style={{ background: c.input, border: `1px solid ${c.border}`, color: c.white }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: c.muted }}>URL 标识</label>
                <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="javascript"
                       className="w-full px-4 py-3 rounded-xl text-sm font-mono focus:outline-none transition-all focus:ring-2 focus:ring-[#c0483e]/50"
                       style={{ background: c.input, border: `1px solid ${c.border}`, color: c.white }} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="md" onClick={() => setShowForm(false)}>取消</Button>
              <Button type="submit" size="md" loading={saving} style={{ background: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)" }}>创建</Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{background: c.card, border: `1px solid ${c.border}`}} />)}
        </div>
      ) : tags.length === 0 ? (
        <div className="text-center py-20 rounded-2xl" style={cardStyle}>
          <TagIcon size={40} className="mx-auto mb-3 opacity-30" style={{ color: c.muted }} />
          <p className="text-lg" style={{ color: c.muted }}>暂无标签</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {tags.map(tag => (
            <div key={tag.id} className="rounded-2xl px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4 transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg" style={cardStyle}>
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)", opacity: 0.8 }}>
                  <TagIcon size={18} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base sm:text-lg font-medium truncate" style={{ color: c.white }}>{tag.name}</p>
                  <p className="text-xs sm:text-sm font-mono mt-1 truncate" style={{ color: c.muted }}>/{tag.slug} · {tag._count.posts} 篇文章</p>
                </div>
              </div>
              <button onClick={() => handleDelete(tag.id)}
                      className="p-2.5 rounded-xl transition-all hover:bg-red-500/10 hover:text-red-400 hover:scale-105 flex-shrink-0" style={{ color: c.muted }} title="删除">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
