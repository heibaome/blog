import { postService } from "@/modules/post/service";
import { PostCard } from "@/components/post/PostCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { ScrollReveal, StaggerList, StaggerItem } from "@/components/motion/ScrollReveal";
import {
  HomeHero,
  HomeLatestHeader,
  HomeViewAll,
  HomeEmpty,
} from "@/components/i18n/Translated";
import { getServerTranslations } from "@/lib/i18n-server";

export const revalidate = 300;

export async function generateMetadata() {
  const { t, locale } = await getServerTranslations();
  return buildMetadata({
    title: t.nav_home,
    description: t.home_meta_description,
    siteName: t.site_blog_name,
    locale,
  });
}

export default async function HomePage() {
  let posts: Awaited<ReturnType<typeof postService.getPublishedPosts>> | null = null;
  try {
    posts = await postService.getPublishedPosts({ page: 1, pageSize: 10 });
  } catch {}

  return (
    <div>
      <ScrollReveal duration={0.6} y={12}>
        <HomeHero />
      </ScrollReveal>

      <section className="mt-10">
        <ScrollReveal delay={0.1}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-sans font-semibold text-lg text-ink">
              <HomeLatestHeader />
            </h2>
            <Link
              href="/archive"
              className="flex items-center gap-1 text-sm font-sans text-ink-lighter hover:text-accent transition-colors group"
            >
              <HomeViewAll />
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-200" />
            </Link>
          </div>
        </ScrollReveal>

        {posts && posts.posts.length > 0 ? (
          <StaggerList stagger={0.07}>
            {posts.posts.map((post) => (
              <StaggerItem key={post.id}>
                <PostCard post={post} />
              </StaggerItem>
            ))}
          </StaggerList>
        ) : (
          <ScrollReveal>
            <div className="text-center py-20">
              <p className="text-ink-lighter font-sans text-sm">
                <HomeEmpty />
              </p>
            </div>
          </ScrollReveal>
        )}
      </section>
    </div>
  );
}
