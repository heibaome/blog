"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { List, X, ChevronRight } from "lucide-react";
import { clsx } from "clsx";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

/** 从 DOM 中提取文章标题生成目录 */
function extractHeadings(container: HTMLElement | null): TocItem[] {
  if (!container) return [];
  const headings = container.querySelectorAll("h1, h2, h3");
  return Array.from(headings).map((el, i) => {
    // 给没有 id 的标题加上 id
    if (!el.id) {
      el.id = `heading-${i}`;
    }
    return {
      id: el.id,
      text: el.textContent || "",
      level: parseInt(el.tagName[1]),
    };
  });
}

export function TableOfContents() {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 提取标题
  useEffect(() => {
    // 延迟一下等 DOM 渲染完成
    const timer = setTimeout(() => {
      const article = document.querySelector<HTMLElement>(".prose");
      const headings = extractHeadings(article);
      setItems(headings);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // 监听滚动高亮当前标题
  useEffect(() => {
    if (items.length === 0) return;

    const headingElements = items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    if (headingElements.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // 找到第一个可见的标题
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0,
      }
    );

    headingElements.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, [items]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
      setOpen(false);
    }
  }, []);

  // 无标题时不显示
  if (items.length === 0) return null;

  const indentClass = (level: number) => {
    if (level === 1) return "pl-3";
    if (level === 2) return "pl-6";
    return "pl-9";
  };

  return (
    <>
      {/* 桌面端：右侧悬浮面板 */}
      <nav
        className="hidden lg:block fixed right-6 top-1/2 -translate-y-1/2 z-30"
        aria-label="文章目录"
      >
        <div className="w-52 max-h-[70vh] overflow-y-auto p-3 rounded-lg border border-border bg-paper/90 backdrop-blur-sm shadow-sm">
          <p className="text-xs font-sans font-semibold text-ink-lighter mb-2 px-3">
            目录
          </p>
          <ul className="space-y-0.5">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => scrollTo(item.id)}
                  className={clsx(
                    "w-full text-left text-xs font-sans py-1 px-3 rounded transition-colors truncate",
                    indentClass(item.level),
                    activeId === item.id
                      ? "text-accent bg-accent/5 font-medium"
                      : "text-ink-lighter hover:text-ink hover:bg-paper-warm"
                  )}
                >
                  {item.text}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* 移动端：浮动按钮 + 底部抽屉 */}
      <div className="lg:hidden">
        <button
          onClick={() => setOpen(!open)}
          className="fixed bottom-20 right-6 z-30 p-3 rounded-full bg-paper border border-border shadow-lg
            text-ink-lighter hover:text-ink hover:bg-paper-warm transition-all"
          aria-label="文章目录"
          title="文章目录"
        >
          {open ? <X size={18} /> : <List size={18} />}
        </button>

        {open && (
          <>
            {/* 遮罩 */}
            <div
              className="fixed inset-0 bg-black/20 z-30"
              onClick={() => setOpen(false)}
            />
            {/* 抽屉 */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-paper border-t border-border rounded-t-2xl shadow-2xl max-h-[60vh] overflow-y-auto p-4 animate-slide-up">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-sans font-semibold text-ink">
                  📑 文章目录
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 text-ink-lighter hover:text-ink transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => scrollTo(item.id)}
                      className={clsx(
                        "w-full text-left text-sm font-sans py-2 px-3 rounded-lg transition-colors flex items-center gap-1",
                        indentClass(item.level),
                        activeId === item.id
                          ? "text-accent bg-accent/5 font-medium"
                          : "text-ink-light hover:text-ink hover:bg-paper-warm"
                      )}
                    >
                      {item.level > 1 && (
                        <ChevronRight size={12} className="text-ink-lighter flex-shrink-0" />
                      )}
                      <span className="truncate">{item.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </>
  );
}
