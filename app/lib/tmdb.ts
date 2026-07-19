import { manualWorks, workGenreOverrides } from "../data/manualWorks";
import { workImageOverrides } from "../data/workImages";
import type { Work } from "./types";

const TMDB_API = "https://api.themoviedb.org/3";
const API_HEADERS = (token: string) => ({ Authorization: `Bearer ${token}`, accept: "application/json" });

/** APIが一時的に利用できない場合にも一覧を空にしないための軽量な予備データ。 */
const fallbackWorks: Work[] = [
  { id: 249231, media_type: "tv", name: "Rivals", first_air_date: "2024-10-18", character: "Tony Baddingham", overview: "1980年代の英国テレビ業界を舞台にしたドラマ。" },
  { id: 241855, media_type: "tv", name: "Doctor Who: 60th Anniversary Specials", first_air_date: "2023-11-25", character: "The Doctor", overview: "ドクター・フー60周年を記念したスペシャル。" },
  { id: 90669, media_type: "tv", name: "Around the World in 80 Days", first_air_date: "2021-12-05", character: "Phileas Fogg", overview: "80日間で世界一周に挑む冒険ドラマ。" },
  { id: 87739, media_type: "tv", name: "The Des", first_air_date: "2020-09-14", character: "Dennis Nilsen", overview: "実在の事件をもとにした犯罪ドラマ。" },
  { id: 71915, media_type: "tv", name: "Good Omens", first_air_date: "2019-05-31", character: "Crowley", overview: "天使と悪魔が世界の終わりを止めようとする物語。" },
  { id: 38472, media_type: "tv", name: "Jessica Jones", first_air_date: "2015-11-20", character: "Kilgrave", overview: "私立探偵ジェシカ・ジョーンズを描くマーベル作品。" },
  { id: 1427, media_type: "tv", name: "Broadchurch", first_air_date: "2013-03-04", character: "Alec Hardy", overview: "海辺の町で起きた事件を追う英国ミステリー。" },
  { id: 57243, media_type: "tv", name: "Doctor Who", first_air_date: "2005-03-26", character: "The Doctor", overview: "時空を旅するドクターの冒険を描くSFドラマ。" },
  { id: 674, media_type: "movie", title: "Harry Potter and the Goblet of Fire", release_date: "2005-11-16", character: "Barty Crouch Jr.", overview: "三大魔法学校対抗試合をめぐるシリーズ第4作。" },
];

/** 作品名に対応する手入力ジャンルを、重複しないよう追加します。 */
function applyGenreOverrides(work: Work): Work {
  const titles = [work.title, work.name, work.original_title, work.original_name].filter((title): title is string => Boolean(title));
  const additions = titles.flatMap((title) => workGenreOverrides[title] ?? []);
  if (!additions.length) return work;
  const genres = [...(work.genres ?? [])];
  for (const name of additions) {
    if (!genres.some((genre) => genre.name === name)) genres.push({ id: -1000 - genres.length, name });
  }
  return { ...work, genres };
}

/** 原題・邦題のどちらかに一致するローカル作品画像を適用します。 */
function applyImageOverrides(work: Work): Work {
  const titles = [work.title, work.name, work.original_title, work.original_name]
    .filter((title): title is string => Boolean(title));
  const override = titles.map((title) => workImageOverrides[title]).find(Boolean);
  return override ? { ...work, ...override } : work;
}

/**
 * TMDBの日本語名・原題・予備データで表記が異なっても、
 * 2023年の60周年特別編は14代目ドクター役として統一します。
 * 取得直後に補正することで、WORKS・CHARACTERS・検索・年表で同じ役名を使えます。
 */
function applyCharacterOverrides(work: Work): Work {
  const titles = [work.title, work.name, work.original_title, work.original_name]
    .filter((title): title is string => Boolean(title))
    .map((title) => title.normalize("NFKC").toLowerCase().replace(/[\s・:=\-]/g, ""));
  const isFourteenthDoctorSpecial = work.id === 241855 || titles.some((title) =>
    title.includes("doctorwho60thanniversaryspecials")
    || title.includes("doctorwhochildreninneedspecial2023")
    || title.includes("ドクターフー60周年スペシャル")
    || title.includes("ドクターフーチルドレンインニードスペシャル2023"),
  );

  return isFourteenthDoctorSpecial ? { ...work, character: "14th Doctor" } : work;
}

/** TMDB作品と手入力作品を統合し、ジャンル上書き後に公開日の新しい順に並べます。 */
function withManualWorks(works: Work[]) {
  const merged = new Map(works.map((work) => [`${work.media_type}-${work.id}`, work]));
  for (const work of manualWorks) {
    // トーク番組などはTMDBに同名作品がある時だけそちらを優先し、二重表示を防ぎます。
    const manualTitles = [work.title, work.name, work.original_title, work.original_name]
      .filter((title): title is string => Boolean(title))
      .map((title) => title.normalize("NFKC").toLowerCase().replace(/\s+/g, ""));
    const alreadyExists = work.addOnlyIfMissing && [...merged.values()].some((item) =>
      [item.title, item.name, item.original_title, item.original_name]
        .filter((title): title is string => Boolean(title))
        .some((title) => manualTitles.includes(title.normalize("NFKC").toLowerCase().replace(/\s+/g, ""))),
    );
    if (!alreadyExists) merged.set(`${work.media_type}-${work.id}`, work);
  }
  return [...merged.values()]
    .map(applyImageOverrides)
    .map(applyCharacterOverrides)
    .map(applyGenreOverrides)
    .sort((a, b) => getWorkDate(b).localeCompare(getWorkDate(a)));
}

