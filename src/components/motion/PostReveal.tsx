"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

/**
 * 文章页渐入效果 — 包裹整个文章内容
 * 替代 CSS animate-fade-in，提供更可控的入场动画
 */
export function PostReveal({ children }: { children: ReactNode }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </motion.article>
  );
}
