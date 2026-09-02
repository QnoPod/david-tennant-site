import Link from "next/link";
import { getAllInterviewTags, getInterviewTagGroup, type InterviewSummary } from "../../data/interviews/types";
import InterviewBookmarkButton from "./InterviewBookmarkButton";
import WatchLaterButton from "../WatchLaterButton";

/** 動画と記事で共通利用する、インタビュー一覧カード。 */
export default function InterviewCard({ interview, onOpen }: { interview: InterviewSummary; onOpen?: () => void }) {
  const isVideo = interview.mediaType === "video";
  const tags = getAllInterviewTags(interview.tagGroups, interview.tags);
  const showWholeThumbnail = interview.slug === "david-tennant-it-just-feels-scary-guardian-2009";
  const genreTags = getInterviewTagGroup(interview.tagGroups, "categories");
  return <article className="interview-card">
    <Link className="interview-card__link" href={`/interviews/${interview.slug}`} aria-label={`${interview.title}を読む`} onClick={onOpen} />
    <InterviewBookmarkButton slug={interview.slug} title={interview.title} compact />
    <WatchLaterButton slug={interview.slug} title={interview.title} compact />
    <div
      className="video-thumb"
      style={showWholeThumbnail ? { minHeight: 0, height: "clamp(220px, 28vw, 300px)" } : undefined}
    >
      <img
        src={interview.thumbnailUrl}
        alt=""
        width="480"
        height="360"
        loading="lazy"
        decoding="async"
        style={showWholeThumbnail ? {
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "center",
          background: "var(--ink)",
        } : undefined}
      />
      <span>{isVideo ? "▶" : "記事"}</span>
    </div>
    <div>
      <p>{interview.publishedDate.replaceAll("-", ".")} · {interview.source}</p>
      <h2 className={interview.titleEn ? "interview-title-ja" : undefined}>{interview.title}</h2>
      {interview.titleEn && <p className="interview-title-en" lang="en">{interview.titleEn}</p>}
      <p className="interview-card-description">{interview.description}</p>
      <div className="tag-row">{tags.map((tag) => (
        <span
          className={genreTags.includes(tag)
            ? "interview-genre-tag"
            : undefined}
          key={tag}
        >
          {tag}
        </span>
      ))}</div>
      <strong>{isVideo ? "動画と翻訳を読む" : "記事と翻訳を読む"} →</strong>
    </div>
  </article>;
}
