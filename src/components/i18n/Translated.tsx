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
    <section className="mb-6 text-center py-4 sm:py-6 relative">
      {/* 背景装饰 - 渐变光晕 */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-radial from-accent/5 via-transparent to-transparent" />
      </div>

      {/* 顶部装饰性墨点 */}
      <div className="flex justify-center mb-4">
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-accent/60" />
        </div>
      </div>

      {/* 主标题 */}
      <h1 className="text-4xl sm:text-5xl font-sans font-bold text-ink mb-4 tracking-tight">
        {t.home_title}<span className="text-accent">{t.home_title_accent}</span>
      </h1>

      {/* 副标题 / 标语 */}
      <p className="text-base sm:text-lg text-ink-light font-sans mb-5 max-w-md mx-auto px-4">
        用心书写，以墨留迹
      </p>

      {/* 装饰分隔线 */}
      <div className="flex items-center justify-center gap-3 mb-5">
        <div className="w-12 h-px bg-gradient-to-r from-transparent to-border" />
        <div className="w-2 h-2 rounded-full bg-accent/50 rotate-45" />
        <div className="w-12 h-px bg-gradient-to-l from-transparent to-border" />
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
