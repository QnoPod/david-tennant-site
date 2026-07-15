"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import InterviewCard from "../components/interviews/InterviewCard";
import type { InterviewSummary } from "../data/interviews/types";
import { ARCHIVE_STORAGE_KEYS, ARCHIVE_UPDATED_EVENT, readArchiveList, writeArchiveList } from "../lib/archiveStorage";
import { getMediaLabel, getPosterUrl, getWorkDate } from "../lib/tmdb";
import type { Character, Work } from "../lib/types";
import { getDisplayTitle, getSourceTitle } from "../lib/workPresentation";

type MyArchiveProps = {
  works: Work[];
  characters: Character[];
  interviews: readonly InterviewSummary[];
};

/** localStorageに保存された全種類のマークを、閲覧・解除できる一覧へ変換します。 */
export default function MyArchive({ works, characters, interviews }: MyArchiveProps) {
  const [ready, setReady] = useState(false);
  const [favoriteWorkIds, setFavoriteWorkIds] = useState<number[]>([]);
  const [favoriteCharacterKeys, setFavoriteCharacterKeys] = useState<string[]>([]);
  const [favoriteInterviewSlugs, setFavoriteInterviewSlugs] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => {
      setFavoriteWorkIds(readArchiveList<number>(ARCHIVE_STORAGE_KEYS.favoriteWorks));
      setFavoriteCharacterKeys(readArchiveList<string>(ARCHIVE_STORAGE_KEYS.favoriteCharacters));
      setFavoriteInterviewSlugs(readArchiveList<string>(ARCHIVE_STORAGE_KEYS.favoriteInterviews));
      setReady(true);
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(ARCHIVE_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(ARCHIVE_UPDATED_EVENT, sync);
    };
  }, []);

  // WORKSと同じく、邦題が重複する出演記録は最初の1件へまとめます。
  const uniqueWorks = useMemo(() => {
    const map = new Map<string, Work>();
    for (const work of works) {
      const title = getDisplayTitle(work);
      if (!map.has(title)) map.set(title, work);
    }
    return [...map.values()];
  }, [works]);

  const favoriteWorks = uniqueWorks.filter((work) => favoriteWorkIds.map(String).includes(String(work.id)));
  const favoriteCharacters = characters.filter((character) => favoriteCharacterKeys.includes(character.key));
  const favoriteInterviews = interviews.filter((interview) => favoriteInterviewSlugs.includes(interview.slug));

  const remove = (key: string, value: string | number) => {
    const current = readArchiveList<string | number>(key);
    writeArchiveList(key, current.filter((item) => String(item) !== String(value)));
  };

  const clearSection = (key: string, label: string) => {
    const current = readArchiveList<string | number>(key);
    if (!current.length || !window.confirm(`${label}をすべて解除しますか？`)) return;
    writeArchiveList(key, []);
  };

  if (!ready) return <section className="my-archive shell" aria-live="polite"><p className="empty-state">MY ARCHIVEを読み込んでいます。</p></section>;

  return <section className="my-archive shell">
    <div className="my-archive-summary" aria-label="保存件数">
      <ArchiveCount href="#favorite-works" value={favoriteWorks.length} label="お気に入り作品" />
      <ArchiveCount href="#favorite-characters" value={favoriteCharacters.length} label="お気に入りキャラクター" />
      <ArchiveCount href="#favorite-interviews" value={favoriteInterviews.length} label="インタビューのしおり" />
    </div>

    <ArchiveSection id="favorite-works" title="お気に入り作品" eyebrow="FAVORITE WORKS" count={favoriteWorks.length} onClear={() => clearSection(ARCHIVE_STORAGE_KEYS.favoriteWorks, "お気に入り作品")} empty="お気に入りにした作品はまだありません。" emptyHref="/works" emptyLabel="作品を探す">
      <div className="my-archive-item-grid">{favoriteWorks.map((work) => <WorkArchiveCard key={`favorite-${work.media_type}-${work.id}`} work={work} actionLabel="お気に入りを解除" onRemove={() => remove(ARCHIVE_STORAGE_KEYS.favoriteWorks, work.id)} />)}</div>
    </ArchiveSection>

    <ArchiveSection id="favorite-characters" title="お気に入りキャラクター" eyebrow="FAVORITE CHARACTERS" count={favoriteCharacters.length} onClear={() => clearSection(ARCHIVE_STORAGE_KEYS.favoriteCharacters, "お気に入りキャラクター")} empty="お気に入りにしたキャラクターはまだありません。" emptyHref="/characters" emptyLabel="キャラクターを探す">
      <div className="my-archive-item-grid">{favoriteCharacters.map((character) => <article className="my-archive-item" key={character.key}>
        <Link href={`/characters?q=${encodeURIComponent(character.name)}`}><img src={character.image} alt={`${character.name}の画像`} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.src = "/images/default-character.jpg"; }} /><div><p>{character.year} · CHARACTER</p><h3>{character.name}</h3>{character.englishName && <small>{character.englishName}</small>}<span>{character.displayWorkTitle}</span></div></Link>
        <button className="my-archive-favorite" type="button" aria-label={`${character.name}のお気に入りを解除`} title="お気に入りを解除" onClick={() => remove(ARCHIVE_STORAGE_KEYS.favoriteCharacters, character.key)}>★</button>
      </article>)}</div>
    </ArchiveSection>

    <ArchiveSection id="favorite-interviews" title="インタビューのしおり" eyebrow="BOOKMARKED INTERVIEWS" count={favoriteInterviews.length} onClear={() => clearSection(ARCHIVE_STORAGE_KEYS.favoriteInterviews, "インタビューのしおり")} empty="しおりを付けたインタビューはまだありません。" emptyHref="/interviews" emptyLabel="インタビューを探す">
      <div className="interview-grid">{favoriteInterviews.map((interview) => <InterviewCard key={interview.slug} interview={interview} />)}</div>
    </ArchiveSection>

    <p className="my-archive-note">保存内容はこのブラウザ内に記録されます。別の端末やブラウザには自動で共有されません。</p>
  </section>;
}

