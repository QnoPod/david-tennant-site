"use client";

import { useEffect, useMemo, useState } from "react";
import type { InterviewSummary } from "../../data/interviews/types";
import InterviewCard from "./InterviewCard";

const INITIAL_VISIBLE_COUNT = 6;

/** インタビューが増えても目的の記事を探せる、一覧専用の検索・絞り込みUI。 */
export default function InterviewsExplorer({ interviews }: { interviews: readonly InterviewSummary[] }) {
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState<"all" | "video" | "article">("all");
  const [year, setYear] = useState("all");
  const [contentMatches, setContentMatches] = useState<string[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const years = useMemo(() => [...new Set(interviews.map((item) => item.year))].sort((a, b) => b.localeCompare(a)), [interviews]);

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
      const searchable = [interview.title, interview.source, interview.description, ...interview.tags]
        .join(" ").normalize("NFKC").toLowerCase();
      const matchesQuery = !needle || (contentMatches === null ? searchable.includes(needle) : contentMatches.includes(interview.slug));
      return matchesQuery
        && (mediaType === "all" || interview.mediaType === mediaType)
        && (year === "all" || interview.year === year);
    });
  }, [contentMatches, interviews, mediaType, query, year]);

  const updateQuery = (value: string) => {
    setQuery(value); setContentMatches(null); setIsSearching(Boolean(value.trim()));
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  const clearFilters = () => {
    setQuery(""); setMediaType("all"); setYear("all"); setContentMatches(null); setIsSearching(false);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  return <section className="archive-section shell interview-archive">
    <div className="interview-filters" aria-label="インタビューの検索と絞り込み">
      <div className="interview-search">
        <label htmlFor="interview-search">タイトル・人物・発言内容</label>
        <input id="interview-search" value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="原文・日本語訳も検索できます" />
        {query && <button type="button" onClick={() => updateQuery("")} aria-label="検索文字を消す">×</button>}
      </div>
      <label>種類<select value={mediaType} onChange={(event) => setMediaType(event.target.value as typeof mediaType)}><option value="all">すべて</option><option value="video">動画</option><option value="article">記事</option></select></label>
      <label>公開年<select value={year} onChange={(event) => setYear(event.target.value)}><option value="all">すべて</option>{years.map((item) => <option key={item}>{item}</option>)}</select></label>
      <button className="interview-filter-reset" type="button" onClick={clearFilters}>条件をリセット</button>
    </div>

    <div className="interview-results"><p><span>{filtered.length}</span> INTERVIEWS</p><small>{isSearching ? "発言内容を検索中…" : "公開年月日の新しい順"}</small></div>
    <div className="interview-grid">{filtered.slice(0, visibleCount).map((interview) => <InterviewCard interview={interview} key={interview.slug} />)}</div>
    {!filtered.length && <div className="empty-state"><p>条件に一致するインタビューがありません。</p><button type="button" onClick={clearFilters}>すべて表示する</button></div>}
    {visibleCount < filtered.length && <button className="interview-load-more" type="button" onClick={() => setVisibleCount((count) => count + INITIAL_VISIBLE_COUNT)}>さらに表示する</button>}
  </section>;
}
