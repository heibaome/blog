import { postService } from "@/modules/post/service";
import { buildMetadata } from "@/lib/seo";
import Link from "next/link";
import { ArchiveTitle, ArchiveEmpty, ArchivePostsCount, TranslatedArchiveDate } from "@/components/i18n/Translated";
import { ScrollReveal, StaggerList, StaggerItem } from "@/components/motion/ScrollReveal";
import { FolderOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({ title: "归档", path: "/archive" });

export default async function ArchivePage() {
  let archive: Awaited<ReturnType<typeof postService.getArchive>> = {};
  try {
    archive = await postService.getArchive();
  } catch {}

  const months = Object.keys(archive).sort().reverse();

  return (
    <div>
      <ScrollReveal>
        <h1 className="text-2xl font-sans font-bold text-ink mb-8">
          <ArchiveTitle />
        </h1>
      </ScrollReveal>

      {months.length === 0 ? (
        <ScrollReveal>
          <p className="text-ink-lighter text-center py-12"><ArchiveEmpty /></p>
        </ScrollReveal>
      ) : (
        <StaggerList stagger={0.1} y={12}>
          {months.map((month) => (
            <StaggerItem key={month}>
              <section className="mb-8">
                <h2 className="font-sans font-semibold text-accent mb-3 sticky top-14 bg-paper py-2 z-10">
                  <TranslatedArchiveDate date={month + "-01"} />
                  <span className="text-ink-lighter font-normal text-sm ml-2">
                    <ArchivePostsCount count={archive[month].length} />
                  </span>
                </h2>
                <ul className="space-y-2">
                  {archive[month].map((post) => (
                    <li key={post.id} className="flex items-baseline gap-3">
                      <time className="text-xs font-sans text-ink-lighter flex-shrink-0 w-10">
                        {post.publishedAt
                          ? new Date(post.publishedAt)
                              .toLocaleDateString("zh-CN", {
                                month: "2-digit",
                                day: "2-digit",
                              })
                              .replace("/", "-")
                          : ""}
                      </time>
                      <Link
                        href={`/post/${post.slug}`}
                        className="link-underline text-sm font-sans text-ink hover:text-accent transition-colors"
                      >
                        {post.title}
                      </Link>
                      {post.category && (
                        <Link
                          href={`/category/${post.category.slug}`}
                          className="flex items-center gap-1 text-xs text-jade flex-shrink-0 hover:text-jade-light transition-colors"
                        >
                          <FolderOpen size={12} />
                          {post.category.name}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </div>
  );
}
