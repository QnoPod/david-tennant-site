import Link from "next/link";
import { getAllInterviewTags, type InterviewSummary } from "../../data/interviews/types";
import InterviewBookmarkButton from "./InterviewBookmarkButton";

/** 動画と記事で共通利用する、インタビュー一覧カード。 */
export default function InterviewCard({ interview, onOpen }: { interview: InterviewSummary; onOpen?: () => void }) {
  const isVideo = interview.mediaType === "video";
  const tags = getAllInterviewTags(interview.tagGroups);
  return <article className="interview-card">
    <Link className="interview-card__link" href={`/interviews/${interview.slug}`} aria-label={`${interview.title}を読む`} onClick={onOpen} />
    <InterviewBookmarkButton slug={interview.slug} title={interview.title} compact />
    <div className="video-thumb">
      <img src={interview.thumbnailUrl} alt="" loading="lazy" decoding="async" />
      <span>{isVideo ? "▶" : "記事"}</span>
    </div>
    <div>
      <p>{interview.publishedDate.replaceAll("-", ".")} · {interview.source}</p>
      <h2 className={interview.titleEn ? "interview-title-ja" : undefined}>{interview.title}</h2>
      {interview.titleEn && <p className="interview-title-en" lang="en">{interview.titleEn}</p>}
      <p className="interview-card-description">{interview.description}</p>
      <div className="tag-row">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      <strong>{isVideo ? "動画と翻訳を読む" : "記事と翻訳を読む"} →</strong>
    </div>
  </article>;
}
