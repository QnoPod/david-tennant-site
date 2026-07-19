"use client";

import { useEffect, useMemo, useState } from "react";
import type { InterviewSummary } from "../../data/interviews/types";
import { ARCHIVE_STORAGE_KEYS, ARCHIVE_UPDATED_EVENT, readArchiveList, writeArchiveList } from "../../lib/archiveStorage";
import InterviewCard from "./InterviewCard";

const INITIAL_VISIBLE_COUNT = 6;
const EXPLORER_STATE_KEY = "david-tennant-interviews-explorer-state-v1";
const TAG_CATEGORIES = ["actors", "genres", "sources"] as const;
type TagCategory = typeof TAG_CATEGORIES[number];

type SavedExplorerState = {
  restorePending: boolean;
  scrollY: number;
  query: string;
  mediaType: "all" | "video" | "article";
  year: string;
  favoritesOnly: boolean;
  tagExpanded: boolean;
  selectedTags: Record<TagCategory, string[]>;
  visibleCount: number;
};

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
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);
  const [tagExpanded, setTagExpanded] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Record<TagCategory, string[]>>({
    actors: [],
    genres: [],
    sources: [],
  });
  const [contentMatches, setContentMatches] = useState<string[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  // 詳細ページから戻った場合だけ、検索条件・表示件数・スクロール位置を一度復元します。
  useEffect(() => {
    let saved: SavedExplorerState | null = null;
    try {
      const raw = window.sessionStorage.getItem(EXPLORER_STATE_KEY);
      saved = raw ? JSON.parse(raw) as SavedExplorerState : null;
    } catch {
      saved = null;
    }
    if (!saved?.restorePending) return;
    const timers = new Set<number>();
    let cancelled = false;
    const schedule = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        if (!cancelled) callback();
      }, delay);
      timers.add(timer);
    };

    // Effect本体ではなく次のタスクで状態を復元し、不要な連続レンダーを避けます。
    schedule(() => {
      if (!saved) return;
      setQuery(saved.query || "");
      setMediaType(["all", "video", "article"].includes(saved.mediaType) ? saved.mediaType : "all");
      setYear(saved.year || "all");
      setFavoritesOnly(Boolean(saved.favoritesOnly));
      setTagExpanded(Boolean(saved.tagExpanded));
      setSelectedTags({
        actors: saved.selectedTags?.actors ?? [],
        genres: saved.selectedTags?.genres ?? [],
        sources: saved.selectedTags?.sources ?? [],
      });
      setVisibleCount(Math.max(INITIAL_VISIBLE_COUNT, saved.visibleCount || INITIAL_VISIBLE_COUNT));
      if (saved.query?.trim()) setIsSearching(true);

      // 直接INTERVIEWSを開いたときに古い位置へ戻らないよう、復元予約はここで消費します。
      try {
        window.sessionStorage.setItem(EXPLORER_STATE_KEY, JSON.stringify({ ...saved, restorePending: false }));
      } catch {
        // sessionStorageが使えない環境でも一覧表示自体は継続します。
      }

      let attempts = 0;
      const restoreScroll = () => {
        window.scrollTo(0, Math.max(0, saved?.scrollY ?? 0));
        attempts += 1;
        // 検索本文やカードが描画されるまで高さが足りない場合に、短時間だけ再試行します。
        if (attempts < 30 && Math.abs(window.scrollY - (saved?.scrollY ?? 0)) > 2) schedule(restoreScroll, 100);
      };
      schedule(restoreScroll, 0);
    }, 0);

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  // 一覧や詳細でしおりを変更した場合も、お気に入り検索へ即時反映します。
  useEffect(() => {
    const syncFavorites = () => setFavoriteSlugs(readArchiveList<string>(ARCHIVE_STORAGE_KEYS.favoriteInterviews));
    syncFavorites();
    window.addEventListener("storage", syncFavorites);
    window.addEventListener(ARCHIVE_UPDATED_EVENT, syncFavorites);
    return () => {
      window.removeEventListener("storage", syncFavorites);
      window.removeEventListener(ARCHIVE_UPDATED_EVENT, syncFavorites);
    };
  }, []);

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
      const searchable = [interview.title, interview.titleEn, interview.source, interview.description]
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
        && (!favoritesOnly || favoriteSlugs.includes(interview.slug))
        && (mediaType === "all" || interview.mediaType === mediaType)
        && (year === "all" || interview.year === year);
    });
  }, [contentMatches, favoriteSlugs, favoritesOnly, interviews, mediaType, query, selectedTags, year]);

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
    setQuery(""); setMediaType("all"); setYear("all"); setFavoritesOnly(false); setTagExpanded(false);
    setSelectedTags({ actors: [], genres: [], sources: [] }); setContentMatches(null); setIsSearching(false);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  const clearAllFavorites = () => {
    if (!favoriteSlugs.length || !window.confirm("インタビューのしおりをすべて解除しますか？")) return;
    writeArchiveList(ARCHIVE_STORAGE_KEYS.favoriteInterviews, []);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  /** インタビュー詳細へ移動する直前の一覧状態を、同じタブの間だけ保存します。 */
  const saveExplorerState = () => {
    const state: SavedExplorerState = {
      restorePending: true,
      scrollY: window.scrollY,
      query,
      mediaType,
      year,
      favoritesOnly,
      tagExpanded,
      selectedTags,
      visibleCount,
    };
    try {
      window.sessionStorage.setItem(EXPLORER_STATE_KEY, JSON.stringify(state));
    } catch {
      // 保存できない環境では通常のページ遷移を妨げません。
    }
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
        <button className={favoritesOnly ? "is-active" : ""} type="button" aria-pressed={favoritesOnly} onClick={() => { setFavoritesOnly((current) => !current); setVisibleCount(INITIAL_VISIBLE_COUNT); }}>🔖 お気に入り</button>
        <button className="interview-clear-favorites" type="button" disabled={!favoriteSlugs.length} onClick={clearAllFavorites}>お気に入りを一括解除</button>
      </div>
      <button className="work-filters__expand" type="button" onClick={() => setTagExpanded((current) => !current)}>{tagExpanded ? "▲ 詳細フィルターを閉じる" : "▼ 役者・関連作品・配信元で絞り込む"}</button>
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
    <div className="interview-grid">{filtered.slice(0, visibleCount).map((interview) => <InterviewCard interview={interview} key={interview.slug} onOpen={saveExplorerState} />)}</div>
    {!filtered.length && <div className="empty-state"><p>条件に一致するインタビューがありません。</p><button type="button" onClick={clearFilters}>すべて表示する</button></div>}
    {visibleCount < filtered.length && <button className="interview-load-more" type="button" onClick={() => setVisibleCount((count) => count + INITIAL_VISIBLE_COUNT)}>さらに表示する</button>}
  </section>;
}
