"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Modal from "../components/Modal";
import RelatedLinks from "../components/RelatedLinks";
import { findRelatedInterviews } from "../lib/relatedContent";
import { recordRecentlyViewed } from "../lib/recentlyViewed";
import { getBackdropUrl, getMediaLabel, getPosterUrl, getProviderLogo, getWorkDate } from "../lib/tmdb";
import type { EpisodeAppearanceResult, Work } from "../lib/types";
import {
  getDisplayTitle,
  getOriginalTitle,
  getSourceTitle,
  getWorkCharacters,
  getWorkOverview,
  getWorkVideoKey,
  normalizeText,
} from "../lib/workPresentation";

type WorkDetailModalProps = {
  work: Work;
  watched: boolean;
  onToggleWatched: () => void;
  onClose: () => void;
};

/**
 * 一覧では不要な作品詳細を別チャンクに分離します。
 * カードを選択したときだけ、このファイルと関連コンポーネントが読み込まれます。
 */
export default function WorkDetailModal({ work, watched, onToggleWatched, onClose }: WorkDetailModalProps) {
  const characters = getWorkCharacters(work);
  const videoKey = getWorkVideoKey(work);
  const displayTitle = getDisplayTitle(work);
  const originalTitle = getOriginalTitle(work);
  const relatedInterviews = findRelatedInterviews([
    displayTitle,
    getSourceTitle(work),
    originalTitle,
    ...characters.flatMap((character) => [character.name, character.englishName]),
  ]);

  useEffect(() => {
    recordRecentlyViewed({
      key: `work-${work.media_type}-${work.id}`,
      type: "work",
      title: displayTitle,
      subtitle: originalTitle !== displayTitle ? originalTitle : undefined,
      href: `/works?q=${encodeURIComponent(displayTitle)}`,
      image: getPosterUrl(work.poster_path, work.posterUrl),
    });
  }, [displayTitle, originalTitle, work.id, work.media_type, work.posterUrl, work.poster_path]);

  return <Modal open onClose={onClose} label={`${displayTitle}の詳細`}>
    <div className="work-detail">
      {(work.backdrop_path || work.backdropUrl) && <div className="work-detail__backdrop" style={{ backgroundImage: `linear-gradient(to top, var(--white), transparent), url('${getBackdropUrl(work.backdrop_path, work.backdropUrl)}')` }} />}
      <header><p className="eyebrow">{getWorkDate(work).slice(0, 4)} · {getMediaLabel(work.media_type)}</p><h2>{displayTitle}</h2>{normalizeText(originalTitle) !== normalizeText(displayTitle) && <p className="detail-subtitle">{originalTitle}</p>}<button className={`detail-watch ${watched ? "is-active" : ""}`} onClick={onToggleWatched}>{watched ? "✓ 視聴済" : "▷ 未視聴"}</button></header>
      <div className="work-detail__facts">{work.media_type !== "stage" && <span>{work.media_type === "movie" ? (work.runtime ? `${work.runtime}分` : "映画") : `${work.numberOfSeasons ? `全${work.numberOfSeasons}シーズン` : "TV番組"}${work.numberOfEpisodes ? ` · ${work.numberOfEpisodes}話` : ""}${work.episodeRunTime ? ` · 1話約${work.episodeRunTime}分` : ""}`}</span>}{work.genres?.map((genre) => <span key={genre.id}>{genre.name}</span>)}</div>

      <section className="detail-section"><h3>作品あらすじ</h3><p>{getWorkOverview(work)}</p></section>
      {work.media_type === "tv" && <EpisodeAppearances work={work} />}

      <section className="detail-section"><h3>日本の定額配信サービス</h3>{work.providers?.length ? <div className="provider-detail-list">{work.providers.map((provider) => <div key={provider.provider_id}>{provider.logo_path && <img src={getProviderLogo(provider.logo_path)} alt="" loading="lazy" decoding="async" />}<span>{provider.provider_name}</span></div>)}</div> : <p>現在、日本の定額配信サービスは確認できません。</p>}<small>配信状況は変更される場合があります。各サービスの公式情報もご確認ください。</small></section>

      {videoKey && <section className="detail-section"><h3>予告編・関連動画</h3><div className="detail-video"><iframe src={`https://www.youtube-nocookie.com/embed/${videoKey}`} title={`${displayTitle} trailer`} loading="lazy" allowFullScreen /></div></section>}

      <section className="detail-section"><h3>演じたキャラクター</h3><div className="work-characters">{characters.map((character) => <article key={`${character.name}-${character.englishName}`}><img src={character.image} alt={character.name} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.src = "/images/default-character.jpg"; }} /><div><h4>{character.name}</h4>{character.englishName && normalizeText(character.englishName) !== normalizeText(character.name) && <small>{character.englishName}</small>}{character.appearanceNote && <p className="work-character__appearance"><strong>出演形態：</strong>{character.appearanceNote}</p>}<p>{character.description}</p>{!character.excludeFromCharacters && <Link className="text-link" href={`/characters?q=${encodeURIComponent(character.name)}`}>キャラクター詳細を見る →</Link>}</div></article>)}</div></section>
      {work.updatedAt && <p className="detail-updated-at">情報最終確認：<time dateTime={work.updatedAt}>{work.updatedAt.replaceAll("-", ".")}</time></p>}
      <RelatedLinks title="関連インタビュー" items={relatedInterviews.map((interview) => ({ href: `/interviews/${interview.slug}`, title: interview.title, meta: `${interview.year} · ${interview.source}`, description: interview.titleEn }))} />
    </div>
  </Modal>;
}

