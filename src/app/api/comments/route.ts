import { NextRequest, NextResponse } from "next/server";
import { commentService } from "@/modules/comment/service";
import { createCommentSchema, paginationSchema } from "@/shared/types";
import { errorResponse, successResponse, AppError } from "@/shared/errors";
import { getCurrentUser, requireAuth } from "@/shared/security";
import { rateLimit, rateLimitPresets, getClientIP } from "@/lib/ratelimit";
import { verifyCaptcha } from "@/lib/captcha";
import { getVerifiedEmail } from "@/lib/email-session";
import { checkSensitiveContent, checkRestrictedContent } from "@/lib/content-filter";

// GET /api/comments?postId=xxx - 获取文章评论（公开）
// GET /api/comments?all=true&page=1&pageSize=20&status=pending&search=xxx&filterPostId=xxx - 后台获取所有评论（需登录）
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const postId = sp.get("postId");
    const all = sp.get("all");

    if (postId) {
      const comments = await commentService.getPostComments(postId);
      return successResponse(comments);
    }

    if (all) {
      // 后台查看所有评论需要登录
      await requireAuth();
      const params = paginationSchema.parse(Object.fromEntries(sp));
      const status = sp.get("status") || undefined;
      const search = sp.get("search") || undefined;
      const filterPostId = sp.get("filterPostId") || undefined;
      const result = await commentService.getAllComments({
        ...params,
        status,
        search,
        postId: filterPostId,
      });
      return successResponse(result);
    }

    return errorResponse(new AppError("缺少参数"));
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/comments - 创建评论
export async function POST(req: NextRequest) {
  try {
    // 速率限制：1分钟内最多5条评论
    const ip = getClientIP(req);
    const rl = rateLimit(req, { ...rateLimitPresets.comment, keyFn: () => "comment:" + ip });
    if (!rl.success) {
      return NextResponse.json(
        { error: "评论过于频繁，请稍后再试" },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    const user = await getCurrentUser();
    const body = await req.json();

    // 匿名用户必须通过验证码 + 邮箱验证
    if (!user) {
      // 图形验证码（每次必须）
      if (!body.captchaToken || !body.captchaAnswer) {
        return errorResponse(new AppError("请输入验证码"));
      }
      if (!(await verifyCaptcha(body.captchaToken, body.captchaAnswer))) {
        return errorResponse(new AppError("验证码错误或已过期"));
      }

      // 邮箱验证：检查 cookie 会话（邮箱格式和域名由 createCommentSchema 校验）
      if (!body.authorEmail) {
        return errorResponse(new AppError("匿名评论需要提供邮箱"));
      }
      const sessionEmail = await getVerifiedEmail();
      if (!sessionEmail || sessionEmail !== body.authorEmail.toLowerCase().trim()) {
        return errorResponse(new AppError("请先验证邮箱"));
      }
    }

    // 内容审核：敏感词（所有人）
    const contentCheck = checkSensitiveContent(body.content || "");
    if (!contentCheck.passed) {
      return errorResponse(new AppError(contentCheck.reason || "评论包含不当内容"));
    }
    const nameCheck = checkSensitiveContent(body.authorName || "");
    if (!nameCheck.passed) {
      return errorResponse(new AppError("昵称包含不当内容"));
    }

    // 内容审核：链接、手机号、社交媒体（管理员豁免）
    if (user?.role !== "admin") {
      const restrictedCheck = checkRestrictedContent(body.content || "");
      if (!restrictedCheck.passed) {
        return errorResponse(new AppError(restrictedCheck.reason || "评论包含不允许的内容"));
      }
      const restrictedNameCheck = checkRestrictedContent(body.authorName || "");
      if (!restrictedNameCheck.passed) {
        return errorResponse(new AppError("昵称包含不允许的内容"));
      }
    }

    const input = createCommentSchema.parse(body);
    const comment = await commentService.createComment(input, user?.id, ip || undefined, user?.role);
    return successResponse(comment, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
