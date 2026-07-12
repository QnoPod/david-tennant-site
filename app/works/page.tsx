import type { Metadata } from "next";
import PageHero from "../components/PageHero";
import { getEnrichedWorks } from "../lib/tmdb";
import WorksExplorer from "./WorksExplorer";

export const metadata: Metadata = { title: "出演作品" };

/** TMDBへの通信はサーバー側で1度だけ行い、ブラウザには必要な一覧だけを渡します。 */
export default async function WorksPage() {
  const works = await getEnrichedWorks();
  return <main id="main-content"><PageHero eyebrow="FILMOGRAPHY" title="WORKS" description="映画、テレビ、舞台、声の出演。公開年や役名から作品を探せます。" /><WorksExplorer works={works} /></main>;
}
