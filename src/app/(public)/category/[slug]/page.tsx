import { notFound } from "next/navigation";
import { postService } from "@/modules/post/service";
import { PostCard } from "@/components/post/PostCard";
import { buildMetadata } from "@/lib/seo";
import { CategoryTitle, CategoryEmpty, CategoryPostsCount } from "@/components/i18n/Translated";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return buildMetadata({ title: `分类: ${slug}`, path: `/category/${slug}` });
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  let result;
  try {
    result = await postService.getPostsByCategory(slug, { page: 1, pageSize: 50 });
  } catch {
    notFound();
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-sans font-bold text-ink mb-2">
        <CategoryTitle name={result.category.name} />
      </h1>
      <p className="text-sm text-ink-lighter font-sans mb-8">
        <CategoryPostsCount count={result.posts.length} />
      </p>

      {result.posts.length > 0 ? (
        result.posts.map((post) => <PostCard key={post.id} post={post} />)
      ) : (
        <p className="text-center text-ink-lighter py-12"><CategoryEmpty /></p>
      )}
    </div>
  );
}
