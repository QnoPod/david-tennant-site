"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { GlobalSearchCategory, GlobalSearchItem } from "../lib/globalSearch";

const PAGE_SIZE = 20;
const categories: GlobalSearchCategory[] = ["works", "characters", "interviews", "conventions", "upcoming"];
const categoryLabels: Record<GlobalSearchCategory, string> = {
  works: "作品",
  characters: "キャラクター",
  interviews: "インタビュー",
  conventions: "コミコン",
  upcoming: "今後の予定",
};

function normalize(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/[\s・=\-.,:;!?"'()[\]{}~～＆&]/g, "");
}

/** 作品・役柄・インタビュー・イベント・公開予定を一度に検索します。 */
export default function SearchExplorer({ items }: { items: GlobalSearchItem[] }) {
  const initialQuery = useSearchParams().get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<"all" | GlobalSearchCategory>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const counts = useMemo(() => Object.fromEntries(categories.map((key) => [key, items.filter((item) => item.category === key).length])) as Record<GlobalSearchCategory, number>, [items]);
  const filtered = useMemo(() => {
    const needle = normalize(query);
    if (!needle) return [];
    return items.filter((item) => (category === "all" || item.category === category) && normalize(item.searchText).includes(needle));
  }, [category, items, query]);

  const updateQuery = (value: string) => { setQuery(value); setVisibleCount(PAGE_SIZE); };
  const updateCategory = (value: typeof category) => { setCategory(value); setVisibleCount(PAGE_SIZE); };

  return <section className="global-search shell">
    <div className="global-search__controls">
      <label><span className="sr-only">サイト全体を検索</span><input autoFocus value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="作品名、役名、人物、発言テーマなど" />{query && <button type="button" onClick={() => updateQuery("")} aria-label="検索文字を消す">×</button>}<b aria-hidden="true">⌕</b></label>
      <div>{(["all", ...categories] as Array<"all" | GlobalSearchCategory>).map((key) => <button type="button" className={category === key ? "is-active" : ""} onClick={() => updateCategory(key)} key={key}>{key === "all" ? "すべて" : categoryLabels[key]}{key !== "all" && <span>{counts[key]}</span>}</button>)}</div>
    </div>

    {query.trim() ? <>
      <div className="global-search__summary"><strong>{filtered.length}</strong><span>件見つかりました</span></div>
      <div className="global-search__results">{filtered.slice(0, visibleCount).map((item) => <Link href={item.href} key={item.key}>
        <span>{categoryLabels[item.category]}</span><div><p>{item.meta}</p><h2>{item.title}</h2>{item.originalTitle && item.originalTitle !== item.title && <small>{item.originalTitle}</small>}<b>{item.description}</b></div><i aria-hidden="true">→</i>
      </Link>)}</div>
      {!filtered.length && <p className="empty-state">検索条件に一致する情報がありません。</p>}
      {visibleCount < filtered.length && <button className="archive-load-more" type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>さらに表示</button>}
    </> : <div className="global-search__guide"><p className="eyebrow">SEARCH ALL ARCHIVES</p><h2>キーワードを入力してください</h2><p>邦題・原題・キャラクター名・インタビューの人物やテーマ・コミコン名をまとめて検索できます。</p></div>}
  </section>;
}
