import { customCharacterInfo, selfCharacterDescription } from "../data/characterDetails";
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

/**
 * WORKSの太字タイトルを返します。
 * 手入力の邦題、辞書の邦題、TMDBの日本語タイトル、原題の順に採用します。
 */
export function getDisplayTitle(work: Work) {
  if (work.manualTitle) return work.manualTitle;
  const sourceTitle = getWorkTitle(work);
  const originalTitle = work.original_title || work.original_name || sourceTitle;
  const japaneseTitle = searchDictionary[normalizeText(originalTitle)] || searchDictionary[normalizeText(sourceTitle)];
  return japaneseTitle?.trim() || sourceTitle.trim() || originalTitle.trim();
}

/** キャラクター辞書や概要辞書を引くときに使う、変換前の作品名。 */
export function getSourceTitle(work: Work) {
  return getWorkTitle(work);
}

/** 詳細画面で邦題と併記する、TMDB登録上の原題を返します。 */
export function getOriginalTitle(work: Work) {
  return work.original_title || work.original_name || getSourceTitle(work);
}

/** 邦題がある作品だけ、太字タイトルの下へ表示する原題を返します。 */
export function getOriginalTitleForDisplay(work: Work) {
  const displayTitle = getDisplayTitle(work);
  const originalTitle = getOriginalTitle(work).trim();
  return originalTitle && normalizeText(originalTitle) !== normalizeText(displayTitle)
    ? originalTitle
    : null;
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

/** Narrator、Narrator (voice)などを同じナレーター役として判定します。 */
function isNarratorRole(value: string) {
  return /\bnarrator\b/i.test(value) || value.includes("ナレーター");
}

/** Self、Self - Host、Himselfなどを同じ本人出演として判定します。 */
function isSelfRole(value: string) {
  return value.toLowerCase().includes("self") || value.includes("本人");
}

/** Huyangを含む英語表記と日本語表記を同じヒュイヤン役として判定します。 */
function isHuyangRole(value: string) {
  return value.toLowerCase().includes("huyang") || value.includes("ヒュイヤン");
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
    const isNarrator = isNarratorRole(rawName);
    const isSelf = isSelfRole(rawName);
    const isHuyang = isHuyangRole(rawName);
    let dictionaryKey = sourceTitle;
    let imageKey = sourceTitle;

    if (sourceTitle === "Doctor Who: 60th Anniversary Specials") {
      dictionaryKey = sourceTitle;
      imageKey = sourceTitle;
    } else if (rawName === "The Doctor" || rawName === "The Doctor (10)") {
      dictionaryKey = "10th Doctor";
      imageKey = "10th doctor";
    } else if (isSelf) {
      imageKey = "self";
    } else if (isNarrator) {
      imageKey = "narrator";
    } else if (isHuyang) {
      dictionaryKey = "スター・ウォーズ：アソーカ";
      imageKey = "Huyang";
    } else if (rawName.includes("Scrooge McDuck")) {
      dictionaryKey = "Scrooge McDuck";
      imageKey = "Scrooge McDuck";
    } else if (sourceTitle === "Nativity 2: Danger in the Manger!") {
      dictionaryKey = rawName === "Donald" ? "Donald Peterson" : "Roderick Peterson";
      imageKey = dictionaryKey;
    }

    const parsed = parseCharacterInfo(customCharacterInfo[dictionaryKey] || customCharacterInfo[sourceTitle]);
    const fallbackName = isSelf ? "本人"
      : isNarrator ? "ナレーター"
      : rawName || "役名未登録";
    const englishName = sourceTitle === "Being Considered" ? "ex-boyfriend"
      : sourceTitle === "Doctor Who: 60th Anniversary Specials" ? "14th Doctor"
      : dictionaryKey === "10th Doctor" ? "10th Doctor"
      : dictionaryKey === "Donald Peterson" ? "Donald Peterson"
      : dictionaryKey === "Roderick Peterson" ? "Roderick Peterson"
      : isSelf ? "Self"
      : isNarrator ? "Narrator"
      : isHuyang ? "Huyang"
      : rawName || dictionaryKey;
    return {
      name: isSelf ? "本人" : isNarrator ? "ナレーター" : isHuyang ? "ヒュイヤン" : parsed.name || fallbackName,
      englishName,
      image: getCharacterImage(customCharacterImages[imageKey] || customCharacterImages[sourceTitle]),
      description: isSelf ? selfCharacterDescription : parsed.description,
    };
  });
}

export function getWorkOverview(work: Work) {
  return customOverviews[getSourceTitle(work)] || work.overview || "日本語の作品紹介は準備中です。";
}

export function getWorkVideoKey(work: Work) {
  return videoOverrides[getSourceTitle(work)] || work.videoKey || null;
}
