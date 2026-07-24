import { announcementKeywords, personKeywords } from "../../data/upcomingSources";

export const UPCOMING_REVALIDATE_SECONDS = 86400;

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function normalize(value = "") {
  return value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}

/** 人名と出演・制作を示す語が両方ある情報だけを候補にします。 */
export function isRelevantAnnouncement(value: string) {
  const text = normalize(value);
  return !isRejectedAnnouncement(text)
    && personKeywords.some((keyword) => text.includes(normalize(keyword)))
    && announcementKeywords.some((keyword) => text.includes(normalize(keyword)));
}

const strongAnnouncementKeywords = [
  "cast", "casting", "joins", "join", "stars", "starring", "to star", "returns", "returning",
  "adds", "added", "set to", "will star", "will play", "voice cast", "voiced by", "led by", "reprising",
  "announced", "announcement", "commissioned", "greenlit", "new series", "new film", "production",
  "filming", "shooting", "first look", "first image", "unveils images", "reveals images",
  // Deadlineなどの、監督名＋複数キャスト＋作品名という見出しにも対応します。
  "directing", "directs", "pre-sells", "pre-sold",
  "出演", "キャスト", "出演決定", "新作", "新シリーズ", "制作", "撮影", "初公開",
];

const nearbyIntentKeywords = [
  "will star", "will play", "set to", "joins", "has joined", "to star", "returns as", "returning as",
  "cast as", "casting", "commissioned", "greenlit", "new series", "new film", "production", "filming",
  "shooting", "reprising", "first look", "first image", "directing", "directs",
  "出演予定", "出演決定", "キャスト", "新作", "新シリーズ", "制作", "撮影", "初公開",
];

const rejectedAnnouncementKeywords = [
  "cancelled", "canceled", "scrapped", "no longer attached", "exits the project", "will not return",
  "released now", "now streaming", "available now", "watch now", "review", "recap",
  "制作中止", "打ち切り", "降板", "配信中", "公開中", "レビュー", "振り返り",
];

const tentativeAnnouncementKeywords = [
  "rumour", "rumor", "reportedly", "may join", "might join", "could join", "in talks", "being considered",
  "may return", "might return", "could return", "噂", "出演する可能性", "交渉中", "検討中",
];

export function isRejectedAnnouncement(value: string) {
  const text = normalize(value);
  return rejectedAnnouncementKeywords.some((keyword) => text.includes(normalize(keyword)));
}

/** 噂や交渉中の記事は削除せず、確定作品へ自動昇格させないために識別します。 */
export function isTentativeAnnouncement(value: string) {
  const text = normalize(value);
  return tentativeAnnouncementKeywords.some((keyword) => text.includes(normalize(keyword)));
}

/** 配信権や過去作紹介を除き、本文中で本人と新規出演を近く結び付けられる記事だけを残します。 */
export function isRelevantArticleAnnouncement(title: string, description: string, body: string) {
  const heading = normalize(`${title} ${description}`);
  const fullText = normalize(`${heading} ${body}`);
  if (isRejectedAnnouncement(fullText)) return false;
  const hasPerson = personKeywords.some((keyword) => fullText.includes(normalize(keyword)));
  const strongInHeading = strongAnnouncementKeywords.some((keyword) => heading.includes(normalize(keyword)));
  if (!hasPerson || !strongInHeading) {
    const name = normalize("David Tennant");
    const index = fullText.indexOf(name);
    if (index < 0) return false;
    const nearby = fullText.slice(Math.max(0, index - 220), index + name.length + 220);
    return nearbyIntentKeywords.some((keyword) => nearby.includes(normalize(keyword)));
  }
  return true;
}

/**
 * 発表見出しから作品名だけを抽出します。抽出できない記事は確認待ちに残し、
 * 記事見出し全体を作品名として扱わないようにします。
 */