/**
 * TMDBから出演作品を1回だけ取得します。
 * 一覧・キャラクター画面ではこの軽量データだけを利用します。
 */
export async function getWorks(): Promise<Work[]> {
  const token = process.env.TMDB_READ_TOKEN;
  if (!token) return withManualWorks(fallbackWorks);

  try {
    const searchResponse = await fetch(`${TMDB_API}/search/person?query=David%20Tennant&language=ja-JP`, {
      headers: API_HEADERS(token),
      next: { revalidate: 86400 },
    });
    if (!searchResponse.ok) throw new Error("TMDB person search failed");
    const search = await searchResponse.json() as { results?: Array<{ id: number }> };
    const personId = search.results?.[0]?.id;
    if (!personId) return withManualWorks(fallbackWorks);

    const creditsResponse = await fetch(`${TMDB_API}/person/${personId}/combined_credits?language=ja-JP`, {
      headers: API_HEADERS(token),
      next: { revalidate: 86400 },
    });
    if (!creditsResponse.ok) throw new Error("TMDB credits request failed");
    const credits = await creditsResponse.json() as { cast?: Work[] };

    const unique = new Map<string, Work>();
    for (const work of credits.cast ?? []) {
      if (!work.id || !["movie", "tv"].includes(work.media_type)) continue;
      const key = `${work.media_type}-${work.id}`;
      if (!unique.has(key)) unique.set(key, work);
    }
    return withManualWorks([...unique.values()]);
  } catch {
    return withManualWorks(fallbackWorks);
  }
}

/** 旧サイトで手動追加していた日本向け配信サービスを維持します。 */
function addManualProviders(title: string, providers: Work["providers"] = []) {
  const result = [...providers];
  if (title === "Doctor Who: 60th Anniversary Specials") {
    result.push({ provider_id: 337, provider_name: "Disney Plus", logo_path: "/97yvRBw1GzX7fXprcF80er19ot.jpg" });
  }
  if (title === "Good Omens - Season 3: An Ineffable Goodbye") {
    result.push({ provider_id: 119, provider_name: "Amazon Prime Video", logo_path: "/pvske1MyAoymrs5bguRfVqYiM9a.jpg" });
  }
  return result.filter((provider, index, list) => list.findIndex((item) => item.provider_id === provider.provider_id) === index);
}

/**
 * WORKS画面で必要なジャンル、上映時間、予告編、日本向け配信情報を追加します。
 * TMDBのappend_to_responseを使って1作品1通信にまとめ、結果を24時間キャッシュします。
 */
export async function getEnrichedWorks(): Promise<Work[]> {
  const works = await getWorks();
  const token = process.env.TMDB_READ_TOKEN;
  if (!token) return works;

  const enriched: Work[] = [];
  const chunkSize = 24;
  for (let index = 0; index < works.length; index += chunkSize) {
    const chunk = works.slice(index, index + chunkSize);
    const results = await Promise.all(chunk.map(async (work) => {
      if (work.isManual) return work;
      try {
        const response = await fetch(
          `${TMDB_API}/${work.media_type}/${work.id}?language=ja-JP&append_to_response=videos,watch/providers`,
          { headers: API_HEADERS(token), next: { revalidate: 86400 } },
        );
        if (!response.ok) return work;
        const detail = await response.json() as {
          genres?: Work["genres"];
          runtime?: number;
          number_of_seasons?: number;
          number_of_episodes?: number;
          episode_run_time?: number[];
          videos?: { results?: Array<{ site?: string; type?: string; key?: string }> };
          "watch/providers"?: { results?: { JP?: { flatrate?: Work["providers"] } } };
        };
        const providers = detail["watch/providers"]?.results?.JP?.flatrate ?? [];
        return applyGenreOverrides({
          ...work,
          genres: detail.genres ?? [],
          runtime: detail.runtime ?? null,
          numberOfSeasons: detail.number_of_seasons ?? null,
          numberOfEpisodes: detail.number_of_episodes ?? null,
          episodeRunTime: detail.episode_run_time?.[0] ?? null,
          videoKey: detail.videos?.results?.find((video) => video.site === "YouTube" && video.type === "Trailer")?.key ?? null,
          providers: addManualProviders(getWorkTitle(work), providers),
        } satisfies Work);
      } catch {
        return work;
      }
    }));
    enriched.push(...results);
  }
  return enriched;
}

export function getWorkTitle(work: Work) {
  return work.title || work.name || work.original_title || work.original_name || "タイトル未登録";
}

export function getWorkDate(work: Work) {
  return work.release_date || work.first_air_date || "0000-00-00";
}

export function getPosterUrl(path?: string | null, manualUrl?: string) {
  if (manualUrl) return manualUrl;
  return path ? `https://image.tmdb.org/t/p/w342${path}` : "/images/default-character.jpg";
}

export function getBackdropUrl(path?: string | null, manualUrl?: string) {
  if (manualUrl) return manualUrl;
  return path ? `https://image.tmdb.org/t/p/w780${path}` : "";
}

export function getMediaLabel(type: Work["media_type"]) {
  return type === "movie" ? "MOVIE" : type === "tv" ? "TV" : "STAGE";
}

export function getProviderLogo(path?: string | null) {
  return path ? `https://image.tmdb.org/t/p/w92${path}` : "";
}
