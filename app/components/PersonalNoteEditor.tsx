"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MAX_PERSONAL_NOTE_LENGTH,
  PERSONAL_NOTES_EVENT,
  PERSONAL_NOTES_KEY,
  readPersonalNotes,
  removePersonalNote,
  savePersonalNote,
  type PersonalNoteType,
} from "../lib/personalNotes";

type PersonalNoteEditorProps = {
  noteKey: string;
  type: PersonalNoteType;
  title: string;
  href: string;
  placeholder?: string;
};

function formatUpdatedAt(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("ja-JP", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(date);
}

/** 詳細ページで使う共通メモ欄。内容はこのブラウザのlocalStorageだけに保存します。 */
export default function PersonalNoteEditor({ noteKey, type, title, href, placeholder = "感想や確認したいことを入力" }: PersonalNoteEditorProps) {
  const [text, setText] = useState("");
  const [savedText, setSavedText] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const sync = () => {
      const note = readPersonalNotes().find((item) => item.key === noteKey);
      setText(note?.text ?? "");
      setSavedText(note?.text ?? "");
      setUpdatedAt(note?.updatedAt ?? "");
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(PERSONAL_NOTES_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(PERSONAL_NOTES_EVENT, sync);
    };
  }, [noteKey]);

  const isDirty = text !== savedText;
  const updatedLabel = useMemo(() => formatUpdatedAt(updatedAt), [updatedAt]);

  const save = () => {
    if (!text.trim()) {
      setMessage("メモを入力してください。");
      return;
    }
    savePersonalNote({ key: noteKey, type, title, href, text });
    setMessage("メモを保存しました。");
  };

  const remove = () => {
    if (!savedText || !window.confirm("このメモを削除しますか？")) return;
    removePersonalNote(noteKey);
    setMessage("メモを削除しました。");
  };

  return <section className="personal-note-editor" aria-labelledby={`${noteKey}-note-title`}>
    <div className="personal-note-editor__heading">
      <div><p className="eyebrow">PRIVATE NOTE</p><h3 id={`${noteKey}-note-title`}>自分用メモ</h3></div>
      {updatedLabel && <small>最終更新 {updatedLabel}</small>}
    </div>
    <p className="personal-note-editor__privacy">このブラウザ内だけに保存され、サイトには公開されません。</p>
    <textarea value={text} maxLength={MAX_PERSONAL_NOTE_LENGTH} placeholder={placeholder} aria-label={`${title}の自分用メモ`} onChange={(event) => { setText(event.target.value); setMessage(""); }} />
    <div className="personal-note-editor__footer">
      <span>{text.length.toLocaleString()} / {MAX_PERSONAL_NOTE_LENGTH.toLocaleString()}文字</span>
      <div><button type="button" onClick={save} disabled={!isDirty || !text.trim()}>メモを保存</button><button className="personal-note-editor__delete" type="button" onClick={remove} disabled={!savedText}>削除</button></div>
    </div>
    <p className="personal-note-editor__message" aria-live="polite">{message}</p>
  </section>;
}
