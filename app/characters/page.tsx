import type { Metadata } from "next";
import PageHero from "../components/PageHero";
import { getCharacters } from "../lib/characters";
import { getWorks } from "../lib/tmdb";
import CharactersExplorer from "./CharactersExplorer";

export const metadata: Metadata = { title: "キャラクター" };

export default async function CharactersPage() {
  const works = await getWorks();
  return <main id="main-content"><PageHero eyebrow="CHARACTER FILES" title="CHARACTERS" description="デイヴィッドが演じた人物を、年代や役柄の属性から探せます。" /><CharactersExplorer characters={getCharacters(works)} /></main>;
}
