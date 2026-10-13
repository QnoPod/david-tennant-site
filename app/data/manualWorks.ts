import type { Work } from "../lib/types";
import { selfCharacterDescription } from "./characterDetails";
import { episodeOverrides } from "./episodeOverrides";

/** 本人出演番組をWORKS詳細に表示するための共通データです。CHARACTERSには追加しません。 */
const selfAppearance = [{
  name: "本人",
  englishName: "Self",
  image: "/characters/self-icon.webp",
  description: selfCharacterDescription,
}];

/**
 * TMDBで取得できない映画・TV・舞台作品を手入力するファイルです。
 * この配列へ追加すると、WORKSとCHARACTERSの両ページへ自動的に反映されます。
 * 通常はTMDBと重複しない負の整数を使用してください。
 * 既存のTMDB作品を特定シーズンの出演情報で置き換える場合は、そのTMDB IDを指定できます。
 */
export const manualWorks: Work[] = [
  // TMDBの出演クレジットにない場合のみ表示する予備データ。
  // 役名・画像・説明は workCharacterOverrides.ts から取得します。
  {
    id: -1201,
    isManual: true,
    addOnlyIfMissing: true,
    media_type: "tv",
    name: "The Genius Game",
    original_name: "Genius Game",
    first_air_date: "2025-04-30",
    character: "The Creator",
    numberOfEpisodes: 8,
    episodeRunTime: 53,
    providers: [],
  },
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

  // TIME シリーズ3（2026年）：2021年開始のシリーズ本体とは出演年度を区別。
  // 正のIDはTMDBのシリーズID。ポスターと日本の配信情報はTMDBから取得。
  {
    id: 126116,
    isManual: true,
    media_type: "tv",
    name: "Time",
    original_name: "Time",
    manualTitle: "TIME シリーズ3",
    first_air_date: "2026-10-11",
    character: "Bobby Bailey",
    numberOfEpisodes: 3,
    episodeRunTime: 60,
    episodeAppearances: episodeOverrides["Time"],
    updatedAt: "2026-10-13",
  },

  // TMDBの出演クレジットにない場合だけ補う、本人出演のトーク・バラエティ番組です。
  {
    id: -1101,
    isManual: true,
    addOnlyIfMissing: true,
    excludeFromCharacters: true,
    media_type: "tv",
    name: "Have I Got News for You",
    original_name: "Have I Got News for You",
    first_air_date: "2015-10-30",
    overview: "英国のニュースを題材にしたパネル番組。デイヴィッド・テナントはゲスト司会として出演。",
    providers: [],
    manualCharacters: selfAppearance,
    episodeAppearances: episodeOverrides["Have I Got News for You"],
  },
  {
    id: -1102,
    isManual: true,
    addOnlyIfMissing: true,
    excludeFromCharacters: true,
    media_type: "tv",
    name: "The Graham Norton Show",
    original_name: "The Graham Norton Show",
    first_air_date: "2007-03-29",
    overview: "グラハム・ノートン司会のトーク番組。デイヴィッド・テナントは本人ゲストとして複数回出演。",
    providers: [],
    manualCharacters: selfAppearance,
    episodeAppearances: episodeOverrides["The Graham Norton Show"],
  },
  {
    id: -1103,
    isManual: true,
    addOnlyIfMissing: true,
    excludeFromCharacters: true,
    media_type: "tv",
    name: "The Last Leg",
    original_name: "The Last Leg",
    first_air_date: "2017-01-27",
    overview: "一週間のニュースを振り返る英国のコメディ・トーク番組。本人ゲストとして出演。",
    providers: [],
    manualCharacters: selfAppearance,
    episodeAppearances: episodeOverrides["The Last Leg"],
  },
  {
    id: -1104,
    isManual: true,
    addOnlyIfMissing: true,
    excludeFromCharacters: true,
    media_type: "tv",
    name: "The Jonathan Ross Show",
    original_name: "The Jonathan Ross Show",
    first_air_date: "2013-01-05",
    overview: "ジョナサン・ロス司会のトーク番組。デイヴィッド・テナントは本人ゲストとして出演。",
    providers: [],
    manualCharacters: selfAppearance,
    episodeAppearances: episodeOverrides["The Jonathan Ross Show"],
  },

  // 授賞式も本人出演番組としてWORKSに含めます。出演回と役割はepisodeOverrides.tsで管理します。
  {
    id: -1105,
    isManual: true,
    addOnlyIfMissing: true,
    excludeFromCharacters: true,
    media_type: "tv",
    name: "National Television Awards",
    original_name: "National Television Awards",
    first_air_date: "2015-01-21",
    overview: "英国のテレビ賞。2015年にデイヴィッド・テナントが特別表彰を受賞。",
    providers: [],
    manualCharacters: selfAppearance,
    episodeAppearances: episodeOverrides["National Television Awards"],
  },
  {
    id: -1106,
    isManual: true,
    addOnlyIfMissing: true,
    excludeFromCharacters: true,
    media_type: "tv",
    name: "The British Academy Film Awards",
    original_name: "The British Academy Film Awards",
    first_air_date: "2024-02-18",
    overview: "英国アカデミー賞の映画部門授賞式。デイヴィッド・テナントは2024年と2025年に司会を担当。",
    providers: [],
    manualCharacters: selfAppearance,
    episodeAppearances: episodeOverrides["The British Academy Film Awards"],
  },

  // 追加例：上の作品をコピーし、id・タイトル・公開日・役名などを書き換えてください。
];

/**
 * TMDB取得作品・手入力作品の両方へ追加するジャンルです。
 * TMDB上では映画扱いの舞台収録作品にも「舞台」タグを付けられます。
 */
export const workGenreOverrides: Record<string, string[]> = {
  "Don Juan in Soho": ["舞台","コメディ"],
  "Time": ["ドラマ"],
  "Macbeth": ["舞台"],
  "National Theatre Live: Good": ["舞台"],
  "Have I Got News for You": ["バラエティ"],
  "The Graham Norton Show": ["トーク番組"],
  "The Last Leg": ["トーク番組", "コメディ"],
  "The Jonathan Ross Show": ["トーク番組"],
  "National Television Awards": ["授賞式"],
  "The British Academy Film Awards": ["授賞式"],
  "EE BAFTA Film Awards": ["授賞式"],
};
