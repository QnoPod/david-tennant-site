import {
  announcementKeywords,
  personKeywords,
  upcomingTitleAliasGroups,
} from "../../data/upcomingSources";

export const UPCOMING_REVALIDATE_SECONDS = 86400;

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function normalize(value = "") {
  return value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}

function compact(value = "") {
  return normalize(value).replace(/[^\p{L}\p{N}]/gu, "");
}

function canonicalAlias(value?: string) {
  if (!value) return undefined;
  const normalizedValue = compact(value);
  if (!normalizedValue) return undefined;

  const group = upcomingTitleAliasGroups.find((aliases) =>
    aliases.some((alias) => {
      const normalizedAlias = compact(alias);
      return normalizedAlias === normalizedValue
        || (
          Math.min(normalizedAlias.length, normalizedValue.length) >= 8
          && (
            normalizedAlias.includes(normalizedValue)
            || normalizedValue.includes(normalizedAlias)
          )
        );
    })
  );

  return group?.[0] || value;
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
 * 発表文から作品名だけを抽出します。
 * 記事見出しだけでなく、説明文や本文にも同じ抽出処理を利用できます。
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
    // 本文中に「映画『作品名』」「series "Title"」と書かれている場合の補助抽出です。
    /(?:film|movie|series|drama|adaptation|映画|ドラマ|作品)\s+(?:called|titled|entitled|『|「|[“"'‘])\s*([^”"'’』」。.!?]{2,100})[”"'’』」]?/iu,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const base = match?.[1]?.trim();
    if (!base || /^(?:new\s+)?(?:film|movie|series|drama|play|project|show|production)$/i.test(base)) continue;
    const season = match?.[2];
    const title = season && !/(?:season|series)\s*\d+/i.test(base) ? `${base} Season ${season}` : base;
    return canonicalAlias(title);
  }
  return undefined;
}

const urlStopWords = new Set([
  "movie", "film", "tv", "television", "series", "show", "drama", "adaptation",
  "cast", "casting", "trailer", "release", "date", "first", "look", "news",
  "exclusive", "official", "starring", "stars", "joins", "david", "tennant",
]);

function titleCaseWords(words: string[]) {
  const lowerCaseWords = new Set(["a", "an", "and", "as", "at", "by", "for", "from", "in", "of", "on", "or", "the", "to", "with"]);
  return words.map((word, index) => {
    const lower = word.toLowerCase();
    if (index > 0 && index < words.length - 1 && lowerCaseWords.has(lower)) return lower;
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join(" ");
}

/**
 * URLのスラッグから作品名候補を抽出します。
 * 例: /joy-of-sex-movie-adaptation-colin-firth-david-tennant-casting/
 *     → The Joy of Sex（別名辞書で正規化）
 */
export function extractProjectTitleFromUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    const slug = decodeURIComponent(url.pathname.split("/").filter(Boolean).at(-1) || "")
      .replace(/\.[a-z0-9]{2,5}$/i, "")
      .replace(/[_–—]+/g, "-");
    const words = slug.split("-").map((word) => word.trim()).filter(Boolean);
    const cutoff = words.findIndex((word) => urlStopWords.has(word.toLowerCase()));
    const projectWords = (cutoff > 0 ? words.slice(0, cutoff) : words)
      .filter((word) => !/^\d{4}$/.test(word));

    if (projectWords.length < 2) return undefined;
    const candidate = titleCaseWords(projectWords);
    if (compact(candidate).length < 6) return undefined;
    return canonicalAlias(candidate);
  } catch {
    return undefined;
  }
}

/**
 * 見出しだけに依存せず、説明文・本文・URLを順に確認して作品名を推定します。
 * 推定できない場合はundefinedを返し、確認待ちに残します。
 */
export function inferProjectTitle({
  title,
  description = "",
  body = "",
  url = "",
}: {
  title: string;
  description?: string;
  body?: string;
  url?: string;
}) {
  const candidates = [
    extractProjectTitle(title),
    extractProjectTitle(description),
    extractProjectTitle(body.slice(0, 5000)),
    extractProjectTitleFromUrl(url),
  ].filter(Boolean) as string[];

  return candidates[0];
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
