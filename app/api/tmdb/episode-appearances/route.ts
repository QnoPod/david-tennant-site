import { NextRequest, NextResponse } from "next/server";
import { episodeOverrides } from "../../../data/episodeOverrides";
import type { EpisodeAppearance, EpisodeAppearanceResult } from "../../../lib/types";

const TMDB_API = "https://api.themoviedb.org/3";
const DAVID_TENNANT_TMDB_ID = 3786;
const REVALIDATE_SECONDS = 60 * 60 * 24 * 7;

type AggregateCastMember = { id: number; total_episode_count?: number };
type SeasonSummary = { season_number: number; episode_count?: number };
type Episode = {
  season_number: number;
  episode_number: number;
  name?: string;
  air_date?: string;
  guest_stars?: Array<{ id: number; character?: string }>;
};

/** 少数ずつ取得し、TMDBとVercelへ同時に大量の通信を発生させないようにします。 */
async function mapInChunks<T, R>(items: T[], size: number, mapper: (item: T) => Promise<R>) {
  const results: R[] = [];
  for (let index = 0; index < items.length; index += size) {
    results.push(...await Promise.all(items.slice(index, index + size).map(mapper)));
  }
  return results;
}

/**
 * 作品詳細を開いた時だけTMDBを照会します。
 * シリーズ出演数はaggregate credits、具体的な話数は各シーズンのguest_starsから取得します。
 */
export async function GET(request: NextRequest) {
  const seriesId = Number(request.nextUrl.searchParams.get("seriesId"));
  if (!Number.isInteger(seriesId) || seriesId <= 0) {
    return NextResponse.json({ error: "有効なseriesIdが必要です。" }, { status: 400 });
  }

  // 日本語名・原題など複数の候補を受け取り、手入力データを先に適用します。
  const titleCandidates = request.nextUrl.searchParams.getAll("title");
  const manual = titleCandidates.map((title) => episodeOverrides[title]).find(Boolean);
  if (manual?.length) {
    return NextResponse.json({ status: "exact", appearances: manual, episodeCount: manual.length } satisfies EpisodeAppearanceResult);
  }

  const token = process.env.TMDB_READ_TOKEN;
  if (!token) return NextResponse.json({ error: "TMDB_READ_TOKENが未設定です。" }, { status: 503 });

  const headers = { Authorization: `Bearer ${token}`, accept: "application/json" };
  const tmdbFetch = (path: string) => fetch(`${TMDB_API}${path}`, {
    headers,
    next: { revalidate: REVALIDATE_SECONDS },
  });

  try {
    const [aggregateResponse, detailResponse] = await Promise.all([
      tmdbFetch(`/tv/${seriesId}/aggregate_credits?language=ja-JP`),
      tmdbFetch(`/tv/${seriesId}?language=ja-JP`),
    ]);
    if (!aggregateResponse.ok || !detailResponse.ok) throw new Error("TMDB series request failed");

    const aggregate = await aggregateResponse.json() as { cast?: AggregateCastMember[] };
    const detail = await detailResponse.json() as { number_of_episodes?: number; seasons?: SeasonSummary[] };
    const david = aggregate.cast?.find((member) => member.id === DAVID_TENNANT_TMDB_ID);
    if (!david) {
      return NextResponse.json({ status: "not-found", appearances: [] } satisfies EpisodeAppearanceResult);
    }

    const episodeCount = david.total_episode_count ?? 0;
    if (episodeCount > 0 && episodeCount === detail.number_of_episodes) {
      return NextResponse.json({ status: "full-series", appearances: [], episodeCount } satisfies EpisodeAppearanceResult);
    }

    // スペシャル（season 0）も対象にし、話数が0のシーズンだけ除外します。
    const seasons = (detail.seasons ?? []).filter((season) => (season.episode_count ?? 0) > 0).slice(0, 30);
    const seasonEpisodes = await mapInChunks(seasons, 5, async (season) => {
      const response = await tmdbFetch(`/tv/${seriesId}/season/${season.season_number}?language=ja-JP`);
      if (!response.ok) return [] as Episode[];
      const data = await response.json() as { episodes?: Episode[] };
      return data.episodes ?? [];
    });

    const appearances: EpisodeAppearance[] = seasonEpisodes.flat().flatMap((episode) => {
      const credit = episode.guest_stars?.find((guest) => guest.id === DAVID_TENNANT_TMDB_ID);
      if (!credit) return [];
      return [{
        seasonNumber: episode.season_number,
        episodeNumber: episode.episode_number,
        title: episode.name,
        airDate: episode.air_date,
        character: credit.character,
      }];
    });

    if (appearances.length && appearances.length === episodeCount) {
      return NextResponse.json({ status: "exact", appearances, episodeCount } satisfies EpisodeAppearanceResult);
    }
    if (appearances.length) {
      return NextResponse.json({
        status: "partial",
        appearances,
        episodeCount,
        note: "TMDBで具体的な話数を確認できた出演回だけを表示しています。",
      } satisfies EpisodeAppearanceResult);
    }
    return NextResponse.json({
      status: "count-only",
      appearances: [],
      episodeCount,
      note: "TMDBでは出演話数の集計のみ確認できました。具体的な話数は手入力で補足できます。",
    } satisfies EpisodeAppearanceResult);
  } catch {
    return NextResponse.json({ error: "TMDBから出演エピソードを取得できませんでした。" }, { status: 502 });
  }
}
