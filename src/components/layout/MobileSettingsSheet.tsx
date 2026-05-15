"use client";

import { useState, useEffect, useCallback } from "react";
import { clsx } from "clsx";
import {
  Sun, Moon, Monitor, SlidersHorizontal, Eye, EyeOff,
  Globe, Settings, X, RotateCcw,
} from "lucide-react";
import { useTheme, type Theme } from "@/components/theme/ThemeProvider";
import { useReadingPrefs, type ReadingPrefs } from "@/components/reading/ReadingProvider";
import { useFocusMode } from "@/components/motion/FocusMode";
import { useLocale } from "@/components/providers/LocaleProvider";

/* ───────── Theme options ───────── */
const THEME_OPTS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
  { value: "system", label: "跟随系统", icon: Monitor },
];

const FONT_OPTS: { value: ReadingPrefs["fontFamily"]; label: string }[] = [
  { value: "serif", label: "宋体" },
  { value: "sans", label: "黑体" },
  { value: "system", label: "系统" },
];

/* ───────── Slider ───────── */
function Slider({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number;
  step: number; unit: string; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm font-sans">
        <span className="text-ink-light">{label}</span>
        <span className="text-ink font-medium tabular-nums">
          {step < 1 ? value.toFixed(1) : value}{unit}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-8 h-8 flex items-center justify-center rounded-md border border-border text-ink-lighter hover:text-ink hover:bg-paper-warm transition-colors text-sm"
          disabled={value <= min}
        >−</button>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-1.5 appearance-none bg-border rounded-full cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent
            [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-8 h-8 flex items-center justify-center rounded-md border border-border text-ink-lighter hover:text-ink hover:bg-paper-warm transition-colors text-sm"
          disabled={value >= max}
        >+</button>
      </div>
    </div>
  );
}

/* ───────── Sheet toggle button ───────── */
export function MobileSettingsButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={clsx(
          "p-2 rounded-md text-ink-lighter hover:text-ink hover:bg-paper-warm transition-colors",
          className,
        )}
        aria-label="设置"
        title="设置"
      >
        <Settings size={16} />
      </button>
      {open && <SettingsSheet onClose={() => setOpen(false)} />}
    </>
  );
}

/* ───────── Bottom Sheet ───────── */
function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { theme, setTheme } = useTheme();
  const { prefs, updatePref, resetPrefs } = useReadingPrefs();
  const { focused, toggleFocus } = useFocusMode();
  const { t, locale, setLocale } = useLocale();

  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 250);
  }, [onClose]);

  // Esc 关闭
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleClose]);

  // 锁定 body 滚动
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <>
      {/* 遮罩 */}
      <div
        className={clsx(
          "fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm",
          closing ? "animate-fade-out" : "animate-fade-in",
        )}
        onClick={handleClose}
      />

      {/* 面板 */}
      <div
        className={clsx(
          "fixed left-0 right-0 bottom-0 z-[101]",
          "bg-paper rounded-t-2xl border-t border-border",
          "max-h-[85vh] overflow-y-auto",
          "px-5 pt-3 pb-8",
          closing ? "animate-sheet-out" : "animate-sheet-in",
        )}
      >
        {/* 拖拽条 */}
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />

        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-base font-sans font-semibold text-ink">设置</span>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md text-ink-lighter hover:text-ink hover:bg-paper-warm transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── 主题 ── */}
        <section className="mb-5">
          <div className="flex items-center gap-2 mb-2.5">
            <Sun size={14} className="text-ink-lighter" />
            <span className="text-sm font-sans text-ink-light">主题</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={clsx(
                  "flex flex-col items-center gap-1.5 py-3 rounded-lg border transition-colors",
                  theme === value
                    ? "border-accent/30 bg-accent/5 text-accent"
                    : "border-border text-ink-light hover:text-ink hover:bg-paper-warm",
                )}
              >
                <Icon size={18} />
                <span className="text-xs font-sans">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── 专注模式 ── */}
        <section className="mb-5">
          <div className="flex items-center gap-2 mb-2.5">
            <Eye size={14} className="text-ink-lighter" />
            <span className="text-sm font-sans text-ink-light">专注模式</span>
          </div>
          <button
            onClick={toggleFocus}
            className={clsx(
              "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-colors text-sm font-sans",
              focused
                ? "border-accent/30 bg-accent/5 text-accent"
                : "border-border text-ink-light hover:text-ink hover:bg-paper-warm",
            )}
          >
            {focused ? <><EyeOff size={15} /> 退出专注模式</> : <><Eye size={15} /> 开启专注模式</>}
          </button>
        </section>

        {/* ── 阅读设置 ── */}
        <section className="mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-ink-lighter" />
              <span className="text-sm font-sans text-ink-light">阅读偏好</span>
            </div>
            <button
              onClick={resetPrefs}
              className="flex items-center gap-1 text-xs font-sans text-ink-lighter hover:text-accent transition-colors"
            >
              <RotateCcw size={12} />
              重置
            </button>
          </div>

          <div className="space-y-4">
            <Slider
              label="字体大小" value={prefs.fontSize}
              min={12} max={22} step={1} unit="px"
              onChange={(v) => updatePref("fontSize", v)}
            />
            <Slider
              label="行距" value={prefs.lineHeight}
              min={1.4} max={2.4} step={0.1} unit=""
              onChange={(v) => updatePref("lineHeight", v)}
            />

            {/* 字体 */}
            <div className="space-y-1.5">
              <span className="text-sm font-sans text-ink-light">字体</span>
              <div className="grid grid-cols-3 gap-2">
                {FONT_OPTS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => updatePref("fontFamily", value)}
                    className={clsx(
                      "py-2 rounded-lg text-sm font-sans transition-colors border",
                      prefs.fontFamily === value
                        ? "text-accent bg-accent/5 border-accent/20 font-medium"
                        : "text-ink-light border-border hover:text-ink hover:bg-paper-warm",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 语言 ── */}
        <section>
          <div className="flex items-center gap-2 mb-2.5">
            <Globe size={14} className="text-ink-lighter" />
            <span className="text-sm font-sans text-ink-light">语言</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setLocale("zh-CN")}
              className={clsx(
                "py-2.5 rounded-lg text-sm font-sans transition-colors border",
                locale === "zh-CN"
                  ? "text-accent bg-accent/5 border-accent/20 font-medium"
                  : "text-ink-light border-border hover:text-ink hover:bg-paper-warm",
              )}
            >
              中文
            </button>
            <button
              onClick={() => setLocale("en-US")}
              className={clsx(
                "py-2.5 rounded-lg text-sm font-sans transition-colors border",
                locale === "en-US"
                  ? "text-accent bg-accent/5 border-accent/20 font-medium"
                  : "text-ink-light border-border hover:text-ink hover:bg-paper-warm",
              )}
            >
              English
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
