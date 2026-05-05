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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f0f0f" }}>
        <div className="animate-spin h-10 w-10 border-3 border-[#c0483e] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#0f0f0f", color: "#f5f5f4", fontFamily: '"Source Han Sans SC", "Noto Sans SC", "PingFang SC", sans-serif' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-md"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-68 flex flex-col transition-all duration-300 shadow-2xl lg:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{ background: "linear-gradient(180deg, #151515 0%, #0f0f0f 100%)" }}
      >
        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b border-neutral-800/50">
          <Link
            href="/"
            className="font-bold text-xl flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: "linear-gradient(135deg, #c0483e 0%, #ef4444 100%)"
              }}
            >
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white group-hover:text-white transition-colors">
                {t.site_name}
              </span>
              <span style={{ color: "#c0483e" }} className="text-xs">
                {t.site_name_accent}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all duration-300 group relative",
                  isActive
                    ? "font-semibold shadow-lg"
                    : "hover:bg-white/[0.06] hover:translate-x-1"
                )}
                style={isActive
                  ? {
                      background: "linear-gradient(135deg, rgba(192, 72, 62, 0.2) 0%, rgba(192, 72, 62, 0.08) 100%)",
                      color: "#f87171"
                    }
                  : { color: "#78716c" }
                }
              >
                {isActive && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-full"
                    style={{ background: "#c0483e" }}
                  />
                )}
                <Icon size={20} className={isActive ? "" : "group-hover:text-neutral-400"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User & Actions */}
        <div className="p-4 border-t border-neutral-800/50">
          <div className="flex items-center gap-3 px-3 py-3 mb-3 rounded-2xl bg-white/[0.02]">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-base font-bold shadow-lg"
              style={{
                background: "linear-gradient(135deg, rgba(192, 72, 62, 0.3) 0%, rgba(192, 72, 62, 0.1) 100%)",
                color: "#f87171"
              }}
            >
              {user.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate font-medium">{user.username}</p>
              <p className="text-xs" style={{ color: "#78716c" }}>
                {user.role === "admin" ? "管理员" : user.role}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs transition-all hover:bg-white/[0.06] hover:translate-y-[-1px]"
              style={{ color: "#a8a29e" }}
            >
              <ChevronLeft size={16} />
              {t.admin_back_to_site}
            </Link>
            <button
              onClick={logout}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs transition-all hover:bg-red-500/10 hover:text-red-400"
              style={{ color: "#a8a29e" }}
            >
              <LogOut size={16} />
              {t.admin_logout}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content - edge to edge, no nested framing */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header - shows current page, not generic "管理后台" */}
        <header className="lg:hidden h-16 flex items-center justify-between px-5 border-b border-neutral-800/50" style={{ background: "#0f0f0f" }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="打开菜单" aria-expanded={sidebarOpen}
              className="p-2.5 rounded-xl transition-all hover:bg-white/[0.06]"
              style={{ color: "#a8a29e" }}
            >
              <Menu size={22} />
            </button>
            <span className="text-base font-semibold">{currentPageTitle}</span>
          </div>
          <button
            onClick={logout}
            className="p-2.5 rounded-xl transition-all hover:bg-white/[0.06]"
            style={{ color: "#a8a29e" }}
          >
            <LogOut size={20} />
          </button>
        </header>

        {/* Desktop header */}
        <header className="hidden lg:flex h-16 items-center justify-between px-8 border-b border-neutral-800/30" style={{ background: "rgba(15, 15, 15, 0.8)" }}>
          <div>
            <h1 className="text-lg font-bold">{currentPageTitle}</h1>
            <p className="text-xs mt-1" style={{ color: "#78716c" }}>
              {new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs px-3 py-1.5 rounded-full bg-white/[0.04]" style={{ color: "#78716c" }}>
              最后更新: {new Date().toLocaleTimeString("zh-CN")}
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-7 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
