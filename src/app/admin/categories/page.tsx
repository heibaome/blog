"use client";
import { getCsrfHeaders } from "@/lib/csrf-client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2, FolderOpen } from "lucide-react";


import { adminTheme as c } from "@/shared/admin-theme";

interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  _count: { posts: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchCategories() {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.data) setCategories(data.data);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCategories(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest", ...getCsrfHeaders() },
        body: JSON.stringify({ name, slug: slug || name.toLowerCase().replace(/\s+/g, "-") }),
      });
      if (res.ok) { setName(""); setSlug(""); setShowForm(false); fetchCategories(); }
    } catch {
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除此分类？")) return;
    try { await fetch(`/api/categories/${id}`, { method: "DELETE", headers: { "X-Requested-With": "XMLHttpRequest", ...getCsrfHeaders() } }); fetchCategories(); } catch {}
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: c.white }}>
          <FolderOpen size={20} /> 分类管理
        </h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} /> 新建分类
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl p-5 mb-6 animate-fade-in" style={{ background: c.card }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: c.muted }}>分类名称</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="技术" required
                className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: c.input, border: `1px solid ${c.border}`, color: c.white }} />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: c.muted }}>URL 标识</label>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="tech"
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
      ) : categories.length === 0 ? (
        <div className="text-center py-20"><p style={{ color: c.muted }}>暂无分类</p></div>
      ) : (
        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="rounded-xl px-5 py-4 flex items-center justify-between"
              style={{ background: c.card }}>
              <div>
                <p className="text-sm" style={{ color: c.white }}>{cat.name}</p>
                <p className="text-xs font-mono" style={{ color: c.muted }}>{cat.slug} · {cat._count.posts} 篇文章</p>
              </div>
              <button onClick={() => handleDelete(cat.id)}
                className="p-2 rounded-lg transition-colors hover:bg-red-500/10" style={{ color: c.muted }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
