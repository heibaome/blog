import { buildMetadata } from "@/lib/seo";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import {
  AboutTitle,
  AboutSubtitle,
  AboutGreeting,
  AboutBio,
  AboutBlogIntro,
  AboutContact,
  AboutEmail,
} from "@/components/i18n/Translated";
import { Mail } from "lucide-react";

export const metadata = buildMetadata({ title: "关于", path: "/about" });

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* 标题区 */}
      <ScrollReveal>
        <div className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-sans font-bold text-ink mb-2">
            <AboutTitle />
          </h1>
          <p className="text-sm text-ink-lighter font-sans">
            <AboutSubtitle />
          </p>
          {/* 装饰分隔线 */}
          <div className="flex items-center gap-3 mt-4">
            <div className="w-8 h-px bg-border" />
            <div className="w-1.5 h-1.5 rounded-full bg-accent/40 rotate-45" />
            <div className="w-8 h-px bg-border" />
          </div>
        </div>
      </ScrollReveal>

      {/* 自我介绍 */}
      <ScrollReveal delay={0.1}>
        <section className="mb-10">
          <h2 className="text-lg font-sans font-semibold text-ink mb-4">
            <AboutGreeting />
          </h2>
          <p className="text-sm leading-relaxed text-ink-light font-sans">
            <AboutBio />
          </p>
        </section>
      </ScrollReveal>

      {/* 博客介绍 */}
      <ScrollReveal delay={0.15}>
        <section className="mb-10">
          <div className="p-5 rounded-lg bg-paper-warm border border-border">
            <p className="text-sm leading-relaxed text-ink-light font-sans italic">
              「<AboutBlogIntro />」
            </p>
          </div>
        </section>
      </ScrollReveal>

      {/* 联系方式 */}
      <ScrollReveal delay={0.2}>
        <section>
          <h2 className="text-lg font-sans font-semibold text-ink mb-4">
            <AboutContact />
          </h2>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-paper-warm border border-border group hover:border-accent/30 transition-colors">
            <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Mail size={16} className="text-accent" />
            </div>
            <div>
              <p className="text-xs text-ink-lighter font-sans mb-0.5">
                <AboutEmail />
              </p>
              <a
                href="mailto:3117077908@qq.com"
                className="text-sm font-sans text-ink hover:text-accent transition-colors"
              >
                3117077908@qq.com
              </a>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
