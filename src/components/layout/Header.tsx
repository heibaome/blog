"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useState, useEffect } from "react";
import { Menu, X, Globe, Search } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ReadingSettings } from "@/components/reading/ReadingSettings";
import { FocusModeToggle } from "@/components/motion/FocusMode";
import { MobileSettingsButton } from "@/components/layout/MobileSettingsSheet";

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t, locale, setLocale } = useLocale();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: t.nav_home },
    { href: "/archive", label: t.nav_archive },
    { href: "/about", label: t.nav_about },
    { href: "/search", label: t.nav_search },
  ];

  return (
    <header className={clsx("site-header", scrolled && "scrolled")}>
      <div className="max-w-5xl mx-auto px-6 sm:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          <Link href="/" className="logo-ink group flex items-center gap-3">
            <span className="text-vermilion">墨</span>
            <span className="text-ink-deep">迹</span>
            <span className="hidden sm:inline text-sm font-sans font-normal text-ink-mist ml-2 tracking-wider">
              {t.site_name_accent}
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-2">
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "nav-link",
                  pathname === link.href && "active"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <button
              className="p-2.5 text-ink-medium hover:text-vermilion transition-colors"
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
              }}
              aria-label={t.nav_search}
            >
              <Search size={18} />
            </button>
            <ThemeToggle />
            <ReadingSettings />
            <FocusModeToggle />
            <button
              onClick={() => setLocale(locale === "zh-CN" ? "en-US" : "zh-CN")}
              className="p-2.5 text-ink-medium hover:text-vermilion transition-colors"
              title={locale === "zh-CN" ? "Switch to English" : "切换到中文"}
            >
              <Globe size={18} />
            </button>

            <button
              className="sm:hidden p-2.5 text-ink-medium hover:text-vermilion transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="菜单"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="sm:hidden pb-4 border-t border-border-light mt-2 pt-4 animate-fade-in">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    "px-4 py-3 text-sm font-sans rounded-md transition-colors",
                    pathname === link.href
                      ? "bg-vermilion-muted text-vermilion font-medium"
                      : "text-ink-medium hover:bg-paper-warm hover:text-ink-deep"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
