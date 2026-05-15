"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

/**
 * 阅读进度条
 * 页面顶部 2px 细线，随滚动进度增长，提供阅读位置反馈
 */
export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] origin-left z-[60]"
      style={{
        scaleX,
        background: "linear-gradient(90deg, var(--color-accent), var(--color-jade))",
      }}
    />
  );
}
