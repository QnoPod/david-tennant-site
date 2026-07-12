import type { InterviewSummary } from "../../data/interviews/types";

/** YouTube動画と記事画像を、同じ詳細ページから表示する共通部品。 */
export default function InterviewMedia({ interview }: { interview: InterviewSummary }) {
  if (interview.mediaType === "video" && interview.videoId) {
    return <div className="video-frame"><iframe src={`https://www.youtube-nocookie.com/embed/${interview.videoId}`} title={interview.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>;
  }
  return <div className="article-frame"><img src={interview.thumbnailUrl} alt={`${interview.title}の掲載画像`} loading="lazy" decoding="async" /></div>;
}
