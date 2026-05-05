"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export interface ReadingPrefs {
  fontSize: number;
  lineHeight: number;
  fontFamily: "serif" | "sans" | "system";
  contentWidth: number;
}

const DEFAULT_PREFS: ReadingPrefs = {
  fontSize: 16,
  lineHeight: 1.9,
  fontFamily: "serif",
  contentWidth: 720,
};

const STORAGE_KEY = "moji-reading-prefs";

interface ReadingContextValue {
  prefs: ReadingPrefs;
  updatePref: <K extends keyof ReadingPrefs>(
    key: K,
    value: ReadingPrefs[K]
  ) => void;
  resetPrefs: () => void;
}

const ReadingContext = createContext<ReadingContextValue>({
  prefs: DEFAULT_PREFS,
  updatePref: () => {},
  resetPrefs: () => {},
});

function loadPrefs(): ReadingPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PREFS, ...parsed };
    }
  } catch {}
  return DEFAULT_PREFS;
}

function applyPrefs(prefs: ReadingPrefs) {
  const root = document.documentElement;
  root.style.setProperty("--reading-font-size", `${prefs.fontSize}px`);
  root.style.setProperty("--reading-line-height", String(prefs.lineHeight));

  const fontMap: Record<string, string> = {
    serif:
      '"Source Han Serif SC", "Noto Serif SC", "Songti SC", "SimSun", serif',
    sans:
      '"Source Han Sans SC", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    system: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  };
  root.style.setProperty("--reading-font-family", fontMap[prefs.fontFamily]);
  root.style.setProperty("--reading-content-width", `${prefs.contentWidth}px`);
}

export function ReadingProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<ReadingPrefs>(DEFAULT_PREFS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loaded = loadPrefs();
    setPrefs(loaded);
    applyPrefs(loaded);
    setMounted(true);
  }, []);

  const updatePref = useCallback(
    <K extends keyof ReadingPrefs>(key: K, value: ReadingPrefs[K]) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: value };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        applyPrefs(next);
        return next;
      });
    },
    []
  );

  const resetPrefs = useCallback(() => {
    setPrefs(DEFAULT_PREFS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PREFS));
    applyPrefs(DEFAULT_PREFS);
  }, []);

  if (!mounted) {
    return (
      <ReadingContext.Provider
        value={{
          prefs: DEFAULT_PREFS,
          updatePref: () => {},
          resetPrefs: () => {},
        }}
      >
        {children}
      </ReadingContext.Provider>
    );
  }

  return (
    <ReadingContext.Provider value={{ prefs, updatePref, resetPrefs }}>
      {children}
    </ReadingContext.Provider>
  );
}

export function useReadingPrefs() {
  return useContext(ReadingContext);
}
