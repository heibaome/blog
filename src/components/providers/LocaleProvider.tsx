"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { Locale, Translations, detectLocale, getTranslations } from "@/lib/i18n";

interface LocaleContextType {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: "zh-CN",
  t: getTranslations("zh-CN"),
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh-CN");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check localStorage first, then detect from browser
    const saved = localStorage.getItem("moji-locale") as Locale | null;
    let detected: Locale;
    if (saved && (saved === "zh-CN" || saved === "en-US")) {
      detected = saved;
    } else {
      detected = detectLocale();
    }
    setLocaleState(detected);
    // Sync cookie for server components
    document.cookie = `moji-locale=${detected};path=/;max-age=31536000`;
    document.documentElement.lang = detected;
    setMounted(true);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("moji-locale", l);
    // Set cookie for server components
    document.cookie = `moji-locale=${l};path=/;max-age=31536000`;
    // Update html lang attribute
    document.documentElement.lang = l;
  }, []);

  // Update html lang on locale change
  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = locale;
    }
  }, [locale, mounted]);

  return (
    <LocaleContext.Provider
      value={{
        locale,
        t: getTranslations(locale),
        setLocale,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
