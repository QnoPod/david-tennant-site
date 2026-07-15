import type { UpcomingWork } from "../types";
import { getFeedUpcoming } from "./feeds";
import { getWikidataUpcoming } from "./wikidata";
import { getYouTubeUpcoming } from "./youtube";

/** TMDB・TVmaze以外の監視先を並列取得し、1つの候補一覧へ統合します。 */
export async function getSupplementalUpcoming(): Promise<UpcomingWork[]> {
  const [wikidata, youtube, feeds] = await Promise.all([
    getWikidataUpcoming(),
    getYouTubeUpcoming(),
    getFeedUpcoming(),
  ]);
  return [...wikidata, ...youtube, ...feeds];
}
