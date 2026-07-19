import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  interviewActorKeywords,
  interviewArticleFeeds,
  interviewWorkKeywords,
  interviewYouTubeQueries,
  officialInterviewYouTubeChannels,
} from "../app/data/interviews/discoverySources.ts";

const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";
const DATA_FILE = path.resolve(process.cwd(), "app/data/interviews/autoCandidates.ts");
const MANUAL_CATALOG_FILE = path.resolve(process.cwd(), "app/data/interviews/catalog.ts");
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const SYNC_MODE = process.env.INTERVIEW_SYNC_MODE || "daily";
const IS_FULL_BACKFILL = SYNC_MODE === "full-backfill";
const LOOKBACK_DAYS = Math.max(1, Number(process.env.INTERVIEW_DISCOVERY_DAYS || 14));
// 通常同期は1ページ、初回バックフィルは最大12ページにします。6検索語でも100回/日以内に収まる設定です。
const YOUTUBE_MAX_PAGES = Math.min(12, Math.max(1, Number(process.env.YOUTUBE_MAX_PAGES || 1)));
const YOUTUBE_REQUEST_INTERVAL_MS = Math.max(0, Number(process.env.YOUTUBE_REQUEST_INTERVAL_MS || 300));
const YOUTUBE_RETRY_LIMIT = 5;
const TODAY = new Date().toISOString().slice(0, 10);
let lastYouTubeRequestAt = 0;

class YouTubeDailyQuotaError extends Error {
  constructor(message) {
    super(message);
    this.name = "YouTubeDailyQuotaError";
  }
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function normalize(value = "") {
  return value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

function decodeEntities(value = "") {
  const named = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (entity, name) => named[name.toLowerCase()] ?? entity);
}

function stripHtml(value = "") {
  return decodeEntities(value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/** 説明文の先頭3文・最大600文字だけを使い、外部記事本文を保存しない短い概要にします。 */
function summarize(value = "") {
  const clean = stripHtml(value);
  if (!clean) return "";
  const sentences = clean.match(/[^.!?。！？]+[.!?。！？]?/g) ?? [clean];
  const summary = sentences.slice(0, 3).join(" ").trim();
  return summary.length > 600 ? `${summary.slice(0, 597).trim()}…` : summary;
}

function hasJapanese(value = "") {
  return /[ぁ-んァ-ヶ一-龠々]/.test(value);
}

/** DeepLや取得元による固有名詞の表記ゆれを、サイト内の正式表記へ統一します。 */
function normalizeJapaneseNotation(value = "") {
  return value
    .replace(/デヴィッド/g, "デイヴィッド")
    .replace(/(?:デビッド|デイビッド)(?:・|\s*)テナント/g, "デイヴィッド・テナント")
    .replace(/デイヴィッド(?:\s+)テナント/g, "デイヴィッド・テナント")
    .replace(/グッド(?:・|\s*)オメンズ/g, "グッド・オーメンズ")
    .replace(/マイケル(?:・|\s*)シーン/g, "マイケル・シーン")
    .replace(/キャサリン(?:・|\s*)テイト/g, "キャサリン・テイト")
    .replace(/オリヴィア(?:・|\s*)コールマン/g, "オリヴィア・コールマン");
}

/** YouTube Shortsとして明示された動画はインタビュー候補へ含めません。 */
function isYouTubeShort(text = "") {
  return /#(?:youtube)?shorts?\b/i.test(text);
}

function slugify(title, suffix) {
  const base = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72) || "interview";
  return `${base}-${suffix.slice(0, 10).toLowerCase()}`;
}

function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 10);
}

function isoDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? TODAY : date.toISOString().slice(0, 10);
}

function publishedAfter() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - LOOKBACK_DAYS);
  return date.toISOString();
}

function parseDuration(value = "") {
  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return "Video";
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  const label = hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
  return `Video · ${label}`;
}

function tagsFor(text, source) {
  const normalized = normalize(text);
  return {
    actors: interviewActorKeywords.filter((name) => normalized.includes(normalize(name))),
    genres: interviewWorkKeywords.filter((title) => normalized.includes(normalize(title))),
    sources: [source],
  };
}

