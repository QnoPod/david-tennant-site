import type { Metadata } from "next";
import PageHero from "../components/PageHero";
import { interviewCatalog } from "../data/interviews/catalog";
import { getCharacters } from "../lib/characters";
import { getWorks } from "../lib/tmdb";
import MyArchive from "./MyArchive";

export const metadata: Metadata = { title: "マイアーカイブ" };

/** 既存のお気に入り・視聴済み・インタビューのしおりをまとめる個人用ページ。 */
export default async function MyArchivePage() {
  const works = await getWorks();
  return <main id="main-content" className="my-archive-page">
    <PageHero eyebrow="YOUR SAVED COLLECTION" title="MY ARCHIVE" description="最近見た項目、お気に入りの作品・キャラクター、インタビューのしおりを一か所で確認できます。" />
    <MyArchive works={works} characters={getCharacters(works)} interviews={interviewCatalog} />
  </main>;
}
