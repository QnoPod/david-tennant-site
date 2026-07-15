import { officialYouTubeChannels } from "../../data/upcomingSources";
import type { UpcomingWork } from "../types";
import { isRelevantAnnouncement, normalize, stableKey, todayIso, UPCOMING_REVALIDATE_SECONDS } from "./shared";

type SearchItem = {
  id?: { videoId?: string };
  snippet?: { publishedAt?: string; channelTitle?: string; title?: string; description?: string };
};

/** 公式チャンネルの新着動画から、予告・出演発表らしい動画を候補として取得します。 */
export async function getYouTubeUpcoming(): Promise<UpcomingWork[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];
  try {
    const after = new Date(Date.now() - 370 * 86400000).toISOString();
    const params = new URLSearchParams({
      part: "snippet",
      q: "David Tennant",
      type: "video",
      order: "date",
      maxResults: "50",
      publishedAfter: after,
      key: apiKey,
    });
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, {
      next: { revalidate: UPCOMING_REVALIDATE_SECONDS },
    });
    if (!response.ok) return [];
    const data = await response.json() as { items?: SearchItem[] };
    const checkedAt = todayIso();
    return (data.items ?? []).flatMap((item) => {
      const snippet = item.snippet;
      const videoId = item.id?.videoId;
      const channel = snippet?.channelTitle || "";
      const approvedChannel = officialYouTubeChannels.some((name) => normalize(channel) === normalize(name));
      const searchable = `${snippet?.title || ""} ${snippet?.description || ""}`;
      if (!videoId || !snippet?.title || !approvedChannel || !isRelevantAnnouncement(searchable)) return [];
      return [{
        key: stableKey("youtube", videoId),
        kind: "announcement" as const,
        mediaType: "other" as const,
        title: snippet.title,
        overview: snippet.description,
        publishedDate: snippet.publishedAt?.slice(0, 10),
        status: "unknown" as const,
        source: `YouTube · ${channel}`,
        sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
        confirmed: false,
        lastCheckedAt: checkedAt,
      }];
    });
  } catch {
    return [];
  }
}
