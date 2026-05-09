"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/LocaleProvider";

export function Footer() {
  const { t } = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-12">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6">
            <Link href="/" className="signature inline-block hover:text-vermilion transition-colors">
              墨迹
            </Link>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-vermilion to-transparent mx-auto mt-3 opacity-60"></div>
          </div>

          <p className="text-sm font-sans text-ink-light mb-2">
            © {year} {t.site_name}{t.site_name_accent}
          </p>
          <p className="text-xs font-sans text-ink-mist mb-6">
            {t.footer_tagline}
          </p>

          <div className="flex items-center gap-6 text-sm font-sans">
            <Link href="/archive" className="text-ink-light hover:text-vermilion transition-colors relative group">
              归档
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-vermilion transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <span className="text-ink-mist">·</span>
            <Link href="/search" className="text-ink-light hover:text-vermilion transition-colors relative group">
              搜索
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-vermilion transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-border-light w-full">
            <p className="text-xs font-sans text-ink-mist opacity-70">
              用墨迹记录生活，用文字书写人生
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