function candidateIdentity(item) {
  return item.videoId ? `youtube:${item.videoId}` : `url:${normalize(item.externalUrl)}`;
}

function canonicalExternalUrl(value = "") {
  try {
    const url = new URL(value);
    url.hash = "";
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    for (const key of [...url.searchParams.keys()]) {
      if (/^(?:utm_|fbclid|gclid|si$|feature$|t$)/i.test(key)) url.searchParams.delete(key);
    }
    url.pathname = url.pathname.replace(/\/$/, "") || "/";
    return url.toString();
  } catch {
    return value;
  }
}

/** 動画ID、正規化URL、原題と公開日の組み合わせで同一インタビューを判定します。 */
function candidateDuplicateKeys(item) {
  const keys = [];
  if (item.videoId) keys.push(`youtube:${item.videoId}`);
  if (item.externalUrl) keys.push(`url:${normalize(canonicalExternalUrl(item.externalUrl))}`);
  const title = normalize(item.titleEn || item.title || "");
  if (title && item.publishedDate) keys.push(`title-date:${title}:${item.publishedDate}`);
  return keys;
}

const officialChannelNames = new Set(officialInterviewYouTubeChannels.map((name) => normalize(name)));

function isOfficialYouTubeChannel(channelTitle = "") {
  return officialChannelNames.has(normalize(channelTitle));
}

function isRelevant(text) {
  const normalized = text.toLowerCase();
  const mentionsDavid = /david\s+(?:john\s+)?tennant/.test(normalized);
  if (!mentionsDavid) return false;

  // full-backfillは公開前の候補収集です。検索語自体がインタビュー形式を指定しているため、
  // 古い動画で説明欄に interview などの語がなくても候補から落としません。
  if (IS_FULL_BACKFILL) return true;

  return /interview|talks?|reveals?|explains?|speaks?|chat|q\s*&\s*a|conversation|inside|remembers?|answers?|press|podcast/.test(normalized);
}

/** 出演発表や作品ニュースを除き、インタビュー形式だと判断できる記事だけを候補にします。 */
function isInterviewArticle(text) {
  const normalized = text.toLowerCase();
  return normalized.includes("david tennant")
    && /interview|q\s*&\s*a|in conversation|speaks? to|talks? to|conversation with/.test(normalized);
}

function youtubeErrorDetail(payload, fallback) {
  const reason = payload?.error?.errors?.[0]?.reason;
  const message = payload?.error?.message;
  return [reason, message].filter(Boolean).join(": ") || fallback;
}

async function youtubeFetch(pathname, params) {
  const url = new URL(`${YOUTUBE_API}${pathname}`);
  Object.entries({ ...params, key: YOUTUBE_API_KEY }).forEach(([key, value]) => url.searchParams.set(key, String(value)));

  for (let attempt = 0; attempt <= YOUTUBE_RETRY_LIMIT; attempt += 1) {
    const elapsed = Date.now() - lastYouTubeRequestAt;
    if (elapsed < YOUTUBE_REQUEST_INTERVAL_MS) await wait(YOUTUBE_REQUEST_INTERVAL_MS - elapsed);
    lastYouTubeRequestAt = Date.now();

    const response = await fetch(url, { headers: { accept: "application/json" } });
    const responseText = await response.text();
    let payload = {};
    try {
      payload = responseText ? JSON.parse(responseText) : {};
    } catch {
      payload = {};
    }
    if (response.ok) return payload;

    const detail = youtubeErrorDetail(payload, responseText.slice(0, 300));
    const dailyQuotaExhausted = /quotaexceeded|dailylimitexceeded|daily.*limit|daily.*quota|quota exceeded[\s\S]*per day|search queries per day/i.test(detail);
    const retryable = !dailyQuotaExhausted && (response.status === 429 || response.status >= 500);
    if (!retryable || attempt === YOUTUBE_RETRY_LIMIT) {
      if (dailyQuotaExhausted) {
        throw new YouTubeDailyQuotaError(
          `YouTube API daily quota was exhausted: ${pathname}: ${detail}. Wait for the Pacific Time daily reset before rerunning full-backfill.`,
        );
      }
      throw new Error(`YouTube API failed (${response.status}): ${pathname}: ${detail}`);
    }

    const retryAfterSeconds = Number(response.headers.get("retry-after"));
    const backoffMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
      ? Math.min(retryAfterSeconds * 1_000, 60_000)
      : Math.min(2 ** attempt * 2_000, 30_000);
    console.warn(
      `YouTube API ${response.status} (${detail}). Waiting ${Math.ceil(backoffMs / 1_000)}s before retry ${attempt + 1}/${YOUTUBE_RETRY_LIMIT}.`,
    );
    await wait(backoffMs);
  }

  throw new Error(`YouTube API retry loop ended unexpectedly: ${pathname}`);
}

