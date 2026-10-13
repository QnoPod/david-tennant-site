/**
 * david-tennant-site
 * 「The Genius Game / Genius Game」の WORKS に「クリエイター」を反映する。
 * - TMDB取得作品の役名・画像・詳細を既存の辞書から補完する
 * - TMDB出演クレジットに現れない場合だけ、作品を手動補完する
 * - ほかの作品の登録には触れない
 *
 * 実行: node fix_genius_game_creator.cjs
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const files = [
  'app/data/workCharacterOverrides.ts',
  'app/data/manualWorks.ts',
];
const originals = new Map();
for (const file of files) {
  const absolute = path.join(ROOT, file);
  if (!fs.existsSync(absolute)) {
    console.error(`対象ファイルが見つかりません: ${file}\nVS Codeでサイトのルートフォルダを開いて実行してください。`);
    process.exit(1);
  }
  originals.set(file, fs.readFileSync(absolute, 'utf8'));
}

const edited = new Map(originals);
function replaceUnique(file, before, after, label) {
  const input = edited.get(file);
  const start = input.indexOf(before);
  if (start === -1 || input.indexOf(before, start + before.length) !== -1) {
    throw new Error(`${file}: ${label} の位置が一意に見つかりません。コードは変更していません。`);
  }
  edited.set(file, input.slice(0, start) + after + input.slice(start + before.length));
}

try {
  const overrides = 'app/data/workCharacterOverrides.ts';
  let current = edited.get(overrides);

  // キャラクターの説明や画像は既存の定義から取得し、ここに重複記載しない。
  if (!current.includes('geniusCreatorAppearance')) {
    replaceUnique(
      overrides,
      'import type { WorkCharacter } from "../lib/types";',
      'import type { WorkCharacter } from "../lib/types";\nimport { customCharacterInfo } from "./characterDetails";\nimport { customCharacterImages } from "./characterImages";',
      '既存import',
    );
    replaceUnique(
      overrides,
      'const TENTH_DOCTOR_IMAGE = "/characters/10thDoctor.jpg";',
      `const TENTH_DOCTOR_IMAGE = "/characters/10thDoctor.jpg";

/** 番組の案内役 "The Creator" を、CHARACTERSと同じ辞書データで表示します。 */
const [geniusCreatorName, ...geniusCreatorDescription] =
  (customCharacterInfo["The Genius Game"] ?? "クリエイター\\n詳細情報は準備中です。").split("\\n");
const geniusCreatorAppearance: WorkCharacterOverride = {
  character: "The Creator",
  characters: [{
    name: geniusCreatorName || "クリエイター",
    englishName: "The Creator",
    image: customCharacterImages["The Genius Game"] || "/images/default-character.jpg",
    description: geniusCreatorDescription.join("\\n") || "詳細情報は準備中です。",
    appearanceNote: "番組の司会・進行役",
  }],
};`,
      'キャラクター辞書連携',
    );
    replaceUnique(
      overrides,
      'export const workCharacterOverrides: Record<string, WorkCharacterOverride> = {',
      `export const workCharacterOverrides: Record<string, WorkCharacterOverride> = {
  // TMDB側の表記揺れに対応し、WORKSカードにも「クリエイター」を表示する。
  "The Genius Game": geniusCreatorAppearance,
  "Genius Game": geniusCreatorAppearance,`,
      '作品別役名補正',
    );
  }

  // TMDBに出演クレジットがない場合やAPI障害時だけ追加するため、二重表示しない。
  const manual = 'app/data/manualWorks.ts';
  current = edited.get(manual);
  if (!/\bname:\s*["'](?:The Genius Game|Genius Game)["']/.test(current)) {
    if (/\bid:\s*-1201\b/.test(current)) {
      throw new Error('manualWorks.ts: ID -1201 は別の登録で使用済みです。コードは変更していません。');
    }
    replaceUnique(
      manual,
      'export const manualWorks: Work[] = [',
      `export const manualWorks: Work[] = [
  // TMDBの出演クレジットにない場合のみ表示する予備データ。
  // 役名・画像・説明は workCharacterOverrides.ts から取得します。
  {
    id: -1201,
    isManual: true,
    addOnlyIfMissing: true,
    media_type: "tv",
    name: "The Genius Game",
    original_name: "Genius Game",
    first_air_date: "2025-04-30",
    character: "The Creator",
    numberOfEpisodes: 8,
    episodeRunTime: 53,
    providers: [],
  },`,
      '手動作品一覧',
    );
  }

  // 処理完了までファイルには触れず、検証を終えてから一括書き込み。
  const candidateOverrides = edited.get(overrides);
  const candidateManual = edited.get(manual);
  for (const marker of [
    '"The Genius Game": geniusCreatorAppearance',
    '"Genius Game": geniusCreatorAppearance',
    'customCharacterInfo["The Genius Game"]',
    'customCharacterImages["The Genius Game"]',
  ]) {
    if (!candidateOverrides.includes(marker)) throw new Error(`${marker} が見つかりません。変更中止。`);
  }
  if (!/\bname:\s*["'](?:The Genius Game|Genius Game)["']/.test(candidateManual)) {
    throw new Error('作品データを確認できません。変更中止。');
  }

  let writes = 0;
  for (const file of files) {
    const before = originals.get(file);
    const after = edited.get(file);
    if (before === after) continue;
    fs.writeFileSync(path.join(ROOT, file), after, 'utf8');
    console.log(`更新: ${file}`);
    writes++;
  }
  if (!writes) console.log('変更不要: すでに登録済みです。');
  else console.log('完了: 『The Genius Game』のクリエイターをWORKSに紐づけました。');
  console.log('次に npm run build で動作確認してください。');
} catch (error) {
  console.error(`変更を中止しました: ${error.message}`);
  process.exit(1);
}
