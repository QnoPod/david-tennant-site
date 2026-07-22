import { getWorkArchiveKey } from "./archiveStorage";

/** 作品の5段階評価は、公開せずブラウザ内だけに保存します。 */
export const WORK_RATINGS_KEY = "david-archive-work-ratings";
export const WORK_RATINGS_EVENT = "david-archive-work-ratings-updated";

export type WorkRating = 1 | 2 | 3 | 4 | 5;
export type WorkRatings = Record<string, WorkRating>;

export function sanitizeWorkRatings(value: unknown): WorkRatings {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: WorkRatings = {};
  for (const [key, rating] of Object.entries(value)) {
    const number = Number(rating);
    if (/^[^:]+:.+$/.test(key) && Number.isInteger(number) && number >= 1 && number <= 5) {
      result[key] = number as WorkRating;
    }
  }
  return result;
}

export function readWorkRatings(): WorkRatings {
  if (typeof window === "undefined") return {};
  try {
    return sanitizeWorkRatings(JSON.parse(window.localStorage.getItem(WORK_RATINGS_KEY) || "{}"));
  } catch {
    return {};
  }
}

export function replaceWorkRatings(ratings: WorkRatings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WORK_RATINGS_KEY, JSON.stringify(sanitizeWorkRatings(ratings)));
  window.dispatchEvent(new CustomEvent(WORK_RATINGS_EVENT));
}

export function setWorkRating(mediaType: string, id: string | number, rating: number) {
  const key = getWorkArchiveKey(mediaType, id);
  const next = readWorkRatings();
  if (rating >= 1 && rating <= 5) next[key] = rating as WorkRating;
  else delete next[key];
  replaceWorkRatings(next);
}
