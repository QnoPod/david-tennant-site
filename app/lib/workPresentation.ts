import { customCharacterInfo, customRoleInfo, narratorCharacterDescription, selfCharacterDescription } from "../data/characterDetails";
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
  return /\bnarrator\b/i.test(value)
    || /^\s*david\s+tennant\s*\(voice\)\s*$/i.test(value)
    || value.includes("ナレーター");
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
 * TMDBの英語役名から、手入力したキャラクター説明・画像の作品キーを取得します。
 * 作品名の表記がTMDBと日本語辞書で異なる場合も、WORKSの詳細へ確実に反映します。
 */
function getCharacterDictionaryKeyByRole(value: string) {
  const normalized = normalizeText(value);
  if (normalized.includes("crowley") || normalized.includes("クロウリー")) return "グッド・オーメンズ";
  if (normalized.includes("buckdouglas")) return "Fireman Sam: Alien Alert! The Movie";
  if (normalized.includes("igorthedoor") || normalized.includes("ドアのイゴール")) {
    return "ミッキーマウス クラブハウス／ミッキーのモンスターミュージカル";
  }
  if (normalized.includes("tychoreeves") || normalized.includes("tycoreeves")) return "サンダーバード ARE GO";
  if (normalized.startsWith("wilf")) return "Postman Pat: The Movie";
  if (normalized.includes("fugitoid")) return "ミュータント タートルズ";
  if (normalized.startsWith("twigs")) return "Tree Fu Tom";
  if (normalized.includes("oscarsbrain") || normalized.includes("オスカーの脳")) return "スイチュー! フレンズ";
  return null;
}

/** 14th Doctorの英語表記を既存の14代目ドクターへ統一します。 */
function isFourteenthDoctorRole(value: string) {
  const normalized = value.normalize("NFKC").replace(/\s+/g, " ").trim();
  return /^14th doctor$/i.test(normalized) || normalized.includes("14代目ドクター");
}

/**
 * TMDBの日本語タイトル・原題・予備データのどれを使っていても、
 * デイヴィッドが14代目ドクターを演じる2023年の特別編を判定します。
 */
function isFourteenthDoctorWork(work: Work) {
  if (work.id === 241855) return true;

  const titles = [getSourceTitle(work), work.title, work.name, work.original_title, work.original_name]
    .filter((title): title is string => Boolean(title))
    .map((title) => normalizeText(title));

  return titles.some((title) =>
    title.includes("doctorwho60thanniversaryspecials")
    || title.includes("doctorwhochildreninneedspecial2023")
    || title.includes("ドクターフー60周年スペシャル")
    || title.includes("ドクターフーチルドレンインニードスペシャル2023"),
  );
}

/** 過去映像で登場するドクターを、通常出演のドクター役と区別します。 */
export function isArchiveDoctorRole(value: string) {
  const normalized = value.normalize("NFKC").replace(/\s+/g, " ").trim();
  return (/\bthe doctor\b/i.test(normalized) && /\barchive footage\b/i.test(normalized))
    || normalized.includes("ドクター（アーカイブ映像）");
}

