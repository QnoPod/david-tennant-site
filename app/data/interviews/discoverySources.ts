/** YouTubeで定期検索する語句。候補はすべて非公開で保存されます。 */
export const interviewYouTubeQueries = [
  '"David Tennant" interview',
  '"David Tennant" talks',
  '"David Tennant" Q&A',
  '"David Tennant" conversation',
  '"David Tennant" press junket',
  '"David Tennant" podcast',
] as const;

/**
 * 記事候補を取得するRSS。公式媒体のRSSを追加したい場合は、この配列へ追記します。
 * Google Newsは発見用途だけに使い、サイトには元記事へのリンクと独自の短い概要だけを保存します。
 */
export const interviewArticleFeeds = [
  {
    name: "Google News",
    url: "https://news.google.com/rss/search?q=%22David%20Tennant%22%20(interview%20OR%20%22Q%26A%22%20OR%20%22in%20conversation%22)&hl=en-GB&gl=GB&ceid=GB:en",
  },
] as const;

/** 自動タグ候補として判定する共演者名。デイヴィッド本人はactorsへ含めません。 */
export const interviewActorKeywords = [
  "Michael Sheen",
  "Catherine Tate",
  "Olivia Colman",
  "Jon Hamm",
  "Alex Hassell",
  "Ty Tennant",
  "Georgia Tennant",
  "Bella Maclean",
] as const;

/** 自動タグ候補として判定する関連作品名。 */
export const interviewWorkKeywords = [
  "Doctor Who",
  "Good Omens",
  "Broadchurch",
  "Rivals",
  "Staged",
  "Jessica Jones",
  "Macbeth",
  "Hamlet",
  "Around the World in 80 Days",
  "The Thursday Murder Club",
] as const;
