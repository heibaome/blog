import { NextResponse } from "next/server";
import { createCaptcha } from "@/lib/captcha";

export async function GET() {
  const { token, svg } = await createCaptcha();
  // 返回 JSON，包含 token 和 base64 编码的 SVG
  const base64 = Buffer.from(svg).toString("base64");
  return NextResponse.json({
    token,
    svg: "data:image/svg+xml;base64," + base64,
  });
}
