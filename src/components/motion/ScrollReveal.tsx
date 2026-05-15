"use client";

import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  /** 动画延迟（秒），用于交错效果 */
  delay?: number;
  /** 动画时长（秒） */
  duration?: number;
  /** 起始 Y 偏移量（像素） */
  y?: number;
  /** 触发后是否只播放一次 */
  once?: boolean;
  /** 视口触发阈值（0-1） */
  amount?: number;
  className?: string;
}

/**
 * 滚动渐入组件
 * 当元素进入视口时从下方滑入并淡出，比全局 fadeIn 更有层次感
 */
export function ScrollReveal({
  children,
  delay = 0,
  duration = 0.5,
  y = 20,
  once = true,
  amount = 0.15,
  className,
}: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1], // ease-out cubic bezier
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerListProps {
  children: ReactNode;
  /** 每项之间的延迟间隔（秒） */
  stagger?: number;
  /** 起始 Y 偏移 */
  y?: number;
  className?: string;
}

/**
 * 交错列表容器
 * 子元素依次入场，产生节奏感
 */
export function StaggerList({
  children,
  stagger = 0.06,
  y = 16,
  className,
}: StaggerListProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.05 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerList 的子项（配合使用）
 */
export function StaggerItem({
  children,
  className,
  y = 16,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.4,
            ease: [0.25, 0.1, 0.25, 1],
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
