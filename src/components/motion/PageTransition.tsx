"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode } from "react";

/**
 * 页面转场动画
 * 包裹在 ConditionalLayout 中，为路由切换提供淡入淡出效果
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{
          duration: 0.25,
          ease: [0.25, 0.1, 0.25, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
