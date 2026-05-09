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
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d4a84b 100%)" }}>
              <FolderOpen size={18} className="text-white" />
            </div>
            分类管理
          </h1>
          <p className="text-sm mt-2" style={{ color: c.secondary }}>管理您的文章分类</p>
        </div>
        <Button size="md" onClick={() => setShowForm(!showForm)} className="gap-2 w-full sm:w-auto">
          <Plus size={18} /> 新建分类
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl p-5 sm:p-6 mb-6 animate-fade-in" style={cardStyle}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: c.muted }}>分类名称</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="技术" required
                       className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all focus:ring-2 focus:ring-[#c0483e]/50"
                       style={{ background: c.input, border: `1px solid ${c.border}`, color: c.white }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: c.muted }}>URL 标识</label>
                <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="tech"
                       className="w-full px-4 py-3 rounded-xl text-sm font-mono focus:outline-none transition-all focus:ring-2 focus:ring-[#c0483e]/50"
                       style={{ background: c.input, border: `1px solid ${c.border}`, color: c.white }} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="md" onClick={() => setShowForm(false)}>取消</Button>
              <Button type="submit" size="md" loading={saving} style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d4a84b 100%)" }}>创建</Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 w-full rounded-2xl animate-pulse" style={{background: c.card, border: `1px solid ${c.border}`}} />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 rounded-2xl" style={cardStyle}>
          <FolderOpen size={40} className="mx-auto mb-3 opacity-30" style={{ color: c.muted }} />
          <p className="text-lg" style={{ color: c.muted }}>暂无分类</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map(cat => (
            <div key={cat.id} className="rounded-2xl px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4 transition-all duration-200 hover:translate-x-0.5 hover:shadow-lg" style={cardStyle}>
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d4a84b 100%)", opacity: 0.8 }}>
                  <FolderOpen size={18} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base sm:text-lg font-medium truncate" style={{ color: c.white }}>{cat.name}</p>
                  <p className="text-xs sm:text-sm font-mono mt-1 truncate" style={{ color: c.muted }}>/{cat.slug} · {cat._count.posts} 篇文章</p>
                </div>
              </div>
              <button onClick={() => handleDelete(cat.id)}
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