async function discoverYouTube() {
  if (!YOUTUBE_API_KEY) {
    throw new Error(
      "YOUTUBE_API_KEY is not set. Add it to GitHub Settings > Secrets and variables > Actions, then rerun the workflow.",
    );
  }

  const ids = new Set();
  let stoppedByDailyQuota = false;
  searchQueries: for (const query of interviewYouTubeQueries) {
    let queryCount = 0;
    let pageToken = "";
    for (let page = 0; page < YOUTUBE_MAX_PAGES; page += 1) {
      let payload;
      try {
        payload = await youtubeFetch("/search", {
          part: "snippet",
          type: "video",
          order: "date",
          maxResults: 50,
          publishedAfter: publishedAfter(),
          q: query,
          relevanceLanguage: "en",
          safeSearch: "moderate",
          ...(pageToken ? { pageToken } : {}),
        });
      } catch (error) {
        if (!(error instanceof YouTubeDailyQuotaError)) throw error;
        stoppedByDailyQuota = true;
        console.warn(`${error.message}\nSaving the video IDs collected before the quota limit.`);
        break searchQueries;
      }
      for (const item of payload.items ?? []) {
        if (!item.id?.videoId) continue;
        ids.add(item.id.videoId);
        queryCount += 1;
      }
      pageToken = payload.nextPageToken || "";
      if (!pageToken) break;
    }
    console.log(`YouTube search: ${query} -> ${queryCount} results`);
  }
  console.log(`YouTube search total: ${ids.size} unique video IDs`);
  if (!ids.size) {
    if (stoppedByDailyQuota) {
      throw new YouTubeDailyQuotaError(
        "YouTube Search Queries daily quota was already exhausted before any results were collected. Retry after the Pacific Time daily reset.",
      );
    }
    throw new Error(
      "YouTube API returned no video IDs. Check API restrictions, YouTube Data API v3 activation, and quota.",
    );
  }
  if (stoppedByDailyQuota) {
    console.warn("The backfill is partial because the Search Queries daily quota was reached. Rerun full-backfill after the next daily reset; duplicate prevention will keep existing candidates once.");
  }

  // videos.listは一度に50IDまでなので、全検索結果を50件ずつ取得します。
  const videos = [];
  const videoIds = [...ids];
  for (let index = 0; index < videoIds.length; index += 50) {
    const payload = await youtubeFetch("/videos", {
      part: "snippet,contentDetails,status",
      id: videoIds.slice(index, index + 50).join(","),
      maxResults: 50,
    });
    videos.push(...(payload.items ?? []));
  }

  let irrelevantCount = 0;
  let nonPublicCount = 0;
  let shortsCount = 0;
  let unofficialChannelCount = 0;
  const unofficialChannelTitles = new Set();
  const candidates = videos.flatMap((video) => {
    const snippet = video.snippet ?? {};
    const sourceText = `${snippet.title || ""} ${snippet.description || ""}`;
    if (video.status?.privacyStatus !== "public") {
      nonPublicCount += 1;
      return [];
    }
    if (isYouTubeShort(sourceText)) {
      shortsCount += 1;
      return [];
    }
    if (!isOfficialYouTubeChannel(snippet.channelTitle || "")) {
      unofficialChannelCount += 1;
      unofficialChannelTitles.add(snippet.channelTitle || "(channel name unavailable)");
      return [];
    }
    if (!isRelevant(sourceText)) {
      irrelevantCount += 1;
      return [];
    }
    const source = snippet.channelTitle || "YouTube";
    const summaryEn = summarize(snippet.description) || `An interview video titled “${snippet.title}” was published by ${source}.`;
    const publishedDate = isoDate(snippet.publishedAt);
    return [{
      slug: slugify(snippet.title || "David Tennant interview", video.id),
      isPublished: false,
      reviewStatus: "pending",
      contentStatus: "review-needed",
      transcriptSource: "unavailable",
      discoveredAt: TODAY,
      contentBasis: "YouTubeの動画説明欄に基づく自動概要です。発言原文は未取得です。",
      title: snippet.title || "David Tennant interview",
      titleEn: snippet.title || "David Tennant interview",
      year: publishedDate.slice(0, 4),
      publishedDate,
      source,
      mediaType: "video",
      videoId: video.id,
      externalUrl: `https://www.youtube.com/watch?v=${video.id}`,
      thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
      duration: parseDuration(video.contentDetails?.duration),
      description: summaryEn,
      tagGroups: tagsFor(sourceText, source),
      _summaryEn: summaryEn,
    }];
  });
  console.log(
    `YouTube details: ${videos.length} loaded, ${candidates.length} candidates, ${shortsCount} Shorts, ${unofficialChannelCount} unofficial channels, ${irrelevantCount} unrelated, ${nonPublicCount} non-public`,
  );
  if (unofficialChannelTitles.size) {
    console.log(`Rejected channel names: ${[...unofficialChannelTitles].sort().join(", ")}`);
  }
  return candidates;
}

function xmlTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return stripHtml(match?.[1] || "");
}

async function publicPageMetadata(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "DavidTennantFanArchive/1.0 (+metadata discovery)" },
    });
    if (!response.ok || !(response.headers.get("content-type") || "").includes("text/html")) return {};
    const html = await response.text();
    const description = html.match(/<meta[^>]+(?:property|name)=["'](?:og:description|description)["'][^>]+content=["']([^"']+)["']/i)?.[1]
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:description|description)["']/i)?.[1]
      || "";
    const image = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] || "";
    return { description: stripHtml(description), image: decodeEntities(image), finalUrl: response.url };
  } catch {
    return {};
  } finally {
    clearTimeout(timeout);
  }
}

async function discoverArticles() {
  const candidates = [];
  const cutoff = publishedAfter().slice(0, 10);
  for (const feed of interviewArticleFeeds) {
    try {
      const response = await fetch(feed.url, { headers: { "user-agent": "DavidTennantFanArchive/1.0 (+RSS discovery)" } });
      if (!response.ok) throw new Error(`RSS ${response.status}`);
      const xml = await response.text();
      const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
      for (const item of items.slice(0, 30)) {
        const rawTitle = xmlTag(item, "title");
        const rssDescription = xmlTag(item, "description") || xmlTag(item, "content:encoded");
        const publishedDate = isoDate(xmlTag(item, "pubDate") || xmlTag(item, "published") || TODAY);
        if (publishedDate < cutoff || !isInterviewArticle(`${rawTitle} ${rssDescription}`)) continue;
        const rssLink = xmlTag(item, "link") || xmlTag(item, "guid");
        if (!rssLink) continue;
        const source = xmlTag(item, "source") || feed.name;
        const page = await publicPageMetadata(rssLink);
        const externalUrl = page.finalUrl || rssLink;
        const titleEn = rawTitle.replace(new RegExp(`\\s+-\\s+${source.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}$`, "i"), "").trim();
        const publicDescription = /comprehensive up-to-date news coverage/i.test(page.description || "") ? "" : page.description;
        const summaryEn = summarize(publicDescription || rssDescription) || `An interview article titled “${titleEn}” was published by ${source}.`;
        const sourceText = `${titleEn} ${summaryEn}`;
        candidates.push({
          slug: slugify(titleEn, hash(externalUrl)),
          isPublished: false,
          reviewStatus: "pending",
          contentStatus: "review-needed",
          transcriptSource: "unavailable",
          discoveredAt: TODAY,
          contentBasis: "RSSと元記事の公開メタ説明に基づく自動概要です。記事全文は保存していません。",
          title: titleEn,
          titleEn,
          year: publishedDate.slice(0, 4),
          publishedDate,
          source,
          mediaType: "article",
          videoId: null,
          externalUrl,
          thumbnailUrl: page.image || "/images/david-tennant.png",
          duration: "Article",
          description: summaryEn,
          tagGroups: tagsFor(sourceText, source),
          _summaryEn: summaryEn,
        });
      }
    } catch (error) {
      console.warn(`Article feed skipped: ${feed.name}: ${String(error)}`);
    }
  }
  return candidates;
}

