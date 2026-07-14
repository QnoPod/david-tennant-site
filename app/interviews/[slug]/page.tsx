import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import InterviewMedia from "../../components/interviews/InterviewMedia";
import InterviewBookmarkButton from "../../components/interviews/InterviewBookmarkButton";
import InterviewTranscript from "../../components/interviews/InterviewTranscript";
import RelatedLinks from "../../components/RelatedLinks";
import { interviewCatalog } from "../../data/interviews/catalog";
import { getInterviewBySlug } from "../../data/interviews/loadInterview";
import { getAllInterviewTags } from "../../data/interviews/types";
import { findRelatedInterviews } from "../../lib/relatedContent";

type InterviewPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return interviewCatalog.map((interview) => ({ slug: interview.slug })); }

export async function generateMetadata({ params }: InterviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  const interview = interviewCatalog.find((item) => item.slug === slug);
  return { title: interview?.title ?? "インタビュー" };
}

/** 動画・記事の基本情報と、英語原文、日本語訳を同じ画面で読める詳細ページ。 */
export default async function InterviewDetailPage({ params }: InterviewPageProps) {
  const { slug } = await params;
  const interview = await getInterviewBySlug(slug);
  if (!interview) notFound();
  const relatedWorkTags = interview.tagGroups.genres;
  const relatedInterviews = findRelatedInterviews(relatedWorkTags, interview.slug);
  return <main id="main-content"><article className="interview-detail shell">
    <Link className="back-link" href="/interviews">← インタビュー一覧</Link>
    <header><p className="eyebrow">{interview.year} · {interview.source}</p><h1 className={interview.titleEn ? "interview-title-ja" : undefined}>{interview.title}</h1>{interview.titleEn && <p className="interview-detail-title-en" lang="en">{interview.titleEn}</p>}<p className="interview-detail-description">{interview.description}</p><InterviewBookmarkButton slug={interview.slug} title={interview.title} /><div className="tag-row">{getAllInterviewTags(interview.tagGroups).map((tag) => <span key={tag}>{tag}</span>)}</div></header>
    <InterviewMedia interview={interview} />
    <div className="transcript-heading"><div><p className="eyebrow">{interview.mediaType === "video" ? "TRANSCRIPT & TRANSLATION" : "ARTICLE & TRANSLATION"}</p><h2>英語原文・日本語訳</h2></div><a className="text-link" href={interview.externalUrl} target="_blank" rel="noreferrer">{interview.mediaType === "video" ? "YouTubeで見る" : "掲載記事を読む"} ↗</a></div>
    <InterviewTranscript lines={interview.transcript} videoId={interview.videoId} />
    <aside className="translation-note"><strong>翻訳について</strong><p>読みやすさを優先した日本語訳です。動画の内容や文脈に合わせて、今後注釈を追加する場合があります。</p></aside>
    <RelatedLinks title="関連作品・キャラクター" items={relatedWorkTags.map((workTitle) => ({ href: `/works?q=${encodeURIComponent(workTitle)}`, title: workTitle, meta: "関連作品", description: "作品情報・配信情報を見る", secondaryHref: `/characters?q=${encodeURIComponent(workTitle)}`, secondaryLabel: "キャラクターを見る" }))} />
    <RelatedLinks title="あわせて読みたいインタビュー" items={relatedInterviews.map((item) => ({ href: `/interviews/${item.slug}`, title: item.title, meta: `${item.year} · ${item.source}`, description: item.titleEn }))} />
  </article></main>;
}
