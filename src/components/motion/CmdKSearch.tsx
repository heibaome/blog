"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, ArrowRight } from "lucide-react";
import { useDebounce, useScrollLock, useEscapeKey } from "@/hooks";
import { useRouter } from "next/navigation";

/**
 * ⌘K / Ctrl+K 搜索面板
 * 键盘快捷键触发，输入即搜，Enter 跳转
 * 移动端通过 Header 的搜索按钮触发（dispatch ⌘K 事件）
 */
export function CmdKSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<{ id: string; title: string; slug: string; summary: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // 使用共享的滚动锁定 Hook
  useScrollLock(open);

  // 使用共享的 ESC 键 Hook
  useEscapeKey(() => setOpen(false), open);

  // 全局键盘监听（⌘K / Ctrl+K）
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // 打开时聚焦输入框
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // 搜索
  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); return; }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) {
          setResults((json.data || []).slice(0, 8));
          setSelectedIdx(0);
        }
      })
      .catch(() => { if (!cancelled) setResults([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIdx]) {
      e.preventDefault();
      setOpen(false);
      router.push(`/post/${results[selectedIdx].slug}`);
    }
  }, [results, selectedIdx, router]);

  // 关闭时不渲染任何 DOM，避免遮挡其他元素
  if (!open) return null;

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 z-[69] bg-black/30 backdrop-blur-sm"
        style={{ touchAction: "none" }}
        onClick={() => setOpen(false)}
      />
      {/* 搜索面板 */}
      <div
        className="fixed inset-0 z-[70] flex items-start justify-center pointer-events-none"
        style={{ top: "80px" }}
      >
        <div
          className="relative w-full max-w-lg mx-4 bg-paper rounded-2xl shadow-xl border border-border overflow-hidden pointer-events-auto animate-scale-in"
          style={{ touchAction: "auto" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search size={18} className="text-ink-lighter flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜索文章…"
              className="flex-1 bg-transparent text-sm font-sans text-ink placeholder:text-ink-lighter outline-none"
            />
            <kbd className="px-1.5 py-0.5 rounded bg-paper-warm text-[10px] font-mono text-ink-lighter">ESC</kbd>
          </div>
          <div
            className="max-h-80 overflow-y-auto overscroll-contain"
            style={{ touchAction: "pan-y" }}
          >
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-ink-lighter font-sans">搜索中…</div>
            ) : results.length > 0 ? (
              <ul className="py-2">
                {results.map((post, idx) => (
                  <li key={post.id}>
                    <button
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                        idx === selectedIdx ? "bg-accent/5" : "hover:bg-paper-warm"
                      }`}
                      onClick={() => { setOpen(false); router.push(`/post/${post.slug}`); }}
                      onMouseEnter={() => setSelectedIdx(idx)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-sans font-medium text-ink truncate">{post.title}</p>
                        {post.summary && (
                          <p className="text-xs text-ink-lighter truncate mt-0.5">{post.summary}</p>
                        )}
                      </div>
                      <ArrowRight size={14} className="text-ink-lighter flex-shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : query.trim() ? (
              <div className="px-4 py-8 text-center text-sm text-ink-lighter font-sans">没有找到相关文章</div>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-ink-lighter font-sans">输入关键词搜索文章</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
