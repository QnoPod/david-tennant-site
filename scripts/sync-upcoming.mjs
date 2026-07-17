import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { upcomingTitleAliasGroups } from "../app/data/upcomingSources.ts";

const TMDB_API = "https://api.themoviedb.org/3";
const DATA_FILE = path.resolve(process.cwd(), "app/data/upcomingWorks.ts");
const SNAPSHOT_URL = process.env.UPCOMING_SNAPSHOT_URL;
const CRON_SECRET = process.env.CRON_SECRET;
const TMDB_TOKEN = process.env.TMDB_READ_TOKEN;
const TODAY = new Date().toISOString().slice(0, 10);

function normalize(value = "") {
  return value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

function withoutSeason(value = "") {
  return value
    .replace(/(?:season|series)\s*(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)/gi, "")
    .replace(/(?:シーズン|シリーズ)\s*[0-9０-９一二三四五六七八九十]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function identity(item) {
  const values = [item.originalTitle, item.title, item.character, item.overview].filter(Boolean);
  const aliases = values.flatMap((value) => [normalize(value), normalize(withoutSeason(value))]);
  const group = upcomingTitleAliasGroups.find((candidates) => candidates.some((candidate) => {
    const normalized = normalize(withoutSeason(candidate));
    return aliases.includes(normalized) || (normalized.length >= 8 && aliases.some((alias) => alias.includes(normalized)));
  }));
  const title = group ? normalize(withoutSeason(group[0])) : normalize(withoutSeason(item.originalTitle || item.title));
  return `${item.mediaType}-${title}`;
}

function sourcesOf(item) {
  const sources = new Map();
  for (const source of item.sources ?? []) sources.set(source.url, source);
  if (item.sourceUrl) {
    sources.set(item.sourceUrl, {
      name: item.source,
      url: item.sourceUrl,
      ...(item.publishedDate ? { publishedDate: item.publishedDate } : {}),
    });
  }
  return sources;
}

function mergeSources(left, right) {
  return [...new Map([...sourcesOf(left), ...sourcesOf(right)]).values()];
}

function hasJapanese(value = "") {
  return /[ぁ-んァ-ヶ一-龠々]/.test(value);
}

/** 自動値を取り込みつつ、手作業で整えた日本語の作品名・役名・概要を維持します。 */
function mergeWithExisting(previous, incoming) {
  if (!previous) return { ...incoming, sources: [...sourcesOf(incoming).values()] };
  return {
    ...previous,
    ...incoming,
    key: previous.key || incoming.key,
    title: hasJapanese(previous.title) ? previous.title : incoming.title || previous.title,
    originalTitle: incoming.originalTitle || previous.originalTitle,
    character: hasJapanese(previous.character) ? previous.character : incoming.character || previous.character,
    overview: hasJapanese(previous.overview) ? previous.overview : incoming.overview || previous.overview,
    releaseDate: incoming.releaseDate || previous.releaseDate,
    publishedDate: incoming.publishedDate || previous.publishedDate,
    status: incoming.status !== "unknown" ? incoming.status : previous.status,
    source: previous.source || incoming.source,
    sourceUrl: previous.sourceUrl || incoming.sourceUrl,
    confirmed: Boolean(previous.confirmed || incoming.confirmed),
    sources: mergeSources(previous, incoming),
  };
}

function withoutCheckDates(item) {
  const { updatedAt: _updatedAt, lastCheckedAt: _lastCheckedAt, ...content } = item;
  return content;
}

/**
 * 外部APIが返すnullを再帰的に除去します。
 * UpcomingWorkの任意項目は、値が不明な場合にnullではなく項目自体を省略します。
 */
function omitNullValues(value) {
  if (Array.isArray(value)) {
    return value
      .map(omitNullValues)
      .filter((child) => child !== undefined);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, child]) => child !== null && child !== undefined)
        .map(([key, child]) => [key, omitNullValues(child)]),
    );
  }

  return value;
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sameContent(left, right) {
  return stableStringify(withoutCheckDates(left)) === stableStringify(withoutCheckDates(right));
}

function preserveChangeDate(item, previous) {
  if (previous && sameContent(item, previous)) {
    return {
      ...item,
      updatedAt: previous.updatedAt || previous.lastCheckedAt || TODAY,
      lastCheckedAt: previous.lastCheckedAt || TODAY,
    };
  }
  return { ...item, updatedAt: TODAY, lastCheckedAt: TODAY };
}

function isPastReleaseDate(value) {
  if (!value) return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value <= TODAY;
  if (/^\d{4}-\d{2}$/.test(value)) return value < TODAY.slice(0, 7);
  if (/^\d{4}$/.test(value)) return Number(value) < Number(TODAY.slice(0, 4));
  return false;
}

function expiredAnnouncement(item) {
  if (item.kind !== "announcement" || !/^\d{4}-\d{2}-\d{2}$/.test(item.publishedDate || "")) return false;
  if (item.releaseDate && !isPastReleaseDate(item.releaseDate)) return false;
  const expiry = new Date(`${item.publishedDate}T00:00:00Z`);
  expiry.setUTCDate(expiry.getUTCDate() + 180);
  return expiry.toISOString().slice(0, 10) < TODAY;
}

async function tmdbFetch(pathname) {
  const response = await fetch(`${TMDB_API}${pathname}`, {
    headers: { Authorization: `Bearer ${TMDB_TOKEN}`, accept: "application/json" },
  });
  if (!response.ok) throw new Error(`TMDB request failed (${response.status}): ${pathname}`);
  return response.json();
}

