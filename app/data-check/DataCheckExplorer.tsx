"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DATA_CHECK_DEFINITIONS, type DataCheckKey } from "../lib/dataCheckDefinitions";
import type { WorkDataCheck } from "../lib/dataChecks";

const checkKeys = Object.keys(DATA_CHECK_DEFINITIONS) as DataCheckKey[];

/** 不足項目、データ取得元、作品名で開発用チェック結果を絞り込みます。 */
export default function DataCheckExplorer({ checks, totalWorks }: { checks: WorkDataCheck[]; totalWorks: number }) {
  const [query, setQuery] = useState("");
  const [issueFilter, setIssueFilter] = useState<"all" | DataCheckKey>("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | WorkDataCheck["source"]>("all");

  const counts = useMemo(() => Object.fromEntries(checkKeys.map((key) => [
    key,
    checks.filter((work) => work.issues.some((item) => item.key === key)).length,
  ])) as Record<DataCheckKey, number>, [checks]);

  const filtered = useMemo(() => {
    const needle = query.normalize("NFKC").toLowerCase().trim();
    return checks.filter((work) => {
      const matchesText = !needle || `${work.title} ${work.originalTitle}`.normalize("NFKC").toLowerCase().includes(needle);
      const matchesIssue = issueFilter === "all" || work.issues.some((item) => item.key === issueFilter);
      const matchesSource = sourceFilter === "all" || work.source === sourceFilter;
      return matchesText && matchesIssue && matchesSource;
    });
  }, [checks, issueFilter, query, sourceFilter]);

  const reset = () => { setQuery(""); setIssueFilter("all"); setSourceFilter("all"); };

  return <section className="data-check shell">
    <div className="data-check-summary" aria-label="不足データの集計">
      <article><strong>{totalWorks}</strong><span>全作品</span></article>
      <article><strong>{checks.length}</strong><span>要確認作品</span></article>
      {checkKeys.map((key) => <button type="button" key={key} className={issueFilter === key ? "is-active" : ""} onClick={() => setIssueFilter((current) => current === key ? "all" : key)}><strong>{counts[key]}</strong><span>{DATA_CHECK_DEFINITIONS[key].label}</span></button>)}
    </div>

    <div className="data-check-filters">
      <label><span>作品名で検索</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="邦題・原題" /></label>
      <label><span>不足項目</span><select value={issueFilter} onChange={(event) => setIssueFilter(event.target.value as typeof issueFilter)}><option value="all">すべての不足項目</option>{checkKeys.map((key) => <option value={key} key={key}>{DATA_CHECK_DEFINITIONS[key].label}（{counts[key]}）</option>)}</select></label>
      <label><span>データ取得元</span><select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as typeof sourceFilter)}><option value="all">TMDB・手入力すべて</option><option value="TMDB">TMDB</option><option value="手入力">手入力</option></select></label>
      <button type="button" onClick={reset}>条件をリセット</button>
    </div>

    <div className="data-check-results"><strong>{filtered.length}</strong><span>件を表示</span></div>
    <div className="data-check-list">
      {filtered.map((work) => <article key={work.key}>
        <header><div><p>{work.year} · {work.source}</p><div className="data-check-title-row"><h2>{work.title}</h2><Link href={`/works?q=${encodeURIComponent(work.title)}`}>該当作品を開く →</Link></div>{work.originalTitle !== work.title && <small>{work.originalTitle}</small>}</div><strong>{work.issues.length}項目</strong></header>
        <ul>{work.issues.map((item) => <li key={item.key}><div><b>{item.label}</b><p>{item.detail}</p></div><code>{item.editFile}</code></li>)}</ul>
      </article>)}
      {!filtered.length && <p className="empty-state">条件に一致する不足データはありません。</p>}
    </div>
  </section>;
}
