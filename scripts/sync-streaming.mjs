import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_FILE = join(ROOT, "app", "data", "generated", "streamingAvailability.json");
const API_BASE = "https://api.movieofthenight.com/v4";
const MAX_PAGES = 40;
const LOOKBACK_DAYS = 7;
const TIMEOUT_MS = 12_000;

const DIRECT_SOURCES = [
  {
    tmdbId: "276843",
    titles: ["What We Did on Our Holiday", "海賊じいちゃんの贈りもの", "海賊じいちゃんの贈り物"],
    url: "https://www.justwatch.com/jp/映画/what-we-did-on-our-holiday",
  },
  {
    tmdbId: "0",
    titles: ["Staged", "ステージド"],
    url: "https://www.justwatch.com/jp/テレビ番組/staged",
  },
];

function readPrevious() {
  try {
    const parsed = JSON.parse(readFileSync(OUTPUT_FILE, "utf8"));
    return { updatedAt: parsed.updatedAt ?? null, items: Array.isArray(parsed.items) ? parsed.items : [] };
  } catch {
    return { updatedAt: null, items: [] };
  }
}

function japanDate(value = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function formatJapanDate(timestamp) {
  return timestamp ? japanDate(new Date(timestamp * 1000)) : undefined;
}

function normalizeTmdbId(value) {
  const normalized = String(value ?? "").trim();
  return normalized.includes("/") ? normalized.split("/").pop() || normalized : normalized;
}

function canonicalProviderName(name) {
  if (/BS10|STAR CHANNEL/i.test(name)) return "BS10プレミアム for Prime Video";
  if (/U-?NEXT/i.test(name)) return "U-NEXT";
  if (/Amazon Prime Video with Ads/i.test(name)) return "Amazon Prime Video with Ads";
  if (/Amazon Prime Video|^Prime Video$/i.test(name)) return "Prime Video";
  return name.trim();
}

function providerKey(name) {
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

function itemKey(item) {
  return `${normalizeTmdbId(item.tmdbId)}::${providerKey(item.providerName)}`;
}

function decodeEmbeddedUrl(value) {
  return value.replace(/\\u002F/gi, "/").replace(/\\u0026/gi, "&");
}

function expiryTimestamp(expiresOn) {
  return Math.floor(new Date(`${expiresOn}T23:59:59+09:00`).getTime() / 1000);
}

function parseDirectExpirations(html) {
  const results = [];
  const offerPattern = /"Offer:[^"]+":\{"id":"[^"]+"[\s\S]*?"monetizationType":"FLATRATE"[\s\S]*?"package":\{[^}]*?"id":"(Package:[^"]+)"[^}]*\}[\s\S]*?"standardWebURL":"([^"]+)"[\s\S]*?"availableTo":"(\d{4}-\d{2}-\d{2})"/g;

  for (const match of html.matchAll(offerPattern)) {
    const [, packageRef, rawLink, expiresOn] = match;
    const escapedRef = packageRef.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const packageMatch = html.match(new RegExp(`"${escapedRef}":\\{[\\s\\S]*?"clearName":"([^"]+)"`));
    const rawName = packageMatch?.[1];
    if (!rawName) continue;
    results.push({
      providerName: canonicalProviderName(rawName),
      serviceId: packageRef,
      expiresOn,
      link: decodeEmbeddedUrl(rawLink),
    });
  }
  return results;
}

async function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchDirectItems() {
  const results = [];
  for (const source of DIRECT_SOURCES) {
    if (source.tmdbId === "0") continue;
    try {
      const response = await fetchWithTimeout(source.url, {
        headers: {
          Accept: "text/html",
          "User-Agent": "Mozilla/5.0 (compatible; DavidTennantArchive/1.0)",
        },
      });
      if (!response.ok) continue;
      for (const item of parseDirectExpirations(await response.text())) {
        const timestamp = expiryTimestamp(item.expiresOn);
        results.push({
          tmdbId: source.tmdbId,
          providerName: item.providerName,
          active: item.expiresOn >= japanDate(),
          changedOn: item.expiresOn,
          eventTimestamp: timestamp,
          expiresOn: item.expiresOn,
          link: item.link,
          source: "justwatch",
        });
      }
    } catch (error) {
      console.warn(`Direct streaming source failed (${source.url}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return results;
}

async function fetchApiChanges(apiKey, changeType) {
  const results = [];
  let cursor;
  const from = Math.floor(Date.now() / 1000) - LOOKBACK_DAYS * 24 * 60 * 60;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = new URL(`${API_BASE}/changes`);
    url.searchParams.set("country", "jp");
    url.searchParams.set("change_type", changeType);
    url.searchParams.set("item_type", "show");
    url.searchParams.set("from", String(from));
    url.searchParams.set("order_direction", "asc");
    if (cursor) url.searchParams.set("cursor", cursor);

    const response = await fetchWithTimeout(url, {
      headers: { "X-API-Key": apiKey, Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Streaming Availability API ${changeType} failed: ${response.status}`);

    const data = await response.json();
    for (const change of data.changes ?? []) {
      if (change.changeType && change.changeType !== changeType) continue;
      if (change.itemType && change.itemType !== "show") continue;
      if (change.streamingOptionType && !["subscription", "addon"].includes(change.streamingOptionType)) continue;
      const show = change.showId ? data.shows?.[change.showId] : undefined;
      const tmdbId = normalizeTmdbId(show?.tmdbId);
      const providerName = canonicalProviderName((change.addon?.name || change.service?.name || "").trim());
      if (!tmdbId || !providerName) continue;

      results.push({
        tmdbId,
        providerName,
        active: changeType === "new",
        changedOn: formatJapanDate(change.timestamp),
        eventTimestamp: change.timestamp ?? 0,
        link: change.link,
        source: "streaming-availability-api",
      });
    }

    if (!data.hasMore || !data.nextCursor) break;
    cursor = data.nextCursor;
  }
  return results;
}

function mergeItem(map, incoming) {
  const key = itemKey(incoming);
  const current = map.get(key);
  if (!current || (incoming.eventTimestamp ?? 0) >= (current.eventTimestamp ?? 0)) {
    map.set(key, { ...current, ...incoming });
  }
}

function comparable(items) {
  return JSON.stringify(items.map((item) => ({
    tmdbId: item.tmdbId,
    providerName: item.providerName,
    active: item.active,
    changedOn: item.changedOn ?? null,
    eventTimestamp: item.eventTimestamp ?? 0,
    expiresOn: item.expiresOn ?? null,
    link: item.link ?? null,
    source: item.source ?? null,
  })));
}

async function main() {
  const previous = readPrevious();
  const map = new Map(previous.items.map((item) => [itemKey(item), item]));

  const apiKey = process.env.STREAMING_AVAILABILITY_API_KEY?.trim();
  if (apiKey) {
    for (const changeType of ["removed", "new"]) {
      try {
        for (const item of await fetchApiChanges(apiKey, changeType)) mergeItem(map, item);
      } catch (error) {
        console.warn(error instanceof Error ? error.message : String(error));
      }
    }
  } else {
    console.warn("STREAMING_AVAILABILITY_API_KEY is not set; syncing registered JustWatch sources only.");
  }

  for (const item of await fetchDirectItems()) mergeItem(map, item);

  const today = japanDate();
  for (const [key, item] of map) {
    if (!item.expiresOn || item.expiresOn >= today) continue;
    const expiresAt = expiryTimestamp(item.expiresOn);
    if ((item.eventTimestamp ?? 0) <= expiresAt) {
      map.set(key, {
        ...item,
        active: false,
        changedOn: item.expiresOn,
        eventTimestamp: expiresAt,
      });
    }
  }

  const items = [...map.values()]
    .filter((item) => normalizeTmdbId(item.tmdbId))
    .sort((a, b) =>
      normalizeTmdbId(a.tmdbId).localeCompare(normalizeTmdbId(b.tmdbId), "en", { numeric: true })
      || a.providerName.localeCompare(b.providerName, "ja")
    );

  const changed = comparable(items) !== comparable(previous.items);
  const output = {
    updatedAt: changed ? new Date().toISOString() : previous.updatedAt,
    items,
  };
  writeFileSync(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Streaming availability: ${items.length}件（変更 ${changed ? "あり" : "なし"}）`);
}

await main();
