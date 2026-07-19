import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  interviewActorKeywords,
  interviewArticleFeeds,
  interviewWorkKeywords,
  interviewYouTubeQueries,
} from "../app/data/interviews/discoverySources.ts";

const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";
const DATA_FILE = path.resolve(process.cwd(), "app/data/interviews/autoCandidates.ts");
const MANUAL_CATALOG_FILE = path.resolve(process.cwd(), "app/data/interviews/catalog.ts");
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const LOOKBACK_DAYS = Math.max(1, Number(process.env.INTERVIEW_DISCOVERY_DAYS || 14));
// 通常同期は1ページ、初回バックフィルは最大12ページにします。6検索語でも100回/日以内に収まる設定です。
const YOUTUBE_MAX_PAGES = Math.min(12, Math.max(1, Number(process.env.YOUTUBE_MAX_PAGES || 1)));
const TODAY = new Date().toISOString().slice(0, 10);

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

function isRelevant(text) {
  const normalized = text.toLowerCase();
  return normalized.includes("david tennant")
    && /interview|talks?|reveals?|explains?|speaks?|chat|q\s*&\s*a|conversation|inside|remembers?/.test(normalized);
}

/** 出演発表や作品ニュースを除き、インタビュー形式だと判断できる記事だけを候補にします。 */
function isInterviewArticle(text) {
  const normalized = text.toLowerCase();
  return normalized.includes("david tennant")
    && /interview|q\s*&\s*a|in conversation|speaks? to|talks? to|conversation with/.test(normalized);
}

async function youtubeFetch(pathname, params) {
  const url = new URL(`${YOUTUBE_API}${pathname}`);
  Object.entries({ ...params, key: YOUTUBE_API_KEY }).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`YouTube API failed (${response.status}): ${pathname}`);
  return response.json();
}

async function discoverYouTube() {
  if (!YOUTUBE_API_KEY) {
    console.warn("YOUTUBE_API_KEY is not set; YouTube discovery was skipped.");
    return [];
  }

  const ids = new Set();
  for (const query of interviewYouTubeQueries) {
    let pageToken = "";
    for (let page = 0; page < YOUTUBE_MAX_PAGES; page += 1) {
      const payload = await youtubeFetch("/search", {
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
      for (const item of payload.items ?? []) if (item.id?.videoId) ids.add(item.id.videoId);
      pageToken = payload.nextPageToken || "";
      if (!pageToken) break;
    }
  }
  if (!ids.size) return [];

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

  return videos.flatMap((video) => {
    const snippet = video.snippet ?? {};
    const sourceText = `${snippet.title || ""} ${snippet.description || ""}`;
    if (!isRelevant(sourceText) || video.status?.privacyStatus !== "public") return [];
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
      title: hasJapanese(title) ? title : clean.title,
      description: hasJapanese(description) ? description : clean.description,
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
  for (const match of source.matchAll(/externalUrl:\s*"([^"]+)"/g)) identities.add(`url:${normalize(match[1])}`);
  return identities;
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
    title: reviewed && hasJapanese(previous.title) ? previous.title : incoming.title,
    description: reviewed && hasJapanese(previous.description) ? previous.description : incoming.description,
    tagGroups: reviewed ? previous.tagGroups : incoming.tagGroups,
    contentStatus: reviewed ? previous.contentStatus : incoming.contentStatus,
    transcriptSource: reviewed ? previous.transcriptSource : incoming.transcriptSource,
  };
}

function renderSource(items) {
  return `import type { InterviewSummary } from "./types";\n\n/**\n * GitHub Actionsが自動生成する、公開判断前のインタビュー候補です。\n * 初期状態は isPublished: false なので一般ページには表示されません。\n * 公開時は内容を確認し、isPublished: true／reviewStatus: "approved"へ変更します。\n */\nexport const autoInterviewCandidates: readonly InterviewSummary[] = ${JSON.stringify(items, null, 2)};\n`;
}

async function main() {
  const [existing, manual, youtube, articles] = await Promise.all([
    readExistingCandidates(),
    manualIdentities(),
    discoverYouTube(),
    discoverArticles(),
  ]);
  const discovered = await applyJapaneseText([...youtube, ...articles]);
  const byIdentity = new Map(existing.map((item) => [candidateIdentity(item), item]));

  for (const incoming of discovered) {
    const identity = candidateIdentity(incoming);
    const urlIdentity = `url:${normalize(incoming.externalUrl)}`;
    if (manual.has(identity) || manual.has(urlIdentity)) continue;
    byIdentity.set(identity, mergeCandidate(byIdentity.get(identity), incoming));
  }

  const candidates = [...byIdentity.values()].sort((left, right) =>
    right.publishedDate.localeCompare(left.publishedDate) || left.slug.localeCompare(right.slug),
  );
  const temporaryFile = `${DATA_FILE}.tmp`;
  await fs.writeFile(temporaryFile, renderSource(candidates), "utf8");
  await fs.rename(temporaryFile, DATA_FILE);
  console.log(`Saved ${candidates.length} interview candidates (${discovered.length} found this run).`);
}

await main();
