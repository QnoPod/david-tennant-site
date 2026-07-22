"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  PERSONAL_NOTES_EVENT,
  readPersonalNotes,
  removePersonalNote,
  replacePersonalNotes,
  type PersonalNote,
  type PersonalNoteType,
} from "../lib/personalNotes";

const TYPE_LABELS: Record<PersonalNoteType, string> = {
  work: "作品",
  character: "キャラクター",
  interview: "インタビュー",
};

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("ja-JP", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(date);
}

/** 各詳細で保存した自分用メモを、MY ARCHIVEにまとめて表示します。 */
export default function PersonalNotes() {
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => { setNotes(readPersonalNotes()); setReady(true); };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(PERSONAL_NOTES_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(PERSONAL_NOTES_EVENT, sync);
    };
  }, []);

  return <section className="my-archive-section personal-notes" id="personal-notes">
    <div className="section-heading"><div><p className="eyebrow">PERSONAL NOTES</p><h2>自分用メモ</h2></div><div className="my-archive-section__actions"><span>{ready ? notes.length : 0}件</span><button type="button" disabled={!notes.length} onClick={() => {
      if (!window.confirm("自分用メモをすべて削除しますか？")) return;
      replacePersonalNotes([]);
    }}>すべて削除</button></div></div>
    {!ready ? <p className="empty-state">メモを読み込んでいます。</p> : !notes.length ? <div className="my-archive-empty"><p>保存したメモはまだありません。</p><Link className="button button--ghost" href="/works">作品を探す</Link></div> : <div className="personal-notes__grid">
      {notes.map((note) => <article className="personal-note-card" key={note.key}>
        <div><p>{TYPE_LABELS[note.type]}</p><small>{formatUpdatedAt(note.updatedAt)}</small></div>
        <h3><Link href={note.href}>{note.title}</Link></h3>
        <p className="personal-note-card__text">{note.text}</p>
        <footer><Link href={note.href}>詳細を開く →</Link><button type="button" aria-label={`${note.title}のメモを削除`} onClick={() => removePersonalNote(note.key)}>削除</button></footer>
      </article>)}
    </div>}
  </section>;
}
