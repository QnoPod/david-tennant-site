/**
 * 作品・キャラクター・インタビューへ付ける、自分用メモのブラウザ保存処理です。
 * サーバーへ送信しないため、入力内容がサイト上で一般公開されることはありません。
 */
export const PERSONAL_NOTES_KEY = "david-archive-personal-notes";
export const PERSONAL_NOTES_EVENT = "david-archive-personal-notes-updated";

export type PersonalNoteType = "work" | "character" | "interview";

export type PersonalNote = {
  key: string;
  type: PersonalNoteType;
  title: string;
  href: string;
  text: string;
  updatedAt: string;
};

const MAX_NOTES = 200;
export const MAX_PERSONAL_NOTE_LENGTH = 5000;

function isPersonalNote(value: unknown): value is PersonalNote {
  if (!value || typeof value !== "object") return false;
  const note = value as Partial<PersonalNote>;
  return Boolean(
    typeof note.key === "string" && note.key.trim()
    && (note.type === "work" || note.type === "character" || note.type === "interview")
    && typeof note.title === "string" && note.title.trim()
    && typeof note.href === "string" && note.href.startsWith("/")
    && typeof note.text === "string" && note.text.trim()
    && typeof note.updatedAt === "string",
  );
}

/** 壊れた保存値を除外し、更新が新しい順で返します。 */
export function sanitizePersonalNotes(value: unknown): PersonalNote[] {
  if (!Array.isArray(value)) return [];
  const notes = value.filter(isPersonalNote).map((note) => ({
    ...note,
    key: note.key.trim(),
    title: note.title.trim(),
    text: note.text.trim().slice(0, MAX_PERSONAL_NOTE_LENGTH),
  }));
  return [...new Map(notes.map((note) => [note.key, note])).values()]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, MAX_NOTES);
}

export function readPersonalNotes(): PersonalNote[] {
  if (typeof window === "undefined") return [];
  try {
    return sanitizePersonalNotes(JSON.parse(window.localStorage.getItem(PERSONAL_NOTES_KEY) || "[]"));
  } catch {
    return [];
  }
}

/** 復元時にも使える全置換処理。同じタブ内の表示へ更新を通知します。 */
export function replacePersonalNotes(notes: PersonalNote[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PERSONAL_NOTES_KEY, JSON.stringify(sanitizePersonalNotes(notes)));
  window.dispatchEvent(new CustomEvent(PERSONAL_NOTES_EVENT));
}

export function savePersonalNote(note: Omit<PersonalNote, "updatedAt">) {
  const text = note.text.trim().slice(0, MAX_PERSONAL_NOTE_LENGTH);
  if (!text) {
    removePersonalNote(note.key);
    return;
  }
  const next = readPersonalNotes().filter((item) => item.key !== note.key);
  replacePersonalNotes([{ ...note, text, updatedAt: new Date().toISOString() }, ...next]);
}

export function removePersonalNote(key: string) {
  replacePersonalNotes(readPersonalNotes().filter((note) => note.key !== key));
}
