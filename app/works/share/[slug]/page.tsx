import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import {
  findWorkBySlug,
  getWorkSlug,
} from "../../../lib/archiveSlugs";
import { getWorks } from "../../../lib/tmdb";
import {
  getDisplayTitle,
  getWorkOverview,
} from "../../../lib/workPresentation";
import ShareWorkRedirect from "./ShareWorkRedirect";

type WorkSharePageProps = {
  params: Promise<{ slug: string }>;
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim()
  || "https://david-tennant-site.vercel.app";

const loadWorks = cache(getWorks);

function absoluteUrl(value: string) {
  return new URL(value, SITE_URL).toString();
}

function summarize(value: string) {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

/**
 * Xのクローラーはこの固有パスから作品別カード情報を取得します。
 * クエリ文字列に依存しないため、作品ごとに別のカードとして扱われます。
 */
export async function generateMetadata({
  params,
}: WorkSharePageProps): Promise<Metadata> {
  const { slug } = await params;
  const works = await loadWorks();
  const work = findWorkBySlug(works, slug);

  if (!work) {
    return {
      title: "作品が見つかりません",
      robots: { index: false, follow: false },
    };
  }

  const canonicalSlug = getWorkSlug(work);
  const title = getDisplayTitle(work);
  const description = summarize(getWorkOverview(work));
  const sharePath = `/works/share/${canonicalSlug}`;
  const versionedSharePath = `${sharePath}?card=3`;
  const image =
    absoluteUrl(`${sharePath}/image?card=3`);

  return {
    title,
    description,
    alternates: { canonical: versionedSharePath },
    robots: { index: false, follow: true },
    openGraph: {
      type: "website",
      locale: "ja_JP",
      url: absoluteUrl(versionedSharePath),
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

export default async function WorkSharePage({
  params,
}: WorkSharePageProps) {
  const { slug } = await params;
  const works = await loadWorks();
  const work = findWorkBySlug(works, slug);
  if (!work) notFound();

  const canonicalSlug = getWorkSlug(work);
  const target =
    `/works?detail=${encodeURIComponent(canonicalSlug)}`;

  return (
    <ShareWorkRedirect
      target={target}
      title={getDisplayTitle(work)}
    />
  );
}
