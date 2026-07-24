import type { Metadata } from "next";
import PageHero from "../components/PageHero";
import ReportIssueButton from "../components/ReportIssueButton";
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

const OVERVIEW_MIN_LENGTH = 120;
const OVERVIEW_MAX_LENGTH = 180;
const overviewClampStyle = {
  display: "-webkit-box",
  overflow: "hidden",
  WebkitBoxOrient: "vertical" as const,
  WebkitLineClamp: 4,
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
  return work.sourceUrl
    ? [{
        name: work.source,
        url: work.sourceUrl,
        publishedDate: work.publishedDate,
      }]
    : [];
}

/**
 * 取得元の全文はデータに残したまま、カード表示用だけを3〜4行程度へ短縮します。
 * 文の途中で切れにくいよう文末を優先し、長い場合だけ180文字以内へ収めます。
 */
function summarizeOverview(value?: string) {
  const normalized = (value || "作品情報は発表され次第追加します。")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.length <= OVERVIEW_MAX_LENGTH) return normalized;

  const sentences =
    normalized.match(/[^。！？.!?]+[。！？.!?]?/g) || [normalized];
  let summary = "";
  let consumedLength = 0;

  for (const sentence of sentences) {
    const cleanSentence = sentence.trim();
    if (!cleanSentence) continue;
    const candidate = `${summary}${cleanSentence}`;

    if (candidate.length > OVERVIEW_MAX_LENGTH) break;
    summary = candidate;
    consumedLength += sentence.length;

    if (summary.length >= OVERVIEW_MIN_LENGTH) break;
  }

  if (summary.length < OVERVIEW_MIN_LENGTH) {
    const remainder = normalized.slice(consumedLength).trim();
    const available = OVERVIEW_MAX_LENGTH - summary.length;
    summary = `${summary}${remainder.slice(0, available)}`;
  }

  return `${summary
    .slice(0, OVERVIEW_MAX_LENGTH)
    .replace(/[、,\s]+$/u, "")
    .replace(/[。！？.!?]+$/u, "")}…`;
}

/** 未公開作品と自動検出した発表候補を、WORKSから分離して表示します。 */
export default async function UpcomingPage() {
  const works = await getUpcomingWorks();
  const productions = works.filter(
    (work) => (work.kind || "work") === "work",
  );
  const announcements = works.filter(
    (work) => work.kind === "announcement",
  );

  return (
    <main id="main-content" className="upcoming-page">
      <PageHero
        eyebrow="ANNOUNCED · IN PRODUCTION · COMING SOON"
        title="UPCOMING"
        description="今後の出演予定"
      />

      <section className="archive-section shell">
        <div className="source-notice upcoming-notice">
          <span>AUTO CHECK + CROSS VERIFICATION</span>
          <p>
            公式発表、または異なる2取得元で作品名と制作状況を確認できた情報だけを
            「制作・公開予定」に表示。1取得元のみ・作品名不明・噂や交渉中の情報は
            「確認待ち」に分けます。
          </p>
        </div>

        <div className="upcoming-summary" aria-label="取得結果">
          <strong>{productions.length}</strong>
          <span>件の制作・公開予定</span>
          <small>{announcements.length}件の発表候補を確認待ち</small>
        </div>

        {productions.length
          ? (
            <>
              <div className="upcoming-section-heading">
                <p className="eyebrow">PRODUCTIONS</p>
                <h2>制作・公開予定</h2>
              </div>
              <div className="upcoming-grid">
                {productions.map((work) => {
                  const sources = sourcesFor(work);
                  return (
                    <article
                      className={`upcoming-card status-${work.status}`}
                      key={work.key}
                    >
                      <div className="upcoming-card__meta">
                        <span>{mediaLabels[work.mediaType]}</span>
                        <span>{formatDate(work.releaseDate)}</span>
                      </div>
                      <p className="upcoming-card__status">
                        {statusLabels[work.status]}
                      </p>
                      <h2>{work.title}</h2>
                      {work.originalTitle
                        && work.originalTitle !== work.title
                        && (
                          <p className="upcoming-card__original">
                            {work.originalTitle}
                          </p>
                        )}
                      {work.character && (
                        <p className="upcoming-card__role">
                          <b>出演役</b>{work.character}
                        </p>
                      )}
                      <p
                        className="upcoming-card__overview"
                        style={overviewClampStyle}
                      >
                        {summarizeOverview(work.overview)}
                      </p>
                      <footer>
                        <span>
                          {work.confirmed
                            ? "公式発表確認済み"
                            : `${work.source}から自動取得`}
                        </span>
                        <time dateTime={work.lastCheckedAt}>
                          確認：{work.lastCheckedAt.replaceAll("-", ".")}
                        </time>
                        {sources.map((source) => (
                          <div
                            className="upcoming-source-summary"
                            key={source.url}
                          >
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              取得元：{source.name} ↗
                            </a>
                            {source.summary && <p>{source.summary}</p>}
                          </div>
                        ))}
                        <ReportIssueButton
                          compact
                          targetType="制作・公開予定"
                          targetTitle={work.title}
                          targetKey={work.key}
                          sourceUrl={sources[0]?.url}
                        />
                      </footer>
                    </article>
                  );
                })}
              </div>
            </>
          )
          : (
            <div className="upcoming-empty">
              <p className="eyebrow">NO UPCOMING RECORDS</p>
              <h2>現在、取得できる未公開作品はありません。</h2>
              <p>
                TMDBトークンが設定されている環境では毎日自動確認します。
                公式発表はdata/upcomingWorks.tsから追加できます。
              </p>
            </div>
          )}

        {announcements.length > 0 && (
          <section
            className="upcoming-announcements"
            aria-labelledby="announcement-heading"
          >
            <div className="upcoming-section-heading">
              <p className="eyebrow">REVIEW QUEUE</p>
              <h2 id="announcement-heading">確認待ちの発表</h2>
            </div>

            <div className="upcoming-announcement-list">
              {announcements.map((item) => {
                const sources = sourcesFor(item);
                return (
                  <article key={item.key}>
                    <div>
                      <p>
                        {item.source} · {item.publishedDate
                          ? `公開 ${formatDate(item.publishedDate)}`
                          : `確認 ${formatDate(item.lastCheckedAt)}`}
                      </p>
                      <h3>{item.title}</h3>
                      {item.overview && <span>{item.overview}</span>}
                      <div className="upcoming-announcement__reason">
                        <b>確認待ちの理由</b>
                        <span>
                          {item.reviewReason
                            || "出演または制作状況について、十分な裏付けを確認できていないため。"}
                        </span>
                      </div>
                      <div className="upcoming-announcement__source-summaries">
                        {sources.map((source) => (
                          <div
                            className="upcoming-source-summary"
                            key={source.url}
                          >
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              取得元：{source.name} ↗
                            </a>
                            {source.summary && <span>{source.summary}</span>}
                          </div>
                        ))}
                      </div>
                      <ReportIssueButton
                        compact
                        targetType="確認待ちの発表"
                        targetTitle={item.title}
                        targetKey={item.key}
                        sourceUrl={sources[0]?.url}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
