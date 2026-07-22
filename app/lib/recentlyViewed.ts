export const RECENTLY_VIEWED_KEY = "david-archive-recently-viewed";
export const RECENTLY_VIEWED_EVENT = "david-archive-recently-viewed-updated";

export type RecentlyViewedItem = {
  key: string;
  type: "work" | "character" | "interview";
  title: string;
  subtitle?: string;
  href: string;
  image?: string;
  viewedAt: string;
};

export function readRecentlyViewed(): RecentlyViewedItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]") as RecentlyViewedItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** 同じ項目を先頭へ移動し、ブラウザ内には直近12件だけ保存します。 */
export function recordRecentlyViewed(item: Omit<RecentlyViewedItem, "viewedAt">) {
  const next = [{ ...item, viewedAt: new Date().toISOString() }, ...readRecentlyViewed().filter((current) => current.key !== item.key)].slice(0, 12);
  replaceRecentlyViewed(next);
}

/** バックアップ復元時にも、通常の閲覧記録と同じ更新通知を送ります。 */
export function replaceRecentlyViewed(items: RecentlyViewedItem[]) {
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(items.slice(0, 12)));
  window.dispatchEvent(new Event(RECENTLY_VIEWED_EVENT));
}

export function clearRecentlyViewed() {
  localStorage.removeItem(RECENTLY_VIEWED_KEY);
  window.dispatchEvent(new Event(RECENTLY_VIEWED_EVENT));
}
