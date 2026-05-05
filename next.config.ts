import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // 不允许远程图片优化（防 SSRF）。文章图片仅使用本地 /uploads/ 路径。
    // 如需加载外部图片，请在此添加具体域名：{ protocol: "https", hostname: "example.com" }
    remotePatterns: [],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "/api/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;
