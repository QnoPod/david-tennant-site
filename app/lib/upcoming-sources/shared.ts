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
  return personKeywords.some((keyword) => text.includes(normalize(keyword)))
    && announcementKeywords.some((keyword) => text.includes(normalize(keyword)));
}

const strongAnnouncementKeywords = [
  "cast", "casting", "joins", "join", "stars", "starring", "to star", "returns", "returning",
  "adds", "added", "set to", "will star", "will play", "voice cast", "voiced by", "led by", "reprising",
  "announced", "announcement", "new series", "new film", "production", "filming", "shooting",
  "出演", "キャスト", "新作", "新シリーズ", "制作", "撮影",
];

const nearbyIntentKeywords = [
  "will star", "will play", "set to", "joins", "has joined", "to star", "returns as", "returning as",
  "cast as", "casting", "new series", "new film", "production", "filming", "shooting", "reprising",
  "出演予定", "キャスト", "新作", "新シリーズ", "制作", "撮影",
];

/** 配信権や過去作紹介を除き、本文中で本人と新規出演を近く結び付けられる記事だけを残します。 */
export function isRelevantArticleAnnouncement(title: string, description: string, body: string) {
  const heading = normalize(`${title} ${description}`);
  const fullText = normalize(`${heading} ${body}`);
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
