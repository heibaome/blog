"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/LocaleProvider";

export function Footer() {
  const { t } = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer mt-auto border-t border-border bg-paper-warm">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-sm font-sans text-ink-light">
              © {year}{" "}
              <span className="font-medium">{t.site_name}{t.site_name_accent}</span>
            </p>
            <p className="text-xs text-ink-lighter mt-1">
              {t.footer_tagline}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-sans text-ink-lighter">
            <Link href="/archive" className="hover:text-accent transition-colors">
              {t.footer_archive}
            </Link>
            <span>·</span>
            <Link href="/search" className="hover:text-accent transition-colors">
              {t.footer_search}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
