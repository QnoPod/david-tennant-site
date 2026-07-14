import { characterAttributes } from "../data/characterAttributes";
import { customCharacterInfo } from "../data/characterDetails";
import { customCharacterImages } from "../data/characterImages";
import { episodeOverrides } from "../data/episodeOverrides";
import { searchDictionary } from "../data/searchDictionary";
import { yearOverrides } from "../data/yearOverrides";
import { getWorkDate, getWorkTitle } from "./tmdb";
import type { Character, EpisodeAppearance, Work, WorkCharacter } from "./types";
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

/** 出演回の放送日（取得できない場合は作品公開日）と1971年4月18日の差から満年齢を算出します。 */
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

/** 作品名の候補を使い、作品へ直接設定した出演回または補完データを取得します。 */
function getEpisodeAppearances(work: Work) {
  if (work.episodeAppearances?.length) return work.episodeAppearances;
  const titles = [work.title, work.name, work.original_title, work.original_name, getWorkTitle(work), getDisplayTitle(work)]
    .filter((title): title is string => Boolean(title));
  return titles.map((title) => episodeOverrides[title]).find((episodes) => episodes?.length) ?? [];
}

/**
 * 同じ作品に複数の役・出演回がある場合は役名が一致する最初の回を優先します。
 * 役名を照合できない場合も、確認済み出演回のうち最も早い放送日を使用します。
 */
function getFirstAppearanceDate(
  appearances: readonly EpisodeAppearance[],
  character?: Pick<WorkCharacter, "name" | "englishName">,
  fallbackCharacter = "",
) {
  const dated = appearances
    .filter((episode): episode is EpisodeAppearance & { airDate: string } => /^\d{4}-\d{2}-\d{2}$/.test(episode.airDate ?? ""))
    .sort((a, b) => a.airDate.localeCompare(b.airDate));
  if (!dated.length) return "";

  const characterNames = [character?.name, character?.englishName, fallbackCharacter]
    .filter((name): name is string => Boolean(name))
    .map(normalize);
  const matched = dated.find((episode) => {
    const episodeCharacter = normalize(episode.character ?? "");
    return episodeCharacter && characterNames.some((name) => name && (episodeCharacter.includes(name) || name.includes(episodeCharacter)));
  });
  return (matched ?? dated[0]).airDate;
}

/** 旧サイトの辞書群を、画面側が扱う単一のCharacter配列に変換します。 */
export function getCharacters(works: Work[] = []): Character[] {
  // WORKSと同じ変換関数で役名を作り、両ページの紐づけを一本化します。
  const workCatalog = works.map((work) => ({
    work,
    titles: [getWorkTitle(work), getDisplayTitle(work), work.original_title, work.original_name]
      .filter((title): title is string => Boolean(title))
      .map(normalize),
    characters: getWorkCharacters(work),
    appearances: getEpisodeAppearances(work),
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
    const matchedEntries = workCatalog.filter((entry) =>
      entry.titles.includes(normalize(workTitle))
      || entry.titles.includes(normalize(defaultDisplayTitle))
      || entry.characters.some((character) => normalize(character.name) === normalize(parsed.name)),
    );
    const matched = matchedEntries[0];
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
    const appearanceDate = matched
      ? getFirstAppearanceDate(matched.appearances, matchingCharacter, matchedWork?.character)
      : "";
    // 10代目ドクターは初登場日を基準にし、別のDoctor Who作品へ誤って紐づいても2005年を維持します。
    const year = isTenthDoctor ? "2005"
      : appearanceDate.slice(0, 4) || yearOverrides[workTitle] || (matchedWork ? getWorkDate(matchedWork).slice(0, 4) : "年不明");
    const releaseDate = isTenthDoctor ? "2005-12-25" : appearanceDate || (matchedWork ? getWorkDate(matchedWork) : "");
    const age = isTenthDoctor ? 34 : calculateAge(releaseDate, year);
    return {
      key: `${workTitle}-${parsed.name}`,
      workIds: [...new Set(matchedEntries.map((entry) => entry.work.id))],
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

  // manualWorks.tsの役柄も、出演回があればその放送日、なければ作品公開日を使います。
  const manualCharacters: Character[] = works.filter((work) => work.isManual && !work.excludeFromCharacters).flatMap((work) => {
    const appearances = getEpisodeAppearances(work);
    return getWorkCharacters(work).map((character, index) => {
      const appearanceDate = getFirstAppearanceDate(appearances, character, work.character);
      const referenceDate = appearanceDate || getWorkDate(work);
      const year = referenceDate.slice(0, 4) || "年不明";
      return {
        key: `manual-${work.id}-${index}`,
        workIds: [work.id],
        workTitle: getWorkTitle(work),
        displayWorkTitle: getDisplayTitle(work),
        name: character.name,
        englishName: character.englishName,
        description: character.description,
        image: character.image || "/images/default-character.jpg",
        year,
        age: calculateAge(referenceDate, year),
        attributes: character.attributes
          ?? (characterAttributes[character.name] || "").split(/[,、/]/).map((item) => item.trim()).filter(Boolean),
      };
    });
  });

  const unique = new Map<string, Character>();
  for (const character of [...dictionaryCharacters, ...manualCharacters]) {
    unique.set(`${normalize(character.name)}-${normalize(character.displayWorkTitle)}`, character);
  }

  return [...unique.values()].sort((a, b) => {
    const yearA = /^\d{4}$/.test(a.year) ? Number(a.year) : 0;
    const yearB = /^\d{4}$/.test(b.year) ? Number(b.year) : 0;
    if (yearA !== yearB) return yearB - yearA;
    // 同じ出演年では年齢の高い役を先にし、若い役ほど下に表示します。
    return (b.age ?? -1) - (a.age ?? -1);
  });
}
