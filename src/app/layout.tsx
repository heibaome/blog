import type { Metadata } from "next";
import "@/styles/globals.css";
import { buildMetadata } from "@/lib/seo";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ReadingProvider } from "@/components/reading/ReadingProvider";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { ConditionalLayout } from "@/components/ConditionalLayout";
import { getServerLocale } from "@/lib/i18n-server";

export const metadata: Metadata = buildMetadata({});

const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('moji-theme');
    if (t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme:dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch(e) {}
})();
`;

const readingScript = `
(function(){
  try {
    var p = JSON.parse(localStorage.getItem('moji-reading-prefs') || '{}');
    var r = document.documentElement;
    if (p.fontSize) r.style.setProperty('--reading-font-size', p.fontSize+'px');
    if (p.lineHeight) r.style.setProperty('--reading-line-height', String(p.lineHeight));
    if (p.fontFamily) {
      var f = {serif:'"Source Han Serif SC","Noto Serif SC","Songti SC","SimSun",serif',sans:'"Source Han Sans SC","Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif',system:'system-ui,-apple-system,"Segoe UI",sans-serif'};
      r.style.setProperty('--reading-font-family', f[p.fontFamily] || f.serif);
    }
    if (p.contentWidth) r.style.setProperty('--reading-content-width', p.contentWidth+'px');
  } catch(e) {}
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: readingScript }} />
      </head>
      <body>
        <ThemeProvider>
          <ReadingProvider>
            <LocaleProvider>
              <ToastProvider />
              <ConditionalLayout>{children}</ConditionalLayout>
            </LocaleProvider>
          </ReadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
