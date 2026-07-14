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
  officialUrl?: string;
  detailUrl?: string;
  sourceUrl: string;
};
