import { revalidatePath } from "next/cache";

/**
 * 刷新文章相关页面的缓存
 * 在文章创建/更新/删除后调用，让静态页面立即更新
 */
export function revalidatePostPages(slug?: string, oldSlug?: string) {
  // 刷新首页（文章列表可能变化）
  revalidatePath("/");

  // 刷新归档页
  revalidatePath("/archive");

  // 刷新当前 slug 的文章页
  if (slug) {
    revalidatePath(`/post/${slug}`);
  }

  // 如果 slug 变了（编辑时修改了 slug），旧页面也要刷新
  if (oldSlug && oldSlug !== slug) {
    revalidatePath(`/post/${oldSlug}`);
  }

  // 刷新分类和标签页（文章的分类/标签可能变了）
  revalidatePath("/category/[slug]", "page");
  revalidatePath("/tag/[slug]", "page");
}
