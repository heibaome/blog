import { format, formatDistanceToNow } from "date-fns";
import { zhCN, enUS } from "date-fns/locale";

function getLocale(lang?: string) {
  return lang?.startsWith("zh") ? zhCN : enUS;
}

export function formatDate(date: Date | string, lang?: string): string {
  const d = new Date(date);
  return format(d, "yyyy-MM-dd", { locale: getLocale(lang) });
}

export function formatDateTime(date: Date | string, lang?: string): string {
  const d = new Date(date);
  return format(d, "yyyy-MM-dd HH:mm", { locale: getLocale(lang) });
}

export function formatRelative(date: Date | string, lang?: string): string {
  const d = new Date(date);
  return formatDistanceToNow(d, { addSuffix: true, locale: getLocale(lang) });
}

export function formatDateForArchive(date: Date | string, lang?: string): string {
  const d = new Date(date);
  if (lang?.startsWith("zh")) {
    return format(d, "yyyy年MM月", { locale: zhCN });
  }
  return format(d, "MMMM yyyy", { locale: enUS });
}
