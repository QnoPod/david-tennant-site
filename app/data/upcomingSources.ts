/** RSS、公式ページ、YouTubeを追加・削除するための監視先一覧です。 */
export const personKeywords = ["David Tennant", "デイヴィッド・テナント"];

/** 過去記事や通常のインタビューを除外し、出演・制作発表らしい情報だけを残します。 */
export const announcementKeywords = [
  "cast", "casting", "joins", "join", "stars", "starring", "to star", "returns", "returning",
  "announced", "announcement", "new series", "new film", "season", "production", "filming",
  "shooting", "trailer", "first look", "coming soon", "release date", "出演", "キャスト",
  "新作", "新シリーズ", "制作", "撮影", "公開予定", "放送予定", "予告編",
];

export const rssSources = [
  {
    name: "BBC Entertainment & Arts",
    url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",
  },
  { name: "Deadline", url: "https://deadline.com/feed/" },
  { name: "Variety", url: "https://variety.com/feed/" },
];

export type OfficialPageSource = {
  name: string;
  url: string;
  /** 一覧ページから辿ってよい記事URLのパス。外部サイトへは移動しません。 */
  articlePathPatterns: string[];
  /** 1回の確認で本文を読む記事数。アクセス集中を防ぐため小さく保ちます。 */
  maxArticles?: number;
};

/**
 * RSSのない公式サイトはニュース一覧ページのリンク文字を監視します。
 * サイト構造が変わった場合はURLをここで直せます。
 */
export const officialPageSources: OfficialPageSource[] = [
  { name: "BBC Media Centre", url: "https://www.bbc.co.uk/mediacentre/latestnews", articlePathPatterns: ["/mediacentre/"], maxArticles: 14 },
  { name: "ITV Press Centre", url: "https://www.itv.com/presscentre/", articlePathPatterns: ["/presscentre/media-releases/", "/presscentre/press-releases/"], maxArticles: 14 },
  { name: "BritBox Media Room", url: "https://press.britbox.com/", articlePathPatterns: ["/post/"], maxArticles: 14 },
  { name: "Netflix Tudum", url: "https://www.netflix.com/tudum/topics/news", articlePathPatterns: ["/tudum/articles/", "/tudum/features/"], maxArticles: 12 },
  { name: "Disney+ Press", url: "https://press.disneyplus.com/news", articlePathPatterns: ["/news/"], maxArticles: 12 },
  { name: "Royal Shakespeare Company", url: "https://www.rsc.org.uk/news", articlePathPatterns: ["/news/"], maxArticles: 12 },
  { name: "Big Finish", url: "https://www.bigfinish.com/news", articlePathPatterns: ["/news/v/"], maxArticles: 14 },
  { name: "Doctor Who Official", url: "https://www.doctorwho.tv/news-and-features", articlePathPatterns: ["/news-and-features/"], maxArticles: 14 },
];

/** YouTube検索結果を、信頼できる公式チャンネル名に限定します。 */
export const officialYouTubeChannels = [
  "BBC", "BBC America", "BAFTA", "ITV", "Royal Shakespeare Company", "National Theatre",
  "Netflix", "Prime Video", "Disney Plus", "Disney+", "Marvel Entertainment",
];
