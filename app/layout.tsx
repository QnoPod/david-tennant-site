import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// 🌟 Vercel Analytics をインポート
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "David Tennant 作品データベース",
  description: "デヴィッド・テナントの出演作品をまとめたサイトです",
  openGraph: {
    title: "David Tennant 作品データベース",
    description: "デヴィッド・テナントの出演作品をまとめたサイトです",
    url: "https://david-tennant-site.vercel.app",
    siteName: "David Tennant 作品データベース",
    images: [
      {
        url: "David-Tennant.png", // サイトのトップページの画像ファイル名
        width: 1200,
        height: 630,
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  verification: {
    google: "j5TwLvhKIVK51iHawcqyg__byU-AxUzXlKIfrXumvqg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja" // 🌟 サイトの言語を日本語(ja)に設定
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* 🌟 bodyの最後にAnalyticsを追加 */}
        <Analytics />
      </body>
    </html>
  );
}