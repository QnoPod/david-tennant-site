import { unstable_cache } from "next/cache";
import { officialPageSources, rssSources } from "../../data/upcomingSources";
import type { UpcomingWork } from "../types";
import { scrapeOfficialSource } from "./articleScraper";
import {
  decodeHtml,
  extractProjectTitle,
  inferAnnouncementStatus,
  isRelevantArticleAnnouncement,
  recentEnough,
  stableKey,
  todayIso,
  UPCOMING_REVALIDATE_SECONDS,
} from "./shared";
import { translateAnnouncements } from "./translate";

function tag(block: string, name: string) {
  return block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"))?.[1] || "";
}

/** RSSの記事を解析し、出演・制作発表らしい最近の記事だけを返します。 */
async function getRssAnnouncements(): Promise<UpcomingWork[]> {
  const checkedAt = todayIso();
  const results = await Promise.all(rssSources.map(async (source) => {
    try {
      const response = await fetch(source.url, { next: { revalidate: UPCOMING_REVALIDATE_SECONDS } });
      if (!response.ok) return [];
      const xml = await response.text();
      return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].flatMap((match) => {
        const block = match[1];
        const title = decodeHtml(tag(block, "title"));
        const description = decodeHtml(tag(block, "description"));
        const link = decodeHtml(tag(block, "link"));
        const rawDate = decodeHtml(tag(block, "pubDate"));
        const publishedDate = rawDate ? new Date(rawDate).toISOString().slice(0, 10) : undefined;
        if (!link || !title || !recentEnough(publishedDate)
          || !isRelevantArticleAnnouncement(title, description, "")) return [];
        const projectTitle = extractProjectTitle(`${title} ${description}`);
        return [{
          key: stableKey("rss", link),
          kind: "announcement" as const,
          mediaType: "other" as const,
          title: projectTitle || title,
          originalTitle: projectTitle,
          overview: description,
          publishedDate,
          status: inferAnnouncementStatus(`${title} ${description}`),
          source: source.name,
          sourceUrl: link,
          confirmed: false,
          lastCheckedAt: checkedAt,
        } satisfies UpcomingWork];
      });
    } catch {
      return [];
    }
  }));
  return results.flat();
}

/** RSSのない公式ページは、一覧から記事本文まで辿って出演発表を確認します。 */
async function getOfficialPageAnnouncements(): Promise<UpcomingWork[]> {
  const results = await Promise.all(officialPageSources.map(scrapeOfficialSource));
  return results.flat();
}

async function getFeedUpcomingUncached() {
  const [rss, officialPages] = await Promise.all([getRssAnnouncements(), getOfficialPageAnnouncements()]);
  const unique = new Map<string, UpcomingWork>();
  for (const item of [...rss, ...officialPages]) unique.set(item.sourceUrl || item.key, item);
  return translateAnnouncements([...unique.values()]);
}

/** 大きな公式ページを閲覧のたびに巡回しないよう、抽出後の軽量な結果だけを1日保存します。 */
export const getFeedUpcoming = unstable_cache(
  getFeedUpcomingUncached,
  // v5: 旧キャッシュで記事説明文が作品名として残ったケースを破棄します。
  ["upcoming-article-monitor-v5"],
  { revalidate: UPCOMING_REVALIDATE_SECONDS, tags: ["upcoming-article-monitor"] },
);
