import { customCharacterInfo } from "../data/characterDetails";
import { customCharacterImages } from "../data/characterImages";
import { customOverviews } from "../data/overviews";
import { searchDictionary } from "../data/searchDictionary";
import { videoOverrides } from "../data/videoOverrides";
import { getWorkTitle } from "./tmdb";
import type { Work, WorkCharacter } from "./types";

/** 記号・空白・全半角の違いを取り除き、辞書検索に使える文字列にします。 */
export function normalizeText(value: string) {
  return String(value || "").normalize("NFKC").toLowerCase().replace(/[\s・=\-.,:;!?"'()[\]{}~～＆&]/g, "");
}

/** TMDBの原題をsearchDictionary.tsで邦題へ変換します。 */
export function getDisplayTitle(work: Work) {
  if (work.manualTitle) return work.manualTitle;
  const sourceTitle = getWorkTitle(work);
  const originalTitle = work.original_title || work.original_name || sourceTitle;
  return searchDictionary[normalizeText(originalTitle)] || searchDictionary[normalizeText(sourceTitle)] || sourceTitle;
}

/** キャラクター辞書や概要辞書を引くときに使う、変換前の作品名。 */
export function getSourceTitle(work: Work) {
  return getWorkTitle(work);
}

/** 詳細画面で邦題と併記する、TMDB登録上の原題を返します。 */
export function getOriginalTitle(work: Work) {
  return work.original_title || work.original_name || getSourceTitle(work);
}

function parseCharacterInfo(raw?: string) {
  if (!raw) return { name: "", description: "詳細なキャラクター情報はありません。" };
  const newlineIndex = raw.indexOf("\n");
  const colonIndex = raw.indexOf("：");
  const indexes = [newlineIndex, colonIndex].filter((value) => value >= 0);
  if (!indexes.length) return { name: raw.trim(), description: "詳細情報は準備中です。" };
  const split = Math.min(...indexes);
  return { name: raw.slice(0, split).trim(), description: raw.slice(split + 1).trim() || "詳細情報は準備中です。" };
}

/**
 * キャラクター画像は public/characters に置いたローカルファイルだけを使います。
 * characterImages.ts には「/characters/ファイル名」の形で記載してください。
 */
function getCharacterImage(path?: string) {
  return path || "/images/default-character.jpg";
}

/**
 * 旧サイトと同じ例外処理を使い、作品と役名・画像・説明を正しく結び付けます。
 * Doctor Who、DuckTales、Nativity 2の複数役にも対応します。
 */
export function getWorkCharacters(work: Work): WorkCharacter[] {
  if (work.manualCharacters?.length) return work.manualCharacters;
  const sourceTitle = getSourceTitle(work);
  const rawParts = sourceTitle === "Nativity 2: Danger in the Manger!"
    ? (work.character || "").split("/")
    : [work.character || ""];

  return rawParts.map((part) => {
    const rawName = part.trim();
    let dictionaryKey = sourceTitle;
    let imageKey = sourceTitle;

    if (sourceTitle === "Doctor Who: 60th Anniversary Specials") {
      dictionaryKey = sourceTitle;
      imageKey = sourceTitle;
    } else if (rawName === "The Doctor" || rawName === "The Doctor (10)") {
      dictionaryKey = "10th Doctor";
      imageKey = "10th doctor";
    } else if (rawName.toLowerCase().startsWith("self")) {
      imageKey = "self";
    } else if (rawName.toLowerCase().startsWith("narrator")) {
      imageKey = "narrator";
    } else if (rawName.includes("Scrooge McDuck")) {
      dictionaryKey = "Scrooge McDuck";
      imageKey = "Scrooge McDuck";
    } else if (sourceTitle === "Nativity 2: Danger in the Manger!") {
      dictionaryKey = rawName === "Donald" ? "Donald Peterson" : "Roderick Peterson";
      imageKey = dictionaryKey;
    }

    const parsed = parseCharacterInfo(customCharacterInfo[dictionaryKey] || customCharacterInfo[sourceTitle]);
    const fallbackName = rawName.toLowerCase().startsWith("self") ? "本人"
      : rawName.toLowerCase().startsWith("narrator") ? "ナレーター"
      : rawName || "役名未登録";
    const englishName = sourceTitle === "Being Considered" ? "ex-boyfriend"
      : sourceTitle === "Doctor Who: 60th Anniversary Specials" ? "14th Doctor"
      : dictionaryKey === "10th Doctor" ? "10th Doctor"
      : dictionaryKey === "Donald Peterson" ? "Donald Peterson"
      : dictionaryKey === "Roderick Peterson" ? "Roderick Peterson"
      : rawName.toLowerCase().startsWith("self") ? "Self"
      : rawName.toLowerCase().startsWith("narrator") ? "Narrator"
      : rawName || dictionaryKey;
    return {
      name: parsed.name || fallbackName,
      englishName,
      image: getCharacterImage(customCharacterImages[imageKey] || customCharacterImages[sourceTitle]),
      description: parsed.description,
    };
  });
}

export function getWorkOverview(work: Work) {
  return customOverviews[getSourceTitle(work)] || work.overview || "日本語の作品紹介は準備中です。";
}

export function getWorkVideoKey(work: Work) {
  return videoOverrides[getSourceTitle(work)] || work.videoKey || null;
}
