import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import ShareRedirect from "../../components/ShareRedirect";
import {
  findWorkBySlug,
  getWorkShareId,
  getWorkSlug,
} from "../../lib/archiveSlugs";
import { getPreparedSocialImagePath } from "../../lib/socialImagePaths";
import {
  getBackdropUrl,
  getPosterUrl,
  getWorks,
} from "../../lib/tmdb";
import {
  getDisplayTitle,
  getWorkOverview,
} from "../../lib/workPresentation";

type Props = {
  params: Promise<{ id: string }>;
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim()
  || "https://david-tennant-site.vercel.app";

const loadWorks = cache(getWorks);

function absoluteUrl(value: string) {
  return new URL(value, SITE_URL).toString();
}

function summarize(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 180);
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { id } = await params;
  const works = await loadWorks();
  const work = findWorkBySlug(works, id);

  if (!work) {
    return {
      title: "作品が見つかりません",
      robots: { index: false, follow: false },
    };
  }

  const shortPath =
    `/w/${getWorkShareId(work)}`;
  const slug = getWorkSlug(work);
  const target =
    `/works?detail=${encodeURIComponent(slug)}`;
  const title = getDisplayTitle(work);
  const description = summarize(
    getWorkOverview(work),
  );
  const imageSource =
    getBackdropUrl(
      work.backdrop_path,
      work.backdropUrl,
    )
    || getPosterUrl(
      work.poster_path,
      work.posterUrl,
    );
  const preparedImage =
    getPreparedSocialImagePath(
      imageSource,
      "works",
    );
  const image = absoluteUrl(
    preparedImage
    || `/works/share/${slug}/image?card=5`,
  );

  return {
    title,
    description,
    alternates: { canonical: target },
    robots: { index: false, follow: true },
    openGraph: {
      type: "website",
      locale: "ja_JP",
      url: absoluteUrl(shortPath),
      siteName: "David Tennant Archive",
      title,
      description,
      images: [{
        url: image,
        width: 1200,
        height: 630,
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

export default async function Page({
  params,
}: Props) {
  const { id } = await params;
  const works = await loadWorks();
  const work = findWorkBySlug(works, id);
  if (!work) notFound();

  const target =
    `/works?detail=${encodeURIComponent(
      getWorkSlug(work),
    )}`;

  return (
    <ShareRedirect
      target={target}
      title={getDisplayTitle(work)}
      eyebrow="WORK FILE"
      message="作品の詳細を開いています。"
    />
  );
}
