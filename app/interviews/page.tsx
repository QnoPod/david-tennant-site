import type { Metadata } from "next";
import PageHero from "../components/PageHero";
import InterviewsExplorer from "../components/interviews/InterviewsExplorer";
import { getInterviewsNewestFirst } from "../data/interviews/catalog";

export const metadata: Metadata = { title: "インタビュー・翻訳" };

export default function InterviewsPage() {
  const interviews = getInterviewsNewestFirst();
  return <main id="main-content" className="interviews-page"><PageHero eyebrow="INTERVIEWS & TRANSLATIONS" title="INTERVIEWS" description="インタビュー動画と、英語原文・日本語訳を一緒に読めるアーカイブです。" />
    <InterviewsExplorer interviews={interviews} />
  </main>;
}
