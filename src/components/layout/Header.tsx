"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useState } from "react";
import { Menu, X, Globe, Search } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ReadingSettings } from "@/components/reading/ReadingSettings";
import { FocusModeToggle } from "@/components/motion/FocusMode";
import { MobileSettingsButton } from "@/components/layout/MobileSettingsSheet";

/* 内联 SVG 图标组件，fill 用 currentColor 自动跟随主题 */
function InkDropIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 56" fill="none" className={className}>
      {/* Ink drop body */}
      <path
        d="M24 2 C24 2, 10 20, 10 30 C10 38.837 16.163 46 24 46 C31.837 46 38 38.837 38 30 C38 20 24 2 24 2Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Brush stroke tail */}
      <path
        d="M35 28 Q43 23, 50 26 Q56 28, 52 30 Q48 32, 40 30 Q36 29, 35 28Z"
        fill="currentColor"
        opacity="0.65"
      />
      {/* Highlight */}
      <ellipse cx="21" cy="24" rx="3.5" ry="5" fill="white" opacity="0.25" />
    </svg>
  );
}

function LogoZh() {
  return (
    <span className="flex items-center gap-1.5">
      <InkDropIcon className="w-7 h-7 text-ink" />
      <span className="font-serif text-2xl font-bold text-ink tracking-wider">墨迹</span>
    </span>
  );
}

function LogoEn() {
  return (
    <span className="flex items-center gap-1.5">
      <InkDropIcon className="w-7 h-7 text-ink" />
      <span className="font-sans text-2xl font-semibold text-ink tracking-wider">Moji</span>
    </span>
  );
}

function Logo({ locale }: { locale: string }) {
  return (
    <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
      {locale === "zh-CN" ? <LogoZh /> : <LogoEn />}
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, locale, setLocale } = useLocale();

  const navLinks = [
    { href: "/", label: t.nav_home },
    { href: "/archive", label: t.nav_archive },
    { href: "/about", label: t.nav_about },
    { href: "/search", label: t.nav_search },
  ];

  return (
    <header className="site-header sticky top-0 z-50 bg-paper border-b border-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Logo locale={locale} />

          {/* Desktop Nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "px-3 py-1.5 rounded-md text-sm font-sans transition-colors",
                  pathname === link.href
                    ? "text-accent bg-accent/5 font-medium"
                    : "text-ink-light hover:text-ink hover:bg-paper-warm"
                )}
              >
                {link.label}
              </Link>
            ))}
            <ThemeToggle />
            <ReadingSettings />
            <FocusModeToggle />
            <button
              onClick={() => setLocale(locale === "zh-CN" ? "en-US" : "zh-CN")}
              className="ml-1 px-2 py-1.5 rounded-md text-sm font-sans text-ink-lighter hover:text-ink hover:bg-paper-warm transition-colors flex items-center gap-1"
              title={locale === "zh-CN" ? "Switch to English" : "切换到中文"}
            >
              <Globe size={14} />
              <span className="text-xs">{locale === "zh-CN" ? "EN" : "中"}</span>
            </button>
          </nav>

          {/* Mobile */}
          <div className="sm:hidden flex items-center gap-1">
            <button
              className="p-2 text-ink-light hover:text-ink transition-colors"
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
              }}
              aria-label="搜索"
            >
              <Search size={18} />
            </button>
            <MobileSettingsButton />
            <button
              className="p-2 text-ink-light hover:text-ink"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="sm:hidden pb-4 animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "block px-3 py-2 rounded-md text-sm font-sans transition-colors",
                  pathname === link.href
                    ? "text-accent bg-accent/5 font-medium"
                    : "text-ink-light hover:text-ink hover:bg-paper-warm"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
