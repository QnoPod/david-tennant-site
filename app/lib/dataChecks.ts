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
  return works.map(checkWorkData).filter((work) => work.issues.length > 0);
}
