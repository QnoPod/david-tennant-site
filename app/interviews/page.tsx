import type { Metadata } from "next";
import PageHero from "../components/PageHero";
import InterviewsExplorer from "../components/interviews/InterviewsExplorer";
import { getInterviewsNewestFirst } from "../data/interviews/catalog";

export const metadata: Metadata = { title: "インタビュー・翻訳" };

export default function InterviewsPage() {
  const interviews = getInterviewsNewestFirst();
  return <main id="main-content" className="interviews-page"><PageHero eyebrow="INTERVIEWS & TRANSLATIONS" title="INTERVIEWS" description="インタビュー動画・記事の英語原文と日本語訳" />
    <InterviewsExplorer interviews={interviews} />
  </main>;
}
