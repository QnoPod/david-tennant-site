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
  manualTitle?: string;
  posterUrl?: string;
  backdropUrl?: string;
  manualCharacters?: WorkCharacter[];
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
  /** 作品公開・初回放送年月日と生年月日から算出した満年齢。 */
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
