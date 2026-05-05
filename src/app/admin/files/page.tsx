"use client";
import { getCsrfHeaders } from "@/lib/csrf-client";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Trash2, Upload, Image as ImageIcon, FileText, Loader2, RefreshCw, Link2 } from "lucide-react";
import { adminTheme as c } from "@/shared/admin-theme";
import toast from "react-hot-toast";

interface FileInfo {
  name: string;
  size: number;
  modified: string;
  url: string;
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/upload/list");
      const data = await res.json();
      if (data.data) setFiles(data.data);
    } catch { toast.error("加载失败"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleDelete = async (name: string) => {
    if (!confirm(`确定删除 ${name} 吗？`)) return;
    try {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest", ...getCsrfHeaders() },
        body: JSON.stringify({ url: `/uploads/${name}` }),
      });
      setFiles((prev) => prev.filter((f) => f.name !== name));
      toast.success("已删除");
    } catch { toast.error("删除失败"); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "X-Requested-With": "XMLHttpRequest", ...getCsrfHeaders() },
          body: formData,
        });
        if (!res.ok) { toast.error(`${file.name} 上传失败`); continue; }
      }
      toast.success("上传完成");
      fetchFiles();
    } catch { toast.error("上传失败"); }
    finally { setUploading(false); if (e.target) e.target.value = ""; }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name);
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="animate-fade-in">
      {/* 头部：移动端纵向排列，桌面端横向 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: c.white }}>文件管理</h1>
          <p className="text-xs mt-1" style={{ color: c.muted }}>
            {files.length} 个文件 · 总计 {formatSize(totalSize)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={fetchFiles}>
            <RefreshCw size={14} />
            <span className="hidden sm:inline">刷新</span>
          </Button>
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-white transition-colors hover:opacity-90 active:scale-95" style={{ background: c.accent }}>
              <Upload size={14} />
              <span className="hidden xs:inline">上传文件</span>
              <span className="xs:hidden">上传</span>
            </span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
        </div>
      </div>

      {uploading && (
        <div className="flex items-center gap-2 mb-4 text-sm" style={{ color: c.secondary }}>
          <Loader2 size={16} className="animate-spin" /> 上传中...
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl animate-pulse" style={{ background: c.card }} />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-20" style={{ color: c.muted }}>
          <ImageIcon size={48} className="mx-auto mb-4 opacity-30" />
          <p>暂无文件</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {files.map((file) => (
            <div key={file.name}
              className="group relative rounded-xl overflow-hidden border transition-all hover:border-[#c0483e]"
              style={{ background: c.card, borderColor: c.border }}>
              {isImage(file.name) ? (
                <div className="aspect-square">
                  <img src={file.url} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
              ) : (
                <div className="aspect-square flex items-center justify-center">
                  <FileText size={32} style={{ color: c.muted }} />
                </div>
              )}
              <div className="p-2">
                <p className="text-[11px] truncate" style={{ color: c.secondary }}>{file.name}</p>
                <p className="text-[10px]" style={{ color: c.muted }}>{formatSize(file.size)}</p>
              </div>

              {/* 操作按钮：移动端常驻半透明，桌面端悬停显示 */}
              <button
                onClick={() => handleDelete(file.name)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center
                  opacity-60 sm:opacity-0 sm:group-hover:opacity-100
                  active:scale-90 transition-all"
                style={{ background: "rgba(0,0,0,0.7)", color: "#ef4444" }}
                title="删除">
                <Trash2 size={14} />
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(file.url); toast.success("链接已复制"); }}
                className="absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center
                  opacity-60 sm:opacity-0 sm:group-hover:opacity-100
                  active:scale-90 transition-all"
                style={{ background: "rgba(0,0,0,0.7)", color: "white" }}
                title="复制链接">
                <Link2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
