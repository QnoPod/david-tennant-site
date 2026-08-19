import type { StreamingExpiration, Work } from "./types";

const API_BASE = "https://api.movieofthenight.com/v4";
const REVALIDATE_SECONDS = 60 * 60 * 6;
const MAX_PAGES = 40;

const JAPAN_SUBSCRIPTION_CATALOGS = [
  "netflix.subscription",
  "prime.subscription",
  "disney.subscription",
  "apple.subscription",
  "mubi.subscription",
  "curiosity.subscription",
].join(",");

type ApiService = { id?: string; name?: string };
type ApiChange = {
  changeType?: string;
  itemType?: string;
  showId?: string;
  streamingOptionType?: string;
  timestamp?: number;
  link?: string;
  service?: ApiService;
};
type ApiShow = { tmdbId?: string };
type ChangesResponse = {
  changes?: ApiChange[];
  shows?: Record<string, ApiShow>;
  hasMore?: boolean;
  nextCursor?: string;
};

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

async function fetchJapanExpirations(apiKey: string) {
  const byTmdbId = new Map<string, StreamingExpiration[]>();
  let cursor: string | undefined;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = new URL(`${API_BASE}/changes`);
    url.searchParams.set("country", "jp");
    url.searchParams.set("change_type", "expiring");
    url.searchParams.set("item_type", "show");
    url.searchParams.set("catalogs", JAPAN_SUBSCRIPTION_CATALOGS);
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
      if (change.streamingOptionType && change.streamingOptionType !== "subscription") continue;
      const show = change.showId ? data.shows?.[change.showId] : undefined;
      const tmdbId = show?.tmdbId;
      const providerName = change.service?.name?.trim();
      if (!tmdbId || !providerName) continue;

      const expiry: StreamingExpiration = {
        providerName,
        serviceId: change.service?.id,
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
  if (!apiKey) return works;
  try {
    const expirations = await fetchJapanExpirations(apiKey);
    return works.map((work) => {
      if (work.media_type === "stage" || work.id <= 0) return work;
      const items = expirations.get(`${work.media_type}/${work.id}`);
      return items?.length
        ? { ...work, streamingExpirations: items }
        : { ...work, streamingExpirations: undefined };
    });
  } catch {
    return works;
  }
}
