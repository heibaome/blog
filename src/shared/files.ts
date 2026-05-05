/**
 * 文件操作工具函数
 */
import { unlink } from "fs/promises";
import path from "path";

/**
 * 从 HTML 内容中提取所有 /uploads/ 开头的图片路径
 */
export function extractUploadUrls(html: string): string[] {
  const urls: string[] = [];
  const regex = /src=["']?(\/uploads\/[^"'\s>]+)["']?/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    urls.push(match[1]);
  }
  return [...new Set(urls)];
}

/**
 * 安全删除 uploads 目录下的文件
 */
export async function deleteUploadFile(url: string): Promise<void> {
  if (!url.startsWith("/uploads/")) return;

  const filename = path.basename(url);
  const filePath = path.resolve(process.cwd(), "uploads", filename);
  const uploadsDir = path.resolve(process.cwd(), "uploads");

  if (!filePath.startsWith(uploadsDir)) return;

  try {
    await unlink(filePath);
  } catch {
    // 文件不存在则忽略
  }
}

/**
 * 删除文章关联的所有图片文件
 */
export async function cleanupPostImages(post: { content: string; coverImage?: string | null }): Promise<void> {
  const imageUrls = extractUploadUrls(post.content);

  if (post.coverImage && post.coverImage.startsWith("/uploads/")) {
    imageUrls.push(post.coverImage);
  }

  await Promise.all(imageUrls.map(deleteUploadFile));
}
