"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ArchiveControls from "../components/ArchiveControls";
import {
  ARCHIVE_STORAGE_KEYS,
  readArchiveList,
  writeArchiveList,
} from "../lib/archiveStorage";
import type { Character } from "../lib/types";
import {
  buildSearchUrl,
  readBooleanParam,
  readEnumParam,
  setBooleanParam,
  setStringParam,
} from "../lib/urlSearchParams";
import { normalizeText } from "../lib/workPresentation";

const FAVORITES_KEY = ARCHIVE_STORAGE_KEYS.favoriteCharacters;
const WATCHED_KEY = ARCHIVE_STORAGE_KEYS.watchedWorks;
const INITIAL_VISIBLE_COUNT = 24;
const INITIAL_ATTRIBUTE_GROUP_COUNT = 4;
type AnimationFilter = "HIDE" | "ALL" | "ONLY";
type CharacterView = "grid" | "timeline";

type CharacterUrlState = {
  query: string;
  showAttributes: boolean;
  watchStatus: string;
  animationFilter: AnimationFilter;
  favoritesOnly: boolean;
  view: CharacterView;
};

/**
 * WORKS詳細などから役名付きで遷移した場合、その役がアニメキャラクターなら
 * 初期フィルターを自動解除し、検索結果が0件になるのを防ぎます。
 */
function getInitialAnimationFilter(
  characters: Character[],
  query: string,
): AnimationFilter {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return "HIDE";

  const targetsAnimationCharacter = characters.some((character) =>
    character.attributes.includes("声優・アニメ")
    && [character.name, character.englishName]
      .some((name) => normalizeText(name) === normalizedQuery));

  return targetsAnimationCharacter ? "ALL" : "HIDE";
}

// キャラクター詳細はカードを開いたときだけ読み込みます。
const CharacterDetailModal = dynamic(
  () => import("./CharacterDetailModal"),
  { ssr: false },
);

