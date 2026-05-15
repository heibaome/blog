"use client";
import { getCsrfHeaders } from "@/lib/csrf-client";
import { useState, useRef, useCallback } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";

export interface UploadedImage {
  url: string;
  id?: string;
  /** blob 对象 URL，用于上传后立即预览（不受 cookie 时序影响） */
  previewUrl?: string;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  /** 点击图片时调用，用于插入到编辑器光标位置 */
  onImageClick?: (url: string) => void;
  /** 图片拖拽排序后调用，传入新的图片顺序 */
  onReorder?: (images: UploadedImage[]) => void;
  /** 文章 ID，提供后上传/删除会自动关联到文章 */
  postId?: string | null;
  /**
   * 新建文章时上传图片：先调用此回调确保文章已创建并返回 postId。
   * 如果返回 null，说明保存失败，上传中止。
   */
  onEnsurePostId?: () => Promise<string | null>;
}

/** 长按延迟（ms）：触摸后等待多久进入拖拽模式 */
const LONG_PRESS_DELAY = 200;
/** 移动阈值（px）：移动超过此距离则取消长按，允许正常滚动 */
const MOVE_THRESHOLD = 10;

export function ImageUploader({ images, onChange, onImageClick, onReorder, postId, onEnsurePostId }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==================== 拖拽状态（桌面 + 移动端共用） ====================

  const dragIndexRef = useRef<number | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);
  const dragTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dragState, setDragState] = useState<{ from: number; over: number } | null>(null);

  /** 执行排序并通知父组件 */
  const applyReorder = useCallback((fromIndex: number, targetIndex: number) => {
    const reordered = [...images];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    onChange(reordered);
    onReorder?.(reordered);
  }, [images, onChange, onReorder]);

  /** 清除所有拖拽状态 */
  const clearDragState = useCallback(() => {
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    setDragState(null);
    dragIndexRef.current = null;
    dragOverIndexRef.current = null;
  }, []);

  // ==================== 桌面端 HTML5 Drag ====================

  const handleDragStart = useCallback((index: number, e: React.DragEvent) => {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    setDragState({ from: index, over: index });
  }, []);

  const handleDragOver = useCallback((index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const from = dragIndexRef.current;
    if (from !== null && from !== index) {
      dragOverIndexRef.current = index;
      setDragState({ from, over: index });
    }
  }, []);

  const handleDragLeave = useCallback((index: number) => {
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    dragTimeoutRef.current = setTimeout(() => {
      if (dragOverIndexRef.current === index) {
        dragOverIndexRef.current = null;
        const from = dragIndexRef.current;
        if (from !== null) setDragState({ from, over: from });
      }
    }, 50);
  }, []);

  const handleDrop = useCallback((targetIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === targetIndex) {
      clearDragState();
      return;
    }
    applyReorder(fromIndex, targetIndex);
    clearDragState();
  }, [applyReorder, clearDragState]);

  const handleDragEnd = useCallback(() => {
    clearDragState();
  }, [clearDragState]);

  // ==================== 移动端触摸拖拽 ====================

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isTouchDraggingRef = useRef(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const handleTouchStart = useCallback((index: number, e: React.TouchEvent) => {
    // 不要 preventDefault，允许正常滚动
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    isTouchDraggingRef.current = false;

    // 长按启动拖拽
    longPressTimerRef.current = setTimeout(() => {
      isTouchDraggingRef.current = true;
      dragIndexRef.current = index;
      setDragState({ from: index, over: index });

      // 触觉反馈（支持的设备）
      if (navigator.vibrate) navigator.vibrate(30);
    }, LONG_PRESS_DELAY);
  }, []);

  /** 根据触摸坐标找到对应的图片索引 */
  const findImageIndexAtPoint = useCallback((x: number, y: number): number | null => {
    // 先用 elementFromPoint 做粗略判断
    const elements = document.elementsFromPoint(x, y);
    for (const el of elements) {
      const card = el.closest("[data-img-index]");
      if (card) {
        const idx = parseInt(card.getAttribute("data-img-index")!, 10);
        if (!isNaN(idx)) return idx;
      }
    }
    // 降级：遍历所有图片卡片的边界矩形
    let bestIndex: number | null = null;
    let bestDist = Infinity;
    imageRefs.current.forEach((ref, idx) => {
      if (!ref) return;
      const rect = ref.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(x - cx, y - cy);
      if (dist < bestDist && dist < rect.width) {
        bestDist = dist;
        bestIndex = idx;
      }
    });
    return bestIndex;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const start = touchStartRef.current;

    if (!isTouchDraggingRef.current) {
      // 尚未进入拖拽模式：检查是否超过移动阈值
      if (start) {
        const dx = Math.abs(touch.clientX - start.x);
        const dy = Math.abs(touch.clientY - start.y);
        if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
          // 超过阈值，取消长按，让浏览器正常滚动
          if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        }
      }
      return;
    }

    // 拖拽模式：阻止滚动
    e.preventDefault();

    // 找到手指下方的图片
    const targetIndex = findImageIndexAtPoint(touch.clientX, touch.clientY);
    const from = dragIndexRef.current;
    if (targetIndex !== null && from !== null && targetIndex !== from) {
      dragOverIndexRef.current = targetIndex;
      setDragState({ from, over: targetIndex });
    }
  }, [findImageIndexAtPoint]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    if (isTouchDraggingRef.current) {
      e.preventDefault();
      const fromIndex = dragIndexRef.current;
      const overIndex = dragOverIndexRef.current;
      if (fromIndex !== null && overIndex !== null && fromIndex !== overIndex) {
        applyReorder(fromIndex, overIndex);
      }
    }

    // 重置
    isTouchDraggingRef.current = false;
    touchStartRef.current = null;
    clearDragState();
  }, [applyReorder, clearDragState]);

  const handleTouchCancel = useCallback(() => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    isTouchDraggingRef.current = false;
    touchStartRef.current = null;
    clearDragState();
  }, [clearDragState]);

  // ==================== 上传 ====================

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const imageFiles = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (imageFiles.length === 0) {
        toast.error("请选择图片文件");
        return;
      }

      const oversized = imageFiles.find((f) => f.size > 5 * 1024 * 1024);
      if (oversized) {
        toast.error(`${oversized.name} 超过 5MB 限制`);
        return;
      }

      // 如果没有 postId，先自动保存草稿
      let effectivePostId = postId;
      if (!effectivePostId && onEnsurePostId) {
        toast.loading("首次上传，正在自动保存草稿...", { id: "auto-save" });
        effectivePostId = await onEnsurePostId();
        toast.dismiss("auto-save");
        if (!effectivePostId) {
          toast.error("自动保存失败，无法上传图片");
          return;
        }
        toast.success("草稿已自动保存");
      }

      setUploading(true);
      const newImages: UploadedImage[] = [];

      try {
        for (const file of imageFiles) {
          const formData = new FormData();
          formData.append("file", file);

          const res = await fetch("/api/upload", {
            method: "POST",
            headers: {
              "X-Requested-With": "XMLHttpRequest",
              ...getCsrfHeaders(),
            },
            body: formData,
          });

          const data = await res.json();
          if (!res.ok) {
            toast.error(data.error || `${file.name} 上传失败`);
            continue;
          }

          const imgUrl = data.data.url;
          let imgId: string | undefined;

          // 关联到文章
          if (effectivePostId) {
            const linkRes = await fetch(`/api/posts/${effectivePostId}/images`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
                ...getCsrfHeaders(),
              },
              body: JSON.stringify({ url: imgUrl }),
            });
            const linkData = await linkRes.json();
            if (linkRes.ok) imgId = linkData.data?.id;
          }

          // 获取 blob 预览 URL（不受 cookie 时序影响，上传后立即可见）
          let previewUrl: string | undefined;
          try {
            const previewRes = await fetch(imgUrl);
            if (previewRes.ok) {
              const blob = await previewRes.blob();
              previewUrl = URL.createObjectURL(blob);
            }
          } catch { /* 预览获取失败不影响上传结果 */ }

          newImages.push({ url: imgUrl, id: imgId, previewUrl });
        }

        if (newImages.length > 0) {
          onChange([...images, ...newImages]);
          toast.success(`成功上传 ${newImages.length} 张图片`);
        }
      } catch {
        toast.error("上传失败，请重试");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [images, onChange, postId, onEnsurePostId]
  );

  // ==================== 删除 ====================

  const handleDelete = useCallback(
    async (image: UploadedImage, index: number) => {
      // 删除文件
      try {
        await fetch("/api/upload", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            ...getCsrfHeaders(),
          },
          body: JSON.stringify({ url: image.url }),
        });
      } catch {
        // 忽略删除文件失败
      }

      // 取消文章关联
      if (postId && image.id) {
        try {
          await fetch(`/api/posts/${postId}/images`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest",
              ...getCsrfHeaders(),
            },
            body: JSON.stringify({ imageId: image.id }),
          });
        } catch {
          // 忽略
        }
      }

      const updated = [...images];
      updated.splice(index, 1);
      onChange(updated);
      toast.success("已删除");
    },
    [images, onChange, postId]
  );

  // ==================== 渲染 ====================

  return (
    <div className="rounded-xl p-4" style={{ background: "#242019" }}>
      <label className="block text-xs mb-3" style={{ color: "#78716c" }}>
        图片（拖拽调整顺序，点击插入到正文）
      </label>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {images.map((image, index) => {
          const isDragging = dragState?.from === index;
          const isOver = dragState?.over === index && dragState.from !== index;

          return (
            <div
              key={image.id || image.url}
              data-img-index={index}
              ref={(el) => { if (el) imageRefs.current.set(index, el); else imageRefs.current.delete(index); }}
              draggable
              onDragStart={(e) => handleDragStart(index, e)}
              onDragOver={(e) => handleDragOver(index, e)}
              onDragLeave={() => handleDragLeave(index)}
              onDrop={(e) => handleDrop(index, e)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(index, e)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchCancel}
              onClick={() => {
                // 触摸拖拽过程中禁止点击
                if (isTouchDraggingRef.current) return;
                onImageClick?.(image.url);
              }}
              className={clsx(
                "group relative aspect-square rounded-lg overflow-hidden",
                "border cursor-pointer touch-none select-none",
                "transition-all duration-150",
                isDragging
                  ? "opacity-40 border-[#c0483e] scale-95"
                  : isOver
                    ? "border-[#c0483e] ring-2 ring-[#c0483e]/60 scale-[1.03]"
                    : "border-[#3d3733] hover:border-[#c0483e] hover:ring-1 hover:ring-[#c0483e]/40 active:border-[#c0483e]"
              )}
            >
              <img
                src={image.previewUrl || image.url}
                alt={""}
                className="w-full h-full object-cover pointer-events-none select-none"
                draggable={false}
              />

              {/* 序号角标 */}
              <span
                className="absolute top-1 left-1 z-50 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white select-none"
                style={{ background: "rgba(0,0,0,0.6)" }}
              >
                {index + 1}
              </span>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleDelete(image, index); }}
                style={{ background: "rgba(0,0,0,0.7)" }}
                className={clsx(
                  "absolute top-1 right-1 z-50",
                  "w-7 h-7 rounded-full flex items-center justify-center",
                  "text-white cursor-pointer border-0 outline-none",
                  "transition-opacity duration-150",
                  "sm:opacity-0 sm:group-hover:opacity-100",
                  "hover:!opacity-100 focus:!opacity-100"
                )}
                title="删除图片"
              >
                <X size={14} />
              </button>

              <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors">
                <span className="text-[11px] text-white opacity-0 hover:opacity-100 transition-opacity font-medium">
                  点击插入
                </span>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={clsx(
            "aspect-square rounded-lg border-2 border-dashed",
            "border-[#3d3733] hover:border-[#57534e]",
            "flex flex-col items-center justify-center gap-1",
            "text-[#78716c] hover:text-[#a8a29e]",
            "transition-colors cursor-pointer bg-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {uploading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <>
              <Plus size={20} />
              <span className="text-xs">添加</span>
            </>
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleUpload(e.target.files)}
        className="hidden"
      />

      <p className="mt-2 text-[10px]" style={{ color: "#57534e" }}>
        支持 JPG/PNG/GIF/WebP/SVG，单个文件 ≤ 5MB · 拖拽/长按排序 · 点击插入正文
      </p>
    </div>
  );
}
