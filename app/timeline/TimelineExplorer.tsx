"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { TimelineEvent, TimelineEventType } from "../lib/timeline";
import { normalizeText } from "../lib/workPresentation";

const PAGE_SIZE = 40;
const TYPE_OPTIONS: Array<{ value: TimelineEventType; label: string }> = [
  { value: "work", label: "作品" },
  { value: "character", label: "キャラクター" },
  { value: "appearance", label: "出演回・登壇" },
  { value: "interview", label: "インタビュー" },
  { value: "convention", label: "コミコン" },
  { value: "milestone", label: "キャリアの節目" },
];

/** 年表の検索、複数カテゴリ選択、年代、並び順、段階表示を担当します。 */
export default function TimelineExplorer({ events }: { events: TimelineEvent[] }) {
  const allTypes = TYPE_OPTIONS.map((option) => option.value);
  const [query, setQuery] = useState("");
  const [types, setTypes] = useState<TimelineEventType[]>(allTypes);
  const [decade, setDecade] = useState("ALL");
  const [order, setOrder] = useState<"newest" | "oldest">("newest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const decades = useMemo(() => [...new Set(events
    .map((event) => /^\d{4}$/.test(event.year) ? `${Math.floor(Number(event.year) / 10) * 10}` : null)
    .filter((value): value is string => Boolean(value)))].sort((a, b) => Number(b) - Number(a)), [events]);

  const filtered = useMemo(() => {
    const needle = normalizeText(query);
    const result = events.filter((event) => {
      const eventDecade = /^\d{4}$/.test(event.year) ? `${Math.floor(Number(event.year) / 10) * 10}` : "UNKNOWN";
      return types.includes(event.type)
        && (decade === "ALL" || decade === eventDecade)
        && (!needle || normalizeText(`${event.title} ${event.subtitle} ${event.description} ${event.searchText}`).includes(needle));
    });
    return order === "newest" ? result : [...result].reverse();
  }, [decade, events, order, query, types]);

  const visible = filtered.slice(0, visibleCount);
  const groups = useMemo(() => {
    const result = new Map<string, TimelineEvent[]>();
    for (const event of visible) result.set(event.year, [...(result.get(event.year) ?? []), event]);
    return [...result.entries()];
  }, [visible]);

  const updateTypes = (type: TimelineEventType) => {
    setTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
    setVisibleCount(PAGE_SIZE);
  };
  const reset = () => { setQuery(""); setTypes(allTypes); setDecade("ALL"); setOrder("newest"); setVisibleCount(PAGE_SIZE); };

  return <section className="archive-section shell">
    <div className="timeline-controls">
      <div className="timeline-controls__heading"><strong>年表を絞り込む</strong><button type="button" onClick={reset}>条件をリセット</button></div>
      <div className="search-field"><label className="sr-only" htmlFor="timeline-search">年表を検索</label><input id="timeline-search" value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(PAGE_SIZE); }} placeholder="作品・役名・人物・イベントを検索" />{query && <button className="search-clear" type="button" onClick={() => setQuery("")} aria-label="検索文字を消す">×</button>}</div>
      <fieldset><legend>表示する情報</legend><div>{TYPE_OPTIONS.map((option) => <button type="button" className={types.includes(option.value) ? `is-active type-${option.value}` : ""} aria-pressed={types.includes(option.value)} onClick={() => updateTypes(option.value)} key={option.value}>{option.label}</button>)}</div></fieldset>
      <div className="timeline-selects"><label>年代<select value={decade} onChange={(event) => { setDecade(event.target.value); setVisibleCount(PAGE_SIZE); }}><option value="ALL">すべての年代</option>{decades.map((value) => <option value={value} key={value}>{value}年代</option>)}<option value="UNKNOWN">年不明</option></select></label><label>並び順<select value={order} onChange={(event) => { setOrder(event.target.value as "newest" | "oldest"); setVisibleCount(PAGE_SIZE); }}><option value="newest">新しい順</option><option value="oldest">古い順</option></select></label></div>
    </div>

    <div className="timeline-results"><p><strong>{filtered.length}</strong> / {events.length}件</p><span>各項目を選ぶと元のアーカイブへ移動します</span></div>
    <div className="unified-timeline">{groups.map(([year, yearEvents]) => <section className="unified-timeline__year" key={year}><h2>{year}</h2><div>{yearEvents.map((event) => <Link className={`unified-timeline__event type-${event.type}`} href={event.href} key={event.id}><time dateTime={event.date}>{event.dateLabel}</time><div><p>{TYPE_OPTIONS.find((option) => option.value === event.type)?.label}</p><h3>{event.title}</h3><strong>{event.subtitle}</strong><span>{event.description}</span></div></Link>)}</div></section>)}</div>
    {!filtered.length && <div className="empty-state"><p>条件に一致する出来事がありません。</p><button type="button" onClick={reset}>すべて表示する</button></div>}
    {visibleCount < filtered.length && <button className="timeline-load-more" type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>さらに表示（残り{filtered.length - visibleCount}件）</button>}
  </section>;
}
