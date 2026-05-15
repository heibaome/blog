import { NextResponse } from "next/server";
import { DISCLAIMER_COOKIE, createDisclaimerToken } from "@/shared/site-secret";
import { DISCLAIMER_CLIENT_COOKIE } from "@/shared/constants";

/**
 * 免责声明接受接口
 * 支持两种调用方式：
 * 1. 表单 POST（原 /disclaimer 页面的 form action）
 * 2. AJAX POST（DisclaimerModal 组件调用）
 */
export async function POST(request: Request) {
  const token = await createDisclaimerToken();

  // 判断是否为 AJAX 请求
  const isAjax = request.headers.get("x-requested-with") === "XMLHttpRequest";

  if (isAjax) {
    // AJAX 请求：返回 JSON，cookie 由 Set-Cookie 头设置
    const response = NextResponse.json({ success: true });

    response.cookies.set(DISCLAIMER_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    response.cookies.set(DISCLAIMER_CLIENT_COOKIE, "1", {
      httpOnly: false,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  }

  // 表单 POST：保持原有重定向行为（兼容 /disclaimer 页面）
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost";
  const origin = `${proto}://${host}`;

  const response = NextResponse.redirect(new URL("/", origin), 302);

  response.cookies.set(DISCLAIMER_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  response.cookies.set(DISCLAIMER_CLIENT_COOKIE, "1", {
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
