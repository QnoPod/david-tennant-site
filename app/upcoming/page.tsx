import type { Metadata } from "next";
import PageHero from "../components/PageHero";
import { getUpcomingWorks } from "../lib/upcoming";
import type { UpcomingSource, UpcomingWork } from "../lib/types";

export const metadata: Metadata = { title: "制作・公開予定" };
export const revalidate = 86400;

const statusLabels: Record<UpcomingWork["status"], string> = {
  rumored: "出演予定・未確定",
  planned: "制作予定",
  filming: "制作中・撮影中",
  "post-production": "ポストプロダクション",
  scheduled: "公開・放送予定",
  unknown: "状況確認中",
  cancelled: "制作中止",
};

const mediaLabels: Record<UpcomingWork["mediaType"], string> = {
  movie: "映画",
  tv: "テレビ",
  stage: "舞台",
  other: "その他",
};

function formatDate(date?: string) {
  if (!date) return "日程未定";
  const [year, month, day] = date.split("-");
  if (!month) return `${year}年`;
  if (!day) return `${year}年${Number(month)}月`;
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function sourcesFor(work: UpcomingWork): UpcomingSource[] {
  if (work.sources?.length) return work.sources;
  return work.sourceUrl ? [{ name: work.source, url: work.sourceUrl, publishedDate: work.publishedDate }] : [];
}

/** 未公開作品と自動検出した発表候補を、WORKSから分離して表示します。 */
export default async function UpcomingPage() {
  const works = await getUpcomingWorks();
  const productions = works.filter((work) => (work.kind || "work") === "work");
  const announcements = works.filter((work) => work.kind === "announcement");

  return <main id="main-content" className="upcoming-page">
    <PageHero
      eyebrow="ANNOUNCED · IN PRODUCTION · COMING SOON"
      title="UPCOMING"
      description="今後の出演予定"
    />
    <section className="archive-section shell">
      <div className="source-notice upcoming-notice">
        <span>AUTO CHECK + CROSS VERIFICATION</span>
        <p>公式発表、または異なる2取得元で作品名と制作状況を確認できた情報だけを「制作・公開予定」に表示。1取得元のみ・作品名不明・噂や交渉中の情報は「確認待ち」に分けます。</p>
      </div>

      <div className="upcoming-summary" aria-label="取得結果">
        <strong>{productions.length}</strong>
        <span>件の制作・公開予定</span>
        <small>{announcements.length}件の発表候補を確認待ち</small>
      </div>

      {productions.length ? <>
        <div className="upcoming-section-heading"><p className="eyebrow">PRODUCTIONS</p><h2>制作・公開予定</h2></div>
        <div className="upcoming-grid">
        {productions.map((work) => <article className={`upcoming-card status-${work.status}`} key={work.key}>
          <div className="upcoming-card__meta">
            <span>{mediaLabels[work.mediaType]}</span>
            <span>{formatDate(work.releaseDate)}</span>
          </div>
          <p className="upcoming-card__status">{statusLabels[work.status]}</p>
          <h2>{work.title}</h2>
          {work.originalTitle && work.originalTitle !== work.title && <p className="upcoming-card__original">{work.originalTitle}</p>}
          {work.character && <p className="upcoming-card__role"><b>出演役</b>{work.character}</p>}
          <p className="upcoming-card__overview">{work.overview || "作品情報は発表され次第追加します。"}</p>
          <footer>
            <span>{work.confirmed ? "公式発表確認済み" : `${work.source}から自動取得`}</span>
            <time dateTime={work.lastCheckedAt}>確認：{work.lastCheckedAt.replaceAll("-", ".")}</time>
            {sourcesFor(work).map((source) => <div className="upcoming-source-summary" key={source.url}>
              <a href={source.url} target="_blank" rel="noreferrer">取得元：{source.name} ↗</a>
              {source.summary && <p>{source.summary}</p>}
            </div>)}
          </footer>
        </article>)}
        </div>
      </> : <div className="upcoming-empty">
        <p className="eyebrow">NO UPCOMING RECORDS</p>
        <h2>現在、取得できる未公開作品はありません。</h2>
        <p>TMDBトークンが設定されている環境では毎日自動確認します。公式発表はdata/upcomingWorks.tsから追加できます。</p>
      </div>}

      {announcements.length > 0 && <section className="upcoming-announcements" aria-labelledby="announcement-heading">
        <div className="upcoming-section-heading"><p className="eyebrow">REVIEW QUEUE</p><h2 id="announcement-heading">確認待ちの発表</h2></div>
        
        <div className="upcoming-announcement-list">
          {announcements.map((item) => <article key={item.key}>
            <div>
              <p>{item.source} · {item.publishedDate ? `公開 ${formatDate(item.publishedDate)}` : `確認 ${formatDate(item.lastCheckedAt)}`}</p>
              <h3>{item.title}</h3>
              {item.overview && <span>{item.overview}</span>}
              <div className="upcoming-announcement__reason">
                <b>確認待ちの理由</b>
                <span>{item.reviewReason || "出演または制作状況について、十分な裏付けを確認できていないため。"}</span>
              </div>
              <div className="upcoming-announcement__source-summaries">
                {sourcesFor(item).map((source) => <div className="upcoming-source-summary" key={source.url}>
                  <a href={source.url} target="_blank" rel="noreferrer">取得元：{source.name} ↗</a>
                  {source.summary && <span>{source.summary}</span>}
                </div>)}
              </div>
            </div>
          </article>)}
        </div>
      </section>}
    </section>
  </main>;
}
