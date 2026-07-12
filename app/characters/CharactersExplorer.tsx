"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ArchiveControls from "../components/ArchiveControls";
import Modal from "../components/Modal";
import type { Character } from "../lib/types";
import { normalizeText } from "../lib/workPresentation";

const FAVORITES_KEY = "david-archive-favorite-characters";

/** キャラクター検索、属性絞り込み、お気に入り、グリッド／年代表示を担当。 */
export default function CharactersExplorer({ characters }: { characters: Character[] }) {
  const initialQuery = useSearchParams().get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [attribute, setAttribute] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [view, setView] = useState<"grid" | "timeline">("grid");
  const [selected, setSelected] = useState<Character | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setFavorites(JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const attributes = useMemo(() => [...new Set(characters.flatMap((item) => item.attributes))].sort((a, b) => a.localeCompare(b, "ja")), [characters]);
  const filtered = useMemo(() => characters.filter((character) => {
    // 日本語名、英語名、辞書キー、表示用作品名のすべてを検索対象にします。
    const text = normalizeText(`${character.name} ${character.englishName} ${character.workTitle} ${character.displayWorkTitle}`);
    return text.includes(normalizeText(query))
      && (attribute === "all" || character.attributes.includes(attribute))
      && (!favoritesOnly || favorites.includes(character.key));
  }), [attribute, characters, favorites, favoritesOnly, query]);

  const timelineGroups = useMemo(() => {
    const groups = new Map<string, Character[]>();
    for (const character of filtered) {
      const year = /^\d{4}$/.test(character.year) ? character.year : "年不明";
      groups.set(year, [...(groups.get(year) ?? []), character]);
    }
    // 同じ年では年齢の高い順。結果として若いキャラクターが下に並びます。
    return [...groups.entries()].map(([year, items]) => [year, [...items].sort((a, b) => (b.age ?? -1) - (a.age ?? -1))] as const);
  }, [filtered]);

  const toggleFavorite = (key: string) => {
    const next = favorites.includes(key) ? favorites.filter((item) => item !== key) : [...favorites, key];
    setFavorites(next);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  };

  /** グリッドとタイムラインで、同じ詳細ボタンとデータ紐づけを再利用します。 */
  const characterCard = (character: Character, timeline = false) => <article className={timeline ? "work-timeline-card character-timeline-card" : "media-card character-card"} key={character.key}>
    <button className="card-hit" onClick={() => setSelected(character)} aria-label={`${character.name}の詳細`} />
    <div className="character-card__image">
      <img src={character.image} alt={`${character.name}の画像`} loading="lazy" onError={(event) => { event.currentTarget.src = "/images/default-character.jpg"; }} />
      <button className={`favorite-button ${favorites.includes(character.key) ? "is-favorite" : ""}`} onClick={() => toggleFavorite(character.key)} aria-label="お気に入りを切り替える">★</button>
    </div>
    <div className="character-card__body">
      <p>{character.year} · {character.attributes[0] || "CHARACTER"}</p>
      <h2>{character.name}</h2>
      {character.englishName && normalizeText(character.englishName) !== normalizeText(character.name) && <small>{character.englishName}</small>}
      {timeline && character.age !== null && <b className="character-age">当時 {character.age}歳</b>}
      <span>{character.displayWorkTitle}</span>
    </div>
  </article>;

  return (
    <section className="archive-section shell">
      <ArchiveControls query={query} onQueryChange={setQuery} view={view} onViewChange={setView} count={filtered.length}>
        <select aria-label="属性" value={attribute} onChange={(event) => setAttribute(event.target.value)}><option value="all">すべての属性</option>{attributes.map((item) => <option key={item}>{item}</option>)}</select>
        <button className={favoritesOnly ? "is-active" : ""} onClick={() => setFavoritesOnly((value) => !value)}>★ お気に入り</button>
      </ArchiveControls>

      {view === "grid" ? <div className="media-grid character-grid">{filtered.map((character) => characterCard(character))}</div>
        : <div className="work-timeline character-timeline">{timelineGroups.map(([year, yearCharacters]) => <section className="timeline-year-group" key={year}><h2>{year}</h2><div>{yearCharacters.map((character) => characterCard(character, true))}</div></section>)}</div>}
      {!filtered.length && <p className="empty-state">条件に一致するキャラクターがいません。</p>}

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} label={selected ? `${selected.name}の詳細` : "キャラクター詳細"}>
        {selected && <div className="detail-layout detail-layout--character"><img src={selected.image} alt={selected.name} onError={(event) => { event.currentTarget.src = "/images/default-character.jpg"; }} /><div><p className="eyebrow">{selected.year} · CHARACTER FILE</p><h2>{selected.name}</h2>{selected.englishName && normalizeText(selected.englishName) !== normalizeText(selected.name) && <p className="character-english-name">{selected.englishName}</p>}<p className="detail-subtitle">{selected.displayWorkTitle}</p><div className="tag-row">{selected.attributes.map((item) => <span key={item}>{item}</span>)}</div><p className="detail-copy">{selected.description}</p></div></div>}
      </Modal>
    </section>
  );
}
