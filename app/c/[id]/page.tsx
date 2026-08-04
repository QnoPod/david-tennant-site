import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import ShareRedirect from "../../components/ShareRedirect";
import {
  findCharacterBySlug,
  getCharacterShareId,
  getCharacterSlug,
} from "../../lib/archiveSlugs";
import { getCharacters } from "../../lib/characters";
import { getPreparedSocialImagePath } from "../../lib/socialImagePaths";
import { getWorks } from "../../lib/tmdb";

type Props = {
  params: Promise<{ id: string }>;
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
  return value.replace(/\s+/g, " ").trim().slice(0, 180);
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { id } = await params;
  const characters = await loadCharacters();
  const character = findCharacterBySlug(
    characters,
    id,
  );

  if (!character) {
    return {
      title: "キャラクターが見つかりません",
      robots: { index: false, follow: false },
    };
  }

  const shortPath =
    `/c/${getCharacterShareId(character)}`;
  const target =
    `/characters?detail=${encodeURIComponent(
      getCharacterSlug(character),
    )}`;
  const title = character.name;
  const description = summarize(
    character.description,
  );
  const preparedImage =
    getPreparedSocialImagePath(
      character.image,
      "characters",
    );
  const image = absoluteUrl(
    preparedImage || character.image,
  );

  return {
    title,
    description,
    alternates: { canonical: target },
    robots: { index: false, follow: true },
    openGraph: {
      type: "profile",
      locale: "ja_JP",
      url: absoluteUrl(shortPath),
      siteName: "David Tennant Archive",
      title,
      description,
      images: [{
        url: image,
        width: 800,
        height: 800,
        type: "image/jpeg",
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

export default async function Page({
  params,
}: Props) {
  const { id } = await params;
  const characters = await loadCharacters();
  const character = findCharacterBySlug(
    characters,
    id,
  );
  if (!character) notFound();

  const target =
    `/characters?detail=${encodeURIComponent(
      getCharacterSlug(character),
    )}`;

  return (
    <ShareRedirect
      target={target}
      title={character.name}
      eyebrow="CHARACTER FILE"
      message="キャラクターの詳細を開いています。"
    />
  );
}
