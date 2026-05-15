"use client";

import { useEffect, useCallback } from "react";

/**
 * ESC 键监听 Hook
 * 按下 ESC 时触发回调，自动清理事件监听
 */
export function useEscapeKey(callback: () => void, enabled = true) {
  const stableCallback = useCallback(callback, []);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        stableCallback();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [enabled, stableCallback]);
}
