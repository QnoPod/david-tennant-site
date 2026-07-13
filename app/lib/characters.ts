import { characterAttributes } from "../data/characterAttributes";
import { customCharacterInfo } from "../data/characterDetails";
import { customCharacterImages } from "../data/characterImages";
import { searchDictionary } from "../data/searchDictionary";
import { yearOverrides } from "../data/yearOverrides";
import { getWorkDate, getWorkTitle } from "./tmdb";
import type { Character, Work } from "./types";
import { getDisplayTitle, getWorkCharacters } from "./workPresentation";

/** 「役名\n説明文」という既存データを、表示に使いやすい形に分割します。 */
function parseInfo(raw: string) {
  const [firstLine, ...rest] = raw.trim().split("\n");
  if (rest.length) return { name: firstLine.trim(), description: rest.join("\n").trim() };
  const colon = raw.indexOf("：");
  return colon >= 0
    ? { name: raw.slice(0, colon).trim(), description: raw.slice(colon + 1).trim() }
    : { name: raw.trim(), description: "" };
}

function normalize(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/[\s・=\-.,:;!?"'()[\]{}~～＆&]/g, "");
}

const DAVID_BIRTH_DATE = { year: 1971, month: 4, day: 18 } as const;

/** 公開年月日と1971年4月18日の差から、公開日時点の満年齢を算出します。 */
function calculateAge(releaseDate: string, year: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(releaseDate) && releaseDate.startsWith(`${year}-`)) {
    const [releaseYear, releaseMonth, releaseDay] = releaseDate.split("-").map(Number);
    const birthdayPassed = releaseMonth > DAVID_BIRTH_DATE.month
      || (releaseMonth === DAVID_BIRTH_DATE.month && releaseDay >= DAVID_BIRTH_DATE.day);
    return releaseYear - DAVID_BIRTH_DATE.year - (birthdayPassed ? 0 : 1);
  }
  // 月日を取得できない作品は、その年に迎える年齢を表示します。
  return /^\d{4}$/.test(year) ? Number(year) - DAVID_BIRTH_DATE.year : null;
}

/** 旧サイトの辞書群を、画面側が扱う単一のCharacter配列に変換します。 */
export function getCharacters(works: Work[] = []): Character[] {
  // WORKSと同じ変換関数で役名を作り、両ページの紐づけを一本化します。
  const workCatalog = works.map((work) => ({
    work,
    titles: [getWorkTitle(work), getDisplayTitle(work)].map(normalize),
    characters: getWorkCharacters(work),
  }));

  const dictionaryCharacters = Object.entries(customCharacterInfo).map(([workTitle, raw]) => {
    const parsed = parseInfo(raw);
    const imageKey = parsed.name.includes("10代目") ? "10th doctor"
      : parsed.name.includes("14代目") ? "Doctor Who: 60th Anniversary Specials"
      : parsed.name.includes("スクルージ") ? "Scrooge McDuck"
      : workTitle;
    // characterImages.ts のパスは public 配下を指すローカルURLです。
    const imagePath = customCharacterImages[imageKey] || customCharacterImages[workTitle];
    const defaultDisplayTitle = searchDictionary[normalize(workTitle)] || workTitle;
    const matched = workCatalog.find((entry) =>
      entry.titles.includes(normalize(workTitle))
      || entry.titles.includes(normalize(defaultDisplayTitle))
      || entry.characters.some((character) => normalize(character.name) === normalize(parsed.name)),
    );
    const matchedWork = matched?.work;
    const matchingCharacter = matched?.characters.find((character) => normalize(character.name) === normalize(parsed.name));

    // 旧サイトで個別指定していた作品名を、WORKS側と同じ規則で表示します。
    const displayWorkTitle = parsed.name.includes("10代目ドクター") ? "Doctor Whoシリーズ"
      : parsed.name.includes("スクルージ・マクダック") ? "ディズニー作品"
      : ["ドナルド・ピーターソン", "ロデリック・ピーターソン"].includes(parsed.name) ? "Nativity 2: Danger in the Manger!"
      : matchedWork ? getDisplayTitle(matchedWork)
      : defaultDisplayTitle;

    const englishName = matchingCharacter?.englishName
      || (parsed.name.includes("10代目ドクター") ? "10th Doctor"
        : parsed.name.includes("14代目ドクター") ? "14th Doctor"
        : parsed.name.includes("スクルージ・マクダック") ? "Scrooge McDuck"
        : parsed.name === "ドナルド・ピーターソン" ? "Donald Peterson"
        : parsed.name === "ロデリック・ピーターソン" ? "Roderick Peterson"
        : "");
    const isTenthDoctor = parsed.name.includes("10代目ドクター");
    // 10代目ドクターは初登場年を基準にし、別のDoctor Who作品へ誤って紐づいても2005年を維持します。
    const year = isTenthDoctor ? "2005"
      : yearOverrides[workTitle] || (matchedWork ? getWorkDate(matchedWork).slice(0, 4) : "年不明");
    const releaseDate = isTenthDoctor ? "2005-12-25" : matchedWork ? getWorkDate(matchedWork) : "";
    const age = isTenthDoctor ? 34 : calculateAge(releaseDate, year);
    return {
      key: `${workTitle}-${parsed.name}`,
      workTitle,
      displayWorkTitle,
      name: parsed.name || "役名未登録",
      englishName,
      description: parsed.description || "詳細情報は準備中です。",
      image: imagePath || "/images/default-character.jpg",
      year,
      age,
      attributes: (characterAttributes[parsed.name] || "").split(/[,、/]/).map((item) => item.trim()).filter(Boolean),
    };
  });

  // manualWorks.tsの役柄も、WORKSと同じ作品名・公開日を使ってCHARACTERSへ追加します。
  const manualCharacters: Character[] = works.filter((work) => work.isManual && !work.excludeFromCharacters).flatMap((work) => {
    const year = getWorkDate(work).slice(0, 4) || "年不明";
    return getWorkCharacters(work).map((character, index) => ({
      key: `manual-${work.id}-${index}`,
      workTitle: getWorkTitle(work),
      displayWorkTitle: getDisplayTitle(work),
      name: character.name,
      englishName: character.englishName,
      description: character.description,
      image: character.image || "/images/default-character.jpg",
      year,
      age: calculateAge(getWorkDate(work), year),
      attributes: character.attributes
        ?? (characterAttributes[character.name] || "").split(/[,、/]/).map((item) => item.trim()).filter(Boolean),
    }));
  });

  const unique = new Map<string, Character>();
  for (const character of [...dictionaryCharacters, ...manualCharacters]) {
    unique.set(`${normalize(character.name)}-${normalize(character.displayWorkTitle)}`, character);
  }

  return [...unique.values()].sort((a, b) => {
    const yearA = /^\d{4}$/.test(a.year) ? Number(a.year) : 0;
    const yearB = /^\d{4}$/.test(b.year) ? Number(b.year) : 0;
    if (yearA !== yearB) return yearB - yearA;
    // 同じ公開年では年齢の高い役を先にし、若い役ほど下に表示します。
    return (b.age ?? -1) - (a.age ?? -1);
  });
}
