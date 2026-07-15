import type { InterviewSummary } from "../data/interviews/types";
import type { Character, ConventionAppearance, UpcomingWork, Work } from "./types";
import { getMediaLabel, getWorkDate } from "./tmdb";
import { getDisplayTitle, getOriginalTitle, getWorkCharacters, getWorkOverview } from "./workPresentation";

export type GlobalSearchCategory = "works" | "characters" | "interviews" | "conventions" | "upcoming";

export type GlobalSearchItem = {
  key: string;
  category: GlobalSearchCategory;
  title: string;
  originalTitle?: string;
  meta: string;
  description: string;
  href: string;
  searchText: string;
};

/** 各データ形式を、本文を含まない軽量な横断検索レコードへ変換します。 */
export function buildGlobalSearchItems({
  works,
  characters,
  interviews,
  conventions,
  upcoming,
}: {
  works: Work[];
  characters: Character[];
  interviews: readonly InterviewSummary[];
  conventions: ConventionAppearance[];
  upcoming: UpcomingWork[];
}): GlobalSearchItem[] {
  const workItems = works.map((work) => {
    const title = getDisplayTitle(work);
    const originalTitle = getOriginalTitle(work);
    const roles = getWorkCharacters(work).flatMap((character) => [character.name, character.englishName]);
    const description = getWorkOverview(work);
    return {
      key: `work-${work.media_type}-${work.id}`,
      category: "works" as const,
      title,
      originalTitle: originalTitle !== title ? originalTitle : undefined,
      meta: `${getWorkDate(work).slice(0, 4) || "年不明"} · ${getMediaLabel(work.media_type)}`,
      description,
      href: `/works?q=${encodeURIComponent(title)}`,
      searchText: [title, originalTitle, description, ...roles, ...(work.genres?.map((genre) => genre.name) ?? [])].join(" "),
    };
  });

  const characterItems = characters.map((character) => ({
    key: `character-${character.key}`,
    category: "characters" as const,
    title: character.name,
    originalTitle: character.englishName || undefined,
    meta: `${character.year} · ${character.displayWorkTitle}`,
    description: character.description,
    href: `/characters?q=${encodeURIComponent(character.name)}`,
    searchText: [character.name, character.englishName, character.workTitle, character.displayWorkTitle, character.description, ...character.attributes].join(" "),
  }));

  const interviewItems = interviews.map((interview) => ({
    key: `interview-${interview.slug}`,
    category: "interviews" as const,
    title: interview.title,
    originalTitle: interview.titleEn,
    meta: `${interview.publishedDate.replaceAll("-", ".")} · ${interview.source}`,
    description: interview.description,
    href: `/interviews/${interview.slug}`,
    searchText: [interview.title, interview.titleEn, interview.source, interview.description, ...interview.tagGroups.actors, ...interview.tagGroups.genres, ...interview.tagGroups.sources].filter(Boolean).join(" "),
  }));

  const conventionItems = conventions.map((event, index) => ({
    key: `convention-${event.name}-${event.appearanceDate || index}`,
    category: "conventions" as const,
    title: event.name,
    meta: `${event.appearanceDate || event.date} · ${event.country}`,
    description: [event.venue, event.organizer, event.statusNote].filter(Boolean).join(" · "),
    href: "/comic-con",
    searchText: [event.name, event.venue, event.country, event.organizer, event.statusNote].filter(Boolean).join(" "),
  }));

  const upcomingItems = upcoming.map((work) => ({
    key: `upcoming-${work.key}`,
    category: "upcoming" as const,
    title: work.title,
    originalTitle: work.originalTitle,
    meta: `${work.releaseDate || "日程未定"} · ${work.source}`,
    description: work.overview || "詳細情報は発表され次第追加します。",
    href: "/upcoming",
    searchText: [work.title, work.originalTitle, work.character, work.overview, work.source].filter(Boolean).join(" "),
  }));

  return [...workItems, ...characterItems, ...interviewItems, ...conventionItems, ...upcomingItems];
}
