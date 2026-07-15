import { manualUpcomingWorks } from "../data/upcomingWorks";
import { upcomingTranslations } from "../data/upcomingTranslations";
import { searchDictionary } from "../data/searchDictionary";
import { getSupplementalUpcoming } from "./upcoming-sources";
import type { UpcomingWork, Work } from "./types";

const TMDB_API = "https://api.themoviedb.org/3";
const TVMAZE_API = "https://api.tvmaze.com";

type TmdbDetail = {
  status?: string;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function normalize(value = "") {
  return value.normalize("NFKC").toLowerCase().replace(/[\s・=\-.,:;!?"'()[\]{}~～＆&]/g, "");
}

/** 英語しか返さない取得元の作品名・概要・役名を、編集可能な辞書で日本語化します。 */
function localizeUpcoming(item: UpcomingWork): UpcomingWork {
  const candidates = [item.originalTitle, item.title].filter(Boolean) as string[];
  const translation = candidates.map((title) => upcomingTranslations[normalize(title)]).find(Boolean);
  if (!translation) return item;
  const originalTitle = item.originalTitle || (item.title !== translation.title ? item.title : undefined);
  return {
    ...item,
    title: translation.title,
    originalTitle,
    character: translation.character || item.character,
    overview: translation.overview || item.overview,
  };
}

function displayTitle(work: Work) {
  const source = work.title || work.name || work.original_title || work.original_name || "タイトル未登録";
  const original = work.original_title || work.original_name || source;
  return searchDictionary[normalize(original)] || searchDictionary[normalize(source)] || source;
}

function tmdbStatus(status?: string, hasFutureDate = false): UpcomingWork["status"] {
  if (status === "Rumored") return "rumored";
  if (["Planned", "Pilot"].includes(status || "")) return "planned";
  if (status === "In Production") return "filming";
  if (status === "Post Production") return "post-production";
  if (["Canceled", "Cancelled"].includes(status || "")) return "cancelled";
  return hasFutureDate ? "scheduled" : "unknown";
}

function isUnreleasedStatus(status?: string) {
  return ["Rumored", "Planned", "Pilot", "In Production", "Post Production", "Canceled", "Cancelled"].includes(status || "");
}

async function fetchTmdbDetail(work: Work, token: string): Promise<TmdbDetail | null> {
  try {
    const response = await fetch(`${TMDB_API}/${work.media_type}/${work.id}?language=ja-JP`, {
      headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
      next: { revalidate: 86400 },
    });
    return response.ok ? await response.json() as TmdbDetail : null;
  } catch {
    return null;
  }
}

/** WORKSから完全未公開作品を除外するため、未来日付または未公開状態のTMDBキーを返します。 */
export async function getUnreleasedTmdbKeys(works: Work[], token: string) {
  const today = todayIso();
  const candidates = works.filter((work) => {
    const date = work.release_date || work.first_air_date || "";
    return !date || date > today;
  });
  const keys = new Set<string>();
  const chunkSize = 20;

  for (let index = 0; index < candidates.length; index += chunkSize) {
    const chunk = candidates.slice(index, index + chunkSize);
    const details = await Promise.all(chunk.map(async (work) => ({ work, detail: await fetchTmdbDetail(work, token) })));
    for (const { work, detail } of details) {
      const date = detail?.release_date || detail?.first_air_date || work.release_date || work.first_air_date || "";
      if (date > today || (!date && isUnreleasedStatus(detail?.status))) keys.add(`${work.media_type}-${work.id}`);
    }
  }
  return keys;
}

async function getTmdbUpcoming(): Promise<UpcomingWork[]> {
  const token = process.env.TMDB_READ_TOKEN;
  if (!token) return [];
  try {
    const personResponse = await fetch(`${TMDB_API}/search/person?query=David%20Tennant&language=en-US`, {
      headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (!personResponse.ok) return [];
    const person = await personResponse.json() as { results?: Array<{ id: number; name: string }> };
    const personId = person.results?.find((item) => item.name === "David Tennant")?.id ?? person.results?.[0]?.id;
    if (!personId) return [];

    const creditsResponse = await fetch(`${TMDB_API}/person/${personId}/combined_credits?language=ja-JP`, {
      headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (!creditsResponse.ok) return [];
    const credits = await creditsResponse.json() as { cast?: Work[] };
    const unique = new Map<string, Work>();
    for (const work of credits.cast ?? []) {
      if (!work.id || !["movie", "tv"].includes(work.media_type)) continue;
      unique.set(`${work.media_type}-${work.id}`, work);
    }

    const today = todayIso();
    const candidates = [...unique.values()].filter((work) => {
      const date = work.release_date || work.first_air_date || "";
      return !date || date > today;
    });
    const result: UpcomingWork[] = [];
    const chunkSize = 20;
    for (let index = 0; index < candidates.length; index += chunkSize) {
      const chunk = candidates.slice(index, index + chunkSize);
      const rows = await Promise.all(chunk.map(async (work) => ({ work, detail: await fetchTmdbDetail(work, token) })));
      for (const { work, detail } of rows) {
        const releaseDate = detail?.release_date || detail?.first_air_date || work.release_date || work.first_air_date || "";
        const hasFutureDate = releaseDate > today;
        if (!hasFutureDate && !isUnreleasedStatus(detail?.status)) continue;
        const sourceTitle = detail?.title || detail?.name || work.title || work.name || "タイトル未登録";
        result.push({
          key: `tmdb-${work.media_type}-${work.id}`,
          kind: "work",
          mediaType: work.media_type,
          title: displayTitle({ ...work, title: detail?.title || work.title, name: detail?.name || work.name }),
          originalTitle: detail?.original_title || detail?.original_name || work.original_title || work.original_name || sourceTitle,
          character: work.character,
          overview: detail?.overview || work.overview,
          releaseDate: releaseDate || undefined,
          status: tmdbStatus(detail?.status, hasFutureDate),
          source: "TMDB",
          sourceUrl: `https://www.themoviedb.org/${work.media_type}/${work.id}`,
          confirmed: false,
          lastCheckedAt: today,
        });
      }
    }
    return result;
  } catch {
    return [];
  }
}

/** TVmazeから、公開日が未来または開発中のテレビ出演を補完します。 */
async function getTvmazeUpcoming(): Promise<UpcomingWork[]> {
  try {
    const searchResponse = await fetch(`${TVMAZE_API}/search/people?q=David%20Tennant`, { next: { revalidate: 86400 } });
    if (!searchResponse.ok) return [];
    const search = await searchResponse.json() as Array<{ person: { id: number; name: string } }>;
    const personId = search.find((item) => item.person.name === "David Tennant")?.person.id;
    if (!personId) return [];
    const creditsResponse = await fetch(`${TVMAZE_API}/people/${personId}/castcredits?embed[]=show&embed[]=character`, {
      next: { revalidate: 86400 },
    });
    if (!creditsResponse.ok) return [];
    const credits = await creditsResponse.json() as Array<{
      _embedded?: {
        show?: { id: number; name: string; premiered?: string; status?: string; summary?: string; url?: string };
        character?: { name?: string };
      };
    }>;
    const today = todayIso();
    return credits.flatMap(({ _embedded }) => {
      const show = _embedded?.show;
      if (!show) return [];
      const future = Boolean(show.premiered && show.premiered > today);
      const developing = ["In Development", "To Be Determined"].includes(show.status || "") && !show.premiered;
      if (!future && !developing) return [];
      return [{
        key: `tvmaze-tv-${show.id}`,
        kind: "work" as const,
        mediaType: "tv" as const,
        title: searchDictionary[normalize(show.name)] || show.name,
        originalTitle: show.name,
        character: _embedded?.character?.name,
        overview: show.summary?.replace(/<[^>]+>/g, ""),
        releaseDate: show.premiered,
        status: future ? "scheduled" as const : "planned" as const,
        source: "TVmaze" as const,
        sourceUrl: show.url,
        confirmed: false,
        lastCheckedAt: today,
      }];
    });
  } catch {
    return [];
  }
}

/** 自動取得と手入力を統合し、同名作品は信頼度の高い情報を優先します。 */
export async function getUpcomingWorks(): Promise<UpcomingWork[]> {
  const [tmdb, tvmaze, supplemental] = await Promise.all([
    getTmdbUpcoming(),
    getTvmazeUpcoming(),
    getSupplementalUpcoming(),
  ]);
  const merged = new Map<string, UpcomingWork>();
  for (const item of [...supplemental, ...tvmaze, ...tmdb, ...manualUpcomingWorks]) {
    // 同じ作品に公開日が未登録／後から登録された場合も、別カードに分裂させません。
    const identity = `${item.kind || "work"}-${item.mediaType}-${normalize(item.originalTitle || item.title)}`;
    const previous = merged.get(identity);
    merged.set(identity, previous ? { ...previous, ...item } : item);
  }
  return [...merged.values()].map(localizeUpcoming).sort((a, b) => {
    // 作品は公開予定日が近い順、確認待ちの発表は新着順に並べます。
    if ((a.kind || "work") !== (b.kind || "work")) return (a.kind || "work") === "work" ? -1 : 1;
    if ((a.kind || "work") === "announcement") {
      return (b.publishedDate || b.lastCheckedAt).localeCompare(a.publishedDate || a.lastCheckedAt);
    }
    if (!a.releaseDate && b.releaseDate) return 1;
    if (a.releaseDate && !b.releaseDate) return -1;
    return (a.releaseDate || "9999-99-99").localeCompare(b.releaseDate || "9999-99-99");
  });
}
