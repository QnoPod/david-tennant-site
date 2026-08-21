import type { StreamingExpiration, Work } from "./types";

const API_BASE = "https://api.movieofthenight.com/v4";
const REVALIDATE_SECONDS = 60 * 60 * 6;
const MAX_PAGES = 40;

const DIRECT_EXPIRATION_SOURCES = [
  { titles: ["Staged", "ステージド"], url: "https://www.justwatch.com/jp/テレビ番組/staged" },
  {
    titles: ["What We Did on Our Holiday", "海賊じいちゃんの贈りもの", "海賊じいちゃんの贈り物"],
    url: "https://www.justwatch.com/jp/映画/what-we-did-on-our-holiday",
  },
] as const;

type ApiChange = {
  changeType?: string;
  itemType?: string;
  showId?: string;
  streamingOptionType?: string;
  timestamp?: number;
  link?: string;
  service?: { id?: string; name?: string };
  addon?: { id?: string; name?: string };
};
type ChangesResponse = {
  changes?: ApiChange[];
  shows?: Record<string, { tmdbId?: string }>;
  hasMore?: boolean;
  nextCursor?: string;
};

function normalizeTitle(title: string) {
  return title.normalize("NFKC").toLowerCase().replace(/[\s・:：!！?？'’"“”\-]/g, "");
}

function expiryKey(item: StreamingExpiration) {
  return [item.serviceId ?? "service", item.providerName, item.expiresOn ?? "unknown"].join("::");
}

function japanDate(timestamp?: number) {
  if (!timestamp) return undefined;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(timestamp * 1000));
}

function isEndingSoon(expiresOn?: string) {
  if (!expiresOn) return true;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit",
  });
  const today = formatter.format(new Date());
  const limit = new Date(`${today}T00:00:00+09:00`);
  limit.setDate(limit.getDate() + 31);
  return expiresOn >= today && expiresOn <= formatter.format(limit);
}

function providerName(name: string) {
  if (/BS10|STAR CHANNEL/i.test(name)) return "BS10プレミアム for Prime Video";
  if (/U-?NEXT/i.test(name)) return "U-NEXT";
  if (/Amazon Prime Video/i.test(name)) return "Prime Video";
  return name;
}

export function parseDirectExpirations(html: string): StreamingExpiration[] {
  const results: StreamingExpiration[] = [];
  const pattern = /"Offer:[^"]+":\{"id":"[^"]+"[\s\S]*?"monetizationType":"FLATRATE"[\s\S]*?"package":\{[^}]*?"id":"(Package:[^"]+)"[^}]*\}[\s\S]*?"standardWebURL":"([^"]+)"[\s\S]*?"availableTo":"(\d{4}-\d{2}-\d{2})"/g;
  for (const match of html.matchAll(pattern)) {
    const [, packageRef, rawLink, expiresOn] = match;
    const escaped = packageRef.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rawName = html.match(new RegExp(`"${escaped}":\\{[\\s\\S]*?"clearName":"([^"]+)"`))?.[1];
    if (!rawName || !isEndingSoon(expiresOn)) continue;
    const item = {
      providerName: providerName(rawName), serviceId: packageRef, expiresOn,
      link: rawLink.replace(/\\u002F/gi, "/").replace(/\\u0026/gi, "&"),
    };
    if (!results.some((current) => expiryKey(current) === expiryKey(item))) results.push(item);
  }
  return results;
}

async function directExpirations() {
  return Promise.all(DIRECT_EXPIRATION_SOURCES.map(async (source) => {
    try {
      const response = await fetch(source.url, {
        headers: { Accept: "text/html", "User-Agent": "Mozilla/5.0 (compatible; DavidTennantArchive/1.0)" },
        next: { revalidate: REVALIDATE_SECONDS }, signal: AbortSignal.timeout(8000),
      });
      return [source.titles, response.ok ? parseDirectExpirations(await response.text()) : []] as const;
    } catch { return [source.titles, []] as const; }
  }));
}

async function apiExpirations(apiKey: string) {
  const result = new Map<string, StreamingExpiration[]>();
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = new URL(`${API_BASE}/changes`);
    url.searchParams.set("country", "jp");
    url.searchParams.set("change_type", "expiring");
    url.searchParams.set("item_type", "show");
    url.searchParams.set("include_unknown_dates", "true");
    url.searchParams.set("order_direction", "asc");
    if (cursor) url.searchParams.set("cursor", cursor);
    const response = await fetch(url, {
      headers: { "X-API-Key": apiKey, Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS }, signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Streaming Availability API failed: ${response.status}`);
    const data = await response.json() as ChangesResponse;
    for (const change of data.changes ?? []) {
      if (change.streamingOptionType && !["subscription", "addon"].includes(change.streamingOptionType)) continue;
      const tmdbId = change.showId ? data.shows?.[change.showId]?.tmdbId : undefined;
      const name = providerName((change.addon?.name || change.service?.name || "").trim());
      if (!tmdbId || !name) continue;
      const item = { providerName: name, serviceId: change.addon?.id || change.service?.id, expiresOn: japanDate(change.timestamp), link: change.link };
      const items = result.get(tmdbId) ?? [];
      if (!items.some((current) => expiryKey(current) === expiryKey(item))) items.push(item);
      result.set(tmdbId, items);
    }
    if (!data.hasMore || !data.nextCursor) break;
    cursor = data.nextCursor;
  }
  return result;
}

export async function applyStreamingExpirations(works: Work[]): Promise<Work[]> {
  const apiKey = process.env.STREAMING_AVAILABILITY_API_KEY;
  const [api, direct] = await Promise.all([
    apiKey ? apiExpirations(apiKey).catch(() => new Map<string, StreamingExpiration[]>()) : new Map<string, StreamingExpiration[]>(),
    directExpirations(),
  ]);
  return works.map((work) => {
    const items = [...(api.get(String(work.id)) ?? [])];
    const titles = [work.title, work.name, work.original_title, work.original_name].filter((v): v is string => Boolean(v)).map(normalizeTitle);
    for (const [sourceTitles, sourceItems] of direct) {
      if (!sourceTitles.some((title) => titles.includes(normalizeTitle(title)))) continue;
      for (const item of sourceItems) if (!items.some((current) => expiryKey(current) === expiryKey(item))) items.push(item);
    }
    items.sort((a, b) => (a.expiresOn ?? "9999").localeCompare(b.expiresOn ?? "9999"));
    return items.length ? { ...work, streamingExpirations: items } : { ...work, streamingExpirations: undefined };
  });
}
