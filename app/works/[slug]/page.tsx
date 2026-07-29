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
  findWorkBySlug,
  getCharacterSlug,
  getWorkSlug,
} from "../../lib/archiveSlugs";
import { getCharacters } from "../../lib/characters";
import { findRelatedInterviews } from "../../lib/relatedContent";
import {
  getMediaLabel,
  getPosterUrl,
  getWorkDate,
  getEnrichedWorks,
} from "../../lib/tmdb";
import {
  getDisplayTitle,
  getOriginalTitle,
  getOriginalTitleForDisplay,
  getSourceTitle,
  getWorkCharacters,
  getWorkOverview,
} from "../../lib/workPresentation";

type WorkDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const loadWorks = cache(getEnrichedWorks);

function summarize(value: string) {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

export async function generateMetadata({
  params,
}: WorkDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const works = await loadWorks();
  const work = findWorkBySlug(works, slug);

  if (!work) return { title: "作品が見つかりません" };

  const title = getDisplayTitle(work);
  const description = summarize(getWorkOverview(work));
  const canonical = `/works/${getWorkSlug(work)}`;
  const socialImage =
    `/api/social-card?type=work&slug=${encodeURIComponent(getWorkSlug(work))}`;

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

export default async function WorkDetailPage({
  params,
}: WorkDetailPageProps) {
  const { slug } = await params;
  const works = await loadWorks();
  const work = findWorkBySlug(works, slug);
  if (!work) notFound();

  const title = getDisplayTitle(work);
  const originalTitle = getOriginalTitleForDisplay(work);
  const detailHref = `/works/${getWorkSlug(work)}`;
  const workCharacters = getWorkCharacters(work);
  const linkedCharacters = getCharacters(works).filter(
    (character) => character.workIds.includes(work.id),
  );
  const relatedInterviews = findRelatedInterviews([
    title,
    getSourceTitle(work),
    getOriginalTitle(work),
    ...workCharacters.flatMap((character) => [
      character.name,
      character.englishName,
    ]),
  ]);

  return (
    <main id="main-content" className="archive-detail-page">
      <article className="archive-detail shell">
        <RecentlyViewedTracker
          item={{
            key: `work-${work.media_type}-${work.id}`,
            type: "work",
            title,
            subtitle: originalTitle || undefined,
            href: detailHref,
            image: getPosterUrl(
              work.poster_path,
              work.posterUrl,
            ),
          }}
        />

        <Link className="back-link" href="/works">
          ← WORKS一覧
        </Link>

        <div className="archive-detail__hero">
          <div className="archive-detail__image archive-detail__image--poster">
            <img
              src={getPosterUrl(
                work.poster_path,
                work.posterUrl,
              )}
              alt={`${title}のポスター`}
              width="520"
              height="780"
            />
          </div>

          <div className="archive-detail__heading">
            <p className="eyebrow">
              {getWorkDate(work).slice(0, 4) || "—"} ·{" "}
              {getMediaLabel(work.media_type)}
            </p>
            <h1>{title}</h1>
            {originalTitle && (
              <p className="archive-detail__original">
                {originalTitle}
              </p>
            )}

            <div className="tag-row">
              {workCharacters.map((character) => (
                <span key={`${character.name}-${character.englishName}`}>
                  {character.name}
                </span>
              ))}
              {work.genres?.map((genre) => (
                <span key={genre.id}>{genre.name}</span>
              ))}
            </div>

            <ShareButtons
              url={detailHref}
              title={title}
              text={`デイヴィッド・テナント出演作「${title}」`}
            />
          </div>
        </div>

        <section className="archive-detail__section">
          <p className="eyebrow">OVERVIEW</p>
          <h2>作品あらすじ</h2>
          <p>{getWorkOverview(work)}</p>
        </section>

        {work.providers?.length ? (
          <section className="archive-detail__section">
            <p className="eyebrow">STREAMING IN JAPAN</p>
            <h2>日本の定額配信サービス</h2>
            <div className="archive-detail__tags">
              {work.providers.map((provider) => (
                <span key={provider.provider_id}>
                  {provider.provider_name}
                </span>
              ))}
            </div>
            <small>
              配信状況は変更される場合があります。
              各サービスの公式情報もご確認ください。
            </small>
          </section>
        ) : null}

        {linkedCharacters.length ? (
          <section className="archive-detail__section">
            <p className="eyebrow">CHARACTERS</p>
            <h2>演じたキャラクター</h2>
            <div className="archive-detail__related-grid">
              {linkedCharacters.map((character) => (
                <Link
                  href={`/characters/${getCharacterSlug(character)}`}
                  key={character.key}
                >
                  <img
                    src={character.image}
                    alt=""
                    width="180"
                    height="180"
                  />
                  <span>
                    <strong>{character.name}</strong>
                    {character.englishName && (
                      <small>{character.englishName}</small>
                    )}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <PersonalNoteEditor
          noteKey={`work-${work.media_type}-${work.id}`}
          type="work"
          title={title}
          href={detailHref}
          placeholder="作品の感想や視聴時のメモを入力"
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
          targetType="作品"
          targetTitle={title}
          targetKey={`${work.media_type}-${work.id}`}
        />
      </article>
    </main>
  );
}