/** 複数作品で共通利用するキャラクター画像の役名キーを返します。 */
export function getSharedRoleImageKey(...values: string[]) {
  const normalized = normalizeText(values.join(" "));
  if (normalized.includes("spitelout") || normalized.includes("スピテルアウト")) return "Spitelout";
  if (normalized.includes("ivarthewhitless") || normalized.includes("アイヴァーザウィットレス")) return "Ivar the Whitless";
  return null;
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
  const isFourteenthDoctorSpecial = isFourteenthDoctorWork(work);

  // 手入力キャラクターにも、複数作品で共通利用する役名別画像を適用します。
  if (work.manualCharacters?.length) {
    const manualCharacters = work.manualCharacters.map((character) => {
      const sharedImageKey = getSharedRoleImageKey(character.name, character.englishName);
      if (!sharedImageKey) return character;
      const roleInfo = parseCharacterInfo(customRoleInfo[sharedImageKey]);
      return {
        ...character,
        name: roleInfo.name || character.name,
        image: getCharacterImage(customCharacterImages[sharedImageKey]),
        description: roleInfo.description || character.description,
      };
    });
    if (!isFourteenthDoctorSpecial) return manualCharacters;
    const fourteenthDoctor = parseCharacterInfo(customCharacterInfo["Doctor Who: 60th Anniversary Specials"]);
    return manualCharacters.map((character) => ({
      ...character,
      name: "14代目ドクター",
      englishName: "14th Doctor",
      image: getCharacterImage(customCharacterImages["Doctor Who: 60th Anniversary Specials"]),
      description: fourteenthDoctor.description || character.description,
    }));
  }

  const sourceTitle = getSourceTitle(work);
  const rawCharacter = work.character || "";
  const normalizedRawCharacter = normalizeText(rawCharacter);
  const hasSpiteloutAndIvar = normalizedRawCharacter.includes("spitelout")
    && normalizedRawCharacter.includes("ivarthewhitless");
  const rawParts = sourceTitle === "Nativity 2: Danger in the Manger!" || hasSpiteloutAndIvar
    ? rawCharacter.split("/")
    : [rawCharacter];

  return rawParts.map((part) => {
    const rawName = part.trim();
    const isNarrator = isNarratorRole(rawName);
    const isSelf = isSelfRole(rawName);
    const isHuyang = isHuyangRole(rawName);
    const isFourteenthDoctor = isFourteenthDoctorRole(rawName) || isFourteenthDoctorSpecial;
    const isArchiveDoctor = isArchiveDoctorRole(rawName);
    const sharedImageKey = getSharedRoleImageKey(rawName);
    const roleDictionaryKey = getCharacterDictionaryKeyByRole(rawName);
    let dictionaryKey = sourceTitle;
    let imageKey = sourceTitle;

    if (sharedImageKey) {
      imageKey = sharedImageKey;
    } else if (roleDictionaryKey) {
      dictionaryKey = roleDictionaryKey;
      imageKey = roleDictionaryKey;
    } else if (isArchiveDoctor) {
      imageKey = "archive doctor";
    } else if (isFourteenthDoctor) {
      dictionaryKey = "Doctor Who: 60th Anniversary Specials";
      imageKey = "Doctor Who: 60th Anniversary Specials";
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

    const parsed = parseCharacterInfo(
      (sharedImageKey ? customRoleInfo[sharedImageKey] : undefined)
      || customCharacterInfo[dictionaryKey]
      || customCharacterInfo[sourceTitle],
    );
    const fallbackName = isArchiveDoctor ? "ドクター（アーカイブ映像）"
      : isFourteenthDoctor ? "14代目ドクター"
      : isSelf ? "本人"
      : isNarrator ? "ナレーター"
      : rawName || "役名未登録";
    const englishName = sourceTitle === "Being Considered" ? "ex-boyfriend"
      : isArchiveDoctor ? rawName
      : isFourteenthDoctor ? "14th Doctor"
      : dictionaryKey === "10th Doctor" ? "10th Doctor"
      : dictionaryKey === "Donald Peterson" ? "Donald Peterson"
      : dictionaryKey === "Roderick Peterson" ? "Roderick Peterson"
      : dictionaryKey === "グッド・オーメンズ" ? "Crowley"
      : isSelf ? "Self"
      : isNarrator ? "Narrator"
      : isHuyang ? "Huyang"
      : rawName || dictionaryKey;
    return {
      name: isArchiveDoctor ? "ドクター（アーカイブ映像）"
        : isFourteenthDoctor ? "14代目ドクター"
        : isSelf ? "本人"
        : isNarrator ? "ナレーター"
        : isHuyang ? "ヒュイヤン"
        : parsed.name || fallbackName,
      englishName,
      image: getCharacterImage(customCharacterImages[imageKey] || customCharacterImages[sourceTitle]),
      description: isSelf ? selfCharacterDescription
        : isNarrator ? narratorCharacterDescription
        : parsed.description,
    };
  });
}

export function getWorkOverview(work: Work) {
  return customOverviews[getSourceTitle(work)] || work.overview || "日本語の作品紹介は準備中です。";
}

export function getWorkVideoKey(work: Work) {
  return videoOverrides[getSourceTitle(work)] || work.videoKey || null;
}
