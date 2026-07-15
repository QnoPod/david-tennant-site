import type { UpcomingWork } from "../types";
import { todayIso, UPCOMING_REVALIDATE_SECONDS } from "./shared";

type Binding = {
  work?: { value: string };
  workLabel?: { value: string };
  date?: { value: string };
  typeLabel?: { value: string };
};

function mediaType(label = ""): UpcomingWork["mediaType"] {
  const normalized = label.toLowerCase();
  if (normalized.includes("film")) return "movie";
  if (normalized.includes("television") || normalized.includes("series") || normalized.includes("episode")) return "tv";
  if (normalized.includes("play") || normalized.includes("theatre")) return "stage";
  return "other";
}

/** Wikidataの出演者・公開日から、未来日付が登録された作品を取得します。 */
export async function getWikidataUpcoming(): Promise<UpcomingWork[]> {
  try {
    const personResponse = await fetch(
      "https://www.wikidata.org/w/api.php?action=wbsearchentities&search=David%20Tennant&language=en&format=json&origin=*",
      { next: { revalidate: UPCOMING_REVALIDATE_SECONDS } },
    );
    if (!personResponse.ok) return [];
    const person = await personResponse.json() as { search?: Array<{ id: string; label: string }> };
    const personId = person.search?.find((item) => item.label === "David Tennant")?.id;
    if (!personId) return [];

    const query = `
      SELECT DISTINCT ?work ?workLabel ?date ?typeLabel WHERE {
        ?work wdt:P161 wd:${personId}; wdt:P577 ?date.
        FILTER(?date >= NOW())
        OPTIONAL { ?work wdt:P31 ?type. }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "ja,en". }
      }
      ORDER BY ?date
      LIMIT 50
    `;
    const response = await fetch(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`, {
      headers: { Accept: "application/sparql-results+json" },
      next: { revalidate: UPCOMING_REVALIDATE_SECONDS },
    });
    if (!response.ok) return [];
    const data = await response.json() as { results?: { bindings?: Binding[] } };
    const checkedAt = todayIso();
    return (data.results?.bindings ?? []).flatMap((binding) => {
      if (!binding.work?.value || !binding.workLabel?.value || !binding.date?.value) return [];
      const releaseDate = binding.date.value.slice(0, 10);
      return [{
        key: `wikidata-${binding.work.value.split("/").pop()}`,
        kind: "work" as const,
        mediaType: mediaType(binding.typeLabel?.value),
        title: binding.workLabel.value,
        releaseDate,
        status: "scheduled" as const,
        source: "Wikidata",
        sourceUrl: binding.work.value,
        confirmed: false,
        lastCheckedAt: checkedAt,
      }];
    });
  } catch {
    return [];
  }
}
