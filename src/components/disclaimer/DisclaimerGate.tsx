"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DISCLAIMER_CLIENT_COOKIE } from "@/shared/constants";
import { DisclaimerModal } from "./DisclaimerModal";

/** 免责声明退出动画时长（ms），需与 CSS 中 modal-content-out 时长 + buffer 一致 */
const EXIT_DURATION_MS = 300;

/** 检查客户端是否已接受免责声明 */
function hasDisclaimerCookie(): boolean {
  if (typeof document === "undefined") return false;
  const cookies = document.cookie.split(";");
  return cookies.some((c) => {
    const trimmed = c.trim();
    return trimmed === `${DISCLAIMER_CLIENT_COOKIE}=1` || trimmed.startsWith(`${DISCLAIMER_CLIENT_COOKIE}=`);
  });
}

interface DisclaimerGateProps {
  children: React.ReactNode;
}

/**
 * 免责声明门控组件
 * - 检测 disc_ok cookie 是否存在
 * - 未接受则显示阻塞式弹窗，用户必须点击同意按钮
 * - 同意后播放退出动画，再渲染子组件
 */
export function DisclaimerGate({ children }: DisclaimerGateProps) {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [checking, setChecking] = useState(true);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  // 初始化时检查 cookie
  useEffect(() => {
    setShowDisclaimer(!hasDisclaimerCookie());
    setChecking(false);
  }, []);

  // 同意处理：调用 API 设置 cookie → 播放退出动画 → 隐藏弹窗
  const handleAgree = useCallback(async () => {
    if (exiting) return; // 防止重复点击

    try {
      const res = await fetch("/api/disclaimer/accept", {
        method: "POST",
        headers: {
          "x-requested-with": "XMLHttpRequest",
        },
      });

      if (res.ok) {
        // API 成功后，cookie 已由服务端 Set-Cookie 设置
        await new Promise((r) => setTimeout(r, 100));

        // 播放退出动画
        setExiting(true);
        exitTimerRef.current = setTimeout(() => {
          setShowDisclaimer(false);
          setExiting(false);
        }, EXIT_DURATION_MS);
      } else {
        console.error("Failed to accept disclaimer");
      }
    } catch (err) {
      console.error("Failed to accept disclaimer:", err);
    }
  }, [exiting]);

  // 检查中：不渲染任何内容，避免闪烁
  if (checking) {
    return null;
  }

  // 免责声明未接受：仅渲染弹窗，不渲染子组件
  // 防止页面内容在遮罩背后加载和暴露
  if (showDisclaimer) {
    return <DisclaimerModal onAgree={handleAgree} exiting={exiting} />;
  }

  // 已接受：正常渲染子组件
  return <>{children}</>;
}
