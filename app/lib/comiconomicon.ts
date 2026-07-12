import type { ConventionAppearance } from "./types";

const SOURCE_URL = "https://comiconomicon.com/guest/490/David_Tennant";

const fallbackAppearances: ConventionAppearance[] = [
  { name: "Dragon Con", date: "3 - 7 Sep, 2026", venue: "Georgia World Congress Center Atlanta, GA", officialUrl: "https://www.dragoncon.org", detailUrl: "https://comiconomicon.com", sourceUrl: SOURCE_URL },
  { name: "Lexington Comic & Toy Con - Fall", date: "4 - 6 Sep, 2026", venue: "Lexington Convention Center, Lexington, Kentucky, USA", officialUrl: "https://lexingtoncomiccon.com", detailUrl: "https://comiconomicon.com", sourceUrl: SOURCE_URL },
  { name: "Comic Con Northern Ireland", date: "19 - 20 Sep, 2026", venue: "Eikon Exhibition Centre, Lisburn, United Kingdom", officialUrl: "https://www.comicconnorthernireland.co.uk", detailUrl: "https://comiconomicon.com", sourceUrl: SOURCE_URL },
];

function decodeHtml(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * ComiconomiconのDavid Tennantページの「Events」部分だけを抽出します。
 * 取得失敗時は最終確認済みデータを表示し、ページ自体が壊れないようにしています。
 */
function parseAppearances(html: string): ConventionAppearance[] {
  const eventsStart = html.search(/>\s*Events\s*</i);
  const rolesStart = html.search(/>\s*Roles\s*</i);
  if (eventsStart < 0 || rolesStart <= eventsStart) return [];
  const section = html.slice(eventsStart, rolesStart);
  const eventLinkPattern = /<a[^>]+href=["']([^"']*(?:event|convention)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const matches = [...section.matchAll(eventLinkPattern)];

  return matches.map((match, index) => {
    const blockEnd = matches[index + 1]?.index ?? section.length;
    const block = section.slice((match.index ?? 0) + match[0].length, blockEnd);
    const text = decodeHtml(block);
    const dateMatch = text.match(/\d{1,2}(?:\s*-\s*\d{1,2})?\s+[A-Z][a-z]{2},\s+\d{4}/);
    const date = dateMatch?.[0] ?? "日程は公式サイトで確認してください";
    const afterDate = dateMatch ? text.slice((dateMatch.index ?? 0) + date.length) : text;
    const venue = afterDate.replace(/show on map.*$/i, "").trim() || "会場情報は公式サイトで確認してください";
    const official = [...block.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>\s*site\s*<\/a>/gi)][0]?.[1];
    return {
      name: decodeHtml(match[2]), date, venue,
      officialUrl: official ? new URL(official, SOURCE_URL).toString() : undefined,
      detailUrl: new URL(match[1], SOURCE_URL).toString(), sourceUrl: SOURCE_URL,
    };
  // 件数を制限せず、取得元に掲載されている現在の参加予定をすべて返します。
  }).filter((event) => event.name);
}

export async function getConventionAppearances(): Promise<ConventionAppearance[]> {
  try {
    const response = await fetch(SOURCE_URL, {
      headers: { "User-Agent": "DavidTennantFanArchive/1.0 (+fan archive; read-only)" },
      next: { revalidate: 21600 },
    });
    if (!response.ok) throw new Error("Comiconomicon request failed");
    const parsed = parseAppearances(await response.text());
    return parsed.length ? parsed : fallbackAppearances;
  } catch {
    return fallbackAppearances;
  }
}

export { SOURCE_URL as COMICONOMICON_SOURCE_URL };
