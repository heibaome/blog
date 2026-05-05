"use client";

import { useAuth } from "@/hooks";
import { ensureCsrfToken } from "@/lib/csrf-client";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  FileText,
  MessageCircle,
  FolderOpen,
  Tag,
  LogOut,
  Settings,
  PenLine,
  Menu,
  ChevronLeft,
  HardDrive,
} from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";

// Map routes to page titles
const routeTitles: Record<string, string> = {
  "/admin/dashboard": "仪表盘",
  "/admin/posts": "文章管理",
  "/admin/editor/new": "写文章",
  "/admin/comments": "评论管理",
  "/admin/categories": "分类管理",
  "/admin/tags": "标签管理",
  "/admin/settings": "个人设置",
};

function getPageTitle(pathname: string): string {
  // Check exact matches first
  if (routeTitles[pathname]) return routeTitles[pathname];
  // Check dynamic routes (e.g. /admin/editor/xxx)
  for (const [route, title] of Object.entries(routeTitles)) {
    if (pathname.startsWith(route + "/")) return title;
  }
  return "管理后台";
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useLocale();

  // 确保 CSRF token 存在（防止 cookie 过期导致写操作失败）
  useEffect(() => {
    ensureCsrfToken();
  }, []);

  const adminNav = [
    { href: "/admin/dashboard", label: t.admin_dashboard, icon: LayoutDashboard },
    { href: "/admin/posts", label: t.admin_posts, icon: FileText },
    { href: "/admin/editor/new", label: t.admin_write, icon: PenLine },
    { href: "/admin/comments", label: t.admin_comments, icon: MessageCircle },
    { href: "/admin/categories", label: t.admin_categories, icon: FolderOpen },
    { href: "/admin/tags", label: t.admin_tags, icon: Tag },
    { href: "/admin/files", label: "文件管理", icon: HardDrive },
    { href: "/admin/settings", label: "个人设置", icon: Settings },
  ];

  const currentPageTitle = getPageTitle(pathname);

  // Login page - no sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Auth check
  // Auth check - redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#1c1917" }}>
        <div className="animate-spin h-8 w-8 border-2 border-[#c0483e] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#1c1917", color: "#e7e5e4", fontFamily: '"Source Han Sans SC", "Noto Sans SC", "PingFang SC", sans-serif' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 flex flex-col transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{ background: "#1c1917" }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6">
          <Link
            href="/"
            className="font-bold text-lg text-white flex items-center gap-2"
          >
            {t.site_name}<span style={{ color: "#c0483e" }}>{t.site_name_accent}</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                  isActive
                    ? "font-medium"
                    : "hover:bg-white/[0.04]"
                )}
                style={isActive
                  ? { background: "rgba(192, 72, 62, 0.12)", color: "#f87171" }
                  : { color: "#a8a29e" }
                }
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User & Actions */}
        <div className="p-3">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: "rgba(192, 72, 62, 0.15)", color: "#f87171" }}
            >
              {user.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{user.username}</p>
              <p className="text-xs" style={{ color: "#78716c" }}>{user.role}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs transition-colors hover:bg-white/[0.04]"
              style={{ color: "#a8a29e" }}
            >
              <ChevronLeft size={14} />
              {t.admin_back_to_site}
            </Link>
            <button
              onClick={logout}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs transition-colors hover:bg-red-500/10"
              style={{ color: "#a8a29e" }}
            >
              <LogOut size={14} />
              {t.admin_logout}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content - edge to edge, no nested framing */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header - shows current page, not generic "管理后台" */}
        <header className="lg:hidden h-14 flex items-center justify-between px-4" style={{ background: "#1c1917" }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="打开菜单" aria-expanded={sidebarOpen}
              className="p-2 transition-colors"
              style={{ color: "#a8a29e" }}
            >
              <Menu size={20} />
            </button>
            <span className="text-sm text-white font-medium">{currentPageTitle}</span>
          </div>
          <button
            onClick={logout}
            className="p-2 transition-colors"
            style={{ color: "#a8a29e" }}
          >
            <LogOut size={18} />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
