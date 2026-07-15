import type { Metadata } from "next";
import PageHero from "../components/PageHero";
import { pastConventionAppearances } from "../data/pastConventionAppearances";
import { getCharacters } from "../lib/characters";
import { getConventionAppearances } from "../lib/comiconomicon";
import { getWorks } from "../lib/tmdb";
import { buildTimelineEvents } from "../lib/timeline";
import TimelineExplorer from "./TimelineExplorer";

export const metadata: Metadata = { title: "統合年表" };

/** 既存の各アーカイブを読み込み、表示専用の軽量イベントへ変換します。 */
export default async function TimelinePage() {
  const [works, conventions] = await Promise.all([getWorks(), getConventionAppearances()]);
  const events = buildTimelineEvents(works, getCharacters(works), [...conventions, ...pastConventionAppearances]);
  return <main id="main-content" className="timeline-page">
    <PageHero eyebrow="LIFE · WORKS · WORDS · APPEARANCES" title="TIMELINE" description="活動を年代順に表示" />
    <TimelineExplorer events={events} />
  </main>;
}