async function getDavidTennantCredits() {
  const people = await tmdbFetch("/search/person?query=David%20Tennant&language=en-US");
  const personId = people.results?.find((item) => item.name === "David Tennant")?.id;
  if (!personId) throw new Error("David Tennant was not found on TMDB.");
  const credits = await tmdbFetch(`/person/${personId}/combined_credits?language=en-US`);
  return credits.cast ?? [];
}

function parseSeasonNumber(item) {
  const match = `${item.title || ""} ${item.originalTitle || ""}`
    .match(/(?:season|series|シーズン|シリーズ)\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}

function titleAliases(value) {
  return [value.title, value.name, value.original_title, value.original_name]
    .filter(Boolean)
    .flatMap((title) => [normalize(title), normalize(withoutSeason(title))]);
}

function matchingCredits(item, credits) {
  const aliases = [item.originalTitle, item.title]
    .filter(Boolean)
    .flatMap((title) => [normalize(title), normalize(withoutSeason(title))]);
  return credits.filter((credit) => {
    if (item.mediaType === "movie" && credit.media_type !== "movie") return false;
    if (item.mediaType === "tv" && credit.media_type !== "tv") return false;
    return titleAliases(credit).some((title) => aliases.includes(title));
  });
}

async function seasonHasStarted(credit, seasonNumber) {
  if (credit.media_type !== "tv" || !seasonNumber) return false;
  try {
    const season = await tmdbFetch(`/tv/${credit.id}/season/${seasonNumber}?language=en-US`);
    return /^\d{4}-\d{2}-\d{2}$/.test(season.air_date || "") && season.air_date <= TODAY;
  } catch (error) {
    console.warn(String(error));
    return false;
  }
}

/** 公開日を過ぎ、David Tennantの出演作品としてTMDBでも一致した場合に削除します。 */
async function shouldRemoveAsReleased(item, credits) {
  if (item.status === "cancelled" || /\b(?:cancelled|canceled|scrapped)\b/i.test(`${item.title} ${item.overview || ""}`)) return true;
  if (isPastReleaseDate(item.releaseDate)) return true;
  const matches = matchingCredits(item, credits);
  if (!matches.length) return false;
  const seasonNumber = parseSeasonNumber(item);
  if (seasonNumber) {
    for (const credit of matches) if (await seasonHasStarted(credit, seasonNumber)) return true;
    return false;
  }
  return matches.some((credit) => {
    const releaseDate = credit.media_type === "movie" ? credit.release_date : credit.first_air_date;
    return /^\d{4}-\d{2}-\d{2}$/.test(releaseDate || "") && releaseDate <= TODAY;
  });
}

async function readExistingItems() {
  const moduleUrl = `${pathToFileURL(DATA_FILE).href}?updated=${Date.now()}`;
  const module = await import(moduleUrl);
  return Array.isArray(module.manualUpcomingWorks) ? module.manualUpcomingWorks : [];
}

async function fetchSnapshot() {
  const response = await fetch(SNAPSHOT_URL, {
    headers: { Authorization: `Bearer ${CRON_SECRET}`, accept: "application/json" },
  });
  if (!response.ok) throw new Error(`UPCOMING snapshot failed (${response.status}).`);
  const payload = await response.json();
  if (!payload.ok || !Array.isArray(payload.works) || payload.works.length === 0) {
    throw new Error("UPCOMING snapshot did not return a non-empty works array.");
  }
  return payload.works;
}

function renderSource(items) {
  const cleanItems = omitNullValues(items);
  return `import type { UpcomingWork } from "../lib/types";\n\n/**\n * GitHub Actionsが自動更新するUPCOMINGデータです。\n * 新しい取得元・公開日・制作状況は既存作品へ統合し、内容が変わった場合だけコミットします。\n * 公開済み・キャンセル済み作品と、180日を過ぎた未確認発表は自動的に整理します。\n */\nexport const manualUpcomingWorks: UpcomingWork[] = ${JSON.stringify(cleanItems, null, 2)};\n`;
}

async function main() {
  if (!SNAPSHOT_URL) throw new Error("UPCOMING_SNAPSHOT_URL is not set.");
  if (!CRON_SECRET) throw new Error("CRON_SECRET is not set.");
  if (!TMDB_TOKEN) throw new Error("TMDB_READ_TOKEN is not set.");

  const [existing, snapshot, credits] = await Promise.all([
    readExistingItems(),
    fetchSnapshot(),
    getDavidTennantCredits(),
  ]);
  const existingByIdentity = new Map(existing.map((item) => [identity(item), item]));
  const active = [];

  for (const incoming of snapshot) {
    // TVmazeなどが返すreleaseDate: nullを、型安全な「未設定」に変換します。
    const cleanIncoming = omitNullValues(incoming);
    const previous = existingByIdentity.get(identity(cleanIncoming));
    const merged = mergeWithExisting(previous, cleanIncoming);
    if (expiredAnnouncement(merged)) continue;
    if (await shouldRemoveAsReleased(merged, credits)) continue;
    active.push(preserveChangeDate(merged, previous));
  }

  active.sort((left, right) => identity(left).localeCompare(identity(right), "en"));
  const temporaryFile = `${DATA_FILE}.tmp`;
  await fs.writeFile(temporaryFile, renderSource(active), "utf8");
  await fs.rename(temporaryFile, DATA_FILE);
  console.log(`Saved ${active.length} UPCOMING records.`);
}

await main();
