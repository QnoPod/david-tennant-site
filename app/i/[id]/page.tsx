import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShareRedirect from "../../components/ShareRedirect";
import { getPublishedInterviews } from "../../data/interviews/catalog";
import { getInterviewShareId } from "../../lib/archiveSlugs";
import { getPreparedSocialImagePath } from "../../lib/socialImagePaths";

type Props = {
  params: Promise<{ id: string }>;
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim()
  || "https://david-tennant-site.vercel.app";

function absoluteUrl(value: string) {
  return new URL(value, SITE_URL).toString();
}

function summarize(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 180);
}

function findInterview(id: string) {
  return getPublishedInterviews().find(
    (interview) =>
      getInterviewShareId(interview.slug) === id,
  );
}

export function generateStaticParams() {
  return getPublishedInterviews().map(
    (interview) => ({
      id: getInterviewShareId(interview.slug),
    }),
  );
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { id } = await params;
  const interview = findInterview(id);

  if (!interview) {
    return {
      title: "インタビュー",
      robots: { index: false, follow: false },
    };
  }

  const shortPath =
    `/i/${getInterviewShareId(interview.slug)}`;
  const target =
    `/interviews/${interview.slug}`;
  const preparedImage =
    getPreparedSocialImagePath(
      interview.thumbnailUrl,
      "interviews",
    );
  const image = absoluteUrl(
    preparedImage
    || `${target}/image?card=5`,
  );
  const description = summarize(
    interview.description,
  );

  return {
    title: interview.title,
    description,
    alternates: { canonical: target },
    robots: { index: false, follow: true },
    openGraph: {
      type: "article",
      locale: "ja_JP",
      url: absoluteUrl(shortPath),
      siteName: "David Tennant Archive",
      title: interview.title,
      description,
      publishedTime:
        `${interview.publishedDate}T00:00:00.000Z`,
      images: [{
        url: image,
        width: 1200,
        height: 630,
        alt: `${interview.title}のインタビュー画像`,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: interview.title,
      description,
      images: [image],
    },
  };
}

export default async function Page({
  params,
}: Props) {
  const { id } = await params;
  const interview = findInterview(id);
  if (!interview) notFound();

  const target =
    `/interviews/${interview.slug}`;

  return (
    <ShareRedirect
      target={target}
      title={interview.title}
      eyebrow="INTERVIEW"
      message="インタビューを開いています。"
    />
  );
}
