"use client";

import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {/* 404 水墨风格 */}
      <div className="relative mb-8">
        <span
          className="text-[8rem] sm:text-[10rem] font-serif font-bold leading-none select-none"
          style={{
            color: "transparent",
            WebkitTextStroke: "2px var(--color-border)",
          }}
        >
          404
        </span>
        {/* 水墨晕染点缀 */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full opacity-20 blur-2xl"
          style={{ background: "var(--color-accent)" }}
        />
      </div>

      <h1 className="text-2xl sm:text-3xl font-sans font-bold text-ink mb-3">
        墨迹未至
      </h1>
      <p className="text-sm text-ink-lighter max-w-md leading-relaxed mb-10">
        这一页尚未落笔，或许文字还在酝酿之中。
        <br />
        不妨回到首页，看看其他篇章。
      </p>

      {/* 操作按钮 */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-sans font-medium
            text-white transition-all duration-200 hover:opacity-90"
          style={{ background: "var(--color-accent)" }}
        >
          <Home size={15} />
          回到首页
        </Link>
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-sans font-medium
            text-ink-light border border-border hover:border-accent/30 hover:text-accent transition-all duration-200"
        >
          <ArrowLeft size={15} />
          返回上页
        </button>
      </div>

      {/* 底部装饰线 */}
      <div className="mt-16 flex items-center gap-2 text-ink-lighter/30">
        <div className="w-12 h-px bg-current" />
        <span className="text-xs font-sans">页面走丢了</span>
        <div className="w-12 h-px bg-current" />
      </div>
    </div>
  );
}
