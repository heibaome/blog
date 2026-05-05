"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BackToTop } from "@/components/motion/BackToTop";
import { ReadingProgress } from "@/components/motion/ReadingProgress";
import { CmdKSearch } from "@/components/motion/CmdKSearch";
import { PageTransition } from "@/components/motion/PageTransition";
import { DisclaimerGate } from "@/components/disclaimer/DisclaimerGate";
import { FocusModeProvider } from "@/components/motion/FocusMode";
import { TableOfContents } from "@/components/motion/TableOfContents";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  // 文章详情页显示 TOC
  const isPostPage = pathname.startsWith("/post/");

  return (
    <DisclaimerGate>
      <FocusModeProvider>
        <div className="min-h-screen flex flex-col">
          {/* Skip navigation - 仅键盘/屏幕阅读器可见 */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-lg focus:text-sm focus:font-sans"
          >
            跳到主要内容
          </a>
          <ReadingProgress />
          <Header />
          <main id="main-content" className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 reading-content">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
          <BackToTop />
          <CmdKSearch />
          {isPostPage && <TableOfContents />}
        </div>
      </FocusModeProvider>
    </DisclaimerGate>
  );
}
