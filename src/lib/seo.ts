import type { Metadata } from "next";
import type { Locale } from "./i18n";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function buildMetadata({
  title,
  description,
  path = "",
  image,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
  siteName,
  locale = "zh-CN",
}: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  siteName?: string;
  locale?: Locale;
}): Metadata {
  const name = siteName || "墨迹博客";
  const fullTitle = title ? `${title} | ${name}` : name;
  const desc = description || "一个用心书写的博客";
  const url = `${SITE_URL}${path}`;
  const ogLocale = locale === "zh-CN" ? "zh_CN" : "en_US";

  return {
    title: fullTitle,
    description: desc,
    metadataBase: new URL(SITE_URL),
    openGraph: {
      title: fullTitle,
      description: desc,
      url,
      siteName: name,
      locale: ogLocale,
      type,
      images: [{ url: image || `${SITE_URL}/og-default.png` }],
      ...(type === "article" && publishedTime ? { publishedTime } : {}),
      ...(type === "article" && modifiedTime ? { modifiedTime } : {}),
      ...(type === "article" && authors ? { authors } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
      images: [image || `${SITE_URL}/og-default.png`],
    },
    alternates: {
      canonical: url,
    },
  };
}
