/** インタビューのタグを、役者・ジャンル・配信元に分けて管理します。 */
export type InterviewTagGroups = {
  actors: readonly string[];
  genres: readonly string[];
  sources: readonly string[];
};

/** カード表示・本文検索で3分類のタグをまとめて扱うための共通関数です。 */
export function getAllInterviewTags(tagGroups: InterviewTagGroups): readonly string[] {
  return [...tagGroups.actors, ...tagGroups.genres, ...tagGroups.sources];
}

/** インタビュー一覧で使う、本文を含まない軽量な基本情報。 */
export type InterviewSummary = {
  slug: string;
  /** 一覧・詳細の主見出しとして表示する日本語タイトル。 */
  title: string;
  /** 元動画・記事の英語タイトル。日本語見出しの直下に併記します。 */
  titleEn?: string;
  year: string;
  /** YYYY-MM-DD。インタビュー一覧の並び順に使います。 */
  publishedDate: string;
  source: string;
  mediaType: "video" | "article";
  videoId: string | null;
  externalUrl: string;
  thumbnailUrl: string;
  duration: string;
  description: string;
  tagGroups: InterviewTagGroups;
};

/** 英語原文と日本語訳を1組にした本文データ。 */
export type TranscriptLine = {
  speakerEn: string;
  speakerJa: string;
  en: string;
  ja: string;
  /**
   * 動画内でこの発言が始まる時刻。"01:23" または "1:02:03" 形式で入力します。
   * 記事、または時刻未確認の発言では省略できます。
   */
  timestamp?: string;
};

/** 詳細ページで使う、基本情報と本文を合わせたデータ。 */
export type Interview = InterviewSummary & {
  transcript: readonly TranscriptLine[];
};
