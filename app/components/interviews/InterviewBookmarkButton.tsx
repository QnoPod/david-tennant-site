"use client";

import { useEffect, useState } from "react";
import { ARCHIVE_STORAGE_KEYS, ARCHIVE_UPDATED_EVENT, readArchiveList, writeArchiveList } from "../../lib/archiveStorage";

type InterviewBookmarkButtonProps = {
  slug: string;
  title: string;
  compact?: boolean;
};

/** インタビューをMY ARCHIVEへ保存する、しおり型の共通ボタン。 */
export default function InterviewBookmarkButton({ slug, title, compact = false }: InterviewBookmarkButtonProps) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(readArchiveList<string>(ARCHIVE_STORAGE_KEYS.favoriteInterviews).includes(slug));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(ARCHIVE_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(ARCHIVE_UPDATED_EVENT, sync);
    };
  }, [slug]);

  const toggle = () => {
    const current = readArchiveList<string>(ARCHIVE_STORAGE_KEYS.favoriteInterviews);
    const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug];
    writeArchiveList(ARCHIVE_STORAGE_KEYS.favoriteInterviews, next);
  };

  return <button
    type="button"
    className={`interview-bookmark ${saved ? "is-active" : ""} ${compact ? "interview-bookmark--compact" : ""}`}
    aria-pressed={saved}
    aria-label={saved ? `${title}のしおりを外す` : `${title}をMY ARCHIVEに保存`}
    title={saved ? "しおりを外す" : "しおりに追加"}
    onClick={toggle}
  >
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 3.5h11v17l-5.5-3.6-5.5 3.6z" /></svg>
    {!compact && <span>{saved ? "保存済み" : "しおりに追加"}</span>}
  </button>;
}
