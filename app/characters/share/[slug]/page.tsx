import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import {
  findCharacterBySlug,
  getCharacterSlug,
} from "../../../lib/archiveSlugs";
import { getCharacters } from "../../../lib/characters";
import { getWorks } from "../../../lib/tmdb";
import ShareCharacterRedirect from "./ShareCharacterRedirect";

type CharacterSharePageProps = {
  params: Promise<{ slug: string }>;
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim()
  || "https://david-tennant-site.vercel.app";

const loadCharacters = cache(async () => {
  const works = await getWorks();
  return getCharacters(works);
});

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
 * Xはキャラクター固有のパスからカード情報を取得します。
 * 正方形画像に合うsummaryカードを使い、画像はプロキシURLから返します。
 */
export async function generateMetadata({
  params,
}: CharacterSharePageProps): Promise<Metadata> {
  const { slug } = await params;
  const characters = await loadCharacters();
  const character = findCharacterBySlug(characters, slug);

  if (!character) {
    return {
      title: "キャラクターが見つかりません",
      robots: { index: false, follow: false },
    };
  }

  const canonicalSlug = getCharacterSlug(character);
  const title = character.name;
  const description = summarize(character.description);
  const sharePath = `/characters/share/${canonicalSlug}`;
  const versionedSharePath = `${sharePath}?card=2`;
  const image =
    absoluteUrl(`${sharePath}/image?card=2`);

  return {
    title,
    description,
    alternates: { canonical: versionedSharePath },
    robots: { index: false, follow: true },
    openGraph: {
      type: "profile",
      locale: "ja_JP",
      url: absoluteUrl(versionedSharePath),
      siteName: "David Tennant Archive",
      title,
      description,
      images: [{
        url: image,
        alt: `${title}のキャラクター画像`,
      }],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [image],
    },
  };
}

export default async function CharacterSharePage({
  params,
}: CharacterSharePageProps) {
  const { slug } = await params;
  const characters = await loadCharacters();
  const character = findCharacterBySlug(characters, slug);
  if (!character) notFound();

  const canonicalSlug = getCharacterSlug(character);
  const target =
    `/characters?detail=${encodeURIComponent(canonicalSlug)}`;

  return (
    <ShareCharacterRedirect
      target={target}
      title={character.name}
    />
  );
}
