import type { ConventionAppearance } from "./types";

const SOURCE_URL = "https://comiconomicon.com/guest/490/David_Tennant";

const fallbackAppearances: ConventionAppearance[] = [
  { name: "Dragon Con", date: "3 - 7 Sep, 2026", venue: "Georgia World Congress Center Atlanta, GA", country: "アメリカ", organizer: "Dragon Con", status: "announced", statusNote: "出演発表に基づく参加予定です。開催前に変更される場合があります。", officialUrl: "https://www.dragoncon.org", sourceUrl: SOURCE_URL },
  { name: "Lexington Comic & Toy Con - Fall", date: "4 - 6 Sep, 2026", venue: "Lexington Convention Center, Lexington, Kentucky, USA", country: "アメリカ", organizer: "Lexington Comic & Toy Con", status: "announced", statusNote: "出演発表に基づく参加予定です。開催前に変更される場合があります。", officialUrl: "https://lexingtoncomiccon.com", sourceUrl: SOURCE_URL },
  { name: "Comic Con Northern Ireland", date: "19 - 20 Sep, 2026", venue: "Eikon Exhibition Centre, Lisburn, United Kingdom", country: "イギリス（北アイルランド）", organizer: "Monopoly Events", status: "announced", statusNote: "出演発表に基づく参加予定です。開催前に変更される場合があります。", officialUrl: "https://www.comicconnorthernireland.co.uk", sourceUrl: SOURCE_URL },
  { name: "Comic Con Liverpool - October", date: "10 - 11 Oct, 2026", venue: "Exhibition Centre Liverpool, Liverpool, United Kingdom", country: "イギリス（イングランド）", organizer: "Monopoly Events", status: "announced", statusNote: "出演発表に基づく参加予定です。開催前に変更される場合があります。", officialUrl: "https://www.comicconventionliverpool.co.uk", sourceUrl: "https://www.rostercon.com/en/event-convention/comic-con-liverpool-october-2026" },
];

/** 自動取得した会場表記から、画面に表示する開催国を補完します。 */
function inferCountry(venue: string) {
  if (/Lisburn|Belfast|Northern Ireland/i.test(venue)) return "イギリス（北アイルランド）";
  if (/United Kingdom|England|London|Liverpool/i.test(venue)) return "イギリス";
  if (/Netherlands|Utrecht|Amsterdam/i.test(venue)) return "オランダ";
  if (/Germany|Dortmund|Goch/i.test(venue)) return "ドイツ";
  if (/Belgium|Ghent/i.test(venue)) return "ベルギー";
  if (/Canada|Edmonton|Montreal/i.test(venue)) return "カナダ";
  if (/USA|United States|\b[A-Z]{2}\b/i.test(venue)) return "アメリカ";
  return "国情報は公式サイトで確認";
}

/** 自動取得分でも同じ主催のイベントをまとめて検索できるよう、名称から主催ブランドを補完します。 */
function inferOrganizer(name: string) {
  if (/Comic Con Northern Ireland|Comic Con Liverpool/i.test(name)) return "Monopoly Events";
  if (/Fan Expo|MEGACON/i.test(name)) return "FAN EXPO HQ";
  if (/New York Comic Con|Emerald City|MCM|Florida Supercon/i.test(name)) return "ReedPop";
  if (/Lexington/i.test(name)) return "Lexington Comic & Toy Con";
  return name.replace(/\s+\(?\d{4}\)?$/i, "");
}

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

  return matches.map<ConventionAppearance>((match, index) => {
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
      country: inferCountry(venue),
      organizer: inferOrganizer(decodeHtml(match[2])),
      status: "announced",
      statusNote: "出演発表に基づく参加予定です。開催前に変更される場合があります。",
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
    if (!parsed.length) return fallbackAppearances;

    // 取得元ごとに掲載タイミングが異なるため、確認済みの補完予定も重複なく併合します。
    const parsedNames = new Set(parsed.map((event) => event.name.toLocaleLowerCase()));
    return [
      ...parsed,
      ...fallbackAppearances.filter((event) => !parsedNames.has(event.name.toLocaleLowerCase())),
    ];
  } catch {
    return fallbackAppearances;
  }
}

export { SOURCE_URL as COMICONOMICON_SOURCE_URL };
