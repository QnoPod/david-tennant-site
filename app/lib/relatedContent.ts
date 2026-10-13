import { getPublishedInterviews } from "../data/interviews/catalog";
import { getInterviewTagGroup, type InterviewSummary } from "../data/interviews/types";
import { searchDictionary } from "../data/searchDictionary";
import { normalizeText } from "./workPresentation";

/** 関連欄へ渡すインタビューは、本文を含まない軽量カタログだけを使用します。 */
export type RelatedInterview = Pick<InterviewSummary, "slug" | "title" | "titleEn" | "year" | "source">;

/** searchDictionary.tsを逆引きし、原題・邦題のどちらからでも同じ作品へ到達できる語群を作ります。 */
function expandWorkTitleTerms(terms: readonly (string | undefined)[]) {
  const expanded = new Set<string>();
  for (const term of terms) {
    if (!term) continue;
    const normalized = normalizeText(term);
    expanded.add(normalized);
    if (normalized === normalizeText("TIME シリーズ3")) {
      expanded.add(normalizeText("Time Series 3"));
      expanded.add(normalizeText("Time Season 3"));
    }
    const japaneseTitle = searchDictionary[normalized];
    if (japaneseTitle) expanded.add(normalizeText(japaneseTitle));
    for (const [originalTitle, translatedTitle] of Object.entries(searchDictionary)) {
      if (normalizeText(translatedTitle) === normalized) expanded.add(normalizeText(originalTitle));
    }
  }
  return [...expanded].filter((term) => term.length >= 3);
}

/**
 * 関連インタビューは、関連作品タグ（tagGroups.genres）との完全一致のみで判定します。
 * 見出し・本文・媒体名の文字列一致は使用しません。
 * 邦題・原題は expandWorkTitleTerms で正規化・照合します。
 */
export function findRelatedInterviews(
  terms: readonly (string | undefined)[],
  excludeSlug?: string,
  limit = 4,
): RelatedInterview[] {
  const needles = new Set(expandWorkTitleTerms(terms));
  if (!needles.size) return [];

  return getPublishedInterviews()
    .filter((interview) => interview.slug !== excludeSlug)
    .filter((interview) => getInterviewTagGroup(interview.tagGroups, "genres")
      .some((tag) => needles.has(normalizeText(tag))))
    .sort((a, b) => b.publishedDate.localeCompare(a.publishedDate))
    .slice(0, limit)
    .map((interview) => ({
      slug: interview.slug,
      title: interview.title,
      titleEn: interview.titleEn,
      year: interview.year,
      source: interview.source,
    }));
}
