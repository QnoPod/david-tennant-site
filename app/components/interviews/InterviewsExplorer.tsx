"use client";

import { useEffect, useMemo, useState } from "react";
import type { InterviewSummary } from "../../data/interviews/types";
import InterviewCard from "./InterviewCard";

const INITIAL_VISIBLE_COUNT = 6;
const TAG_CATEGORIES = ["actors", "genres", "sources"] as const;
type TagCategory = typeof TAG_CATEGORIES[number];

const TAG_CATEGORY_LABELS: Record<TagCategory, string> = {
  actors: "役者",
  genres: "関連作品",
  sources: "配信元",
};

/** WORKSと同じ開閉式フィルターを使う、インタビュー一覧専用の検索・絞り込みUI。 */
export default function InterviewsExplorer({ interviews }: { interviews: readonly InterviewSummary[] }) {
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState<"all" | "video" | "article">("all");
  const [year, setYear] = useState("all");
  const [tagExpanded, setTagExpanded] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Record<TagCategory, string[]>>({
    actors: [],
    genres: [],
    sources: [],
  });
  const [contentMatches, setContentMatches] = useState<string[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const years = useMemo(() => [...new Set(interviews.map((item) => item.year))].sort((a, b) => b.localeCompare(a)), [interviews]);
  // カタログへタグを追加するだけで、役者・ジャンル・配信元の選択肢へ反映します。
  const tagOptions = useMemo(() => Object.fromEntries(TAG_CATEGORIES.map((category) => [
    category,
    [...new Set(interviews.flatMap((item) => item.tagGroups[category]))].sort((a, b) => a.localeCompare(b)),
  ])) as Record<TagCategory, string[]>, [interviews]);

  // 入力が止まってから本文検索APIを呼び、長い翻訳データの常時読み込みを避けます。
  useEffect(() => {
    const needle = query.trim();
    if (!needle) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/interviews/search?q=${encodeURIComponent(needle)}`, { signal: controller.signal });
        const data = await response.json() as { slugs?: string[] };
        setContentMatches(data.slugs ?? []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setContentMatches([]);
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  const filtered = useMemo(() => {
    const needle = query.normalize("NFKC").toLowerCase().trim();
    return interviews.filter((interview) => {
      const searchable = [interview.title, interview.source, interview.description]
        .join(" ").normalize("NFKC").toLowerCase();
      const matchesMetadata = searchable.includes(needle);
      const matchesTranscript = contentMatches?.includes(interview.slug) ?? false;
      const matchesQuery = !needle || matchesMetadata || matchesTranscript;
      // WORKSと同じく同じ分類では「いずれか」を許可し、分類どうしは掛け合わせます。
      const matchesTags = TAG_CATEGORIES.every((category) => {
        const selected = selectedTags[category];
        return !selected.length || selected.some((tag) => interview.tagGroups[category].includes(tag));
      });

      return matchesQuery
        && matchesTags
        && (mediaType === "all" || interview.mediaType === mediaType)
        && (year === "all" || interview.year === year);
    });
  }, [contentMatches, interviews, mediaType, query, selectedTags, year]);

  const updateQuery = (value: string) => {
    setQuery(value); setContentMatches(null); setIsSearching(Boolean(value.trim()));
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  const toggleTag = (category: TagCategory, tag: string) => {
    setSelectedTags((current) => {
      const selected = current[category];
      return { ...current, [category]: selected.includes(tag) ? selected.filter((item) => item !== tag) : [...selected, tag] };
    });
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  const clearTagCategory = (category: TagCategory) => {
    setSelectedTags((current) => ({ ...current, [category]: [] }));
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  const clearFilters = () => {
    setQuery(""); setMediaType("all"); setYear("all"); setTagExpanded(false);
    setSelectedTags({ actors: [], genres: [], sources: [] }); setContentMatches(null); setIsSearching(false);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  return <section className="archive-section shell interview-archive">
    <div className="work-filters interview-filter-panel" aria-label="インタビューの検索と絞り込み">
      <div className="work-filters__top"><strong>インタビューを絞り込む</strong><button type="button" onClick={clearFilters}>条件をリセット</button></div>
      <div className="work-searches interview-searches">
        <label><span>⌕</span><input value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="タイトル・人物・発言内容で検索..." aria-label="タイトル・人物・発言内容で検索" />{query && <button type="button" onClick={() => updateQuery("")} aria-label="検索文字を消す">×</button>}</label>
      </div>
      <div className="work-filter-row">
        <select value={mediaType} onChange={(event) => { setMediaType(event.target.value as typeof mediaType); setVisibleCount(INITIAL_VISIBLE_COUNT); }} aria-label="種類"><option value="all">すべての種類</option><option value="video">動画</option><option value="article">記事</option></select>
        <select value={year} onChange={(event) => { setYear(event.target.value); setVisibleCount(INITIAL_VISIBLE_COUNT); }} aria-label="公開年"><option value="all">すべての公開年</option>{years.map((item) => <option key={item}>{item}</option>)}</select>
      </div>
      <button className="work-filters__expand" type="button" onClick={() => setTagExpanded((current) => !current)}>{tagExpanded ? "▲ 詳細フィルターを閉じる" : "▼ 役者・ジャンル・配信元で絞り込む"}</button>
      {tagExpanded && <div className="work-filter-details">
        {TAG_CATEGORIES.map((category) => {
          const selected = selectedTags[category];
          return <fieldset key={category}>
            <legend>{TAG_CATEGORY_LABELS[category]}で絞り込む</legend>
            <div>{tagOptions[category].map((tag) => <button className={selected.includes(tag) ? "is-active" : ""} type="button" onClick={() => toggleTag(category, tag)} key={tag}>{tag}</button>)}</div>
            {selected.length > 0 && <button className="clear-link" type="button" onClick={() => clearTagCategory(category)}>選択を全解除</button>}
          </fieldset>;
        })}
      </div>}
    </div>

    <div className="interview-results"><p><span>{filtered.length}</span> INTERVIEWS</p><small>{isSearching ? "発言内容を検索中…" : "公開年月日の新しい順"}</small></div>
    <div className="interview-grid">{filtered.slice(0, visibleCount).map((interview) => <InterviewCard interview={interview} key={interview.slug} />)}</div>
    {!filtered.length && <div className="empty-state"><p>条件に一致するインタビューがありません。</p><button type="button" onClick={clearFilters}>すべて表示する</button></div>}
    {visibleCount < filtered.length && <button className="interview-load-more" type="button" onClick={() => setVisibleCount((count) => count + INITIAL_VISIBLE_COUNT)}>さらに表示する</button>}
  </section>;
}

