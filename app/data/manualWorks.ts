import type { Work } from "../lib/types";

/**
 * TMDBで取得できない映画・TV・舞台作品を手入力するファイルです。
 * この配列へ追加すると、WORKSとCHARACTERSの両ページへ自動的に反映されます。
 * idはTMDBと重複しない負の整数を使用してください。
 */
export const manualWorks: Work[] = [
  {
    id: -1001,
    isManual: true,
    media_type: "stage",
    title: "Don Juan in Soho",
    original_title: "Don Juan in Soho",
    manualTitle: "ドン・ジュアン・イン・ソーホー",
    release_date: "2017-03-28",
    character: "Don Juan",
    posterUrl: "/works/Don Juan in SOHO.webp",
    backdropUrl: "/works/Don Juan in SOHO_2.jpg",
    providers: [],
  },

  // 追加例：上の作品をコピーし、id・タイトル・公開日・役名などを書き換えてください。
];

/**
 * TMDB取得作品・手入力作品の両方へ追加するジャンルです。
 * TMDB上では映画扱いの舞台収録作品にも「舞台」タグを付けられます。
 */
export const workGenreOverrides: Record<string, string[]> = {
  "Don Juan in Soho": ["舞台","コメディ"],
  "Macbeth": ["舞台"],
  "National Theatre Live: Good": ["舞台"],
};
