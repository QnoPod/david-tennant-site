import { interviewCatalog } from "../data/interviews/catalog";
import type { InterviewSummary } from "../data/interviews/types";
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
    const japaneseTitle = searchDictionary[normalized];
    if (japaneseTitle) expanded.add(normalizeText(japaneseTitle));
    for (const [originalTitle, translatedTitle] of Object.entries(searchDictionary)) {
      if (normalizeText(translatedTitle) === normalized) expanded.add(normalizeText(originalTitle));
    }
  }
  return [...expanded].filter((term) => term.length >= 3);
}

/**
 * 作品名・役名とインタビューの「関連作品」タグを照合します。
 * 完全一致したタグを最優先し、見出し・紹介文での一致は補助的に使用します。
 */
export function findRelatedInterviews(terms: readonly (string | undefined)[], excludeSlug?: string, limit = 4): RelatedInterview[] {
  const needles = expandWorkTitleTerms(terms);
  if (!needles.length) return [];

  return interviewCatalog
    .filter((interview) => interview.slug !== excludeSlug)
    .map((interview) => {
      const relatedWorkTags = interview.tagGroups.genres.map(normalizeText);
      const summaryText = normalizeText(`${interview.title} ${interview.titleEn ?? ""} ${interview.description}`);
      const score = needles.reduce((total, needle) => {
        if (relatedWorkTags.includes(needle)) return total + 10;
        if (relatedWorkTags.some((tag) => tag.includes(needle) || needle.includes(tag))) return total + 5;
        return summaryText.includes(needle) ? total + 1 : total;
      }, 0);
      return { interview, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.interview.publishedDate.localeCompare(a.interview.publishedDate))
    .slice(0, limit)
    .map(({ interview }) => ({
      slug: interview.slug,
      title: interview.title,
      titleEn: interview.titleEn,
      year: interview.year,
      source: interview.source,
    }));
}
