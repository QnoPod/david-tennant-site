/** RSS、公式ページ、YouTubeを追加・削除するための監視先一覧です。 */
export const personKeywords = [
  "David Tennant",
  "デイヴィッド・テナント",
  // 日本語媒体でよく使われる表記揺れも同一人物として扱います。
  "デヴィッド・テナント",
  "デビッド・テナント",
];

/** 原題・邦題・シーズン表記の違いを、同じ作品として横断照合するための別名一覧です。 */
export const upcomingTitleAliasGroups = [
  [
    "Time",
    "タイム",
    "TIME シリーズ3",
    "Time Season 3",
    "Time Series 3",
    // 公式記事から作品名を抽出できず、役名だけが見出しに残った場合の照合語です。
    "Prison Officer Bailey",
    "刑務官ベイリー",
  ],
  [
    "The Joy of Sex",
    "Joy of Sex",
    // 既に保存された長い記事見出しも、次回の自動更新時に同じ作品へ整理します。
    "David Tennant Officially Starring In New Adaptation Based On Scandalous 54-Year-Old Bestselling Novel",
    "デヴィッド・テナント、54年前に出版され物議を醸したベストセラー小説を原作とする新作ドラマに正式に主演することが決定",
  ],
] as const;

/** 過去記事や通常のインタビューを除外し、出演・制作発表らしい情報だけを残します。 */
export const announcementKeywords = [
  "cast", "casting", "joins", "join", "stars", "starring", "to star", "returns", "returning",
  "announced", "announcement", "commissioned", "greenlit", "new series", "new film", "season",
  "production", "filming", "shooting", "trailer", "first look", "first image", "coming soon",
  "release date", "出演", "キャスト", "出演決定", "新作", "新シリーズ", "制作", "撮影",
  "初公開", "公開予定", "放送予定", "予告編",
];

/**
 * RSSを公開しているニュース媒体の監視先です。
 * ScreenRantは制作元の公式発表サイトではありませんが、独立したニュース取得元として扱います。
 */
export const rssSources = [
  {
    name: "BBC Entertainment & Arts",
    url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",
  },
  { name: "Deadline", url: "https://deadline.com/feed/" },
  { name: "Variety", url: "https://variety.com/feed/" },
  { name: "ScreenRant Movie News", url: "https://screenrant.com/feed/movie-news/" },
  { name: "ScreenRant TV News", url: "https://screenrant.com/feed/tv-news/" },
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
