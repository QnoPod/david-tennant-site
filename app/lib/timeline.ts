import { careerTimeline } from "../data/content";
import { episodeOverrides } from "../data/episodeOverrides";
import { getPublishedInterviews } from "../data/interviews/catalog";
import { getDisplayTitle, getOriginalTitle, getWorkCharacters, normalizeText } from "./workPresentation";
import { getMediaLabel, getWorkDate } from "./tmdb";
import type { Character, ConventionAppearance, Work } from "./types";

export type TimelineEventType = "work" | "character" | "appearance" | "interview" | "convention" | "milestone";

/** クライアントへ渡す情報を表示に必要な項目だけに限定します。 */
export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  date: string;
  dateLabel: string;
  year: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  searchText: string;
};

function formatDate(date: string, fallback: string) {
  return /^[1-9]\d{3}-\d{2}-\d{2}$/.test(date) ? date.replaceAll("-", ".") : fallback;
}

function getKnownYear(date: string) {
  const year = date.slice(0, 4);
  return /^[1-9]\d{3}$/.test(year) ? year : "年不明";
}

/** Comiconomiconの「3 - 7 Sep, 2026」形式から開始日を取得します。 */
function parseConventionDate(value: string) {
  const months: Record<string, string> = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
  const match = value.match(/(\d{1,2})(?:\s*-\s*\d{1,2})?\s+([A-Z][a-z]{2}),?\s+(\d{4})/);
  if (!match || !months[match[2]]) return "0000-00-00";
  return `${match[3]}-${months[match[2]]}-${match[1].padStart(2, "0")}`;
}

/** WORKS・CHARACTERS・出演回・INTERVIEWS・COMIC CON・節目を単一の日付軸へ変換します。 */
export function buildTimelineEvents(works: Work[], characters: Character[], conventions: ConventionAppearance[]): TimelineEvent[] {
  const workEvents: TimelineEvent[] = works.map((work) => {
    const sourceDate = getWorkDate(work);
    const year = getKnownYear(sourceDate);
    const date = year === "年不明" ? "0000-00-00" : sourceDate;
    const title = getDisplayTitle(work);
    const originalTitle = getOriginalTitle(work);
    const roles = getWorkCharacters(work).map((character) => character.name).join(" / ");
    return {
      id: `work-${work.media_type}-${work.id}`,
      type: "work",
      date,
      dateLabel: formatDate(date, year),
      year,
      title,
      subtitle: `${getMediaLabel(work.media_type)} · ${normalizeText(title) === normalizeText(originalTitle) ? roles : originalTitle}`,
      description: roles ? `役名：${roles}` : "出演作品",
      href: `/works?q=${encodeURIComponent(title)}`,
      searchText: `${title} ${originalTitle} ${roles}`,
    };
  });

  const characterEvents: TimelineEvent[] = characters.map((character) => ({
    id: `character-${character.key}`,
    type: "character",
    date: /^[1-9]\d{3}-\d{2}-\d{2}$/.test(character.date) ? character.date : (/^[1-9]\d{3}$/.test(character.year) ? `${character.year}-01-01` : "0000-00-00"),
    dateLabel: formatDate(character.date, character.year),
    year: character.year,
    title: character.name,
    subtitle: character.englishName || "CHARACTER",
    description: `${character.displayWorkTitle}${character.age !== null ? ` · 当時${character.age}歳` : ""}`,
    href: `/characters?q=${encodeURIComponent(character.name)}`,
    searchText: `${character.name} ${character.englishName} ${character.workTitle} ${character.displayWorkTitle}`,
  }));

  const appearanceEventsRaw: TimelineEvent[] = Object.entries(episodeOverrides).flatMap(([workTitle, episodes]) => episodes
    .filter((episode) => /^\d{4}-\d{2}-\d{2}$/.test(episode.airDate ?? ""))
    .map((episode) => ({
      id: `appearance-${workTitle}-${episode.seasonNumber}-${episode.episodeNumber}-${episode.airDate}`,
      type: "appearance" as const,
      date: episode.airDate!,
      dateLabel: formatDate(episode.airDate!, episode.airDate!.slice(0, 4)),
      year: episode.airDate!.slice(0, 4),
      title: episode.title || episode.displayLabel || workTitle,
      subtitle: `${workTitle} · ${episode.displayLabel || `S${episode.seasonNumber} E${episode.episodeNumber}`}`,
      description: episode.character ? `出演：${episode.character}` : "出演回",
      href: `/works?q=${encodeURIComponent(workTitle)}`,
      searchText: `${workTitle} ${episode.title ?? ""} ${episode.originalTitle ?? ""} ${episode.character ?? ""}`,
    })));
  // 同じ授賞式などが別名の作品キーにも登録されている場合は、日付・見出し・役割で一件にまとめます。
  const appearanceEvents = [...new Map(appearanceEventsRaw.map((event) => [
    `${event.date}-${normalizeText(event.title)}-${normalizeText(event.description)}`,
    event,
  ])).values()];

  const interviewEvents: TimelineEvent[] = getPublishedInterviews().map((interview) => ({
    id: `interview-${interview.slug}`,
    type: "interview",
    date: interview.publishedDate,
    dateLabel: formatDate(interview.publishedDate, interview.year),
    year: interview.year,
    title: interview.title,
    subtitle: `${interview.mediaType === "video" ? "VIDEO" : "ARTICLE"} · ${interview.source}`,
    description: interview.titleEn || interview.description,
    href: `/interviews/${interview.slug}`,
    searchText: `${interview.title} ${interview.titleEn ?? ""} ${interview.source} ${interview.description} ${interview.tagGroups.genres.join(" ")} ${interview.tagGroups.actors.join(" ")}`,
  }));

  const conventionEvents: TimelineEvent[] = conventions.map((event, index) => {
    const date = event.appearanceDate && /^\d{4}-\d{2}-\d{2}$/.test(event.appearanceDate) ? event.appearanceDate : parseConventionDate(event.date);
    const statusLabel = event.status === "cancelled"
      ? "CANCELLED COMIC CON / APPEARANCE"
      : event.status === "announced"
        ? "ANNOUNCED COMIC CON / APPEARANCE"
        : event.isHistorical
          ? "PAST COMIC CON / APPEARANCE"
          : "UPCOMING COMIC CON / APPEARANCE";
    return {
      id: `convention-${index}-${event.name}-${event.date}`,
      type: "convention",
      date,
      dateLabel: event.appearanceLabel || event.date,
      year: date.slice(0, 4) === "0000" ? "年不明" : date.slice(0, 4),
      title: event.name,
      subtitle: statusLabel,
      description: event.statusNote ? `${event.venue} · ${event.statusNote}` : event.venue,
      href: "/comic-con",
      searchText: `${event.name} ${event.date} ${event.venue} ${event.statusNote ?? ""}`,
    };
  });

  const milestoneEvents: TimelineEvent[] = careerTimeline.map((event) => ({
    id: `milestone-${event.year}-${event.title}`,
    type: "milestone",
    date: `${event.year}-01-01`,
    dateLabel: event.year,
    year: event.year,
    title: event.title,
    subtitle: "CAREER MILESTONE",
    description: event.text,
    href: "/profile",
    searchText: `${event.title} ${event.text}`,
  }));

  return [...workEvents, ...characterEvents, ...appearanceEvents, ...interviewEvents, ...conventionEvents, ...milestoneEvents]
    .sort((a, b) => b.date.localeCompare(a.date));
}
