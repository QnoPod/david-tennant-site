/**
 * MY ARCHIVEで共有するブラウザ保存キーです。
 * 作品・キャラクターは旧サイトと同じキーを維持し、既存データを引き継ぎます。
 */
export const ARCHIVE_STORAGE_KEYS = {
  favoriteWorks: "favorites",
  watchedWorks: "watchedWorks",
  favoriteCharacters: "david-archive-favorite-characters",
  favoriteInterviews: "david-archive-favorite-interviews",
} as const;

export const ARCHIVE_UPDATED_EVENT = "david-archive-updated";

/** 壊れた保存値があっても画面を止めず、配列だけを安全に読み取ります。 */
export function readArchiveList<T extends string | number>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value as T[] : [];
  } catch {
    return [];
  }
}

/** 保存後に同じタブ内のMY ARCHIVEや各ボタンへ変更を通知します。 */
export function writeArchiveList<T extends string | number>(key: string, values: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(values));
  window.dispatchEvent(new CustomEvent(ARCHIVE_UPDATED_EVENT, { detail: { key } }));
}