/** TV作品を選んだ時だけ出演エピソードを取得し、一覧表示の通信量を増やしません。 */
function EpisodeAppearances({ work }: { work: Work }) {
  const manualResult = work.episodeAppearances?.length
    ? { status: "exact" as const, appearances: work.episodeAppearances, episodeCount: work.episodeAppearances.length }
    : null;
  const [result, setResult] = useState<EpisodeAppearanceResult | null>(manualResult);
  const [selectedSeason, setSelectedSeason] = useState<"all" | number>("all");

  useEffect(() => {
    if (work.episodeAppearances?.length) {
      setResult({ status: "exact", appearances: work.episodeAppearances, episodeCount: work.episodeAppearances.length });
      setSelectedSeason("all");
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
  }, [work]);

  if (!result?.appearances.length) return null;
  const seasons = [...new Set(result.appearances.map((episode) => episode.seasonNumber))].sort((a, b) => a - b);
  const visibleEpisodes = (selectedSeason === "all" ? result.appearances : result.appearances.filter((episode) => episode.seasonNumber === selectedSeason))
    .slice().sort((a, b) => a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber);
  const groups = [...new Set(visibleEpisodes.map((episode) => episode.seasonNumber))].map((season) => ({
    season,
    episodes: visibleEpisodes.filter((episode) => episode.seasonNumber === season),
  }));
  return <section className="detail-section episode-appearances">
    <div className="episode-appearances__heading"><h3>出演エピソード</h3><span>{result.appearances.length}件確認済み</span></div>
    {seasons.length > 1 && <div className="episode-season-nav" aria-label="シーズンで絞り込む">
      <button type="button" className={selectedSeason === "all" ? "is-active" : ""} onClick={() => setSelectedSeason("all")}>すべて</button>
      {seasons.map((season) => <button type="button" className={selectedSeason === season ? "is-active" : ""} onClick={() => setSelectedSeason(season)} key={season}>{season === 0 ? "特別回" : `シーズン${season}`}<span>{result.appearances.filter((episode) => episode.seasonNumber === season).length}</span></button>)}
    </div>}
    <div className="episode-season-groups">{groups.map((group) => <section key={group.season}>
      <h4>{group.season === 0 ? "特別回・授賞式" : `シーズン ${group.season}`}</h4>
      <ol>{group.episodes.map((episode) => <li key={`${episode.seasonNumber}-${episode.episodeNumber}-${episode.airDate || ""}`}>
        <strong>{episode.displayLabel || `S${episode.seasonNumber} E${episode.episodeNumber}`}</strong>
        {episode.title && <span>「{episode.title}」</span>}
        {episode.airDate && <time dateTime={episode.airDate}>{episode.airDate}</time>}
        {episode.character && <small>{episode.character}</small>}
      </li>)}</ol>
    </section>)}</div>
  </section>;
}
