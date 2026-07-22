"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Modal from "../components/Modal";
import RelatedLinks from "../components/RelatedLinks";
import PersonalNoteEditor from "../components/PersonalNoteEditor";
import { ARCHIVE_STORAGE_KEYS, ARCHIVE_UPDATED_EVENT, getWorkArchiveKey, readArchiveList, writeArchiveList } from "../lib/archiveStorage";
import { findRelatedInterviews } from "../lib/relatedContent";
import { recordRecentlyViewed } from "../lib/recentlyViewed";
import { getBackdropUrl, getMediaLabel, getPosterUrl, getProviderLogo, getWorkDate } from "../lib/tmdb";
import type { EpisodeAppearanceResult, Work } from "../lib/types";
import { getDisplayTitle, getOriginalTitle, getOriginalTitleForDisplay, getSourceTitle, getWorkCharacters, getWorkOverview, getWorkVideoKey, normalizeText } from "../lib/workPresentation";
import WorkFilters, { type GenreMode, type SortOrder } from "./WorkFilters";

const FAVORITES_KEY = ARCHIVE_STORAGE_KEYS.favoriteWorks;
const WATCHED_KEY = ARCHIVE_STORAGE_KEYS.watchedWorks;
const WATCH_LATER_KEY = ARCHIVE_STORAGE_KEYS.watchLaterWorks;

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
  const [watchLater, setWatchLater] = useState<string[]>([]);
  const [selected, setSelected] = useState<Work | null>(null);

  // 旧サイトと同じlocalStorageキーを使い、既存のマークを引き継ぎます。
  useEffect(() => {
    const sync = () => {
      setFavorites(readArchiveList<number>(FAVORITES_KEY));
      setWatched(readArchiveList<number>(WATCHED_KEY));
      setWatchLater(readArchiveList<string>(WATCH_LATER_KEY));
    };
    const frame = requestAnimationFrame(sync);
    window.addEventListener("storage", sync);
    window.addEventListener(ARCHIVE_UPDATED_EVENT, sync);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("storage", sync);
      window.removeEventListener(ARCHIVE_UPDATED_EVENT, sync);
    };
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

  const timelineGroups = useMemo(() => {
    const groups = new Map<string, Work[]>();
    for (const work of filtered) {
      const year = getWorkDate(work).slice(0, 4) || "年不明";
      groups.set(year, [...(groups.get(year) ?? []), work]);
    }
    return [...groups.entries()];
  }, [filtered]);

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
  const toggleWatchLater = (work: Work) => {
    const key = getWorkArchiveKey(work.media_type, work.id);
    writeArchiveList(WATCH_LATER_KEY, watchLater.includes(key) ? watchLater.filter((item) => item !== key) : [...watchLater, key]);
  };

  const resetFilters = () => {
    setQuery(""); setCharacterQuery(""); setAvailability("ALL"); setWatchStatus("ALL");
    setSortOrder("default"); setFavoritesOnly(false); setSelectedProviders([]); setSelectedGenres([]);
    setGenreMode("include"); setExpanded(false);
  };

  const card = (work: Work, timeline = false) => {
    const displayTitle = getDisplayTitle(work);
    const originalTitle = getOriginalTitleForDisplay(work);
    const characters = getWorkCharacters(work);
    const hasSpiteloutAndIvar = characters.some((character) => normalizeText(character.englishName).includes("spitelout"))
      && characters.some((character) => normalizeText(character.englishName).includes("ivarthewhitless"));
    const isFavorite = favorites.includes(work.id);
    const isWatched = watched.includes(work.id);
    const isWatchLater = watchLater.includes(getWorkArchiveKey(work.media_type, work.id));
    return <article className={timeline ? "work-timeline-card" : "media-card work-card"} key={`${work.media_type}-${work.id}`}>
      <button className="card-hit" onClick={() => setSelected(work)} aria-label={`${displayTitle}の詳細`} />
      <div className="work-card__image">
        <img src={getPosterUrl(work.poster_path, work.posterUrl)} alt={`${displayTitle}のポスター`} loading="lazy" />
        <button className={`work-status work-status--watched ${isWatched ? "is-active" : ""}`} onClick={() => toggleWatched(work)} aria-label={isWatched ? "視聴済みを解除" : "視聴済みにする"}>✓</button>
        <button className={`work-status work-status--favorite ${isFavorite ? "is-active" : ""}`} onClick={() => toggleFavorite(work)} aria-label={isFavorite ? "お気に入りを解除" : "お気に入りに追加"}>★</button>
        <button className={`work-status work-status--later ${isWatchLater ? "is-active" : ""}`} onClick={() => toggleWatchLater(work)} aria-label={isWatchLater ? "あとで見るから外す" : "あとで見るに追加"} title="あとで見る">◷</button>
      </div>
      <div className="work-card__body">
        <p>{getWorkDate(work).slice(0, 4) || "—"} · {getMediaLabel(work.media_type)}</p>
        <h2>{displayTitle}</h2>
        {originalTitle && <small>{originalTitle}</small>}
        {hasSpiteloutAndIvar
          ? <div className="work-card__character-lines">{characters.map((character) => <span key={character.englishName}>{character.name}</span>)}</div>
          : <span>{characters.map((character) => character.name).join(" / ")}</span>}
        <div className="provider-icons" aria-label="日本の定額配信サービス">
          {(work.providers ?? []).map((provider) => provider.logo_path
            ? <img key={provider.provider_id} src={getProviderLogo(provider.logo_path)} alt={provider.provider_name} title={provider.provider_name} loading="lazy" />
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

      {view === "grid" ? <div className="media-grid">{filtered.map((work) => card(work))}</div>
        : <div className="work-timeline">{timelineGroups.map(([year, yearWorks]) => <section className="timeline-year-group" key={year}><h2>{year}</h2><div>{yearWorks.map((work) => card(work, true))}</div></section>)}</div>}
      {!filtered.length && <p className="empty-state">条件に一致する作品がありません。</p>}

      <WorkDetailModal work={selected} watched={selected ? watched.includes(selected.id) : false} watchLater={selected ? watchLater.includes(getWorkArchiveKey(selected.media_type, selected.id)) : false} onToggleWatched={() => selected && toggleWatched(selected)} onToggleWatchLater={() => selected && toggleWatchLater(selected)} onClose={() => setSelected(null)} />
    </section>
  );
}

/** 作品・配信・予告編・演じたキャラクターを一か所にまとめた詳細画面。 */
function WorkDetailModal({ work, watched, watchLater, onToggleWatched, onToggleWatchLater, onClose }: { work: Work | null; watched: boolean; watchLater: boolean; onToggleWatched: () => void; onToggleWatchLater: () => void; onClose: () => void }) {
  const characters = work ? getWorkCharacters(work) : [];
  const videoKey = work ? getWorkVideoKey(work) : null;
  const displayTitle = work ? getDisplayTitle(work) : "";
  const originalTitle = work ? getOriginalTitle(work) : "";
  const originalTitleForDisplay = work ? getOriginalTitleForDisplay(work) : null;
  const relatedInterviews = work ? findRelatedInterviews([
    displayTitle,
    getSourceTitle(work),
    originalTitle,
    ...characters.flatMap((character) => [character.name, character.englishName]),
  ]) : [];

  // 実際に表示した作品詳細を、MY ARCHIVEの「最近見た項目」へ保存します。
  useEffect(() => {
    if (!work) return;
    recordRecentlyViewed({
      key: `work-${work.media_type}-${work.id}`,
      type: "work",
      title: displayTitle,
      subtitle: originalTitle !== displayTitle ? originalTitle : undefined,
      href: `/works?q=${encodeURIComponent(displayTitle)}`,
      image: getPosterUrl(work.poster_path, work.posterUrl),
    });
  }, [displayTitle, originalTitle, work]);

  return <Modal open={Boolean(work)} onClose={onClose} label={`${displayTitle}の詳細`}>
    {work && <div className="work-detail">
      {(work.backdrop_path || work.backdropUrl) && <div className="work-detail__backdrop" style={{ backgroundImage: `linear-gradient(to top, var(--white), transparent), url('${getBackdropUrl(work.backdrop_path, work.backdropUrl)}')` }} />}
      <header><p className="eyebrow">{getWorkDate(work).slice(0, 4)} · {getMediaLabel(work.media_type)}</p><h2>{displayTitle}</h2>{originalTitleForDisplay && <p className="detail-subtitle">{originalTitleForDisplay}</p>}<div className="work-detail__actions"><button className={`detail-watch ${watched ? "is-active" : ""}`} onClick={onToggleWatched}>{watched ? "✓ 視聴済" : "▷ 未視聴"}</button><button className={`detail-later ${watchLater ? "is-active" : ""}`} onClick={onToggleWatchLater}>{watchLater ? "◷ あとで見るに保存済み" : "◷ あとで見る"}</button></div></header>
      <div className="work-detail__facts">{work.media_type !== "stage" && <span>{work.media_type === "movie" ? (work.runtime ? `${work.runtime}分` : "映画") : `${work.numberOfSeasons ? `全${work.numberOfSeasons}シーズン` : "TV番組"}${work.numberOfEpisodes ? ` · ${work.numberOfEpisodes}話` : ""}${work.episodeRunTime ? ` · 1話約${work.episodeRunTime}分` : ""}`}</span>}{work.genres?.map((genre) => <span key={genre.id}>{genre.name}</span>)}</div>

      <section className="detail-section"><h3>作品あらすじ</h3><p>{getWorkOverview(work)}</p></section>

      {work.media_type === "tv" && <EpisodeAppearances work={work} />}

      <section className="detail-section"><h3>日本の定額配信サービス</h3>{work.providers?.length ? <div className="provider-detail-list">{work.providers.map((provider) => <div key={provider.provider_id}>{provider.logo_path && <img src={getProviderLogo(provider.logo_path)} alt="" />}<span>{provider.provider_name}</span></div>)}</div> : <p>現在、日本の定額配信サービスは確認できません。</p>}<small>配信状況は変更される場合があります。各サービスの公式情報もご確認ください。</small></section>

      {videoKey && <section className="detail-section"><h3>予告編・関連動画</h3><div className="detail-video"><iframe src={`https://www.youtube-nocookie.com/embed/${videoKey}`} title={`${displayTitle} trailer`} allowFullScreen /></div></section>}

      <section className="detail-section"><h3>演じたキャラクター</h3><div className="work-characters">{characters.map((character) => <article key={`${character.name}-${character.englishName}`}><img src={character.image} alt={character.name} onError={(event) => { event.currentTarget.src = "/images/default-character.jpg"; }} /><div><h4>{character.name}</h4>{character.englishName && normalizeText(character.englishName) !== normalizeText(character.name) && <small>{character.englishName}</small>}{character.appearanceNote && <p className="work-character__appearance"><strong>出演形態：</strong>{character.appearanceNote}</p>}<p>{character.description}</p>{!character.excludeFromCharacters && <Link className="text-link" href={`/characters?q=${encodeURIComponent(character.name)}`}>キャラクター詳細を見る →</Link>}</div></article>)}</div></section>
      <PersonalNoteEditor noteKey={`work-${work.media_type}-${work.id}`} type="work" title={displayTitle} href={`/works?q=${encodeURIComponent(displayTitle)}`} placeholder="作品の感想や視聴時のメモを入力" />
      <RelatedLinks title="関連インタビュー" items={relatedInterviews.map((interview) => ({ href: `/interviews/${interview.slug}`, title: interview.title, meta: `${interview.year} · ${interview.source}`, description: interview.titleEn }))} />
    </div>}
  </Modal>;
}

/** TV作品を選んだ時だけ出演エピソードを取得し、一覧表示の通信量を増やさないようにします。 */
function EpisodeAppearances({ work }: { work: Work }) {
  const manualResult = work.episodeAppearances?.length
    ? { status: "exact" as const, appearances: work.episodeAppearances, episodeCount: work.episodeAppearances.length }
    : null;
  const [result, setResult] = useState<EpisodeAppearanceResult | null>(manualResult);
  const [watchedEpisodeKeys, setWatchedEpisodeKeys] = useState<string[]>([]);
  const progressPrefix = `${getWorkArchiveKey(work.media_type, work.id)}|`;
  const getEpisodeProgressKey = (episode: EpisodeAppearanceResult["appearances"][number]) =>
    `${progressPrefix}${episode.seasonNumber}:${episode.episodeNumber}:${episode.airDate || ""}:${normalizeText(episode.title || episode.displayLabel || "")}`;

  useEffect(() => {
    const sync = () => setWatchedEpisodeKeys(readArchiveList<string>(ARCHIVE_STORAGE_KEYS.watchedEpisodes));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(ARCHIVE_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(ARCHIVE_UPDATED_EVENT, sync);
    };
  }, []);

  useEffect(() => {
    if (work.episodeAppearances?.length) {
      setResult({ status: "exact", appearances: work.episodeAppearances, episodeCount: work.episodeAppearances.length });
      return;
    }
    if (work.isManual) {
      setResult(null);
      return;
    }
    const controller = new AbortController();
    setResult(null);
    const params = new URLSearchParams({ seriesId: String(work.id) });
    [getSourceTitle(work), work.original_name, work.name].filter((title): title is string => Boolean(title))
      .forEach((title) => params.append("title", title));
    fetch(`/api/tmdb/episode-appearances?${params}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("episode request failed");
        return response.json() as Promise<EpisodeAppearanceResult>;
      })
      .then(setResult)
      .catch(() => undefined);
    return () => controller.abort();
  }, [work.id, work.isManual, work.episodeAppearances]);

  // 具体的なシーズン・話数が取得できた作品だけに欄を表示します。
  if (!result?.appearances.length) return null;
  const episodeKeys = result.appearances.map(getEpisodeProgressKey);
  const watchedCount = episodeKeys.filter((key) => watchedEpisodeKeys.includes(key)).length;
  const progress = Math.round((watchedCount / episodeKeys.length) * 100);
  const toggleEpisode = (key: string) => writeArchiveList(
    ARCHIVE_STORAGE_KEYS.watchedEpisodes,
    watchedEpisodeKeys.includes(key) ? watchedEpisodeKeys.filter((item) => item !== key) : [...watchedEpisodeKeys, key],
  );
  const toggleAllEpisodes = () => {
    const otherWorks = watchedEpisodeKeys.filter((key) => !key.startsWith(progressPrefix));
    writeArchiveList(ARCHIVE_STORAGE_KEYS.watchedEpisodes, watchedCount === episodeKeys.length ? otherWorks : [...otherWorks, ...episodeKeys]);
  };

  return <section className="detail-section episode-appearances">
    <div className="episode-appearances__heading"><h3>出演エピソード</h3><span>{result.appearances.length}件確認済み</span></div>
    <div className="episode-progress">
      <div><strong>出演回の視聴進捗</strong><span>{watchedCount} / {episodeKeys.length}話</span><button type="button" onClick={toggleAllEpisodes}>{watchedCount === episodeKeys.length ? "すべて解除" : "すべて視聴済み"}</button></div>
      <div className="episode-progress__bar" role="progressbar" aria-label="出演回の視聴進捗" aria-valuemin={0} aria-valuemax={episodeKeys.length} aria-valuenow={watchedCount}><span style={{ width: `${progress}%` }} /></div>
    </div>
    <ol>{result.appearances.map((episode) => {
      const progressKey = getEpisodeProgressKey(episode);
      const isWatched = watchedEpisodeKeys.includes(progressKey);
      return <li className={isWatched ? "is-watched" : undefined} key={progressKey}>
        <strong>{episode.displayLabel || `S${episode.seasonNumber} E${episode.episodeNumber}`}</strong>
        {episode.title && <span>「{episode.title}」</span>}
        {episode.airDate && <time dateTime={episode.airDate}>{episode.airDate}</time>}
        <button type="button" aria-pressed={isWatched} aria-label={`${episode.displayLabel || `S${episode.seasonNumber} E${episode.episodeNumber}`}を${isWatched ? "未視聴に戻す" : "視聴済みにする"}`} onClick={() => toggleEpisode(progressKey)}>{isWatched ? "✓ 視聴済み" : "未視聴"}</button>
        {episode.character && <small>{episode.character}</small>}
      </li>;
    })}</ol>
  </section>;
}