export function extractProjectTitle(value: string) {
  const text = decodeHtml(value).normalize("NFKC").replace(/\s+/g, " ").trim();
  const patterns = [
    // 例: Sharon Maguire Directing ... David Tennant & More In ‘The Joy Of Sex’; ...
    // 「directing/directs」を必須にして、インタビューなどの "David Tennant in ..." を誤検出しません。
    /^(?=[^.!?]{0,300}\bDavid\s+Tennant\b)[^.!?]{0,140}\b(?:directing|directs)\b[^.!?]{0,220}\bIn\s+[“"'‘]([^”"'’]{2,100})[”"'’](?:[;:–—|]|$)/iu,
    /David\s+Tennant(?:\s+(?:and|&)\s+[A-Z][\p{L} .'-]+)?\s+in\s+[“"'‘]?([A-Z][\p{L}\p{N} :'!&.-]{1,90}?)[”"'’]?(?:\s+(?:season|series)\s*(\d+))?(?:\s*[–—|]|$)/iu,
    /[“"'‘『「]([^”"'’』」]{2,100})[”"'’』」]\s*(?:season|series|シーズン|シリーズ)\s*([0-9０-９]+)/iu,
    /(?:first[- ]look|first images?|unveils? images?|reveals? images?)[^.!?]{0,120}?\b(?:in|for|from|of)\s+[“"'‘]?([A-Z][\p{L}\p{N} :'!&.-]{1,90}?)(?:[”"'’]?\s*(?:season|series)\s*(\d+))?(?:\s*[–—|]|$)/iu,
    /David\s+Tennant[^.!?]{0,80}?(?:joins|boards|stars?\s+in|to\s+star\s+in|returns?\s+for|cast\s+in)[^“"'‘]{0,20}[“"'‘]([^”"'’]{2,100})[”"'’]/iu,
    /^[“"'‘]?(.+?)[”"'’]?\s+(?:casts?|adds?|taps?)\s+David\s+Tennant(?:\s+[–—|]|$)/iu,
    /^David\s+Tennant\s+(?:joins|boards|leads|to\s+star\s+in|stars?\s+in|returns?\s+for)\s+[“"'‘]?(.+?)[”"'’]?(?:\s+(?:as|with|alongside|for)\s+|\s+[–—|]\s+|$)/iu,
    /(?:出演決定|キャスト発表|制作開始|撮影開始|初公開)[^『「]{0,40}[『「]([^』」]{2,100})[』」]/u,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const base = match?.[1]?.trim();
    if (!base || /^(?:new\s+)?(?:film|movie|series|drama|play|project|show|production)$/i.test(base)) continue;
    const season = match?.[2];
    return season && !/(?:season|series)\s*\d+/i.test(base) ? `${base} Season ${season}` : base;
  }
  return undefined;
}

export function inferAnnouncementStatus(value: string, hasReleaseDate = false) {
  const text = normalize(value);
  if (/(?:post.production|ポストプロダクション)/i.test(text)) return "post-production" as const;
  if (/(?:filming|shooting|production begins|starts production|in production|撮影|制作開始)/i.test(text)) return "filming" as const;
  if (hasReleaseDate || /(?:premieres?|release date|airs? on|公開予定|放送予定)/i.test(text)) return "scheduled" as const;
  if (/(?:commissioned|greenlit|will star|to star|first look|first image|unveils? images?|reveals? images?|directing|directs|pre[- ]sells?|pre[- ]sold|出演決定|制作決定|初公開)/i.test(text)) return "planned" as const;
  return "unknown" as const;
}

export function decodeHtml(value = "") {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stableKey(prefix: string, value: string) {
  let hash = 0;
  for (const character of value) hash = Math.imul(31, hash) + character.charCodeAt(0) | 0;
  return `${prefix}-${Math.abs(hash).toString(36)}`;
}

export function recentEnough(date?: string, days = 370) {
  if (!date) return true;
  const timestamp = new Date(date).getTime();
  return Number.isFinite(timestamp) && timestamp >= Date.now() - days * 86400000;
}
