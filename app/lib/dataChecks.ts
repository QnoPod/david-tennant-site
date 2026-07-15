import { existsSync } from "node:fs";
import path from "node:path";
import { episodeOverrides } from "../data/episodeOverrides";
import { DATA_CHECK_DEFINITIONS, type DataCheckKey } from "./dataCheckDefinitions";
import type { Work } from "./types";
import {
  getDisplayTitle,
  getOriginalTitle,
  getSourceTitle,
  getWorkCharacters,
  getWorkOverview,
  normalizeText,
} from "./workPresentation";

export type DataCheckIssue = {
  key: DataCheckKey;
  label: string;
  detail: string;
  editFile: string;
};

export type WorkDataCheck = {
  key: string;
  title: string;
  originalTitle: string;
  year: string;
  source: "TMDB" | "手入力";
  issues: DataCheckIssue[];
};

const PLACEHOLDER_IMAGES = new Set(["/images/default-character.jpg", "/default-character.jpg"]);
const PLACEHOLDER_DESCRIPTIONS = new Set([
  "詳細なキャラクター情報はありません。",
  "詳細情報は準備中です。",
]);

function hasJapanese(value: string) {
  return /[ぁ-んァ-ヶ一-龠々〆〤]/.test(value);
}

/** public配下のローカル画像は、パスが書かれていてもファイルがなければ未設定扱いにします。 */
function localImageExists(imagePath?: string | null) {
  if (!imagePath || PLACEHOLDER_IMAGES.has(imagePath)) return false;
  if (!imagePath.startsWith("/")) return true;
  const relativePath = decodeURIComponent(imagePath).replace(/^\/+/, "");
  if (relativePath.includes("..")) return false;
  return existsSync(path.join(process.cwd(), "public", relativePath));
}

function issue(key: DataCheckKey, detail: string): DataCheckIssue {
  const definition = DATA_CHECK_DEFINITIONS[key];
  return { key, label: definition.label, detail, editFile: definition.editFile };
}

/** 1作品のTMDB／手入力データを、画面に出る補完後の状態で検査します。 */
export function checkWorkData(work: Work): WorkDataCheck {
  const issues: DataCheckIssue[] = [];
  const title = getDisplayTitle(work);
  const sourceTitle = getSourceTitle(work);
  const originalTitle = getOriginalTitle(work);
  const characters = getWorkCharacters(work);

  const missingImages: string[] = [];
  const poster = work.posterUrl || work.poster_path;
  if (!poster || (work.posterUrl && !localImageExists(work.posterUrl))) missingImages.push("作品ポスター");
  for (const character of characters) {
    if (!localImageExists(character.image)) missingImages.push(`${character.name}の画像`);
  }
  if (missingImages.length) issues.push(issue("image", missingImages.join("、")));

  if (!hasJapanese(title)) {
    issues.push(issue("japaneseTitle", `「${originalTitle}」に対応する邦題がありません`));
  }

  const overview = getWorkOverview(work).trim();
  if (!overview || overview === "日本語の作品紹介は準備中です。") {
    issues.push(issue("overview", "日本語の作品概要がありません"));
  }

  const incompleteCharacters = characters.filter((character) =>
    !character.name.trim()
    || character.name === "役名未登録"
    || !character.description.trim()
    || PLACEHOLDER_DESCRIPTIONS.has(character.description.trim()),
  );
  if (!characters.length || incompleteCharacters.length) {
    const names = incompleteCharacters.map((character) => character.name || "役名未登録");
    issues.push(issue("characterDetail", names.length ? `${names.join("、")}の説明がありません` : "キャラクターが登録されていません"));
  }

  if (work.media_type === "tv") {
    const titleCandidates = [sourceTitle, title, originalTitle].map(normalizeText);
    const hasConfirmedEpisodes = Boolean(work.episodeAppearances?.length)
      || Object.entries(episodeOverrides).some(([registeredTitle, episodes]) =>
        titleCandidates.includes(normalizeText(registeredTitle)) && episodes.length > 0,
      );
    if (!hasConfirmedEpisodes) issues.push(issue("episodes", "出演したシーズン・話数が登録されていません"));
  }

  // undefinedは未取得、空配列は「確認済みだが日本の定額配信なし」と区別します。
  if (work.providers === undefined) {
    issues.push(issue("providers", "日本向け定額配信サービスの取得結果がありません"));
  }

  return {
    key: `${work.media_type}-${work.id}`,
    title,
    originalTitle,
    year: (work.release_date || work.first_air_date || "年不明").slice(0, 4),
    source: work.isManual ? "手入力" : "TMDB",
    issues,
  };
}

export function buildDataChecks(works: Work[]) {
  const checks = works.map(checkWorkData);
  const checksByKey = new Map(checks.map((check) => [check.key, check]));

  const appendDuplicate = (workKey: string, detail: string) => {
    const check = checksByKey.get(workKey);
    if (!check) return;
    const existing = check.issues.find((item) => item.key === "duplicate");
    if (existing) existing.detail = `${existing.detail}／${detail}`;
    else check.issues.push(issue("duplicate", detail));
  };

  // 同じメディア種別・原題・公開年の作品が複数ある場合は、TMDBと手入力の二重登録候補です。
  const workGroups = new Map<string, Work[]>();
  for (const work of works) {
    const year = (work.release_date || work.first_air_date || "").slice(0, 4);
    const identity = `${work.media_type}|${normalizeText(getOriginalTitle(work))}|${year}`;
    workGroups.set(identity, [...(workGroups.get(identity) ?? []), work]);
  }
  for (const group of workGroups.values()) {
    if (group.length < 2) continue;
    const titles = group.map((work) => `${getDisplayTitle(work)}（${work.isManual ? "手入力" : "TMDB"}）`).join("、");
    for (const work of group) appendDuplicate(`${work.media_type}-${work.id}`, `作品の重複候補：${titles}`);
  }

  // 同じ作品名と役名の組み合わせが複数作品へ紐づく場合も表記揺れ・二重登録候補として通知します。
  const characterGroups = new Map<string, Array<{ work: Work; name: string }>>();
  for (const work of works) {
    for (const character of getWorkCharacters(work)) {
      const identity = `${normalizeText(getDisplayTitle(work))}|${normalizeText(character.name)}`;
      characterGroups.set(identity, [...(characterGroups.get(identity) ?? []), { work, name: character.name }]);
    }
  }
  for (const group of characterGroups.values()) {
    const uniqueWorkKeys = new Set(group.map(({ work }) => `${work.media_type}-${work.id}`));
    if (uniqueWorkKeys.size < 2) continue;
    const detail = `キャラクターの重複候補：${group[0].name}（${getDisplayTitle(group[0].work)}）`;
    for (const workKey of uniqueWorkKeys) appendDuplicate(workKey, detail);
  }

  return checks.filter((work) => work.issues.length > 0);
}
