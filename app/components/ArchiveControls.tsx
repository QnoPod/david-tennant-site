/** 作品とキャラクターで共通利用する検索・表示切替バー。 */
export default function ArchiveControls({ query, onQueryChange, view, onViewChange, count, children }: { query: string; onQueryChange: (value: string) => void; view: "grid" | "timeline"; onViewChange: (value: "grid" | "timeline") => void; count: number; children?: React.ReactNode }) {
  return (
    <div className="archive-controls">
      <div className="search-field"><label className="sr-only" htmlFor="character-search">検索</label><input id="character-search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="タイトル・役名で検索" /><b aria-hidden="true">⌕</b>{query && <button className="search-clear" type="button" onClick={() => onQueryChange("")} aria-label="検索文字をすべて消す">×</button>}</div>
      <div className="archive-controls__actions">{children}<button className={view === "grid" ? "is-active" : ""} onClick={() => onViewChange("grid")}>グリッド</button><button className={view === "timeline" ? "is-active" : ""} onClick={() => onViewChange("timeline")}>年代順</button><span>{count}件</span></div>
    </div>
  );
}
