import streamingAvailability from "../data/generated/streamingAvailability.json";
import type { StreamingExpiration, Work } from "./types";

const API_BASE = "https://api.movieofthenight.com/v4";
const REVALIDATE_SECONDS = 60 * 60 * 6;
const MAX_PAGES = 40;

/**
 * Streaming Availability APIで拾えない国内サービス／Prime Videoチャンネルを補完します。
 * JustWatchの作品ページには、各配信サービスの公式作品URLと配信期限が埋め込まれています。
 * 作品を追加する場合は英題・邦題とJustWatchの日本向け作品ページだけを登録します。
 */
const DIRECT_EXPIRATION_SOURCES = [
  {
    titles: ["Staged", "ステージド"],
    url: "https://www.justwatch.com/jp/テレビ番組/staged",
  },
  {
    titles: ["What We Did on Our Holiday", "海賊じいちゃんの贈りもの", "海賊じいちゃんの贈り物"],
    url: "https://www.justwatch.com/jp/映画/what-we-did-on-our-holiday",
  },
] as const;

type ApiService = { id?: string; name?: string };
type ApiAddon = { id?: string; name?: string };
type ApiChange = {
  changeType?: string;
  itemType?: string;
  showId?: string;
  streamingOptionType?: string;
  timestamp?: number;
  link?: string;
  service?: ApiService;
  addon?: ApiAddon;
};
type ApiShow = { tmdbId?: string };
type ChangesResponse = {
  changes?: ApiChange[];
  shows?: Record<string, ApiShow>;
  hasMore?: boolean;
  nextCursor?: string;
};
type StoredAvailability = {
  tmdbId: string;
  providerName: string;
  active: boolean;
  changedOn?: string;
  eventTimestamp?: number;
  expiresOn?: string;
  link?: string;
  source?: string;
};

const storedAvailabilityItems = (streamingAvailability.items ?? []) as StoredAvailability[];

function formatJapanDate(timestamp?: number) {
  if (!timestamp) return undefined;
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp * 1000));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return values.year && values.month && values.day
    ? `${values.year}-${values.month}-${values.day}`
    : undefined;
}

function expiryKey(item: StreamingExpiration) {
  return [item.serviceId ?? "service", item.providerName, item.expiresOn ?? "unknown"].join("::");
}

function normalizeTitle(title: string) {
  return title.normalize("NFKC").toLowerCase().replace(/[\s・:：!！?？'’"“”\-]/g, "");
}

function normalizeTmdbId(value?: string | number) {
  const normalized = String(value ?? "").trim();
  return normalized.includes("/") ? normalized.split("/").pop() ?? normalized : normalized;
}

function isEndingSoon(expiresOn?: string) {
  if (!expiresOn) return true;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const today = formatter.format(new Date());
  const limit = new Date(`${today}T00:00:00+09:00`);
  limit.setDate(limit.getDate() + 31);
  return expiresOn >= today && expiresOn <= formatter.format(limit);
}

function decodeEmbeddedUrl(value: string) {
  return value.replace(/\\u002F/gi, "/").replace(/\\u0026/gi, "&");
}

function canonicalProviderName(name: string) {
  if (/BS10|STAR CHANNEL/i.test(name)) return "BS10プレミアム for Prime Video";
  if (/U-?NEXT/i.test(name)) return "U-NEXT";
  if (/Amazon Prime Video with Ads/i.test(name)) return "Amazon Prime Video with Ads";
  if (/Amazon Prime Video|^Prime Video$/i.test(name)) return "Prime Video";
  return name;
}

function providerStateKey(name: string) {
  const canonical = canonicalProviderName(name)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s・+_\-]/g, "");
  if (canonical.includes("amazonprimevideowithads")) return "primevideo-ads";
  if (canonical === "primevideo" || canonical.includes("amazonprimevideo")) return "primevideo";
  if (canonical.includes("unext")) return "unext";
  if (canonical.includes("bs10") || canonical.includes("starchannel")) return "bs10-prime-channel";
  return canonical;
}

function storedStatesForWork(work: Work) {
  const workId = String(work.id);
  const latest = new Map<string, StoredAvailability>();
  for (const item of storedAvailabilityItems) {
    if (normalizeTmdbId(item.tmdbId) !== workId) continue;
    const key = providerStateKey(item.providerName);
    const current = latest.get(key);
    if (!current || (item.eventTimestamp ?? 0) >= (current.eventTimestamp ?? 0)) {
      latest.set(key, item);
    }
  }
  return latest;
}

function applyStoredAvailability(work: Work) {
  const states = storedStatesForWork(work);
  if (!states.size || !work.providers?.length) return work;

  const providers = work.providers.filter((provider) => {
    const state = states.get(providerStateKey(provider.provider_name));
    return state?.active !== false;
  });
  return providers.length === work.providers.length ? work : { ...work, providers };
}

