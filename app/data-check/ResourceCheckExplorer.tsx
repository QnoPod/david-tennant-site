"use client";

import { useMemo, useState } from "react";

export type ResourceCheckItem = {
  id: string;
  kind: "image" | "link" | "video";
  target: string;
  status: "ok" | "broken" | "warning" | "unchecked";
  httpStatus: number | null;
  message: string;
  checkedAt: string;
  references: { file: string; line: number }[];
};

export type ResourceCheckData = {
  updatedAt: string | null;
  mode: "full" | "local-only";
  summary: Record<"total" | "ok" | "broken" | "warning" | "unchecked", number>;
  items: ResourceCheckItem[];
};

const statusLabels = { all: "すべて", broken: "切れ", warning: "要手動確認", unchecked: "未確認", ok: "正常" } as const;
const kindLabels = { all: "すべて", image: "画像", link: "外部リンク", video: "YouTube" } as const;

/** 画像切れとリンク切れを、状態・種類・参照元で確認する開発者用一覧です。 */
export default function ResourceCheckExplorer({ data }: { data: ResourceCheckData }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ResourceCheckItem["status"]>("broken");
  const [kind, setKind] = useState<"all" | ResourceCheckItem["kind"]>("all");

  const filtered = useMemo(() => {
    const needle = query.normalize("NFKC").toLowerCase().trim();
    return data.items.filter((item) => {
      const text = `${item.target} ${item.references.map((reference) => reference.file).join(" ")}`.normalize("NFKC").toLowerCase();
      return (!needle || text.includes(needle)) && (status === "all" || item.status === status) && (kind === "all" || item.kind === kind);
    });
  }, [data.items, kind, query, status]);
  const updatedDate = data.updatedAt ? new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeZone: "Asia/Tokyo" }).format(new Date(data.updatedAt)) : null;

  return <section className="data-check resource-check shell">
    <div className="section-heading"><div><p className="eyebrow">LINK &amp; IMAGE CHECK</p><h2>リンク・画像切れ</h2></div><p>{updatedDate ? `結果更新：${updatedDate}` : "未実行"}</p></div>
    <div className="resource-check-guide">
      <p><code>npm run check:resources</code> で外部リンクを含めて確認します。<code>npm run check:resources -- --local-only</code> はローカル画像だけをすばやく確認します。</p>
      <p>404・410と画像ファイルなしは「切れ」、403・429・タイムアウトは誤判定を避けて「要手動確認」に分けています。</p>
    </div>

    <div className="data-check-summary resource-check-summary" aria-label="リンクと画像の検査集計">
      <article><strong>{data.summary.total}</strong><span>検査対象</span></article>
      {(["broken", "warning", "unchecked", "ok"] as const).map((key) => <button type="button" key={key} className={status === key ? "is-active" : ""} onClick={() => setStatus((current) => current === key ? "all" : key)}><strong>{data.summary[key]}</strong><span>{statusLabels[key]}</span></button>)}
    </div>

    <div className="data-check-filters resource-check-filters">
      <label><span>URL・ファイル名で検索</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="画像名・リンク・ソースファイル" /></label>
      <label><span>状態</span><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <label><span>種類</span><select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}>{Object.entries(kindLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <button type="button" onClick={() => { setQuery(""); setStatus("broken"); setKind("all"); }}>条件をリセット</button>
    </div>

    <div className="data-check-results"><strong>{filtered.length}</strong><span>件を表示</span></div>
    <div className="resource-check-list">
      {filtered.map((item) => <article key={item.id} className={`resource-check-item resource-check-item--${item.status}`}>
        <header><div><p>{kindLabels[item.kind]} · {statusLabels[item.status]}{item.httpStatus ? ` · HTTP ${item.httpStatus}` : ""}</p><h3>{item.target}</h3></div>{item.target.startsWith("http") && <a href={item.target} target="_blank" rel="noreferrer">ブラウザで確認 ↗</a>}</header>
        <p>{item.message}</p>
        <ul>{item.references.map((reference) => <li key={`${reference.file}:${reference.line}`}><code>{reference.file}:{reference.line}</code></li>)}</ul>
      </article>)}
      {!filtered.length && <p className="empty-state">条件に一致するリンク・画像はありません。</p>}
    </div>
  </section>;
}
