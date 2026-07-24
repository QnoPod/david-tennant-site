import type { OfficialPageSource } from "../../data/upcomingSources";
import type { UpcomingWork } from "../types";
import {
  decodeHtml,
  inferAnnouncementStatus,
  inferProjectTitle,
  isRelevantArticleAnnouncement,
  isTentativeAnnouncement,
  recentEnough,
  stableKey,
  todayIso,
} from "./shared";

const REQUEST_HEADERS = {
  Accept: "text/html,application/xhtml+xml",
  "User-Agent": "DavidTennantFanArchive/1.0 (+non-commercial announcement monitor)",
};

type ArticleData = { title: string; description: string; body: string; publishedDate?: string };

function firstMatch(html: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const value = html.match(pattern)?.[1];
    if (value) return decodeHtml(value);
  }
  return "";
}

function isoDate(value = "") {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString().slice(0, 10) : undefined;
}

function jsonLdArticles(html: string): Record<string, unknown>[] {
  const values: Record<string, unknown>[] = [];
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1].replace(/&quot;/g, '"')) as Record<string, unknown> | Record<string, unknown>[];
      const queue = Array.isArray(parsed) ? parsed : [parsed];
      for (const value of queue) {
        const graph = Array.isArray(value?.["@graph"]) ? value["@graph"] as Record<string, unknown>[] : [];
        values.push(value, ...graph);
      }
    } catch {
      // 壊れた構造化データがあっても、metaタグと本文解析へフォールバックします。
    }
  }
  return values.filter((value) => {
    const type = value?.["@type"];
    const types = Array.isArray(type) ? type : [type];
    return types.some((name) => typeof name === "string" && /article|news/i.test(name));
  });
}

/** JSON-LD、OGP、article要素の順で、サイトごとの差を吸収して記事情報を取り出します。 */
export function extractArticleData(html: string): ArticleData {
  const structured = jsonLdArticles(html)[0] || {};
  const structuredTitle = typeof structured.headline === "string" ? structured.headline : "";
  const structuredDescription = typeof structured.description === "string" ? structured.description : "";
  const structuredBody = typeof structured.articleBody === "string" ? structured.articleBody : "";
  const structuredDate = typeof structured.datePublished === "string" ? structured.datePublished : "";
  const title = decodeHtml(structuredTitle) || firstMatch(html, [
    /<meta\b[^>]*(?:property|name)=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i,
    /<meta\b[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']og:title["'][^>]*>/i,
    /<h1\b[^>]*>([\s\S]*?)<\/h1>/i,
    /<title\b[^>]*>([\s\S]*?)<\/title>/i,
  ]);
  const description = decodeHtml(structuredDescription) || firstMatch(html, [
    /<meta\b[^>]*(?:property|name)=["'](?:og:description|description)["'][^>]*content=["']([^"']+)["'][^>]*>/i,
    /<meta\b[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:description|description)["'][^>]*>/i,
  ]);
  const articleHtml = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1]
    || html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]
    || "";
  const body = decodeHtml(structuredBody) || decodeHtml(articleHtml).slice(0, 12000);
  const publishedDate = isoDate(structuredDate || firstMatch(html, [
    /<meta\b[^>]*(?:property|name)=["']article:published_time["'][^>]*content=["']([^"']+)["'][^>]*>/i,
    /<time\b[^>]*datetime=["']([^"']+)["'][^>]*>/i,
  ]));
  return { title, description, body, publishedDate };
}

/** 一覧ページから同一オリジンかつ許可された記事パスだけを抽出します。 */
export function discoverArticleLinks(html: string, source: OfficialPageSource) {
  const base = new URL(source.url);
  const links = new Map<string, string>();
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    try {
      const url = new URL(decodeHtml(match[1]), base);
      const text = decodeHtml(match[2]);
      if (url.origin !== base.origin || url.href === base.href || url.hash) continue;
      if (!source.articlePathPatterns.some((pattern) => url.pathname.includes(pattern))) continue;
      if (!text || text.length < 8 || /\.(?:jpg|jpeg|png|webp|gif|pdf)$/i.test(url.pathname)) continue;
      url.hash = "";
      links.set(url.toString(), text);
    } catch {
      // 不正なhrefは監視対象から除外します。
    }
  }
  const entries = [...links.entries()];
  // 名前が見出しにある記事を先に読むことで、少ないリクエストでも出演発表を拾います。
  entries.sort((a, b) => Number(/david\s+tennant/i.test(b[1])) - Number(/david\s+tennant/i.test(a[1])));
  return entries.slice(0, source.maxArticles ?? 14);
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: REQUEST_HEADERS,
    // ページ全体が2MBを超える公式サイトがあるため、完成したUPCOMINGページ側をISRします。
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) return "";
  return (await response.text()).slice(0, 1_500_000);
}

/** 公式一覧から候補記事本文を読み、出演・制作発表だけを確認待ちへ送ります。 */
export async function scrapeOfficialSource(source: OfficialPageSource): Promise<UpcomingWork[]> {
  try {
    const listingHtml = await fetchHtml(source.url);
    if (!listingHtml) return [];
    const links = discoverArticleLinks(listingHtml, source);
    const found: UpcomingWork[] = [];
    const chunkSize = 6;
    for (let index = 0; index < links.length; index += chunkSize) {
      const chunk = links.slice(index, index + chunkSize);
      const articles = await Promise.all(chunk.map(async ([url, linkText]) => {
        try {
          const html = await fetchHtml(url);
          return { url, linkText, article: html ? extractArticleData(html) : null };
        } catch {
          return { url, linkText, article: null };
        }
      }));
      for (const { url, linkText, article } of articles) {
        if (!article) continue;
        const title = article.title || linkText;
        if (!title || !recentEnough(article.publishedDate, 550)
          || !isRelevantArticleAnnouncement(title, article.description, article.body)) continue;
        const searchable = `${title} ${article.description} ${article.body.slice(0, 2500)}`;
        const projectTitle = inferProjectTitle({
          title,
          description: article.description,
          body: article.body,
          url,
        });
        const status = inferAnnouncementStatus(searchable);
        found.push({
          key: stableKey("scraped-article", url), kind: "announcement", mediaType: "other",
          title: projectTitle || title,
          originalTitle: projectTitle,
          overview: article.description || article.body.slice(0, 420), publishedDate: article.publishedDate,
          status, source: source.name, sourceUrl: url,
          // 公式サイトでも、噂・交渉中の表現は確定根拠として扱いません。
          confirmed: Boolean(projectTitle && status !== "unknown" && !isTentativeAnnouncement(searchable)),
          lastCheckedAt: todayIso(),
        });
      }
    }
    return found.slice(0, 10);
  } catch {
    return [];
  }
}