async function translateToJapanese(values) {
  if (!DEEPL_API_KEY || !values.length) return values;
  const endpoint = DEEPL_API_KEY.endsWith(":fx") ? "https://api-free.deepl.com/v2/translate" : "https://api.deepl.com/v2/translate";
  const output = [];
  for (let index = 0; index < values.length; index += 50) {
    const batch = values.slice(index, index + 50);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ text: batch, source_lang: "EN", target_lang: "JA", preserve_formatting: true }),
      });
      if (!response.ok) throw new Error(`DeepL API failed (${response.status}).`);
      const payload = await response.json();
      const translations = (payload.translations ?? []).map((item) => item.text);
      output.push(...(translations.length === batch.length ? translations : batch));
    } catch (error) {
      // 初回の大量取得でDeepL上限へ達しても、候補そのものは失わず英語で保存します。
      console.warn(`DeepL batch skipped: ${String(error)}`);
      output.push(...batch);
    }
  }
  return output;
}

async function applyJapaneseText(candidates) {
  const inputs = candidates.flatMap((item) => [item.titleEn || item.title, item._summaryEn || item.description]);
  let translated = inputs;
  try {
    translated = await translateToJapanese(inputs);
  } catch (error) {
    console.warn(`Automatic translation skipped: ${String(error)}`);
  }
  return candidates.map((item, index) => {
    const title = translated[index * 2] || item.title;
    const description = translated[index * 2 + 1] || item.description;
    const clean = Object.fromEntries(Object.entries(item).filter(([key]) => key !== "_summaryEn"));
    return {
      ...clean,
      title: normalizeJapaneseNotation(hasJapanese(title) ? title : clean.title),
      description: normalizeJapaneseNotation(hasJapanese(description) ? description : clean.description),
    };
  });
}

async function readExistingCandidates() {
  try {
    const moduleUrl = `${pathToFileURL(DATA_FILE).href}?updated=${Date.now()}`;
    const importedCandidates = await import(moduleUrl);
    return Array.isArray(importedCandidates.autoInterviewCandidates) ? importedCandidates.autoInterviewCandidates : [];
  } catch {
    return [];
  }
}

async function manualIdentities() {
  const source = await fs.readFile(MANUAL_CATALOG_FILE, "utf8");
  const identities = new Set();
  for (const match of source.matchAll(/videoId:\s*"([^"]+)"/g)) identities.add(`youtube:${match[1]}`);
  for (const match of source.matchAll(/externalUrl:\s*"([^"]+)"/g)) {
    identities.add(`url:${normalize(canonicalExternalUrl(match[1]))}`);
  }
  for (const match of source.matchAll(/titleEn:\s*"((?:\\.|[^"])*)"[\s\S]{0,240}?publishedDate:\s*"([^"]+)"/g)) {
    identities.add(`title-date:${normalize(match[1].replace(/\\"/g, '"'))}:${match[2]}`);
  }
  return identities;
}

function deduplicateCandidates(items) {
  const seen = new Set();
  const ordered = [...items].sort((left, right) => {
    const leftReviewed = Number(left.isPublished || left.reviewStatus === "approved");
    const rightReviewed = Number(right.isPublished || right.reviewStatus === "approved");
    return rightReviewed - leftReviewed
      || right.publishedDate.localeCompare(left.publishedDate)
      || left.slug.localeCompare(right.slug);
  });
  return ordered.filter((item) => {
    const keys = candidateDuplicateKeys(item);
    if (keys.some((key) => seen.has(key))) return false;
    keys.forEach((key) => seen.add(key));
    return true;
  });
}

