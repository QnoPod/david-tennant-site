"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ARCHIVE_STORAGE_KEYS, readArchiveList, writeArchiveList } from "../lib/archiveStorage";
import { readRecentlyViewed, replaceRecentlyViewed, type RecentlyViewedItem } from "../lib/recentlyViewed";

const BACKUP_FORMAT = "david-tennant-my-archive";
const BACKUP_VERSION = 1;
const MAX_FILE_SIZE = 1024 * 1024;

type ArchiveBackup = {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  data: {
    favoriteWorks: number[];
    watchedWorks: number[];
    watchedEpisodes: string[];
    favoriteCharacters: string[];
    favoriteInterviews: string[];
    watchLaterWorks: string[];
    watchLaterInterviews: string[];
    recentlyViewed: RecentlyViewedItem[];
  };
};

/** MY ARCHIVEに関係するブラウザ保存データを、1つのJSONへまとめます。 */
function createBackup(): ArchiveBackup {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      favoriteWorks: readArchiveList<number>(ARCHIVE_STORAGE_KEYS.favoriteWorks),
      watchedWorks: readArchiveList<number>(ARCHIVE_STORAGE_KEYS.watchedWorks),
      watchedEpisodes: readArchiveList<string>(ARCHIVE_STORAGE_KEYS.watchedEpisodes),
      favoriteCharacters: readArchiveList<string>(ARCHIVE_STORAGE_KEYS.favoriteCharacters),
      favoriteInterviews: readArchiveList<string>(ARCHIVE_STORAGE_KEYS.favoriteInterviews),
      watchLaterWorks: readArchiveList<string>(ARCHIVE_STORAGE_KEYS.watchLaterWorks),
      watchLaterInterviews: readArchiveList<string>(ARCHIVE_STORAGE_KEYS.watchLaterInterviews),
      recentlyViewed: readRecentlyViewed(),
    },
  };
}

function uniqueNumbers(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(Number).filter(Number.isFinite))];
}

function uniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()))];
}

/** ファイル内のリンクや画像に危険なURLが入らないよう、復元前に項目を検証します。 */
function safeRecentlyViewed(value: unknown): RecentlyViewedItem[] {
  if (!Array.isArray(value)) return [];
  const result: RecentlyViewedItem[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Partial<RecentlyViewedItem>;
    if (candidate.type !== "work" && candidate.type !== "character" && candidate.type !== "interview") continue;
    if (typeof candidate.key !== "string" || typeof candidate.title !== "string" || typeof candidate.href !== "string" || !candidate.href.startsWith("/")) continue;
    const image = typeof candidate.image === "string" && (candidate.image.startsWith("/") || candidate.image.startsWith("https://")) ? candidate.image : undefined;
    result.push({
      key: candidate.key,
      type: candidate.type,
      title: candidate.title,
      subtitle: typeof candidate.subtitle === "string" ? candidate.subtitle : undefined,
      href: candidate.href,
      image,
      viewedAt: typeof candidate.viewedAt === "string" ? candidate.viewedAt : new Date().toISOString(),
    });
  }
  return [...new Map(result.map((item) => [item.key, item])).values()].slice(0, 12);
}

/** お気に入り・視聴状態・しおり・閲覧履歴のバックアップと復元。 */
export default function ArchiveBackupControls() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

  const downloadBackup = () => {
    const backup = createBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `david-tennant-my-archive-${backup.exportedAt.slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setMessage("バックアップファイルを保存しました。");
  };

  const restoreBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setMessage("ファイルが大きすぎます。MY ARCHIVEのバックアップファイルを選択してください。");
      return;
    }

    try {
      const parsed = JSON.parse(await file.text()) as Partial<ArchiveBackup>;
      if (parsed.format !== BACKUP_FORMAT || parsed.version !== BACKUP_VERSION || !parsed.data || typeof parsed.data !== "object") {
        throw new Error("invalid backup");
      }
      if (!window.confirm("現在のMY ARCHIVEを、このバックアップの内容で置き換えますか？")) return;

      writeArchiveList(ARCHIVE_STORAGE_KEYS.favoriteWorks, uniqueNumbers(parsed.data.favoriteWorks));
      writeArchiveList(ARCHIVE_STORAGE_KEYS.watchedWorks, uniqueNumbers(parsed.data.watchedWorks));
      writeArchiveList(ARCHIVE_STORAGE_KEYS.watchedEpisodes, uniqueStrings(parsed.data.watchedEpisodes));
      writeArchiveList(ARCHIVE_STORAGE_KEYS.favoriteCharacters, uniqueStrings(parsed.data.favoriteCharacters));
      writeArchiveList(ARCHIVE_STORAGE_KEYS.favoriteInterviews, uniqueStrings(parsed.data.favoriteInterviews));
      writeArchiveList(ARCHIVE_STORAGE_KEYS.watchLaterWorks, uniqueStrings(parsed.data.watchLaterWorks));
      writeArchiveList(ARCHIVE_STORAGE_KEYS.watchLaterInterviews, uniqueStrings(parsed.data.watchLaterInterviews));
      replaceRecentlyViewed(safeRecentlyViewed(parsed.data.recentlyViewed));
      setMessage("MY ARCHIVEを復元しました。");
    } catch {
      setMessage("このファイルはMY ARCHIVEのバックアップとして読み込めませんでした。");
    }
  };

  return <section className="archive-backup" aria-labelledby="archive-backup-title">
    <div><p className="eyebrow">BACKUP &amp; RESTORE</p><h2 id="archive-backup-title">バックアップ・復元</h2><p>お気に入り、視聴状態、しおり、最近見た項目をファイルに保存できます。</p></div>
    <div className="archive-backup__actions">
      <button type="button" onClick={downloadBackup}>バックアップを保存</button>
      <button type="button" onClick={() => fileInput.current?.click()}>ファイルから復元</button>
      <input ref={fileInput} type="file" accept="application/json,.json" onChange={restoreBackup} hidden />
    </div>
    <p className="archive-backup__message" aria-live="polite">{message}</p>
  </section>;
}
