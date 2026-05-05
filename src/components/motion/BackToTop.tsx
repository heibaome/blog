"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";

/**
 * 浮动回到顶部按钮
 * 向下滚动超过 400px 后显示，点击平滑回到顶部
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-paper border border-border shadow-sm flex items-center justify-center text-ink-lighter hover:text-accent hover:border-accent/30 hover:shadow-md transition-colors duration-200"
          aria-label="回到顶部"
          title="回到顶部"
        >
          <ArrowUp size={16} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
