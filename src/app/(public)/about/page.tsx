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
import { Mail, Calendar, PenTool, BookOpen } from "lucide-react";

export const metadata = buildMetadata({ title: "关于", path: "/about" });

export default function AboutPage() {
  const currentYear = new Date().getFullYear();
  const blogAge = currentYear - 2020;

  return (
    <div className="max-w-2xl mx-auto">
      {/* 标题区 */}
      <ScrollReveal>
        <div className="mb-10 text-center">
          {/* 头像区 */}
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-accent/20 to-jade/20 flex items-center justify-center border-2 border-border">
              <span className="text-4xl">✍️</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-sans font-bold text-ink mb-2">
            <AboutTitle />
          </h1>
          <p className="text-sm text-ink-lighter font-sans mb-4">
            <AboutSubtitle />
          </p>

          {/* 装饰分隔线 */}
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-border" />
            <div className="w-2 h-2 rounded-full bg-accent/50 rotate-45" />
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-border" />
          </div>
        </div>
      </ScrollReveal>

      {/* 博客统计 */}
      <ScrollReveal delay={0.05}>
        <div className="grid grid-cols-3 gap-3 mb-10">
          <div className="text-center p-4 rounded-xl bg-paper-warm border border-border">
            <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-accent/10">
              <PenTool size={18} className="text-accent" />
            </div>
            <p className="text-lg font-semibold text-ink">{blogAge}+</p>
            <p className="text-xs text-ink-lighter">年写作</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-paper-warm border border-border">
            <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-jade/10">
              <BookOpen size={18} className="text-jade" />
            </div>
            <p className="text-lg font-semibold text-ink">50+</p>
            <p className="text-xs text-ink-lighter">篇文章</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-paper-warm border border-border">
            <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-gold/10">
              <Calendar size={18} className="text-gold" />
            </div>
            <p className="text-lg font-semibold text-ink">持续</p>
            <p className="text-xs text-ink-lighter">更新中</p>
          </div>
        </div>
      </ScrollReveal>

      {/* 自我介绍 */}
      <ScrollReveal delay={0.1}>
        <section className="mb-8">
          <h2 className="text-lg font-sans font-semibold text-ink mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-accent rounded-full" />
            <AboutGreeting />
          </h2>
          <div className="p-5 rounded-xl bg-paper-warm border border-border">
            <p className="text-sm leading-relaxed text-ink-light font-sans">
              <AboutBio />
            </p>
          </div>
        </section>
      </ScrollReveal>

      {/* 博客介绍 */}
      <ScrollReveal delay={0.15}>
        <section className="mb-8">
          <h2 className="text-lg font-sans font-semibold text-ink mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-jade rounded-full" />
            关于博客
          </h2>
          <div className="p-5 rounded-xl bg-paper-warm border border-border">
            <p className="text-sm leading-relaxed text-ink-light font-sans italic">
              「<AboutBlogIntro />」
            </p>
          </div>
        </section>
      </ScrollReveal>

      {/* 博客理念 */}
      <ScrollReveal delay={0.2}>
        <section className="mb-8">
          <h2 className="text-lg font-sans font-semibold text-ink mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-gold rounded-full" />
            写作理念
          </h2>
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-paper-warm border border-border">
              <span className="text-accent text-lg">01</span>
              <div>
                <p className="text-sm font-medium text-ink mb-1">真实记录</p>
                <p className="text-xs text-ink-light">记录真实的学习和成长经历，不追求完美，只追求真诚</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-paper-warm border border-border">
              <span className="text-jade text-lg">02</span>
              <div>
                <p className="text-sm font-medium text-ink mb-1">深度思考</p>
                <p className="text-xs text-ink-light">每一篇文章都经过深思熟虑，力求提供有价值的观点</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-paper-warm border border-border">
              <span className="text-gold text-lg">03</span>
              <div>
                <p className="text-sm font-medium text-ink mb-1">持续迭代</p>
                <p className="text-xs text-ink-light">博客内容和设计都在不断优化，欢迎提出建议</p>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* 联系方式 */}
      <ScrollReveal delay={0.25}>
        <section>
          <h2 className="text-lg font-sans font-semibold text-ink mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-accent rounded-full" />
            <AboutContact />
          </h2>
          <div className="p-5 rounded-xl bg-paper-warm border border-border hover:border-accent/30 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                <Mail size={20} className="text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-ink-lighter font-sans mb-0.5">
                  <AboutEmail />
                </p>
                <a
                  href="mailto:3117077908@qq.com"
                  className="text-base font-sans text-ink hover:text-accent transition-colors"
                >
                  3117077908@qq.com
                </a>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
