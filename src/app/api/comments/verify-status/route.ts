import { getVerifiedEmail } from "@/lib/email-session";
import { successResponse } from "@/shared/errors";

// GET /api/comments/verify-status - 检查当前会话是否已通过邮箱验证
export async function GET() {
  const email = await getVerifiedEmail();
  return successResponse({ verified: !!email, email: email || null });
}
