import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
  // ↓ ここからOGPの設定を追加！
  openGraph: {
    title: "David Tennant 作品データベース",
    description: "デヴィッド・テナントの出演作品をまとめたサイトです",
    url: "https://david-tennant-site.vercel.app",
    siteName: "David Tennant 作品データベース",
    images: [
      {
        url: "https://david-tennant-site.vercel.app/David-Tennant.webp", // サイトのトップページの画像ファイル名
        width: 1200,
        height: 630,
      },
    ],
    locale: "ja_JP",
    type: "website",
  },

  // 👇 ここを追加
  twitter: {
    card: "summary_large_image",
    title: "David Tennant 作品データベース",
    description: "デヴィッド・テナントの出演作品をまとめたサイトです",
    images: ["https://david-tennant-site.vercel.app/David-Tennant.webp"],
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
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
