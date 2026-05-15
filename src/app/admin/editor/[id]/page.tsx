"use client";
import { getCsrfHeaders, ensureCsrfToken } from "@/lib/csrf-client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TiptapEditor, TiptapEditorRef } from "@/components/editor/TiptapEditor";
import { ImageUploader, UploadedImage } from "@/components/editor/ImageUploader";import { ArrowLeft, Save, Send, Pin, Sparkles, AlertTriangle, Star } from "lucide-react";
import Link from "next/link";


import { adminTheme as c } from "@/shared/admin-theme";


interface Tag { id: string; name: string; slug: string; }
interface Category { id: string; name: string; slug: string; }

export default function EditorPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === "new";
  const postId = isNew ? null : (params.id as string);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [status, setStatus] = useState("draft");
  const [isTop, setIsTop] = useState(false);
  const [isEssence, setIsEssence] = useState(false);
  const [isOutdated, setIsOutdated] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);

  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  // 用 ref 同步追踪 postId（解决闭包中 state 不更新的问题）
  const postIdRef = useRef<string | null>(postId);
  // 编辑器 ref，用于外部插入图片
  const editorRef = useRef<TiptapEditorRef>(null);

  // 追踪用户是否手动编辑过 slug，避免标题变更覆盖手动设置的值
  const slugManuallyEdited = useRef(false);

  // 确保 CSRF token 存在
  useEffect(() => { ensureCsrfToken(); }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/tags").then(r => r.json()),
      fetch("/api/categories").then(r => r.json()),
    ]).then(([tagData, catData]) => {
      if (tagData.data) setTags(tagData.data);
      if (catData.data) setCategories(catData.data);
    });
  }, []);

  useEffect(() => {
    if (!postId) return;
    fetch(`/api/posts/${postId}`).then(r => r.json()).then(data => {
      if (data.data) {
        const post = data.data;
        setTitle(post.title); setSlug(post.slug); setContent(post.content);
        setSummary(post.summary); setCategoryId(post.categoryId || "");
        setSelectedTags(post.tags.map((t: any) => t.tagId)); setStatus(post.status);
        setIsTop(post.isTop || false); setIsEssence(post.isEssence || false);
        setIsOutdated(post.isOutdated || false); setAiSummary(post.aiSummary || "");
        setCoverImage(post.coverImage || "");
        // 加载文章图片
        setImages((post.images || []).map((img: any) => ({ url: img.url, id: img.id })));
        slugManuallyEdited.current = true;
      }
    }).finally(() => setLoading(false));
  }, [postId]);

  const generateSlug = useCallback((text: string) => {
    return text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || `post-${Date.now()}`;
  }, []);

  /**
   * 保存文章并返回 postId。如果标题为空返回 null。
   * 新文章创建后会更新 URL 和 ref。
   */
  const savePost = useCallback(async (publishStatus?: string): Promise<string | null> => {
    if (!title.trim()) return null;

    const body = {
      title: title.trim(),
      slug: slug || generateSlug(title),
      content,
      summary: summary.trim(),
      coverImage: coverImage || null,
      categoryId: categoryId || null,
      tagIds: selectedTags,
      status: publishStatus || status,
      isTop,
      isEssence,
      isOutdated,
      aiSummary: aiSummary || null,
    };

    const currentId = postIdRef.current;
    const url = currentId ? `/api/posts/${currentId}` : "/api/posts";
    const method = currentId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...getCsrfHeaders(),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "保存失败");
      return null;
    }

    if (publishStatus) setStatus(publishStatus);

    // 新文章：更新 URL 和 ref
    if (!currentId && data.data?.id) {
      postIdRef.current = data.data.id;
      router.replace(`/admin/editor/${data.data.id}`);
    }

    return data.data?.id || currentId;
  }, [title, slug, content, summary, categoryId, selectedTags, status, generateSlug, router]);

  /**
   * 确保文章已创建（返回 postId）。
   * 新建文章时首次上传图片会调用此方法，自动保存为草稿。
   */
  const ensurePostId = useCallback(async (): Promise<string | null> => {
    // 已有 postId，直接返回
    if (postIdRef.current) return postIdRef.current;

    // 标题为空则无法保存
    if (!title.trim()) {
      alert("请先输入标题");
      return null;
    }

    const id = await savePost();
    return id;
  }, [title, savePost]);

  async function handleSave(publishStatus?: string) {
    if (!title.trim()) { alert("请输入标题"); return; }
    setSaving(true);
    try {
      const id = await savePost(publishStatus || status);
      if (id) {
        alert(publishStatus === "published" ? "已发布！" : "已保存！");
      }
    } catch { alert("保存失败"); } finally { setSaving(false); }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-2 border-[#c0483e] border-t-transparent rounded-full" />
    </div>;
  }

  const inputStyle = { background: c.input, border: `1px solid ${c.border}`, color: c.white };
  const inputClass = "w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none";

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/posts" className="p-2 rounded-xl transition-colors hover:bg-white/[0.04]" style={{ color: c.secondary }}>
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-lg font-bold" style={{ color: c.white }}>{isNew ? "写文章" : "编辑文章"}</h1>
          {status === "published" && (
            <span className="px-2.5 py-0.5 rounded-lg text-xs" style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80" }}>已发布</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleSave()} loading={saving}>
            <Save size={14} /> 保存草稿
          </Button>
          <Button size="sm" onClick={() => handleSave("published")} loading={saving}>
            <Send size={14} /> 发布
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <input type="text" placeholder="文章标题" value={title}
            onChange={(e) => { setTitle(e.target.value); if (isNew && !slugManuallyEdited.current) setSlug(generateSlug(e.target.value)); }}
            className="w-full px-0 py-3 bg-transparent text-2xl font-bold focus:outline-none focus:ring-0"
            style={{ color: c.white }}
          />
          <div className="rounded-xl overflow-hidden" style={{ background: c.card }}>
            <TiptapEditor ref={editorRef} content={content} onChange={setContent} />
          </div>

          {/* 图片上传 */}
          <ImageUploader
            postId={postIdRef.current}
            images={images}
            onChange={setImages}
            onEnsurePostId={ensurePostId}
            onReorder={async (reordered) => {
              setImages(reordered);
              // 同步排序到后端
              const currentPostId = postIdRef.current;
              const imageIds = reordered.map(img => img.id).filter(Boolean);
              if (currentPostId && imageIds.length > 1) {
                try {
                  await fetch(`/api/posts/${currentPostId}/images/reorder`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      "X-Requested-With": "XMLHttpRequest",
                      ...getCsrfHeaders(),
                    },
                    body: JSON.stringify({ imageIds }),
                  });
                } catch { /* 静默失败，用户保存文章时可重试 */ }
              }
            }}
            onImageClick={(url) => {
              const editor = editorRef.current?.getEditor();
              if (editor) {
                editor.chain().focus().setImage({ src: url }).run();
              }
            }}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ background: c.card }}>
            <label className="block text-xs mb-1.5" style={{ color: c.muted }}>URL 标识</label>
            <input type="text" value={slug} onChange={e => { setSlug(e.target.value); slugManuallyEdited.current = true; }} placeholder="auto-generated"
              className={inputClass + " font-mono"} style={inputStyle} />
          </div>

          <div className="rounded-xl p-4" style={{ background: c.card }}>
            <label className="block text-xs mb-1.5" style={{ color: c.muted }}>摘要</label>
            <textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="文章简介（可选）" rows={3}
              className={inputClass + " resize-none"} style={inputStyle} />
          </div>

          <div className="rounded-xl p-4" style={{ background: c.card }}>
            <label className="block text-xs mb-1.5" style={{ color: c.muted }}>分类</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
              className={inputClass} style={inputStyle}>
              <option value="">无分类</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>

          <div className="rounded-xl p-4" style={{ background: c.card }}>
            <label className="block text-xs mb-2" style={{ color: c.muted }}>标签</label>
            {tags.length === 0 ? (
              <p className="text-xs" style={{ color: "#57534e" }}>暂无标签，去标签管理创建</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {tags.map(tag => (
                  <button key={tag.id}
                    onClick={() => setSelectedTags(prev => prev.includes(tag.id) ? prev.filter(id => id !== tag.id) : [...prev, tag.id])}
                    className="px-2.5 py-1 rounded-lg text-xs transition-colors"
                    style={selectedTags.includes(tag.id)
                      ? { background: "rgba(192,72,62,0.15)", color: "#f87171", border: "1px solid rgba(192,72,62,0.3)" }
                      : { background: c.input, color: c.secondary, border: `1px solid ${c.border}` }
                    }>
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 封面图 */}
          <div className="rounded-xl p-4" style={{ background: c.card }}>
            <label className="block text-xs mb-1.5" style={{ color: c.muted }}>封面图 URL</label>
            <input type="text" value={coverImage} onChange={e => setCoverImage(e.target.value)} placeholder="https://example.com/cover.jpg"
              className={inputClass} style={inputStyle} />
            {coverImage && (
              <img src={coverImage} alt="封面预览" className="mt-2 rounded-lg w-full h-24 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            )}
          </div>

          {/* 文章属性 */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: c.card }}>
            <label className="block text-xs mb-2" style={{ color: c.muted }}>文章属性</label>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs" style={{ color: c.secondary }}>
                <Pin size={12} /> 置顶
              </span>
              <button onClick={() => setIsTop(!isTop)}
                className="w-9 h-5 rounded-full transition-colors relative"
                style={{ background: isTop ? c.accent : c.border }}>
                <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                  style={{ transform: isTop ? "translateX(16px)" : "translateX(0)" }} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs" style={{ color: c.secondary }}>
                <Star size={12} /> 精选
              </span>
              <button onClick={() => setIsEssence(!isEssence)}
                className="w-9 h-5 rounded-full transition-colors relative"
                style={{ background: isEssence ? "#facc15" : c.border }}>
                <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                  style={{ transform: isEssence ? "translateX(16px)" : "translateX(0)" }} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs" style={{ color: c.secondary }}>
                <AlertTriangle size={12} /> 过时提醒
              </span>
              <button onClick={() => setIsOutdated(!isOutdated)}
                className="w-9 h-5 rounded-full transition-colors relative"
                style={{ background: isOutdated ? "#f97316" : c.border }}>
                <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                  style={{ transform: isOutdated ? "translateX(16px)" : "translateX(0)" }} />
              </button>
            </div>
          </div>

          {/* AI 摘要 */}
          <div className="rounded-xl p-4" style={{ background: c.card }}>
            <label className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: c.muted }}>
              <Sparkles size={12} /> AI 摘要
            </label>
            <textarea value={aiSummary} onChange={e => setAiSummary(e.target.value)} placeholder="AI 生成的文章摘要（可选）" rows={3}
              className={inputClass + " resize-none"} style={inputStyle} />
          </div>
        </div>
      </div>
    </div>
  );
}
