"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import { formatRelative, formatDateForArchive } from "@/lib/date";
import Lottie from "lottie-react";
import welcomeAnim from "../../../public/welcome.json";

export function TranslatedDate({ date }: { date: Date | string }) {
  const { locale } = useLocale();
  return <>{formatRelative(date, locale)}</>;
}

export function TranslatedArchiveDate({ date }: { date: Date | string }) {
  const { locale } = useLocale();
  return <>{formatDateForArchive(date, locale)}</>;
}

export function HomeHero() {
  const { t } = useLocale();
  return (
    <section className="mb-4 text-center py-3 sm:py-4">
      {/* 装饰性墨点 */}
      <div className="flex justify-center mb-3">
        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-accent/60" />
        </div>
      </div>
      <h1 className="text-3xl sm:text-4xl font-sans font-bold text-ink mb-4 tracking-tight">
        {t.home_title}<span className="text-accent">{t.home_title_accent}</span>
      </h1>
      {/* 装饰分隔线 */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="w-8 h-px bg-border" />
        <div className="w-1.5 h-1.5 rounded-full bg-accent/40 rotate-45" />
        <div className="w-8 h-px bg-border" />
      </div>
      {/* Lottie welcome 动画 */}
      <div className="w-full max-w-md mx-auto">
        <Lottie
          animationData={welcomeAnim}
          loop={false}
          autoplay={true}
          style={{ width: "100%", height: "auto" }}
        />
      </div>
    </section>
  );
}

export function HomeLatestHeader() {
  const { t } = useLocale();
  return <>{t.home_latest}</>;
}

export function HomeViewAll() {
  const { t } = useLocale();
  return <>{t.home_view_all}</>;
}

export function HomeEmpty() {
  const { t } = useLocale();
  return <>{t.home_empty}</>;
}


export function ArchiveTitle() {
  const { t } = useLocale();
  return <>{t.archive_title}</>;
}

export function ArchiveEmpty() {
  const { t } = useLocale();
  return <>{t.archive_empty}</>;
}

export function ArchivePostsCount({ count }: { count: number }) {
  const { t } = useLocale();
  return <>{count} {t.archive_posts_count}</>;
}

export function SearchTitle() {
  const { t } = useLocale();
  return <>{t.search_title}</>;
}

export function SearchPlaceholder() {
  const { t } = useLocale();
  return <>{t.search_placeholder}</>;
}

export function SearchNoResults({ query }: { query: string }) {
  const { t } = useLocale();
  return <>{t.search_no_results_prefix}{query}{t.search_no_results_suffix}</>;
}

export function SearchResultsCount({ count }: { count: number }) {
  const { t } = useLocale();
  return <>{t.search_results_count_prefix}{count}{t.search_results_count_suffix}</>;
}

export function SearchInputHint() {
  const { t } = useLocale();
  return <>{t.search_input_hint}</>;
}

export function CategoryTitle({ name }: { name: string }) {
  const { t } = useLocale();
  return <>{t.category_title}{name}</>;
}

export function CategoryEmpty() {
  const { t } = useLocale();
  return <>{t.category_empty}</>;
}

export function CategoryPostsCount({ count }: { count: number }) {
  const { t } = useLocale();
  return <>{count} {t.archive_posts_count}</>;
}

export function TagTitle({ name }: { name: string }) {
  const { t } = useLocale();
  return <>{t.tag_title}{name}</>;
}

export function TagEmpty() {
  const { t } = useLocale();
  return <>{t.tag_empty}</>;
}

export function TagPostsCount({ count }: { count: number }) {
  const { t } = useLocale();
  return <>{count} {t.archive_posts_count}</>;
}

export function PostNotFound() {
  const { t } = useLocale();
  return <>{t.post_not_found}</>;
}

export function LoginTitle() {
  const { t } = useLocale();
  return (
    <>
      {t.login_title}<span className="text-accent">迹</span> {t.nav_admin}
    </>
  );
}

export function LoginSubtitle() {
  const { t } = useLocale();
  return <>{t.login_subtitle}</>;
}

export function LoginUsername() {
  const { t } = useLocale();
  return <>{t.login_username}</>;
}

export function LoginPassword() {
  const { t } = useLocale();
  return <>{t.login_password}</>;
}

export function LoginSubmit() {
  const { t } = useLocale();
  return <>{t.login_submit}</>;
}

export function LoginError() {
  const { t } = useLocale();
  return <>{t.login_error}</>;
}

export function LoginNetworkError() {
  const { t } = useLocale();
  return <>{t.login_network_error}</>;
}

export function AboutTitle() {
  const { t } = useLocale();
  return <>{t.about_title}</>;
}

export function AboutSubtitle() {
  const { t } = useLocale();
  return <>{t.about_subtitle}</>;
}

export function AboutGreeting() {
  const { t } = useLocale();
  return <>{t.about_greeting}</>;
}

export function AboutBio() {
  const { t } = useLocale();
  return <>{t.about_bio}</>;
}

export function AboutBlogIntro() {
  const { t } = useLocale();
  return <>{t.about_blog_intro}</>;
}

export function AboutContact() {
  const { t } = useLocale();
  return <>{t.about_contact}</>;
}

export function AboutEmail() {
  const { t } = useLocale();
  return <>{t.about_email}</>;
}
