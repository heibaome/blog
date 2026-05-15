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
          <Link
            href="/"
            className="font-sans font-bold text-xl text-ink hover:text-accent transition-colors"
          >
            {t.site_name}<span className="text-accent">{t.site_name_accent}</span>
          </Link>

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
            {/* Theme toggle */}
            <ThemeToggle />
            {/* Reading settings */}
            <ReadingSettings />
            {/* Focus mode */}
            <FocusModeToggle />
            {/* Language toggle */}
            <button
              onClick={() => setLocale(locale === "zh-CN" ? "en-US" : "zh-CN")}
              className="ml-1 px-2 py-1.5 rounded-md text-sm font-sans text-ink-lighter hover:text-ink hover:bg-paper-warm transition-colors flex items-center gap-1"
              title={locale === "zh-CN" ? "Switch to English" : "切换到中文"}
            >
              <Globe size={14} />
              <span className="text-xs">{locale === "zh-CN" ? "EN" : "中"}</span>
            </button>
          </nav>

          {/* Mobile: Search + Settings + Menu */}
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

        {/* Mobile Nav（仅导航链接） */}
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
