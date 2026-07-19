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
 * 自動取得を許可する公式YouTubeチャンネル名です。
 * YouTube Data APIは認証バッジを返さないため、完全一致の許可リストで管理します。
 * 新しい公式媒体を追加するときは、YouTube上に表示されるチャンネル名を追記してください。
 */
export const officialInterviewYouTubeChannels = [
  "Absolute Radio",
  "Amazon Prime Video UK",
  "BAFTA",
  "BBC",
  "BBC Studios",
  "Capital FM",
  "Channel 4",
  "Channel 4 Entertainment",
  "Doctor Who",
  "Entertainment Weekly",
  "Heart",
  "ITV",
  "LADbible Entertainment",
  "LADbible TV",
  "Letterman",
  "Lorraine",
  "National Television Awards",
  "New York Comic Con",
  "NYCC",
  "Off Camera Show",
  "Prime Video",
  "Royal Shakespeare Company",
  "Showbiz Junkies",
  "The Criterion Collection",
  "The Graham Norton Show",
  "The Graham Norton Show - BBC",
  "The Kelly Clarkson Show",
  "The Late Late Show with James Corden",
  "The One Show",
  "This Morning",
  "TV Insider",
  "Vanity Fair",
  "Variety",
  "Vulture",
  "WIRED",
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
