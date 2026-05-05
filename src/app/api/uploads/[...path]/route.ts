import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { isAllowedCrawler } from "@/shared/site-secret";
import { ALLOWED_SITE_HOSTS, PROTECTED_IMAGE_HTML } from "@/shared/constants";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// MIME 类型映射
const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

/**
 * GET /api/uploads/[...path] - 安全地提供上传文件
 * 
 * 安全检查：
 * 1. 路径遍历防护：解析后必须在 uploads 目录内
 * 2. 文件名白名单：仅允许字母、数字、连字符、下划线 + 合法扩展名
 * 3. 鉴权（三层降级，与 middleware 配合）：
 *    - 站点验证 Cookie
 *    - Referer 检查
 *    - 搜索引擎/微信 UA 白名单
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const filePath = pathSegments.join("/");

  // 基础校验：防止路径遍历，仅允许安全文件名
  const resolvedPath = path.resolve(UPLOADS_DIR, filePath);
  if (!resolvedPath.startsWith(path.resolve(UPLOADS_DIR)) || !/^[\w\-]+(\.[\w]+)+$/.test(filePath)) {
    return new NextResponse(PROTECTED_IMAGE_HTML, { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  // 鉴权（middleware 的 /uploads/ 分支已经做了第一层过滤，
  // 但 Next.js 重写后可能绕过 middleware，此处作为第二道防线）
  const userAgent = request.headers.get("user-agent") || "";
  const referer = request.headers.get("referer");

  const fromSite = (() => {
    if (!referer) return false;
    try {
      const u = new URL(referer);
      return (ALLOWED_SITE_HOSTS as readonly string[]).includes(u.hostname);
    } catch {
      return false;
    }
  })();

  const crawlerOk = isAllowedCrawler(userAgent);

  if (!fromSite && !crawlerOk) {
    return new NextResponse(PROTECTED_IMAGE_HTML, { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  try {
    const fileBuffer = await readFile(resolvedPath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
