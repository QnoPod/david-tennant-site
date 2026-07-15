"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { ARCHIVE_STORAGE_KEYS, readArchiveList, writeArchiveList } from "../lib/archiveStorage";
import { getMediaLabel, getPosterUrl, getProviderLogo, getWorkDate } from "../lib/tmdb";
import type { Work } from "../lib/types";
import { getDisplayTitle, getSourceTitle, getWorkCharacters, normalizeText } from "../lib/workPresentation";
import WorkFilters, { type GenreMode, type SortOrder } from "./WorkFilters";

const FAVORITES_KEY = ARCHIVE_STORAGE_KEYS.favoriteWorks;
const WATCHED_KEY = ARCHIVE_STORAGE_KEYS.watchedWorks;
const INITIAL_VISIBLE_COUNT = 15;

// 作品詳細はカードを開くまで不要なので、一覧の初期JavaScriptから分離します。
const WorkDetailModal = dynamic(() => import("./WorkDetailModal"), { ssr: false });

/**
 * 旧サイトの全検索条件、配信情報、視聴済み、お気に入りを維持する作品一覧。
 * 表示だけを新サイトの読みやすいカード／年表デザインに置き換えています。
 */
export default function WorksExplorer({ works }: { works: Work[] }) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  // CHARACTERSから遷移した場合は、作品名ではなくWORKS側の役名検索へ引き継ぎます。
  const initialCharacterQuery = searchParams.get("character") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [characterQuery, setCharacterQuery] = useState(initialCharacterQuery);
  const [availability, setAvailability] = useState("ALL");
  const [watchStatus, setWatchStatus] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<SortOrder>("default");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [genreMode, setGenreMode] = useState<GenreMode>("include");
  const [view, setView] = useState<"grid" | "timeline">("grid");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [watched, setWatched] = useState<number[]>([]);
  const [selected, setSelected] = useState<Work | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  // 旧サイトと同じlocalStorageキーを使い、既存のマークを引き継ぎます。
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setFavorites(readArchiveList<number>(FAVORITES_KEY));
      setWatched(readArchiveList<number>(WATCHED_KEY));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  /** 邦題単位で重複作品をまとめます（旧サイトと同じ仕様）。 */
  const uniqueWorks = useMemo(() => {
    const map = new Map<string, Work>();
    for (const work of works) {
      const title = getDisplayTitle(work);
      if (!map.has(title)) map.set(title, work);
    }
    return [...map.values()];
  }, [works]);

  const providers = useMemo(() => [...new Set(uniqueWorks.flatMap((work) => work.providers?.map((provider) => provider.provider_name) ?? []))].sort((a, b) => a.localeCompare(b, "ja")), [uniqueWorks]);
  const genres = useMemo(() => [...new Set(uniqueWorks.flatMap((work) => work.genres?.map((genre) => genre.name) ?? []))].sort((a, b) => a.localeCompare(b, "ja")), [uniqueWorks]);

  const filtered = useMemo(() => {
    const titleNeedle = normalizeText(query);
    const characterNeedle = normalizeText(characterQuery);
    const result = uniqueWorks.filter((work) => {
      const titleText = normalizeText([getDisplayTitle(work), getSourceTitle(work), work.original_title, work.original_name].filter(Boolean).join(" "));
      const characterText = normalizeText([work.character, ...getWorkCharacters(work).flatMap((character) => [character.name, character.englishName])].join(" "));
      const workProviders = work.providers ?? [];
      const workGenres = work.genres ?? [];
      const hasStreaming = workProviders.length > 0;

      const matchesProvider = !selectedProviders.length || workProviders.some((provider) => selectedProviders.includes(provider.provider_name));
      const matchesAvailability = availability === "ALL" || (availability === "AVAILABLE" ? hasStreaming : !hasStreaming);
      const matchesGenre = !selectedGenres.length || (genreMode === "include"
        ? workGenres.some((genre) => selectedGenres.includes(genre.name))
        : !workGenres.some((genre) => selectedGenres.includes(genre.name)));
      const isWatched = watched.map(String).includes(String(work.id));

      return titleText.includes(titleNeedle)
        && characterText.includes(characterNeedle)
        && matchesProvider
        && matchesAvailability
        && matchesGenre
        && (!favoritesOnly || favorites.includes(work.id))
        && (watchStatus === "ALL" || (watchStatus === "WATCHED" ? isWatched : !isWatched));
    });

    if (view === "timeline" || sortOrder === "default") return result.sort((a, b) => getWorkDate(b).localeCompare(getWorkDate(a)));
    if (sortOrder === "popularity") return result.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
    return result.sort((a, b) => getDisplayTitle(a).localeCompare(getDisplayTitle(b), "ja"));
  }, [availability, characterQuery, favorites, favoritesOnly, genreMode, query, selectedGenres, selectedProviders, sortOrder, uniqueWorks, view, watchStatus, watched]);

  const visibleWorks = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const timelineGroups = useMemo(() => {
    const groups = new Map<string, Work[]>();
    for (const work of visibleWorks) {
      const year = getWorkDate(work).slice(0, 4) || "年不明";
      groups.set(year, [...(groups.get(year) ?? []), work]);
    }
    return [...groups.entries()];
  }, [visibleWorks]);

  // 検索条件や表示方法を変えたら先頭の15件へ戻し、DOMの肥大化を防ぎます。
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [availability, characterQuery, favoritesOnly, genreMode, query, selectedGenres, selectedProviders, sortOrder, view, watchStatus]);

  const saveList = (key: string, list: number[], setter: (value: number[]) => void) => {
    writeArchiveList(key, list);
    setter(list);
  };
  const toggleFavorite = (work: Work) => {
    const isFavorite = favorites.includes(work.id);
    if (isFavorite && !window.confirm(`「${getDisplayTitle(work)}」のお気に入りを解除しますか？`)) return;
    saveList(FAVORITES_KEY, isFavorite ? favorites.filter((id) => id !== work.id) : [...favorites, work.id], setFavorites);
  };
  const toggleWatched = (work: Work) => saveList(WATCHED_KEY, watched.includes(work.id) ? watched.filter((id) => id !== work.id) : [...watched, work.id], setWatched);

  const resetFilters = () => {
    setQuery(""); setCharacterQuery(""); setAvailability("ALL"); setWatchStatus("ALL");
    setSortOrder("default"); setFavoritesOnly(false); setSelectedProviders([]); setSelectedGenres([]);
    setGenreMode("include"); setExpanded(false);
  };

  const card = (work: Work, timeline = false) => {
    const displayTitle = getDisplayTitle(work);
    const sourceTitle = getSourceTitle(work);
    const isFavorite = favorites.includes(work.id);
    const isWatched = watched.includes(work.id);
    return <article className={timeline ? "work-timeline-card" : "media-card work-card"} key={`${work.media_type}-${work.id}`}>
      <button className="card-hit" onClick={() => setSelected(work)} aria-label={`${displayTitle}の詳細`} />
      <div className="work-card__image">
        <img src={getPosterUrl(work.poster_path, work.posterUrl)} alt={`${displayTitle}のポスター`} loading="lazy" decoding="async" />
        <button className={`work-status work-status--watched ${isWatched ? "is-active" : ""}`} onClick={() => toggleWatched(work)} aria-label={isWatched ? "視聴済みを解除" : "視聴済みにする"}>✓</button>
        <button className={`work-status work-status--favorite ${isFavorite ? "is-active" : ""}`} onClick={() => toggleFavorite(work)} aria-label={isFavorite ? "お気に入りを解除" : "お気に入りに追加"}>★</button>
      </div>
      <div className="work-card__body">
        <p>{getWorkDate(work).slice(0, 4) || "—"} · {getMediaLabel(work.media_type)}</p>
        <h2>{displayTitle}</h2>
        {sourceTitle !== displayTitle && <small>{sourceTitle}</small>}
        <span>{getWorkCharacters(work).map((character) => character.name).join(" / ")}</span>
        <div className="provider-icons" aria-label="日本の定額配信サービス">
          {(work.providers ?? []).map((provider) => provider.logo_path
            ? <img key={provider.provider_id} src={getProviderLogo(provider.logo_path)} alt={provider.provider_name} title={provider.provider_name} loading="lazy" decoding="async" />
            : <b key={provider.provider_id}>{provider.provider_name}</b>)}
          {!work.providers?.length && <em>日本の定額配信なし</em>}
        </div>
      </div>
    </article>;
  };

  return (
    <section className="archive-section shell">
      <WorkFilters
        query={query} setQuery={setQuery} characterQuery={characterQuery} setCharacterQuery={setCharacterQuery}
        availability={availability} setAvailability={setAvailability} watchStatus={watchStatus} setWatchStatus={setWatchStatus}
        sortOrder={view === "timeline" ? "default" : sortOrder} setSortOrder={setSortOrder}
        favoritesOnly={favoritesOnly} setFavoritesOnly={setFavoritesOnly}
        favoriteCount={favorites.length}
        onClearFavorites={() => {
          if (!favorites.length || !window.confirm("WORKSのお気に入りをすべて解除しますか？")) return false;
          saveList(FAVORITES_KEY, [], setFavorites);
          return true;
        }}
        providers={providers} selectedProviders={selectedProviders} setSelectedProviders={setSelectedProviders}
        genres={genres} selectedGenres={selectedGenres} setSelectedGenres={setSelectedGenres}
        genreMode={genreMode} setGenreMode={setGenreMode} expanded={expanded} setExpanded={setExpanded}
        onReset={resetFilters}
      />

      <div className="archive-summary"><p>カードを選ぶと配信情報・予告編・役柄の詳細を表示します。</p><div><button className={view === "grid" ? "is-active" : ""} onClick={() => setView("grid")}>グリッド</button><button className={view === "timeline" ? "is-active" : ""} onClick={() => setView("timeline")}>年代順</button><strong>{filtered.length} / {uniqueWorks.length}作品</strong></div></div>

      {view === "grid" ? <div className="media-grid">{visibleWorks.map((work) => card(work))}</div>
        : <div className="work-timeline">{timelineGroups.map(([year, yearWorks]) => <section className="timeline-year-group" key={year}><h2>{year}</h2><div>{yearWorks.map((work) => card(work, true))}</div></section>)}</div>}
      {!filtered.length && <p className="empty-state">条件に一致する作品がありません。</p>}
      {visibleCount < filtered.length && <button className="archive-load-more" type="button" onClick={() => setVisibleCount((count) => count + INITIAL_VISIBLE_COUNT)}>さらに{Math.min(INITIAL_VISIBLE_COUNT, filtered.length - visibleCount)}作品を表示</button>}

      {selected && <WorkDetailModal work={selected} watched={watched.includes(selected.id)} onToggleWatched={() => toggleWatched(selected)} onClose={() => setSelected(null)} />}
    </section>
  );
}