/** 自動更新値を取り込みつつ、開発者が判断した公開状態と手直しした日本語を維持します。 */
function mergeCandidate(previous, incoming) {
  if (!previous) return incoming;
  const reviewed = previous.reviewStatus === "approved" || previous.reviewStatus === "rejected";
  return {
    ...previous,
    ...incoming,
    slug: previous.slug,
    isPublished: previous.isPublished ?? false,
    reviewStatus: previous.reviewStatus ?? "pending",
    discoveredAt: previous.discoveredAt || incoming.discoveredAt,
    title: normalizeJapaneseNotation(reviewed && hasJapanese(previous.title) ? previous.title : incoming.title),
    description: normalizeJapaneseNotation(
      reviewed && hasJapanese(previous.description) ? previous.description : incoming.description,
    ),
    tagGroups: reviewed ? previous.tagGroups : incoming.tagGroups,
    contentStatus: reviewed ? previous.contentStatus : incoming.contentStatus,
    transcriptSource: reviewed ? previous.transcriptSource : incoming.transcriptSource,
  };
}

function renderSource(items) {
  return `import type { InterviewSummary } from "./types";\n\n/**\n * GitHub Actionsが自動生成する、公開判断前のインタビュー候補です。\n * 初期状態は isPublished: false なので一般ページには表示されません。\n * 公開時は内容を確認し、isPublished: true／reviewStatus: "approved"へ変更します。\n */\nexport const autoInterviewCandidates: readonly InterviewSummary[] = ${JSON.stringify(items, null, 2)};\n`;
}

async function main() {
  console.log(`INTERVIEW sync mode: ${SYNC_MODE}`);
  console.log(
    `Discovery window: ${LOOKBACK_DAYS} days; YouTube pages/query: ${YOUTUBE_MAX_PAGES}; request interval: ${YOUTUBE_REQUEST_INTERVAL_MS}ms`,
  );
  const [existing, manual, youtube, articles] = await Promise.all([
    readExistingCandidates(),
    manualIdentities(),
    discoverYouTube(),
    discoverArticles(),
  ]);
  const discovered = await applyJapaneseText([...youtube, ...articles]);
  const byIdentity = new Map(existing.map((item) => [candidateIdentity(item), item]));
  const existingDuplicateKeys = new Set(existing.flatMap(candidateDuplicateKeys));
  const discoveredDuplicateKeys = new Set();

  for (const incoming of discovered) {
    const identity = candidateIdentity(incoming);
    const duplicateKeys = candidateDuplicateKeys(incoming);
    if (duplicateKeys.some((key) => manual.has(key))) continue;
    const exactExisting = byIdentity.get(identity);
    if (!exactExisting && duplicateKeys.some((key) => existingDuplicateKeys.has(key))) continue;
    if (duplicateKeys.some((key) => discoveredDuplicateKeys.has(key))) continue;
    byIdentity.set(identity, mergeCandidate(byIdentity.get(identity), incoming));
    duplicateKeys.forEach((key) => discoveredDuplicateKeys.add(key));
  }

  const candidates = deduplicateCandidates([...byIdentity.values()]
    // 過去の同期で保存済みのShortsも、次回同期時に候補ファイルから取り除きます。
    .filter((item) => !isYouTubeShort(`${item.titleEn || ""} ${item.title || ""} ${item.description || ""}`))
    // 自動候補に以前保存された非公式チャンネルの動画も取り除きます。記事候補は別判定です。
    .filter((item) => item.mediaType !== "video" || isOfficialYouTubeChannel(item.source))
    .map((item) => ({
      ...item,
      title: normalizeJapaneseNotation(item.title),
      description: normalizeJapaneseNotation(item.description),
    })));
  const temporaryFile = `${DATA_FILE}.tmp`;
  await fs.writeFile(temporaryFile, renderSource(candidates), "utf8");
  await fs.rename(temporaryFile, DATA_FILE);
  console.log(`Saved ${candidates.length} interview candidates (${discovered.length} found this run).`);
}

await main();