/** キャラクター検索、属性カテゴリ、お気に入り、グリッド／年代表示を担当。 */
export default function CharactersExplorer({
  characters,
}: {
  characters: Character[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchString = searchParams.toString();
  const initialQuery = searchParams.get("q") ?? "";
  const explicitAnimation = searchParams.get("animation");
  const initialAnimationFilter: AnimationFilter =
    ["HIDE", "ALL", "ONLY"].includes(explicitAnimation || "")
      ? explicitAnimation as AnimationFilter
      : getInitialAnimationFilter(characters, initialQuery);

  const [query, setQuery] = useState(initialQuery);
  const [showAttributes, setShowAttributes] = useState(() =>
    readBooleanParam(searchParams, "attributes"));
  const [watchStatus, setWatchStatus] = useState<string>(() =>
    readEnumParam(
      searchParams,
      "watch",
      ["ALL", "WATCHED", "UNWATCHED"] as const,
      "ALL",
    ));
  const [animationFilter, setAnimationFilter] = useState<AnimationFilter>(
    initialAnimationFilter,
  );
  const [favoritesOnly, setFavoritesOnly] = useState(() =>
    readBooleanParam(searchParams, "favorites"));
  const [favorites, setFavorites] = useState<string[]>([]);
  const [watchedWorks, setWatchedWorks] = useState<number[]>([]);
  const [view, setView] = useState<CharacterView>(() =>
    readEnumParam(
      searchParams,
      "view",
      ["grid", "timeline"] as const,
      "grid",
    ));
  const [selected, setSelected] = useState<Character | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [visibleAttributeGroups, setVisibleAttributeGroups] = useState(
    INITIAL_ATTRIBUTE_GROUP_COUNT,
  );

  const syncingFromUrl = useRef(false);
  const stateRef = useRef<CharacterUrlState>({
    query,
    showAttributes,
    watchStatus,
    animationFilter,
    favoritesOnly,
    view,
  });
  stateRef.current = {
    query,
    showAttributes,
    watchStatus,
    animationFilter,
    favoritesOnly,
    view,
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setFavorites(readArchiveList<string>(FAVORITES_KEY));
      setWatchedWorks(readArchiveList<number>(WATCHED_KEY));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  // URLを直接開いた時とブラウザの戻る／進むで、検索条件を復元します。
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const nextQuery = params.get("q") ?? "";
    const animation = params.get("animation");
    const nextAnimation: AnimationFilter =
      ["HIDE", "ALL", "ONLY"].includes(animation || "")
        ? animation as AnimationFilter
        : getInitialAnimationFilter(characters, nextQuery);

    const next: CharacterUrlState = {
      query: nextQuery,
      showAttributes: readBooleanParam(params, "attributes"),
      watchStatus: readEnumParam(
        params,
        "watch",
        ["ALL", "WATCHED", "UNWATCHED"] as const,
        "ALL",
      ),
      animationFilter: nextAnimation,
      favoritesOnly: readBooleanParam(params, "favorites"),
      view: readEnumParam(
        params,
        "view",
        ["grid", "timeline"] as const,
        "grid",
      ),
    };

    const current = stateRef.current;
    if (
      next.query === current.query
      && next.showAttributes === current.showAttributes
      && next.watchStatus === current.watchStatus
      && next.animationFilter === current.animationFilter
      && next.favoritesOnly === current.favoritesOnly
      && next.view === current.view
    ) return;

    syncingFromUrl.current = true;
    setQuery(next.query);
    setShowAttributes(next.showAttributes);
    setWatchStatus(next.watchStatus);
    setAnimationFilter(next.animationFilter);
    setFavoritesOnly(next.favoritesOnly);
    setView(next.view);

    const frame = window.requestAnimationFrame(() => {
      syncingFromUrl.current = false;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [characters, searchString]);

  // 現在の検索条件を共有可能なURLへ保存します。
  useEffect(() => {
    if (syncingFromUrl.current) return;

    const params = new URLSearchParams(searchString);
    setStringParam(params, "q", query);
    setBooleanParam(params, "attributes", showAttributes);
    setStringParam(params, "watch", watchStatus, "ALL");
    setStringParam(params, "animation", animationFilter, "HIDE");
    setBooleanParam(params, "favorites", favoritesOnly);
    setStringParam(params, "view", view, "grid");

    const nextUrl = buildSearchUrl(pathname, params);
    const currentUrl = buildSearchUrl(
      pathname,
      new URLSearchParams(searchString),
    );
    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [
    animationFilter,
    favoritesOnly,
    pathname,
    query,
    router,
    searchString,
    showAttributes,
    view,
    watchStatus,
  ]);

  const attributeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const character of characters) {
      for (const item of new Set(character.attributes)) {
        counts.set(item, (counts.get(item) ?? 0) + 1);
      }
    }
    return counts;
  }, [characters]);

  const watchedWorkIds = useMemo(
    () => new Set(watchedWorks.map(String)),
    [watchedWorks],
  );

  const filtered = useMemo(() => characters.filter((character) => {
    const text = normalizeText(
      `${character.name} ${character.englishName} ${character.workTitle} ${character.displayWorkTitle}`,
    );
    const isWatched = character.workIds.some((id) =>
      watchedWorkIds.has(String(id)));
    const isAnimationCharacter = character.attributes.includes("声優・アニメ");

    return text.includes(normalizeText(query))
      && (watchStatus === "ALL"
        || (watchStatus === "WATCHED" ? isWatched : !isWatched))
      && (animationFilter === "ALL"
        || (animationFilter === "ONLY"
          ? isAnimationCharacter
          : !isAnimationCharacter))
      && (!favoritesOnly || favorites.includes(character.key));
  }), [
    animationFilter,
    characters,
    favorites,
    favoritesOnly,
    query,
    watchStatus,
    watchedWorkIds,
  ]);

  const attributeGroups = useMemo(() =>
    [...attributeCounts.keys()]
      .map((item) => ({
        attribute: item,
        characters: filtered.filter((character) =>
          character.attributes.includes(item)),
      }))
      .filter((group) => group.characters.length)
      .sort((a, b) => {
        const aIsOther = a.attribute === "その他職業"
          || a.attribute === "その他の職業";
        const bIsOther = b.attribute === "その他職業"
          || b.attribute === "その他の職業";
        if (aIsOther !== bIsOther) return aIsOther ? 1 : -1;
        return b.characters.length - a.characters.length
          || a.attribute.localeCompare(b.attribute, "ja");
      }),
    [attributeCounts, filtered],
  );

  const visibleCharacters = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );

  const timelineGroups = useMemo(() => {
    const groups = new Map<string, Character[]>();
    for (const character of visibleCharacters) {
      const year = /^\d{4}$/.test(character.year)
        ? character.year
        : "年不明";
      groups.set(year, [...(groups.get(year) ?? []), character]);
    }
    return [...groups.entries()].map(([year, items]) => [
      year,
      [...items].sort((a, b) => (b.age ?? -1) - (a.age ?? -1)),
    ] as const);
  }, [visibleCharacters]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
    setVisibleAttributeGroups(INITIAL_ATTRIBUTE_GROUP_COUNT);
  }, [animationFilter, favoritesOnly, query, view, watchStatus]);

  const toggleFavorite = (character: Character) => {
    const isFavorite = favorites.includes(character.key);
    if (
      isFavorite
      && !window.confirm(`「${character.name}」のお気に入りを解除しますか？`)
    ) return;
    const next = isFavorite
      ? favorites.filter((item) => item !== character.key)
      : [...favorites, character.key];
    setFavorites(next);
    writeArchiveList(FAVORITES_KEY, next);
  };

  const clearFavorites = () => {
    if (
      !favorites.length
      || !window.confirm("CHARACTERSのお気に入りをすべて解除しますか？")
    ) return;
    setFavorites([]);
    setFavoritesOnly(false);
    writeArchiveList(FAVORITES_KEY, []);
  };

  const attributeSectionId = (item: string) =>
    `character-attribute-${encodeURIComponent(item)}`;

  /** カードの属性を押すとカテゴリ表示をONにし、該当する属性枠まで移動します。 */
  const goToAttribute = (item: string) => {
    setShowAttributes(true);
    const targetIndex = attributeGroups.findIndex(
      (group) => group.attribute === item,
    );
    if (targetIndex >= 0) {
      setVisibleAttributeGroups((count) =>
        Math.max(count, targetIndex + 1));
    }
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document
          .getElementById(attributeSectionId(item))
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  const favoriteButton = (character: Character, timeline: boolean) => (
    <button
      className={`favorite-button ${
        timeline ? "favorite-button--timeline" : ""
      } ${
        favorites.includes(character.key) ? "is-favorite" : ""
      }`}
      onClick={() => toggleFavorite(character)}
      aria-label={favorites.includes(character.key)
        ? `${character.name}のお気に入りを解除`
        : `${character.name}をお気に入りに追加`}
    >
      ★{timeline ? " お気に入り" : ""}
    </button>
  );

  /** グリッドとタイムラインで、同じ詳細ボタンとデータ紐づけを再利用します。 */
  const characterCard = (character: Character, timeline = false) => (
    <article
      className={timeline
        ? "work-timeline-card character-timeline-card"
        : "media-card character-card"}
      key={character.key}
    >
      <button
        className="card-hit"
        onClick={() => setSelected(character)}
        aria-label={`${character.name}の詳細`}
      />
      <div className="character-card__image">
        <img
          src={character.image}
          alt={`${character.name}の画像`}
          width="400"
          height="400"
          loading="lazy"
          decoding="async"
          onError={(event) => {
            event.currentTarget.src = "/images/default-character.jpg";
          }}
        />
        {!timeline && favoriteButton(character, false)}
      </div>
      <div className="character-card__body">
        <p>{character.year}</p>
        <h2>{character.name}</h2>
        {character.englishName
          && normalizeText(character.englishName)
            !== normalizeText(character.name)
          && <small>{character.englishName}</small>}
        {timeline && character.age !== null && (
          <b className="character-age">当時 {character.age}歳</b>
        )}
        <span>{character.displayWorkTitle}</span>
        {showAttributes && (
          <div className="character-card__attributes">
            {character.attributes.map((item) => (
              <button
                type="button"
                className="is-active"
                key={item}
                onClick={() => goToAttribute(item)}
              >
                {item}
              </button>
            ))}
          </div>
        )}
        {timeline && favoriteButton(character, true)}
      </div>
    </article>
  );

  return (
    <section className="archive-section shell">
      <ArchiveControls
        className="archive-controls--characters"
        query={query}
        onQueryChange={setQuery}
        view={view}
        onViewChange={setView}
        count={filtered.length}
        showViewControls={false}
      >
        <select
          className="character-watch-filter"
          aria-label="視聴状況"
          value={watchStatus}
          onChange={(event) => setWatchStatus(event.target.value)}
        >
          <option value="ALL">すべての視聴状況</option>
          <option value="WATCHED">視聴済</option>
          <option value="UNWATCHED">未視聴</option>
        </select>
        <select
          className="character-animation-filter"
          aria-label="アニメキャラクターの表示"
          value={animationFilter}
          onChange={(event) =>
            setAnimationFilter(event.target.value as AnimationFilter)}
        >
          <option value="HIDE">アニメ：表示しない</option>
          <option value="ALL">アニメ：表示する</option>
          <option value="ONLY">アニメだけ表示</option>
        </select>
        <button
          className={showAttributes ? "is-active" : ""}
          onClick={() => setShowAttributes((value) => !value)}
        >
          {showAttributes ? "属性をOFF" : "属性をON"}
        </button>
        <div className="character-favorite-controls">
          <button
            className={favoritesOnly ? "is-active" : ""}
            onClick={() => setFavoritesOnly((value) => !value)}
          >
            {favoritesOnly
              ? "★ お気に入りのみ表示"
              : "☆ お気に入りのみ表示"}
          </button>
          <button
            className="archive-clear-favorites"
            disabled={!favorites.length}
            onClick={clearFavorites}
          >
            お気に入りを一括解除
          </button>
        </div>
      </ArchiveControls>

      <div className="archive-summary">
        <p>
          カードを選ぶと、キャラクターの説明と関連作品・インタビューを表示します。
        </p>
        <div>
          <button
            className={view === "grid" ? "is-active" : ""}
            onClick={() => setView("grid")}
          >
            グリッド
          </button>
          <button
            className={view === "timeline" ? "is-active" : ""}
            onClick={() => setView("timeline")}
          >
            年代順
          </button>
          <strong>{filtered.length} / {characters.length}人</strong>
        </div>
      </div>

      {showAttributes
        ? (
          <div className="character-attribute-sections">
            {attributeGroups
              .slice(0, visibleAttributeGroups)
              .map((group) => (
                <section
                  className="character-attribute-section"
                  id={attributeSectionId(group.attribute)}
                  key={group.attribute}
                >
                  <div className="character-attribute-section__heading">
                    <p className="eyebrow">ATTRIBUTE FILE</p>
                    <h2>{group.attribute}</h2>
                    <span>{group.characters.length}人</span>
                  </div>
                  {view === "grid"
                    ? (
                      <div className="media-grid character-grid">
                        {group.characters.map((character) =>
                          characterCard(character))}
                      </div>
                    )
                    : (
                      <div className="work-timeline character-timeline character-attribute-timeline">
                        {group.characters.map((character) =>
                          characterCard(character, true))}
                      </div>
                    )}
                </section>
              ))}
            {visibleAttributeGroups < attributeGroups.length && (
              <button
                className="archive-load-more"
                type="button"
                onClick={() => setVisibleAttributeGroups((count) =>
                  count + INITIAL_ATTRIBUTE_GROUP_COUNT)}
              >
                さらに属性を表示
              </button>
            )}
          </div>
        )
        : view === "grid"
          ? (
            <div className="media-grid character-grid">
              {visibleCharacters.map((character) => characterCard(character))}
            </div>
          )
          : (
            <div className="work-timeline character-timeline">
              {timelineGroups.map(([year, yearCharacters]) => (
                <section className="timeline-year-group" key={year}>
                  <h2>{year}</h2>
                  <div>
                    {yearCharacters.map((character) =>
                      characterCard(character, true))}
                  </div>
                </section>
              ))}
            </div>
          )}

      {!filtered.length && (
        <p className="empty-state">
          条件に一致するキャラクターがいません。
        </p>
      )}

      {!showAttributes && visibleCount < filtered.length && (
        <button
          className="archive-load-more"
          type="button"
          onClick={() => setVisibleCount((count) =>
            count + INITIAL_VISIBLE_COUNT)}
        >
          さらに
          {Math.min(
            INITIAL_VISIBLE_COUNT,
            filtered.length - visibleCount,
          )}
          人を表示
        </button>
      )}

      {selected && (
        <CharacterDetailModal
          character={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
