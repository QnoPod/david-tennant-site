import Link from "next/link";
import { getAllInterviewTags, type InterviewSummary } from "../../data/interviews/types";

/** 動画と記事で共通利用する、インタビュー一覧カード。 */
export default function InterviewCard({ interview }: { interview: InterviewSummary }) {
  const isVideo = interview.mediaType === "video";
  const tags = getAllInterviewTags(interview.tagGroups);
  return <Link className="interview-card" href={`/interviews/${interview.slug}`}>
    <div className="video-thumb">
      <img src={interview.thumbnailUrl} alt="" loading="lazy" decoding="async" />
      <span>{isVideo ? "▶" : "記事"}</span>
    </div>
    <div>
      <p>{interview.publishedDate.replaceAll("-", ".")} · {interview.source}</p>
      <h2>{interview.title}</h2>
      <p>{interview.description}</p>
      <div className="tag-row">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      <strong>{isVideo ? "動画と翻訳を読む" : "記事と翻訳を読む"} →</strong>
    </div>
  </Link>;
}

