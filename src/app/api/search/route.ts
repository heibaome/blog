import { NextRequest, NextResponse } from "next/server";
import { searchService } from "@/modules/search/service";
import { errorResponse, successResponse } from "@/shared/errors";
import { rateLimit, rateLimitPresets } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  try {
    // 速率限制：1分钟内最多30次搜索
    const rl = rateLimit(req, rateLimitPresets.general);
    if (!rl.success) {
      return NextResponse.json(
        { error: "搜索过于频繁，请稍后再试" },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    const query = req.nextUrl.searchParams.get("q") || "";
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");
    const results = await searchService.search(query, Math.min(limit, 50));
    return successResponse(results);
  } catch (error) {
    return errorResponse(error);
  }
}