/** JustWatchの埋め込みキャッシュから、公式リンク付きの定額配信終了予定だけを抽出します。 */
export function parseDirectExpirations(html: string): StreamingExpiration[] {
  const results: StreamingExpiration[] = [];
  const offerPattern = /"Offer:[^"]+":\{"id":"[^"]+"[\s\S]*?"monetizationType":"FLATRATE"[\s\S]*?"package":\{[^}]*?"id":"(Package:[^"]+)"[^}]*\}[\s\S]*?"standardWebURL":"([^"]+)"[\s\S]*?"availableTo":"(\d{4}-\d{2}-\d{2})"/g;

  for (const match of html.matchAll(offerPattern)) {
    const [, packageRef, rawLink, expiresOn] = match;
    const escapedRef = packageRef.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const packageMatch = html.match(new RegExp(`"${escapedRef}":\\{[\\s\\S]*?"clearName":"([^"]+)"`));
    const rawName = packageMatch?.[1];
    if (!rawName || !isEndingSoon(expiresOn)) continue;
    const item: StreamingExpiration = {
      providerName: canonicalProviderName(rawName),
      serviceId: packageRef,
      expiresOn,
      link: decodeEmbeddedUrl(rawLink),
    };
    if (!results.some((current) => expiryKey(current) === expiryKey(item))) results.push(item);
  }
  return results.sort((a, b) =>
    (a.expiresOn ?? "9999-12-31").localeCompare(b.expiresOn ?? "9999-12-31")
    || a.providerName.localeCompare(b.providerName, "ja")
  );
}

async function fetchDirectExpirations() {
  const entries = await Promise.all(DIRECT_EXPIRATION_SOURCES.map(async (source) => {
    try {
      const response = await fetch(source.url, {
        headers: { Accept: "text/html", "User-Agent": "Mozilla/5.0 (compatible; DavidTennantArchive/1.0)" },
        next: { revalidate: REVALIDATE_SECONDS },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) return [source.titles, []] as const;
      return [source.titles, parseDirectExpirations(await response.text())] as const;
    } catch {
      return [source.titles, []] as const;
    }
  }));
  return entries;
}

async function fetchJapanExpirations(apiKey: string) {
  const byTmdbId = new Map<string, StreamingExpiration[]>();
  let cursor: string | undefined;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = new URL(`${API_BASE}/changes`);
    url.searchParams.set("country", "jp");
    url.searchParams.set("change_type", "expiring");
    url.searchParams.set("item_type", "show");
    // catalogsを限定しないことで、日本で利用可能な全サービスとPrime Videoチャンネルを対象にします。
    url.searchParams.set("include_unknown_dates", "true");
    url.searchParams.set("order_direction", "asc");
    if (cursor) url.searchParams.set("cursor", cursor);

    const response = await fetch(url, {
      headers: { "X-API-Key": apiKey, Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Streaming Availability API failed: ${response.status}`);

    const data = await response.json() as ChangesResponse;
    for (const change of data.changes ?? []) {
      if (change.changeType && change.changeType !== "expiring") continue;
      if (change.itemType && change.itemType !== "show") continue;
      if (change.streamingOptionType && !["subscription", "addon"].includes(change.streamingOptionType)) continue;
      const show = change.showId ? data.shows?.[change.showId] : undefined;
      const tmdbId = normalizeTmdbId(show?.tmdbId);
      const providerName = canonicalProviderName(
        (change.addon?.name || change.service?.name || "").trim(),
      );
      if (!tmdbId || !providerName) continue;

      const expiry: StreamingExpiration = {
        providerName,
        serviceId: change.addon?.id || change.service?.id,
        expiresOn: formatJapanDate(change.timestamp),
        link: change.link,
      };
      const current = byTmdbId.get(tmdbId) ?? [];
      const key = expiryKey(expiry);
      if (!current.some((item) => expiryKey(item) === key)) current.push(expiry);
      current.sort((a, b) =>
        (a.expiresOn ?? "9999-12-31").localeCompare(b.expiresOn ?? "9999-12-31")
        || a.providerName.localeCompare(b.providerName, "ja")
      );
      byTmdbId.set(tmdbId, current);
    }

    if (!data.hasMore || !data.nextCursor) break;
    cursor = data.nextCursor;
  }

  return byTmdbId;
}

export async function applyStreamingExpirations(works: Work[]): Promise<Work[]> {
  const apiKey = process.env.STREAMING_AVAILABILITY_API_KEY;
  const [apiResult, directResult] = await Promise.all([
    apiKey ? fetchJapanExpirations(apiKey).catch(() => new Map<string, StreamingExpiration[]>()) : new Map<string, StreamingExpiration[]>(),
    fetchDirectExpirations(),
  ]);

  return works.map((sourceWork) => {
    if (sourceWork.media_type === "stage" || sourceWork.id <= 0) return sourceWork;
    const work = applyStoredAvailability(sourceWork);
    const inactiveProviders = new Set(
      [...storedStatesForWork(work).entries()]
        .filter(([, state]) => state.active === false)
        .map(([key]) => key),
    );
    const items = [...(apiResult.get(String(work.id)) ?? [])]
      .filter((item) => !inactiveProviders.has(providerStateKey(item.providerName)));
    const titles = [work.title, work.name, work.original_title, work.original_name]
      .filter((title): title is string => Boolean(title))
      .map(normalizeTitle);
    for (const [sourceTitles, directItems] of directResult) {
      if (!sourceTitles.some((title) => titles.includes(normalizeTitle(title)))) continue;
      for (const item of directItems) {
        if (inactiveProviders.has(providerStateKey(item.providerName))) continue;
        if (!items.some((current) => expiryKey(current) === expiryKey(item))) items.push(item);
      }
    }
    items.sort((a, b) =>
      (a.expiresOn ?? "9999-12-31").localeCompare(b.expiresOn ?? "9999-12-31")
      || a.providerName.localeCompare(b.providerName, "ja")
    );
    return items.length ? { ...work, streamingExpirations: items } : { ...work, streamingExpirations: undefined };
  });
}
