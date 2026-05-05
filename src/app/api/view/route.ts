import { NextRequest } from "next/server";
import { z } from "zod";
import { postService } from "@/modules/post/service";
import { errorResponse, successResponse, AppError } from "@/shared/errors";
import { rateLimit, rateLimitPresets, getClientIP } from "@/lib/ratelimit";

const viewSchema = z.object({
  slug: z.string().min(1),
});

// ==================== 浏览量去重 ====================
// 按 IP + 文章 slug 记录，同一 IP 对同一文章在窗口期内只计一次
// 防止恶意刷接口导致数据库频繁写入

const VIEW_WINDOW_MS = 5 * 60 * 1000; // 5 分钟

declare global {
  var __viewDedupStore: Map<string, number> | undefined;
}

if (!globalThis.__viewDedupStore) {
  globalThis.__viewDedupStore = new Map();
}

import { registerCleanup } from "@/shared/cleanup-registry";

const viewDedupStore = globalThis.__viewDedupStore;

registerCleanup("view-dedup-cleanup", () => {
  const now = Date.now();
  for (const [key, expiresAt] of viewDedupStore) {
    if (expiresAt < now) viewDedupStore.delete(key);
  }
}, 60_000);

/**
 * 检查该 IP + slug 是否在去重窗口内
 * @returns true 表示应该计数（首次或窗口已过期），false 表示重复请求
 */
function shouldCountView(ip: string, slug: string): boolean {
  const key = `${ip}:${slug}`;
  const now = Date.now();
  const expiresAt = viewDedupStore.get(key);

  if (expiresAt && expiresAt > now) {
    return false; // 窗口内，不计数
  }

  // 首次或窗口过期，记录新窗口
  viewDedupStore.set(key, now + VIEW_WINDOW_MS);
  return true;
}

// POST /api/view - 递增浏览量
export async function POST(req: NextRequest) {
  try {
    // 第一层：通用 API 限速（30 次/分钟/IP）
    const rl = rateLimit(req, rateLimitPresets.general);
    if (!rl.success) {
      return errorResponse(new AppError("请求过于频繁", 429));
    }

    const body = await req.json();
    const { slug } = viewSchema.parse(body);

    // 第二层：IP + 文章去重（同一 IP 对同一文章 5 分钟内只计一次）
    const ip = getClientIP(req);
    if (!shouldCountView(ip, slug)) {
      // 重复请求，返回当前浏览量但不递增
      const result = await postService.getViewCount(slug);
      return successResponse(result);
    }

    const result = await postService.incrementViewCount(slug);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

// GET /api/view?slug=xxx - 获取当前浏览量
export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug");
    if (!slug) {
      return errorResponse(new AppError("缺少 slug 参数", 400));
    }

    const result = await postService.getViewCount(slug);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
