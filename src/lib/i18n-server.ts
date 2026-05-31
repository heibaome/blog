import { cookies } from "next/headers";
import { headers } from "next/headers";
import type { Locale } from "@/lib/i18n";
import { getTranslations, getLocaleFromCookie, getLocaleFromAcceptLanguage } from "@/lib/i18n";

/**
 * Get current locale from server context
 * Priority: middleware header > cookie > Accept-Language > default "zh-CN"
 */
export async function getServerLocale(): Promise<Locale> {
  const headerStore = await headers();
  const middlewareLocale = headerStore.get("x-moji-locale");
  if (middlewareLocale === "en-US" || middlewareLocale === "zh-CN") {
    return middlewareLocale as Locale;
  }

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("moji-locale")?.value;
  if (cookieLocale === "en-US" || cookieLocale === "zh-CN") {
    return cookieLocale as Locale;
  }

  const acceptLang = headerStore.get("accept-language");
  return getLocaleFromAcceptLanguage(acceptLang || undefined);
}

/**
 * Get translations for current server locale
 */
export async function getServerTranslations() {
  const locale = await getServerLocale();
  return { t: getTranslations(locale), locale };
}
