import type { Metadata } from "next";
import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";
import ScrollButtons from "./components/ScrollButtons";
import "./globals.css";

/**
 * 全ページ共通のレイアウト。
 * ヘッダー、本文、フッターをここで一度だけ定義します。
 */
export const metadata: Metadata = {
  title: {
    default: "David Tennant Archive",
    template: "%s | David Tennant Archive",
  },
  description:
    "デイヴィッド・テナントの出演作品、キャラクター、コミコン参加情報、インタビューをまとめた非公式ファンアーカイブ。",
  other: { "codex-preview": "development" },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <a className="skip-link" href="#main-content">本文へ移動</a>
        <SiteHeader />
        {children}
        <SiteFooter />
        <ScrollButtons />
      </body>
    </html>
  );
}
