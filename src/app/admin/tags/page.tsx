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

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: c.white }}>
          <TagIcon size={20} /> 标签管理
        </h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} /> 新建标签
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl p-5 mb-6 animate-fade-in" style={{ background: c.card }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: c.muted }}>标签名称</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="JavaScript" required
                className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: c.input, border: `1px solid ${c.border}`, color: c.white }} />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: c.muted }}>URL 标识</label>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="javascript"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono focus:outline-none"
                style={{ background: c.input, border: `1px solid ${c.border}`, color: c.white }} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>取消</Button>
            <Button type="submit" size="sm" loading={saving}>创建</Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-14 w-full" style={{background: c.card}}/>)}</div>
      ) : tags.length === 0 ? (
        <div className="text-center py-20"><p style={{ color: c.muted }}>暂无标签</p></div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <div key={tag.id} className="rounded-xl px-4 py-2.5 flex items-center gap-3"
              style={{ background: c.card }}>
              <div>
                <p className="text-sm" style={{ color: c.white }}>{tag.name}</p>
                <p className="text-xs font-mono" style={{ color: c.muted }}>{tag.slug} · {tag._count.posts}</p>
              </div>
              <button onClick={() => handleDelete(tag.id)}
                className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10" style={{ color: c.muted }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
