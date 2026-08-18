import autoConventionHistoryData from "../data/autoConventionHistory.json";
import type { ConventionAppearance } from "./types";

const SOURCE_URL = "https://comiconomicon.com/guest/490/David_Tennant";
const REVALIDATE_SECONDS = 21600;
const TODAY = new Date().toISOString().slice(0, 10);

const fallbackAppearances: ConventionAppearance[] = [
  {
    name: "Dragon Con",
    date: "3 - 7 Sep, 2026",
    venue: "Georgia World Congress Center Atlanta, GA",
    country: "アメリカ",
    organizer: "Dragon Con",
    status: "cancelled",
    statusNote: "デイヴィッド・テナントの出演キャンセルを確認済みです。",
    officialUrl: "https://www.dragoncon.org",
    sourceUrl: SOURCE_URL,
    updatedAt: "2026-08-18",
  },
  {
    name: "Lexington Comic & Toy Con - Fall",
    date: "4 - 6 Sep, 2026",
    venue: "Lexington Convention Center, Lexington, Kentucky, USA",
    country: "アメリカ",
    organizer: "Lexington Comic & Toy Con",
    status: "cancelled",
    statusNote: "デイヴィッド・テナントの出演キャンセルを確認済みです。",
    officialUrl: "https://lexingtoncomiccon.com",
    sourceUrl: SOURCE_URL,
    updatedAt: "2026-08-18",
  },
  {
    name: "Comic Con Northern Ireland",
    date: "19 - 20 Sep, 2026",
    venue: "Eikon Exhibition Centre, Lisburn, United Kingdom",
    country: "イギリス（北アイルランド）",
    organizer: "Monopoly Events",
    status: "cancelled",
    statusNote: "デイヴィッド・テナントの出演キャンセルを確認済みです。",
    officialUrl: "https://www.comicconnorthernireland.co.uk",
    sourceUrl: SOURCE_URL,
    updatedAt: "2026-08-18",
  },
  {
    name: "Comic Con Liverpool - October",
    date: "10 - 11 Oct, 2026",
    venue: "Exhibition Centre Liverpool, Liverpool, United Kingdom",
    country: "イギリス（イングランド）",
    organizer: "Monopoly Events",
    status: "cancelled",
    statusNote: "デイヴィッド・テナントの出演キャンセルを確認済みです。",
    officialUrl: "https://www.comicconventionliverpool.co.uk",
    sourceUrl: "https://www.rostercon.com/en/event-convention/comic-con-liverpool-october-2026",
    updatedAt: "2026-08-18",
  },
];

const automaticHistory =
  autoConventionHistoryData as ConventionAppearance[];

function canonicalEventName(value: string) {
  const cleaned = value
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();

  if (/^comic con liverpool\s*(?:[-–—]|\()\s*october\)?$/i.test(cleaned)) {
    return "Comic Con Liverpool - October";
  }

  return cleaned;
}

function normalizeEventName(value: string) {
  return canonicalEventName(value)
    .toLocaleLowerCase()
    .replace(/[()\[\]{}–—-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidEventName(value: string) {
  const normalized = normalizeEventName(value);
  return Boolean(normalized)
    && !/^(?:site|website|official site|official website)$/.test(normalized);
}

function eventKey(event: Pick<ConventionAppearance, "name" | "date">) {
  return `${normalizeEventName(event.name)}::${event.date}`;
}

const fallbackByKey = new Map(
  fallbackAppearances.map((event) => [eventKey(event), event]),
);
const historyByKey = new Map(
  automaticHistory.map((event) => [eventKey(event), event]),
);

/** 保存済みのキャンセル履歴と手動確認済み状態を、自動取得より優先します。 */
function applyKnownState(
  event: ConventionAppearance,
): ConventionAppearance {
  const key = eventKey(event);
  const saved = historyByKey.get(key);
  if (saved?.status === "cancelled") {
    return {
      ...event,
      ...saved,
      isAutoFetched: event.isAutoFetched,
    };
  }

  const fallback = fallbackByKey.get(key);
  if (fallback) {
    return {
      ...event,
      ...fallback,
      detailUrl: event.detailUrl || fallback.detailUrl,
      isAutoFetched: event.isAutoFetched,
    };
  }

  return event;
}

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

function inferOrganizer(name: string) {
  if (/Comic Con Northern Ireland|Comic Con Liverpool/i.test(name)) return "Monopoly Events";
  if (/Fan Expo|MEGACON/i.test(name)) return "FAN EXPO HQ";
  if (/New York Comic Con|Emerald City|MCM|Florida Supercon/i.test(name)) return "ReedPop";
  if (/Lexington/i.test(name)) return "Lexington Comic & Toy Con";
  return name.replace(/\s+\(?\d{4}\)?$/i, "");
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const cancellationPatterns = [
  /\bcancel(?:led|ed)\b/i,
  /\bno longer (?:able to )?(?:attend|appear|join)\b/i,
  /\bwill not (?:be able to )?(?:attend|appear|join)\b/i,
  /\bwill not be attending\b/i,
  /\bunable to (?:attend|appear|join)\b/i,
  /\bcannot (?:attend|appear|join)\b/i,
  /\bcan't (?:attend|appear|join)\b/i,
  /\bwithdrawn from\b/i,
];

/** チケット規約のcancel表記を避けるため、David Tennantの名前の前後だけを判定します。 */
function hasDavidTennantCancellation(html: string) {
  const text = decodeHtml(html);
  const lower = text.toLocaleLowerCase();
  const needle = "david tennant";
  let offset = 0;

  while (offset < lower.length) {
    const index = lower.indexOf(needle, offset);
    if (index < 0) break;

    const context = lower.slice(
      Math.max(0, index - 650),
      Math.min(lower.length, index + needle.length + 650),
    );

    if (cancellationPatterns.some((pattern) => pattern.test(context))) {
      return true;
    }
    offset = index + needle.length;
  }

  return false;
}

async function pageShowsCancellation(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "DavidTennantFanArchive/1.0 (+fan archive; read-only)",
        Accept: "text/html,text/plain;q=0.9,*/*;q=0.1",
      },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(6500),
    });
    if (!response.ok) return false;

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType && !/text\/(?:html|plain)/i.test(contentType)) return false;
    return hasDavidTennantCancellation(await response.text());
  } catch {
    return false;
  }
}

