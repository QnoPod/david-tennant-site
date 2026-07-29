import type { Metadata } from "next";
import { cache, Suspense } from "react";
import PageHero from "../components/PageHero";
import { findWorkBySlug, getWorkSlug } from "../lib/archiveSlugs";
import {
  getBackdropUrl,
  getEnrichedWorks,
  getPosterUrl,
} from "../lib/tmdb";
import {
  getDisplayTitle,
  getWorkOverview,
} from "../lib/workPresentation";
import WorksExplorer from "./WorksExplorer";

type WorksPageProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

const loadWorks = cache(getEnrichedWorks);

const defaultMetadata: Metadata = {
  title: "出演作品",
  description:
    "デイヴィッド・テナントの映画、テレビ、舞台、声の出演作品。",
};

function firstValue(
  value: string | string[] | undefined,
) {
  return Array.isArray(value) ? value[0] : value;
}

function summarize(value: string) {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

/**
 * /works?detail=... をXなどが取得した時、
 * 選択中の作品に合わせてタイトル・説明・画像を出し分けます。
 */
export async function generateMetadata({
  searchParams,
}: WorksPageProps): Promise<Metadata> {
  const params = await searchParams;
  const detailSlug = firstValue(params.detail);
  if (!detailSlug) return defaultMetadata;

  const works = await loadWorks();
  const work = findWorkBySlug(works, detailSlug);
  if (!work) return defaultMetadata;

  const title = getDisplayTitle(work);
  const description = summarize(getWorkOverview(work));
  const canonical =
    `/works?detail=${encodeURIComponent(getWorkSlug(work))}`;
  const image =
    getBackdropUrl(work.backdrop_path, work.backdropUrl)
    || getPosterUrl(work.poster_path, work.posterUrl);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "ja_JP",
      url: canonical,
      siteName: "David Tennant Archive",
      title,
      description,
      images: [{
        url: image,
        alt: `${title}の作品画像`,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

/** TMDBへの通信はサーバー側で1度だけ行い、ブラウザには必要な一覧だけを渡します。 */
export default async function WorksPage() {
  const works = await loadWorks();

  return (
    <main id="main-content">
      <PageHero
        eyebrow="FILMOGRAPHY"
        title="WORKS"
        description="映画、テレビ、舞台、声の出演。公開年や役名から検索"
      />
      <Suspense fallback={null}>
        <WorksExplorer works={works} />
      </Suspense>
    </main>
  );
}
