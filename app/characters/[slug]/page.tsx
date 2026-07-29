import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import PersonalNoteEditor from "../../components/PersonalNoteEditor";
import RecentlyViewedTracker from "../../components/RecentlyViewedTracker";
import RelatedLinks from "../../components/RelatedLinks";
import ReportIssueButton from "../../components/ReportIssueButton";
import ShareButtons from "../../components/ShareButtons";
import {
  findCharacterBySlug,
  getCharacterSlug,
  getWorkSlug,
} from "../../lib/archiveSlugs";
import { getCharacters } from "../../lib/characters";
import { findRelatedInterviews } from "../../lib/relatedContent";
import { getWorks } from "../../lib/tmdb";
import { getDisplayTitle } from "../../lib/workPresentation";

type CharacterDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const loadData = cache(async () => {
  const works = await getWorks();
  return {
    works,
    characters: getCharacters(works),
  };
});

function summarize(value: string) {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

export async function generateMetadata({
  params,
}: CharacterDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { characters } = await loadData();
  const character = findCharacterBySlug(characters, slug);

  if (!character) {
    return { title: "キャラクターが見つかりません" };
  }

  const title = character.name;
  const description = summarize(character.description);
  const canonical =
    `/characters/${getCharacterSlug(character)}`;
  const socialImage =
    `/api/social-card?type=character&slug=${encodeURIComponent(getCharacterSlug(character))}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      locale: "ja_JP",
      url: canonical,
      title,
      description,
      images: [{
        url: socialImage,
        width: 1200,
        height: 630,
        alt: `${title}の共有画像`,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}

export default async function CharacterDetailPage({
  params,
}: CharacterDetailPageProps) {
  const { slug } = await params;
  const { works, characters } = await loadData();
  const character = findCharacterBySlug(characters, slug);
  if (!character) notFound();

  const detailHref =
    `/characters/${getCharacterSlug(character)}`;
  const linkedWorks = works.filter((work) =>
    character.workIds.includes(work.id));
  const relatedInterviews = findRelatedInterviews([
    character.workTitle,
    character.displayWorkTitle,
    character.name,
    character.englishName,
  ]);

  return (
    <main id="main-content" className="archive-detail-page">
      <article className="archive-detail shell">
        <RecentlyViewedTracker
          item={{
            key: `character-${character.key}`,
            type: "character",
            title: character.name,
            subtitle: character.displayWorkTitle,
            href: detailHref,
            image: character.image,
          }}
        />

        <Link className="back-link" href="/characters">
          ← CHARACTERS一覧
        </Link>

        <div className="archive-detail__hero">
          <div className="archive-detail__image archive-detail__image--character">
            <img
              src={character.image}
              alt={character.name}
              width="600"
              height="600"
            />
          </div>

          <div className="archive-detail__heading">
            <p className="eyebrow">
              {character.year} · CHARACTER FILE
            </p>
            <h1>{character.name}</h1>
            {character.englishName && (
              <p className="archive-detail__original">
                {character.englishName}
              </p>
            )}
            <p className="archive-detail__work-title">
              {character.displayWorkTitle}
            </p>

            <div className="tag-row">
              {character.attributes.map((attribute) => (
                <span key={attribute}>{attribute}</span>
              ))}
              {character.age !== null && (
                <span>当時 {character.age}歳</span>
              )}
            </div>

            <ShareButtons
              url={detailHref}
              title={character.name}
              text={`デイヴィッド・テナントが演じた「${character.name}」`}
            />
          </div>
        </div>

        <section className="archive-detail__section">
          <p className="eyebrow">CHARACTER PROFILE</p>
          <h2>キャラクターについて</h2>
          <p>{character.description}</p>
        </section>

        {linkedWorks.length ? (
          <section className="archive-detail__section">
            <p className="eyebrow">WORKS</p>
            <h2>出演作品</h2>
            <div className="archive-detail__work-links">
              {linkedWorks.map((work) => (
                <Link
                  href={`/works/${getWorkSlug(work)}`}
                  key={`${work.media_type}-${work.id}`}
                >
                  <strong>{getDisplayTitle(work)}</strong>
                  <span>作品ページを見る →</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <PersonalNoteEditor
          noteKey={`character-${character.key}`}
          type="character"
          title={character.name}
          href={detailHref}
          placeholder="キャラクターの感想や覚えておきたいことを入力"
        />

        <RelatedLinks
          title="関連インタビュー"
          items={relatedInterviews.map((interview) => ({
            href: `/interviews/${interview.slug}`,
            title: interview.title,
            meta: `${interview.year} · ${interview.source}`,
            description: interview.titleEn,
          }))}
        />

        <ReportIssueButton
          targetType="キャラクター"
          targetTitle={`${character.name}｜${character.displayWorkTitle}`}
          targetKey={character.key}
        />
      </article>
    </main>
  );
}
