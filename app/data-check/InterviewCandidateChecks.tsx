import type { InterviewSummary } from "../data/interviews/types";

const reviewLabels = {
  pending: "公開判断待ち",
  approved: "公開承認済み",
  rejected: "非掲載",
} as const;

/** 自動取得した動画・記事を、一般公開前に開発者が確認するための一覧です。 */
export default function InterviewCandidateChecks({ candidates }: { candidates: readonly InterviewSummary[] }) {
  const pendingCount = candidates.filter((item) => item.reviewStatus === "pending").length;

  return <section className="data-check interview-candidate-checks shell">
    <div className="section-heading"><div><p className="eyebrow">INTERVIEW REVIEW QUEUE</p><h2>インタビュー公開判断</h2></div><p>{pendingCount}件が確認待ち</p></div>
    <div className="interview-candidate-guide">
      <p>自動取得した情報はすべて非公開です。タイトル、概要、掲載元、元ページを確認してから <code>app/data/interviews/autoCandidates.ts</code> を編集してください。</p>
      <code>isPublished: true, reviewStatus: &quot;approved&quot;, contentStatus: &quot;approved&quot;</code>
    </div>
    <div className="data-check-list">
      {candidates.map((item) => <article key={item.slug}>
        <header><div><p>{item.publishedDate} · {item.source}</p><h2>{item.title}</h2>{item.titleEn && item.titleEn !== item.title && <small>{item.titleEn}</small>}</div><strong>{reviewLabels[item.reviewStatus ?? "pending"]}</strong></header>
        <ul>
          <li><div><b>自動概要</b><p>{item.description}</p></div><code>{item.contentBasis ?? "取得根拠未登録"}</code></li>
          <li><div><b>原文・翻訳</b><p>{item.transcriptSource === "unavailable" ? "発言原文は取得できていません。概要だけを確認してください。" : `取得方法：${item.transcriptSource}`}</p></div><code>{item.contentStatus ?? "metadata-only"}</code></li>
          <li><div><b>公開元を確認</b><p>{item.mediaType === "video" ? "動画を開いて、本人出演・インタビュー内容・公開日を確認します。" : "元記事を開いて、記事種別・概要・リンク先を確認します。"}</p></div><a href={item.externalUrl} target="_blank" rel="noreferrer">取得元を開く ↗</a></li>
        </ul>
      </article>)}
      {!candidates.length && <p className="empty-state">現在、公開判断待ちのインタビュー候補はありません。</p>}
    </div>
  </section>;
}
