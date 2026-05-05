import { MetadataRoute } from "next";
import { prisma } from "@/shared/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const posts = await prisma.post.findMany({
    where: { status: "published" },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: "desc" },
    take: 1000,
  });

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/post/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/archive`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ...postEntries,
  ];
}
