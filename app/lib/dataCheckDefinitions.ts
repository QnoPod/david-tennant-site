/** ブラウザとサーバーの両方から参照できる、データ不足項目の共通定義です。 */
export const DATA_CHECK_DEFINITIONS = {
  image: { label: "画像未設定", editFile: "public/works・public/characters / characterImages.ts" },
  japaneseTitle: { label: "邦題未設定", editFile: "searchDictionary.ts / manualWorks.ts" },
  overview: { label: "概要未設定", editFile: "overviews.ts / manualWorks.ts" },
  characterDetail: { label: "キャラクター詳細未設定", editFile: "characterDetails.ts / manualWorks.ts" },
  episodes: { label: "出演エピソード未確認", editFile: "episodeOverrides.ts / manualWorks.ts" },
  providers: { label: "日本の配信先未確認", editFile: "TMDB取得結果 / manualWorks.ts" },
} as const;

export type DataCheckKey = keyof typeof DATA_CHECK_DEFINITIONS;
