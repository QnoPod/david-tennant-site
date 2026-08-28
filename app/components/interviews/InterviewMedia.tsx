import type { InterviewSummary } from "../../data/interviews/types";

/** YouTube動画と記事画像を、同じ詳細ページから表示する共通部品。 */
export default function InterviewMedia({ interview }: { interview: InterviewSummary }) {
  if (interview.mediaType === "video" && interview.videoId) {
    return <div className="video-frame"><iframe src={`https://www.youtube-nocookie.com/embed/${interview.videoId}`} title={interview.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>;
  }

  const isGuardianScary2009 =
    interview.slug === "david-tennant-it-just-feels-scary-guardian-2009";

  return (
    <div
      className="article-frame"
      style={isGuardianScary2009 ? {
        maxWidth: "480px",
        background: "transparent",
      } : undefined}
    >
      <img
        src={interview.thumbnailUrl}
        alt={`${interview.title}の掲載画像`}
        width={isGuardianScary2009 ? "445" : "1200"}
        height={isGuardianScary2009 ? "667" : "675"}
        loading="lazy"
        decoding="async"
        style={isGuardianScary2009 ? {
          width: "100%",
          height: "auto",
          maxHeight: "none",
          objectFit: "contain",
          objectPosition: "center",
        } : undefined}
      />
    </div>
  );
}
