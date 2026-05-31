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

const FONT_OPTS: { value: ReadingPrefs["fontFamily"]; labelKey: keyof ReturnType<typeof useLocale>["t"] }[] = [
  { value: "serif", labelKey: "reading_font_serif" },
  { value: "sans", labelKey: "reading_font_sans" },
  { value: "system", labelKey: "reading_font_system" },
];

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

export function MobileSettingsButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { t } = useLocale();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={clsx(
          "p-2 rounded-md text-ink-lighter hover:text-ink hover:bg-paper-warm transition-colors",
          className,
        )}
        aria-label={t.settings_title}
        title={t.settings_title}
      >
        <Settings size={16} />
      </button>
      {open && <SettingsSheet onClose={() => setOpen(false)} />}
    </>
  );
}

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <>
      <div
        className={clsx(
          "fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm",
          closing ? "animate-fade-out" : "animate-fade-in",
        )}
        onClick={handleClose}
      />

      <div
        className={clsx(
          "fixed left-0 right-0 bottom-0 z-[101]",
          "bg-paper rounded-t-2xl border-t border-border",
          "max-h-[85vh] overflow-y-auto",
          "px-5 pt-3 pb-8",
          closing ? "animate-sheet-out" : "animate-sheet-in",
        )}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />

        <div className="flex items-center justify-between mb-4">
          <span className="text-base font-sans font-semibold text-ink">{t.settings_title}</span>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md text-ink-lighter hover:text-ink hover:bg-paper-warm transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <section className="mb-5">
          <div className="flex items-center gap-2 mb-2.5">
            <Sun size={14} className="text-ink-lighter" />
            <span className="text-sm font-sans text-ink-light">{t.theme_label}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "light", label: t.theme_light, icon: Sun },
              { value: "dark", label: t.theme_dark, icon: Moon },
              { value: "system", label: t.theme_system, icon: Monitor },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value as Theme)}
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

        <section className="mb-5">
          <div className="flex items-center gap-2 mb-2.5">
            <Eye size={14} className="text-ink-lighter" />
            <span className="text-sm font-sans text-ink-light">{t.focus_mode_label}</span>
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
            {focused ? <><EyeOff size={15} /> {t.focus_mode_exit}</> : <><Eye size={15} /> {t.focus_mode_enter}</>}
          </button>
        </section>

        <section className="mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-ink-lighter" />
              <span className="text-sm font-sans text-ink-light">{t.reading_prefs_label}</span>
            </div>
            <button
              onClick={resetPrefs}
              className="flex items-center gap-1 text-xs font-sans text-ink-lighter hover:text-accent transition-colors"
            >
              <RotateCcw size={12} />
              {t.reading_reset}
            </button>
          </div>

          <div className="space-y-4">
            <Slider
              label={t.reading_font_size} value={prefs.fontSize}
              min={12} max={22} step={1} unit="px"
              onChange={(v) => updatePref("fontSize", v)}
            />
            <Slider
              label={t.reading_line_height} value={prefs.lineHeight}
              min={1.4} max={2.4} step={0.1} unit=""
              onChange={(v) => updatePref("lineHeight", v)}
            />

            <div className="space-y-1.5">
              <span className="text-sm font-sans text-ink-light">{t.reading_font_family}</span>
              <div className="grid grid-cols-3 gap-2">
                {FONT_OPTS.map(({ value, labelKey }) => (
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
                    {t[labelKey]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-2.5">
            <Globe size={14} className="text-ink-lighter" />
            <span className="text-sm font-sans text-ink-light">{t.language_label}</span>
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
