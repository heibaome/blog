"use client";

import { useState, useEffect } from "react";
import { Eye } from "lucide-react";
import { getCsrfHeaders } from "@/lib/csrf-client";

interface ViewCounterProps {
  slug: string;
  initialCount: number;
}

/**
 * 客户端浏览量组件
 * - 页面加载时显示构建时的初始值
 * - 挂载后异步递增浏览量并更新显示
 * - 使用 sessionStorage 防止同一会话重复计数
 */
export function ViewCounter({ slug, initialCount }: ViewCounterProps) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const sessionKey = `viewed_${slug}`;

    // 同一会话不重复计数（刷新页面不重复 +1）
    if (sessionStorage.getItem(sessionKey)) {
      // 已计过数，只拉最新值
      fetch(`/api/view?slug=${encodeURIComponent(slug)}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.data?.viewCount != null) setCount(json.data.viewCount);
        })
        .catch(() => {});
      return;
    }

    // 首次访问，递增浏览量
    fetch("/api/view", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...getCsrfHeaders(),
      },
      body: JSON.stringify({ slug }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.data?.viewCount != null) {
          setCount(json.data.viewCount);
          sessionStorage.setItem(sessionKey, "1");
        }
      })
      .catch(() => {});
  }, [slug]);

  return (
    <span className="flex items-center gap-1">
      <Eye size={14} />
      {count}
    </span>
  );
}