function ArchiveCount({ href, value, label }: { href: string; value: number; label: string }) {
  return <a href={href}><strong>{value}</strong><span>{label}</span></a>;
}

function ArchiveSection({ id, title, eyebrow, count, onClear, empty, emptyHref, emptyLabel, children }: { id: string; title: string; eyebrow: string; count: number; onClear: () => void; empty: string; emptyHref: string; emptyLabel: string; children: ReactNode }) {
  return <section className="my-archive-section" id={id}>
    <div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div><div className="my-archive-section__actions"><span>{count}件</span><button type="button" disabled={!count} onClick={onClear}>すべて解除</button></div></div>
    {count ? children : <div className="my-archive-empty"><p>{empty}</p><Link className="button button--ghost" href={emptyHref}>{emptyLabel}</Link></div>}
  </section>;
}

function WorkArchiveCard({ work, actionLabel, onRemove }: { work: Work; actionLabel: string; onRemove: () => void }) {
  const title = getDisplayTitle(work);
  const sourceTitle = getSourceTitle(work);
  return <article className="my-archive-item">
    <Link href={`/works?q=${encodeURIComponent(title)}`}>
      <img src={getPosterUrl(work.poster_path, work.posterUrl)} alt={`${title}のポスター`} loading="lazy" decoding="async" />
      <div><p>{getWorkDate(work).slice(0, 4) || "—"} · {getMediaLabel(work.media_type)}</p><h3>{title}</h3>{sourceTitle !== title && <small>{sourceTitle}</small>}<span>{work.character || "役名未登録"}</span></div>
    </Link>
    <button className="my-archive-favorite" type="button" aria-label={`${title}の${actionLabel}`} title={actionLabel} onClick={onRemove}>★</button>
  </article>;
}
