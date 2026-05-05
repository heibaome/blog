"use client";

import { useEffect } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";

interface DisclaimerModalProps {
  onAgree: () => void;
  exiting?: boolean;
}

export function DisclaimerModal({ onAgree, exiting = false }: DisclaimerModalProps) {
  const { t } = useLocale();

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const origOverflow = body.style.overflow;
    const origHtmlOverflow = html.style.overflow;
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    return () => {
      body.style.overflow = origOverflow;
      html.style.overflow = origHtmlOverflow;
    };
  }, []);

  const sections = [
    { title: t.disclaimer_section1_title, content: t.disclaimer_section1_content },
    { title: t.disclaimer_section2_title, content: t.disclaimer_section2_content },
    { title: t.disclaimer_section3_title, content: t.disclaimer_section3_content },
    { title: t.disclaimer_section4_title, content: t.disclaimer_section4_content },
    { title: t.disclaimer_section5_title, content: t.disclaimer_section5_content },
    { title: t.disclaimer_section6_title, content: t.disclaimer_section6_content },
  ];

  const overlayClass = exiting ? "modal-overlay-exit" : "modal-overlay-enter";
  const contentClass = exiting ? "modal-content-exit" : "modal-content-enter";

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm ${overlayClass}`}
    >
      <div
        className={`flex flex-col w-[calc(100%-2rem)] max-w-2xl bg-paper rounded-2xl shadow-2xl border border-border overflow-hidden ${contentClass}`}
        style={{ maxHeight: "min(85vh, calc(100dvh - 3rem))" }}
      >
        {/* 标题 - 固定 */}
        <div className="shrink-0 px-6 pt-6 pb-4 text-center border-b border-border">
          <h2 className="font-sans font-semibold text-xl sm:text-2xl text-ink mb-1">
            {t.disclaimer_title}
          </h2>
          <p className="text-sm text-ink-lighter font-sans">
            {t.disclaimer_subtitle}
          </p>
        </div>

        {/* 内容 - 可滚动 */}
        <div
          className="overflow-y-auto px-6 py-5"
          style={{ touchAction: "pan-y" }}
        >
          <div className="space-y-4 text-[15px] text-ink-light leading-relaxed font-sans">
            <p>{t.disclaimer_welcome}</p>

            <div className="space-y-4 pl-3 sm:pl-5">
              {sections.map((s) => (
                <p key={s.title}>
                  <strong className="text-ink">{s.title}</strong>
                  <br />
                  {s.content}
                </p>
              ))}
            </div>

            <p className="text-ink-lighter text-xs pt-2">
              {t.disclaimer_footer}
            </p>
          </div>
        </div>

        {/* 按钮 - 固定在底部，不被内容覆盖 */}
        <div className="shrink-0 px-6 py-4 border-t border-border flex justify-center">
          <button
            onClick={onAgree}
            disabled={exiting}
            className="inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c0483e]
                       text-white hover:opacity-90 active:scale-[0.98]
                       text-base px-10 py-2.5 gap-2
                       disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "#c0483e" }}
          >
            {t.disclaimer_agree}
          </button>
        </div>
      </div>
    </div>
  );
}
