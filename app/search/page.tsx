import type { Metadata } from "next";
import { Suspense } from "react";
import PageHero from "../components/PageHero";
import { pastConventionAppearances } from "../data/pastConventionAppearances";
import { getPublishedInterviews } from "../data/interviews/catalog";
import { getCharacters } from "../lib/characters";
import { getConventionAppearances } from "../lib/comiconomicon";
import { buildGlobalSearchItems } from "../lib/globalSearch";
import { getEnrichedWorks } from "../lib/tmdb";
import { getUpcomingWorks } from "../lib/upcoming";
import SearchExplorer from "./SearchExplorer";

export const metadata: Metadata = { title: "サイト内検索" };

export default async function SearchPage() {
  const [works, upcoming, liveConventions] = await Promise.all([getEnrichedWorks(), getUpcomingWorks(), getConventionAppearances()]);
  const items = buildGlobalSearchItems({
    works,
    characters: getCharacters(works),
    interviews: getPublishedInterviews(),
    conventions: [...liveConventions, ...pastConventionAppearances],
    upcoming,
  });
  return <main id="main-content"><PageHero eyebrow="SEARCH ALL ARCHIVES" title="SEARCH" description="作品、キャラクター、インタビュー、コミコン、今後の予定をまとめて検索" /><Suspense fallback={null}><SearchExplorer items={items} /></Suspense></main>;
}
