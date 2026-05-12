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
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-sans font-bold text-ink mb-3">
            <ArchiveTitle />
          </h1>
          <p className="text-sm text-ink-lighter font-sans">
            共 {Object.values(archive).flat().length} 篇文章
          </p>
        </div>
      </ScrollReveal>

      {months.length === 0 ? (
        <ScrollReveal>
          <p className="text-ink-lighter text-center py-12"><ArchiveEmpty /></p>
        </ScrollReveal>
      ) : (
        <div className="relative">
          {/* 时间线中轴线 */}
          <div className="absolute left-[7px] sm:left-1/2 sm:-translate-x-px top-0 bottom-0 w-px bg-border" />

          <StaggerList stagger={0.08} y={12}>
            {months.map((month) => (
              <StaggerItem key={month}>
                <section className="mb-10 relative">
                  {/* 月份节点 */}
                  <div className="flex items-center mb-4 sm:justify-center">
                    <div className="sm:absolute sm:left-1/2 sm:-translate-x-1/2 w-4 h-4 rounded-full bg-paper border-2 border-accent z-10" />
                    <h2 className="ml-6 sm:ml-0 sm:px-4 sm:bg-paper sm:rounded-lg font-sans font-semibold text-accent">
                      <TranslatedArchiveDate date={month + "-01"} />
                      <span className="text-ink-lighter font-normal text-sm ml-2">
                        <ArchivePostsCount count={archive[month].length} />
                      </span>
                    </h2>
                  </div>

                  {/* 文章列表 */}
                  <ul className="space-y-3 ml-6 sm:ml-auto sm:mr-[calc(50%+24px)] sm:w-[calc(50%-24px)]">
                    {archive[month].map((post) => (
                      <li key={post.id} className="flex items-baseline gap-3 group">
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
                          className="text-sm font-sans text-ink group-hover:text-accent transition-colors flex-1 line-clamp-1"
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
        </div>
      )}
    </div>
  );
}
