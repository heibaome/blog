"use client";

import { useState, useRef, useEffect } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type Theme } from "./ThemeProvider";
import { clsx } from "clsx";

const options: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
  { value: "system", label: "跟随系统", icon: Monitor },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Esc 关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const CurrentIcon =
    theme === "dark" ? Moon : theme === "system" ? Monitor : Sun;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-md text-ink-lighter hover:text-ink hover:bg-paper-warm transition-colors"
        aria-label="切换主题"
        title="切换主题"
      >
        <CurrentIcon size={16} />
      </button>

      {open && (
        <div
          className={clsx(
            "absolute right-0 top-full mt-1 w-36 py-1 rounded-lg border border-border",
            "bg-paper shadow-lg z-50",
            "animate-scale-in"
          )}
        >
          {options.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => {
                setTheme(value);
                setOpen(false);
              }}
              className={clsx(
                "w-full flex items-center gap-2 px-3 py-2 text-sm font-sans transition-colors",
                theme === value
                  ? "text-accent bg-accent/5"
                  : "text-ink-light hover:text-ink hover:bg-paper-warm"
              )}
            >
              <Icon size={14} />
              {label}
              {theme === value && (
                <span className="ml-auto text-accent">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