/** イベント詳細・公式ページを追加確認し、明示的なキャンセルだけを自動反映します。 */
async function reconcileConventionStatus(
  rawEvent: ConventionAppearance,
): Promise<ConventionAppearance> {
  const event = applyKnownState(rawEvent);
  if (event.status === "cancelled") return event;

  const urls = [
    event.detailUrl,
    event.officialUrl,
    event.sourceUrl !== SOURCE_URL ? event.sourceUrl : undefined,
  ].filter((value): value is string => Boolean(value));

  for (const url of [...new Set(urls)]) {
    if (await pageShowsCancellation(url)) {
      return {
        ...event,
        status: "cancelled",
        statusNote:
          "公式／掲載ページでデイヴィッド・テナントの出演キャンセル表記を自動検出しました。",
        updatedAt: TODAY,
      };
    }
  }

  return event;
}

function parseAppearances(html: string): ConventionAppearance[] {
  const eventsStart = html.search(/>\s*Events\s*</i);
  const rolesStart = html.search(/>\s*Roles\s*</i);
  if (eventsStart < 0 || rolesStart <= eventsStart) return [];
  const section = html.slice(eventsStart, rolesStart);
  const eventLinkPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const matches = [...section.matchAll(eventLinkPattern)].filter((match) => {
    const name = canonicalEventName(decodeHtml(match[2]));
    if (!isValidEventName(name)) return false;

    try {
      const url = new URL(match[1], SOURCE_URL);
      return /(?:^|\.)comiconomicon\.com$/i.test(url.hostname)
        && /\/(?:event|convention)\//i.test(url.pathname);
    } catch {
      return false;
    }
  });

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
      name: canonicalEventName(decodeHtml(match[2])),
      date,
      venue,
      country: inferCountry(venue),
      organizer: inferOrganizer(canonicalEventName(decodeHtml(match[2]))),
      status: "announced",
      statusNote: "出演発表に基づく参加予定です。開催前に変更される場合があります。",
      officialUrl: official ? new URL(official, SOURCE_URL).toString() : undefined,
      detailUrl: new URL(match[1], SOURCE_URL).toString(),
      sourceUrl: SOURCE_URL,
      isAutoFetched: true,
    };
  }).filter((event) => event.name);
}

export async function getConventionAppearances(): Promise<ConventionAppearance[]> {
  let events: ConventionAppearance[];

  try {
    const response = await fetch(SOURCE_URL, {
      headers: { "User-Agent": "DavidTennantFanArchive/1.0 (+fan archive; read-only)" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) throw new Error("Comiconomicon request failed");

    const parsed = parseAppearances(await response.text()).map(applyKnownState);
    if (!parsed.length) {
      events = fallbackAppearances.map(applyKnownState);
    } else {
      const parsedKeys = new Set(parsed.map(eventKey));
      events = [
        ...parsed,
        ...fallbackAppearances
          .filter((event) => !parsedKeys.has(eventKey(event)))
          .map(applyKnownState),
      ];
    }
  } catch {
    events = fallbackAppearances.map(applyKnownState);
  }

  return Promise.all(events.map(reconcileConventionStatus));
}

export { SOURCE_URL as COMICONOMICON_SOURCE_URL };
