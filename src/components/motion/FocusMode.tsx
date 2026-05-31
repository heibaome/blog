"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { Eye, EyeOff } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";

interface FocusContextValue {
  focused: boolean;
  toggleFocus: () => void;
}

const FocusContext = createContext<FocusContextValue>({
  focused: false,
  toggleFocus: () => {},
});

export function useFocusMode() {
  return useContext(FocusContext);
}

export function FocusModeProvider({ children }: { children: ReactNode }) {
  const { t } = useLocale();
  const [focused, setFocused] = useState(false);

  const toggleFocus = useCallback(() => {
    setFocused((prev) => !prev);
  }, []);

  // Esc 退出专注
  useEffect(() => {
    if (!focused) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocused(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [focused]);

  // 专注模式下添加 body class
  useEffect(() => {
    if (focused) {
      document.body.classList.add("focus-active");
    } else {
      document.body.classList.remove("focus-active");
    }
    return () => document.body.classList.remove("focus-active");
  }, [focused]);

  return (
    <FocusContext.Provider value={{ focused, toggleFocus }}>
      {children}
      {/* 浮动切换按钮（专注模式下显示退出提示） */}
      {focused && (
        <button
          onClick={toggleFocus}
          className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-paper border border-border shadow-lg
            text-accent hover:text-accent-light hover:bg-paper-warm transition-all duration-200
            animate-fade-in"
          title={`${t.focus_mode_exit} (Esc)`}
        >
          <EyeOff size={18} />
        </button>
      )}
    </FocusContext.Provider>
  );
}

/** Header 中的专注模式按钮 */
export function FocusModeToggle() {
  const { focused, toggleFocus } = useFocusMode();
  const { t } = useLocale();

  return (
    <button
      onClick={toggleFocus}
      className="p-2 rounded-md text-ink-lighter hover:text-ink hover:bg-paper-warm transition-colors"
      aria-label={focused ? t.focus_mode_exit : t.focus_mode_enter}
      title={focused ? `${t.focus_mode_exit} (Esc)` : t.focus_mode_enter}
    >
      {focused ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );
}
