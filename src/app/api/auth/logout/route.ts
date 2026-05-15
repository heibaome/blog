import { clearAuthCookie, getTokenFromCookie, blacklistToken, getCurrentUser } from "@/shared/security";
import { clearCsrfCookie } from "@/lib/csrf";
import { successResponse } from "@/shared/errors";

export async function POST() {
  // 将当前 token 加入黑名单，使其立即失效
  const token = await getTokenFromCookie();
  if (token) {
    const user = await getCurrentUser();
    await blacklistToken(token, user?.id);
  }

  await clearAuthCookie();
  await clearCsrfCookie();
  return successResponse({ message: "已退出登录" });
}
