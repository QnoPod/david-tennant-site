import type { MetadataRoute } from "next";

/** スマートフォンのホーム画面へ追加する際のアプリ情報です。 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "David Tennant Archive",
    short_name: "DT Archive",
    description: "デイヴィッド・テナントの出演作品・キャラクター・インタビューをまとめた非公式ファンアーカイブ。",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fffef9",
    theme_color: "#111116",
    lang: "ja",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
