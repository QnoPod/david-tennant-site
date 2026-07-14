"use client";

export type SortOrder = "default" | "popularity" | "title";
export type GenreMode = "include" | "exclude";

type Props = {
  query: string; setQuery: (value: string) => void;
  characterQuery: string; setCharacterQuery: (value: string) => void;
  availability: string; setAvailability: (value: string) => void;
  watchStatus: string; setWatchStatus: (value: string) => void;
  sortOrder: SortOrder; setSortOrder: (value: SortOrder) => void;
  favoritesOnly: boolean; setFavoritesOnly: (value: boolean) => void;
  favoriteCount: number;
  onClearFavorites: () => boolean;
  providers: string[]; selectedProviders: string[]; setSelectedProviders: (value: string[]) => void;
  genres: string[]; selectedGenres: string[]; setSelectedGenres: (value: string[]) => void;
  genreMode: GenreMode; setGenreMode: (value: GenreMode) => void;
  expanded: boolean; setExpanded: (value: boolean) => void;
  onReset: () => void;
};

/** 旧サイトと同じ検索項目を、レスポンシブなフィルターパネルとして整理。 */
export default function WorkFilters(props: Props) {
  const toggle = (value: string, list: string[], setter: (value: string[]) => void) => setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  return <div className="work-filters">
    <div className="work-filters__top"><strong>作品を絞り込む</strong><button onClick={props.onReset}>条件をリセット</button></div>
    <div className="work-searches">
      <label><span>🎬</span><input value={props.query} onChange={(event) => props.setQuery(event.target.value)} placeholder="作品名で検索..." aria-label="作品名で検索" />{props.query && <button onClick={() => props.setQuery("")} aria-label="作品名検索をクリア">×</button>}</label>
      <label><span>👥</span><input value={props.characterQuery} onChange={(event) => props.setCharacterQuery(event.target.value)} placeholder="キャラクター名で検索..." aria-label="キャラクター名で検索" />{props.characterQuery && <button onClick={() => props.setCharacterQuery("")} aria-label="キャラクター検索をクリア">×</button>}</label>
    </div>
    <div className="work-filter-row">
      <select aria-label="配信状況" value={props.availability} onChange={(event) => props.setAvailability(event.target.value)}><option value="ALL">すべての配信状況</option><option value="AVAILABLE">日本で配信中</option><option value="UNAVAILABLE">配信なし</option></select>
      <select aria-label="視聴状況" value={props.watchStatus} onChange={(event) => props.setWatchStatus(event.target.value)}><option value="ALL">すべての視聴状況</option><option value="WATCHED">視聴済</option><option value="UNWATCHED">未視聴</option></select>
      <select aria-label="並び順" value={props.sortOrder} onChange={(event) => props.setSortOrder(event.target.value as SortOrder)}><option value="default">公開順（新しい順）</option><option value="popularity">人気順</option><option value="title">タイトル順（ABC/五十音）</option></select>
      <button className={props.favoritesOnly ? "is-active" : ""} onClick={() => props.setFavoritesOnly(!props.favoritesOnly)}>{props.favoritesOnly ? "★ お気に入りのみ表示" : "☆ お気に入りのみ表示"}</button>
      <button className="archive-clear-favorites" disabled={!props.favoriteCount} onClick={() => { if (props.onClearFavorites()) props.setFavoritesOnly(false); }}>お気に入りを一括解除</button>
    </div>
    <button className="work-filters__expand" onClick={() => props.setExpanded(!props.expanded)}>{props.expanded ? "▲ 詳細フィルターを閉じる" : "▼ 配信サービス・ジャンルで絞り込む"}</button>
    {props.expanded && <div className="work-filter-details">
      <fieldset><legend>配信サービスで絞り込む</legend><div>{props.providers.map((provider) => <button className={props.selectedProviders.includes(provider) ? "is-active" : ""} onClick={() => toggle(provider, props.selectedProviders, props.setSelectedProviders)} key={provider}>{provider}</button>)}</div>{props.selectedProviders.length > 0 && <button className="clear-link" onClick={() => props.setSelectedProviders([])}>選択を全解除</button>}</fieldset>
      <fieldset><legend>ジャンルで絞り込む</legend><div className="genre-heading"><label><input type="radio" checked={props.genreMode === "include"} onChange={() => props.setGenreMode("include")} />含める</label><label><input type="radio" checked={props.genreMode === "exclude"} onChange={() => props.setGenreMode("exclude")} />除外する</label></div><div>{props.genres.map((genre) => <button className={props.selectedGenres.includes(genre) ? "is-active" : ""} onClick={() => toggle(genre, props.selectedGenres, props.setSelectedGenres)} key={genre}>{genre}</button>)}</div>{props.selectedGenres.length > 0 && <button className="clear-link" onClick={() => props.setSelectedGenres([])}>選択を全解除</button>}</fieldset>
    </div>}
  </div>;
}
