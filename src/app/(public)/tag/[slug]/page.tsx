import { notFound } from "next/navigation";
import { postService } from "@/modules/post/service";
import { PostCard } from "@/components/post/PostCard";
import { buildMetadata } from "@/lib/seo";
import { TagTitle, TagEmpty, TagPostsCount } from "@/components/i18n/Translated";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return buildMetadata({ title: `标签: ${slug}`, path: `/tag/${slug}` });
}

export default async function TagPage({ params }: PageProps) {
  const { slug } = await params;
  let result;
  try {
    result = await postService.getPostsByTag(slug, { page: 1, pageSize: 50 });
  } catch {
    notFound();
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-sans font-bold text-ink mb-2">
        <TagTitle name={result.tag.name} />
      </h1>
      <p className="text-sm text-ink-lighter font-sans mb-8">
        <TagPostsCount count={result.posts.length} />
      </p>

      {result.posts.length > 0 ? (
        result.posts.map((post) => <PostCard key={post.id} post={post} />)
      ) : (
        <p className="text-center text-ink-lighter py-12"><TagEmpty /></p>
      )}
    </div>
  );
}
