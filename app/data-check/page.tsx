import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHero from "../components/PageHero";
import { autoInterviewCandidates } from "../data/interviews/autoCandidates";
import resourceChecks from "../data/generated/resourceChecks.json";
import { buildDataChecks } from "../lib/dataChecks";
import { getEnrichedWorks } from "../lib/tmdb";
import DataCheckExplorer from "./DataCheckExplorer";
import InterviewCandidateChecks from "./InterviewCandidateChecks";
import ResourceCheckExplorer, { type ResourceCheckData } from "./ResourceCheckExplorer";

export const metadata: Metadata = {
  title: "データチェック",
  robots: { index: false, follow: false },
};

/**
 * 開発環境だけで利用できるデータ品質確認ページです。
 * 本番ではデータ取得前に404へ移動し、一般ユーザーへ内容を公開しません。
 */
export default async function DataCheckPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  const works = await getEnrichedWorks();
  const checks = buildDataChecks(works);

  return <main id="main-content" className="data-check-page">
    <PageHero eyebrow="DEVELOPMENT ONLY" title="DATA CHECK" description="TMDB取得データと手入力データの不足項目を確認します。" />
    <DataCheckExplorer checks={checks} totalWorks={works.length} />
    <ResourceCheckExplorer data={resourceChecks as ResourceCheckData} />
    <InterviewCandidateChecks candidates={autoInterviewCandidates} />
  </main>;
}
