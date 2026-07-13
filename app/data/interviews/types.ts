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
  title: string;
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
};

/** 詳細ページで使う、基本情報と本文を合わせたデータ。 */
export type Interview = InterviewSummary & {
  transcript: readonly TranscriptLine[];
};

