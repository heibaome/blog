"use client";

import { useState, useRef, useEffect } from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { useReadingPrefs, type ReadingPrefs } from "./ReadingProvider";
import { clsx } from "clsx";

const FONT_OPTIONS: { value: ReadingPrefs["fontFamily"]; label: string }[] = [
  { value: "serif", label: "宋体" },
  { value: "sans", label: "黑体" },
  { value: "system", label: "系统" },
];

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (val: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm font-sans">
        <span className="text-ink-light">{label}</span>
        <span className="text-ink font-medium tabular-nums">
          {step < 1 ? value.toFixed(1) : value}
          {unit}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-ink-lighter hover:text-ink hover:bg-paper-warm transition-colors text-sm"
          disabled={value <= min}
        >
          −
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-1.5 appearance-none bg-border rounded-full cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent
            [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
            dark:[&::-webkit-slider-thumb]:bg-accent"
        />
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-ink-lighter hover:text-ink hover:bg-paper-warm transition-colors text-sm"
          disabled={value >= max}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function ReadingSettings() {
  const { prefs, updatePref, resetPrefs } = useReadingPrefs();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-md text-ink-lighter hover:text-ink hover:bg-paper-warm transition-colors"
        aria-label="阅读设置"
        title="阅读设置"
      >
        <SlidersHorizontal size={16} />
      </button>

      {open && (
        <div
          className={clsx(
            "absolute right-0 top-full mt-1 w-64 p-4 rounded-lg border border-border",
            "bg-paper shadow-lg z-50 space-y-4",
            "animate-scale-in"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-sans font-semibold text-ink">
              📖 阅读设置
            </span>
            <button
              onClick={resetPrefs}
              className="flex items-center gap-1 text-xs font-sans text-ink-lighter hover:text-accent transition-colors"
              title="重置为默认"
            >
              <RotateCcw size={12} />
              重置
            </button>
          </div>

          <SliderRow
            label="字体大小"
            value={prefs.fontSize}
            min={12}
            max={22}
            step={1}
            unit="px"
            onChange={(v) => updatePref("fontSize", v)}
          />

          <SliderRow
            label="行距"
            value={prefs.lineHeight}
            min={1.4}
            max={2.4}
            step={0.1}
            unit=""
            onChange={(v) => updatePref("lineHeight", v)}
          />

          <SliderRow
            label="文章宽度"
            value={prefs.contentWidth}
            min={480}
            max={800}
            step={20}
            unit="px"
            onChange={(v) => updatePref("contentWidth", v)}
          />

          {/* 字体选择 */}
          <div className="space-y-1.5">
            <span className="text-sm font-sans text-ink-light">字体</span>
            <div className="flex gap-1">
              {FONT_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updatePref("fontFamily", value)}
                  className={clsx(
                    "flex-1 py-1.5 rounded-md text-xs font-sans transition-colors",
                    prefs.fontFamily === value
                      ? "text-accent bg-accent/5 border border-accent/20 font-medium"
                      : "text-ink-light border border-border hover:text-ink hover:bg-paper-warm"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
