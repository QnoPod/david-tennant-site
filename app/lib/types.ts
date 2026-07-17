/** アーカイブ全体で共有するデータ型。 */
export type Work = {
  id: number;
  media_type: "movie" | "tv" | "stage";
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  character?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  popularity?: number;
  /** 日本向け定額配信サービス。TMDBのwatch/providersから取得します。 */
  providers?: Array<{ provider_id: number; provider_name: string; logo_path?: string | null }>;
  genres?: Array<{ id: number; name: string }>;
  runtime?: number | null;
  numberOfSeasons?: number | null;
  numberOfEpisodes?: number | null;
  episodeRunTime?: number | null;
  videoKey?: string | null;
  /** TMDBにない作品をdata/manualWorks.tsから追加した場合に使用します。 */
  isManual?: boolean;
  /** 同名のTMDB作品がある場合は追加せず、TMDB側の作品情報を優先します。 */
  addOnlyIfMissing?: boolean;
  /** 本人出演番組など、CHARACTERSの役柄一覧へは追加しない作品に使用します。 */
  excludeFromCharacters?: boolean;
  manualTitle?: string;
  posterUrl?: string;
  backdropUrl?: string;
  manualCharacters?: WorkCharacter[];
  /** 特定の回だけに出演する場合のエピソード情報。手入力作品でも使用できます。 */
  episodeAppearances?: EpisodeAppearance[];
  /** 作品・配信・出演回情報を最後に確認した日（YYYY-MM-DD）。 */
  updatedAt?: string;
};

/** 公開前・制作中の出演情報。公開済みのWORKSとは分けて扱います。 */
export type UpcomingWork = {
  /** TMDB等の取得元とIDを組み合わせた重複しないキー。 */
  key: string;
  /** 作品情報か、ニュース・動画から検出した確認待ちの発表かを区別します。 */
  kind?: "work" | "announcement";
  mediaType: "movie" | "tv" | "stage" | "other";
  title: string;
  originalTitle?: string;
  character?: string;
  overview?: string;
  releaseDate?: string;
  /** 記事・動画が公開された日。作品自体の公開日とは分けて管理します。 */
  publishedDate?: string;
  status: "rumored" | "planned" | "filming" | "post-production" | "scheduled" | "unknown" | "cancelled";
  source: string;
  sourceUrl?: string;
  /** 公式発表を確認済みの場合だけtrueにします。 */
  confirmed?: boolean;
  /** 作品情報が前回保存時から変わった日。新規追加時にも設定します。 */
  updatedAt?: string;
  /** 内容変更を最後に確認した日。取得結果が同じ場合は更新しません。 */
  lastCheckedAt: string;
};

/** TVシリーズ内でデイヴィッド・テナントが出演した1エピソード。 */
export type EpisodeAppearance = {
  seasonNumber: number;
  episodeNumber: number;
  /** 授賞式など、通常のS/E表記を持たない番組で使う表示名（例: 第77回）。 */
  displayLabel?: string;
  title?: string;
  originalTitle?: string;
  airDate?: string;
  character?: string;
};

/** TMDBの出演エピソード照会結果。 */
export type EpisodeAppearanceResult = {
  status: "exact" | "partial" | "count-only" | "full-series" | "not-found";
  appearances: EpisodeAppearance[];
  episodeCount?: number;
  note?: string;
};

export type WorkCharacter = {
  name: string;
  englishName: string;
  image: string;
  description: string;
  attributes?: string[];
};

export type Character = {
  key: string;
  /** WORKSの視聴済み情報と照合する、紐づいたTMDB／手入力作品ID。 */
  workIds: number[];
  /** 出演回の放送日。月日不明の場合は作品公開日または空文字です。 */
  date: string;
  workTitle: string;
  displayWorkTitle: string;
  name: string;
  englishName: string;
  description: string;
  image: string;
  year: string;
  /** 出演エピソードの放送日（不明時は作品公開日）と生年月日から算出した満年齢。 */
  age: number | null;
  attributes: string[];
};

export type ConventionAppearance = {
  name: string;
  date: string;
  venue: string;
  /** 開催国。地域差が重要な場合は「イギリス（ウェールズ）」のように記載します。 */
  country: string;
  /** イベントを運営する主催者または主催ブランド。 */
  organizer: string;
  /** 本人の参加日がイベント全体の日程と異なる場合に使用するISO日付。 */
  appearanceDate?: string;
  /** 複数日参加など、画面に表示する本人参加日の説明。 */
  appearanceLabel?: string;
  /** 過去イベントでは「参加確認済み」などの状態を明示します。 */
  status?: "upcoming" | "attended" | "announced" | "cancelled";
  /** 出演発表のみ・キャンセル理由など、状態の補足説明です。 */
  statusNote?: string;
  isHistorical?: boolean;
  officialUrl?: string;
  /** イベント専用の記録ページ。存在を確認できた場合だけ設定します。 */
  detailUrl?: string;
  /** detailUrlが実在する専用ページであることを確認済みかどうか。 */
  recordUrlVerified?: boolean;
  sourceUrl: string;
  /** Comiconomiconから定期取得できた項目だけ、画面に掲載元を表示します。 */
  isAutoFetched?: boolean;
  /** 参加予定・状態・日程などの内容が最後に変更された日。定期確認だけでは更新しません。 */
  updatedAt?: string;
};
