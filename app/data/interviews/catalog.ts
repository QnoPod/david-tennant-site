import type { InterviewSummary } from "./types";

/**
 * インタビュー一覧用の軽量カタログ。
 * 新しい記事を追加するときは、最初にこの配列へ基本情報を1件追加します。
 * 長い英語原文・日本語訳は transcripts/ に分けて保存してください。
 */
export const interviewCatalog: readonly InterviewSummary[] = [
  {
    slug: "bella-maclean-found-her-fire-in-rivals",
    title: "Bella Maclean Found Her Fire in 'Rivals'",
    year: "2026",
    publishedDate: "2026-07-10",
    source: "L'OFFICIEL USA",
    mediaType: "article",
    videoId: null,
    externalUrl: "https://www.lofficielusa.com/film-tv/bella-maclean-movies-and-tv-shows-rivals-season-2-release-cast",
    thumbnailUrl: "https://www.datocms-assets.com/39109/1783013189-l-officiel_usa_julaug26_watchlist_bella_web_11.jpg?auto=format&fit=max&w=1200",
    duration: "Article",
    description: "『Rivals』でタギーを演じるベラ・マクリーンが、撮影現場の熱量と、共演者デイヴィッド・テナントの勤勉さや明るさを語る。",
    tags: ["Rivals", "Article"],
  },
  {
    slug: "michael-sheen-david-tennant-one-final-time-lorraine",
    title: "Michael Sheen Is Teaming Up With David Tennant for One Final Time | Lorraine",
    year: "2026",
    publishedDate: "2026-03-02",
    source: "Lorraine",
    mediaType: "video",
    videoId: "G-VJL50HKRM",
    externalUrl: "https://www.youtube.com/watch?v=G-VJL50HKRM",
    thumbnailUrl: "https://i.ytimg.com/vi/G-VJL50HKRM/hqdefault.jpg",
    duration: "Video · 3:58〜",
    description: "マイケル・シーンが『Good Omens』での共演を経て、デイヴィッド・テナントとの信頼関係について語る。",
    tags: ["Michael Sheen"],
  },
  {
    slug: "michael-sheen-his-dark-materials-this-morning",
    title: "Michael Sheen Reveals Why ‘His Dark Materials’ Changed His Life | This Morning",
    year: "2025",
    publishedDate: "2025-10-20",
    source: "This Morning",
    mediaType: "video",
    videoId: "bqK9HOk5M-0",
    externalUrl: "https://www.youtube.com/watch?v=bqK9HOk5M-0",
    thumbnailUrl: "https://i.ytimg.com/vi/bqK9HOk5M-0/hqdefault.jpg",
    duration: "Video · 7:54〜",
    description: "マイケル・シーンが、友人デイヴィッド・テナントとの次の共演の可能性について語る。",
    tags: ["Michael Sheen", "This Morning"],
  },
  {
    slug: "david-tennant-fights-the-demon-of-imposter-syndrome",
    title: "David Tennant Fights the Demon of Imposter Syndrome",
    year: "2019",
    publishedDate: "2019-06-25",
    source: "Off Camera with Sam Jones",
    mediaType: "video",
    videoId: "3sBA0RWPAbY",
    externalUrl: "https://www.youtube.com/watch?v=3sBA0RWPAbY",
    thumbnailUrl: "https://i.ytimg.com/vi/3sBA0RWPAbY/hqdefault.jpg",
    duration: "Video",
    description: "恐怖心やインポスター症候群、舞台で頭の中に響く「悪魔の声」、経験を重ねることで得た向き合い方をデイヴィッドが語る。",
    tags: ["Acting"],
  },
  {
    slug: "nta-2015-special-recognition",
    title: "NTA 2015 Special Recognition",
    year: "2015",
    publishedDate: "2015-03-12",
    source: "National Television Awards",
    mediaType: "video",
    videoId: "Li_WIjv53pI",
    externalUrl: "https://www.youtube.com/watch?v=Li_WIjv53pI",
    thumbnailUrl: "https://i.ytimg.com/vi/Li_WIjv53pI/hqdefault.jpg",
    duration: "Video",
    description: "デイヴィッド・テナントへの特別表彰を知らせるサプライズ映像。",
    tags: ["Awards"],
  },
];

/** 公開年月日の新しい順に並べた一覧を返します。元データは変更しません。 */
export function getInterviewsNewestFirst() {
  return [...interviewCatalog].sort((a, b) => b.publishedDate.localeCompare(a.publishedDate));
}
