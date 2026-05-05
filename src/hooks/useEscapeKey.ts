"use client";

import { useEffect, useRef } from "react";

/**
 * ESC 键监听 Hook
 * 按下 ESC 时触发回调，自动清理事件监听
 * 使用 ref 始终引用最新的 callback，避免闭包过期问题
 */
export function useEscapeKey(callback: () => void, enabled = true) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        callbackRef.current();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [enabled]);
}
