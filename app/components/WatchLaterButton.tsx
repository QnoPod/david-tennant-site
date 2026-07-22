"use client";

import { useEffect, useState } from "react";
import { ARCHIVE_STORAGE_KEYS, ARCHIVE_UPDATED_EVENT, readArchiveList, writeArchiveList } from "../lib/archiveStorage";

/** インタビューカードと詳細ページで共有する「あとで見る」ボタンです。 */
export default function WatchLaterButton({ slug, title, compact = false }: { slug: string; title: string; compact?: boolean }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(readArchiveList<string>(ARCHIVE_STORAGE_KEYS.watchLaterInterviews).includes(slug));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(ARCHIVE_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(ARCHIVE_UPDATED_EVENT, sync);
    };
  }, [slug]);

  const toggle = () => {
    const current = readArchiveList<string>(ARCHIVE_STORAGE_KEYS.watchLaterInterviews);
    writeArchiveList(ARCHIVE_STORAGE_KEYS.watchLaterInterviews, current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]);
  };

  return <button type="button" className={`watch-later-button ${saved ? "is-active" : ""} ${compact ? "watch-later-button--compact" : ""}`} aria-pressed={saved} aria-label={saved ? `${title}をあとで見るリストから外す` : `${title}をあとで見るリストへ追加`} title={saved ? "あとで見るから外す" : "あとで見るに追加"} onClick={toggle}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v5l3.5 2" /></svg>
    {!compact && <span>{saved ? "あとで見るに保存済み" : "あとで見る"}</span>}
  </button>;
}
