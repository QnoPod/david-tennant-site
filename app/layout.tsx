import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";
import ScrollButtons from "./components/ScrollButtons";
import ReadabilitySettings from "./components/ReadabilitySettings";
import "./globals.css";
import "./mobile-fixes.css";

/**
 * 全ページ共通のレイアウト。
 * ヘッダー、本文、フッターをここで一度だけ定義します。
 */
export const metadata: Metadata = {
  metadataBase: new URL("https://david-tennant-site.vercel.app"),
  title: {
    default: "David Tennant Archive",
    template: "%s | David Tennant Archive",
  },
  description:
    "デイヴィッド・テナントの出演作品、キャラクター、コミコン参加情報、インタビューをまとめた非公式ファンアーカイブ。",
  applicationName: "David Tennant Archive",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "/",
    siteName: "David Tennant Archive",
    title: "David Tennant Archive",
    description:
      "デイヴィッド・テナントの出演作品、キャラクター、コミコン参加情報、インタビューをまとめた非公式ファンアーカイブ。",
    images: [{
      url: "/opengraph-image",
      width: 1200,
      height: 630,
      alt: "David Tennant Archive",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "David Tennant Archive",
    description:
      "デイヴィッド・テナントの出演作品、キャラクター、コミコン参加情報、インタビューをまとめた非公式ファンアーカイブ。",
    images: ["/opengraph-image"],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DT Archive",
  },
  formatDetection: { telephone: false },
  other: { "codex-preview": "development" },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }, { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

/** ブラウザ上部とホーム画面起動時の配色をサイトのネイビーに揃えます。 */
export const viewport: Viewport = { themeColor: "#111116" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <a className="skip-link" href="#main-content">本文へ移動</a>
        <SiteHeader />
        {children}
        <SiteFooter />
        <ReadabilitySettings />
        <ScrollButtons />
        {/* Vercel本番環境のページ閲覧数・訪問者数を計測します。 */}
        <Analytics />
      </body>
    </html>
  );
}
