"use client";

import { useState, useEffect } from "react";
import { getCsrfHeaders } from "@/lib/csrf-client";
import { type AuthUser } from "@/shared/types";

/**
 * 认证状态 Hook
 * 管理用户登录状态、登出功能
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          // 401 表示未登录，属于正常状态，不算错误
          if (res.status === 401) return { data: null };
          throw new Error(`认证请求失败 (HTTP ${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setUser(data.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "认证服务异常");
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "X-Requested-With": "XMLHttpRequest", ...getCsrfHeaders() },
      });
    } catch {
      // 登出请求失败不影响本地状态清理
    } finally {
      setUser(null);
      window.location.href = "/";
    }
  }

  return { user, loading, error, logout, setUser };
}
