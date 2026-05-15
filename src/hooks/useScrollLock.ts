"use client";

import { useEffect } from "react";

/**
 * 滚动锁定 Hook
 * 锁定时固定页面位置，解锁后恢复原位
 * 替代各组件中重复的滚动锁定逻辑
 */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      const sy = Math.abs(parseInt(document.body.style.top || "0"));
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, sy);
    };
  }, [locked]);
}
