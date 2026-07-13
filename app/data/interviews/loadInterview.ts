import { interviewCatalog } from "./catalog";
import { getAllInterviewTags, type Interview, type TranscriptLine } from "./types";

type TranscriptLoader = () => Promise<readonly TranscriptLine[]>;

/**
 * 詳細ページを開いたときだけ、該当する長い翻訳ファイルを読み込みます。
 * インタビューを追加したら、catalog.ts とこの対応表へ同じslugを追加してください。
 */
const transcriptLoaders: Record<string, TranscriptLoader> = {
  "bella-maclean-found-her-fire-in-rivals": async () =>
    (await import("./transcripts/bellaMacleanRivalsTranscript")).bellaMacleanRivalsTranscript,
  "michael-sheen-david-tennant-one-final-time-lorraine": async () =>
    (await import("./transcripts/michaelSheenLorraineTranscript")).michaelSheenLorraineTranscript,
  "michael-sheen-his-dark-materials-this-morning": async () =>
    (await import("./transcripts/michaelSheenThisMorningTranscript")).michaelSheenThisMorningTranscript,
  "david-tennant-evil-character-jessica-jones": async () =>
    (await import("./transcripts/davidTennantEvilCharacterTranscript")).davidTennantEvilCharacterTranscript,
  "david-tennant-injured-himself-rivals-scene": async () =>
    (await import("./transcripts/davidTennantRivalsInjuryTranscript")).davidTennantRivalsInjuryTranscript,
  "rivals-tennant-hassell-tv-insider": async () =>
    (await import("./transcripts/rivalsTennantHassellTranscript")).rivalsTennantHassellTranscript,
  "david-tennant-doctor-who-devilish-demon": async () =>
    (await import("./transcripts/davidTennantDevilishDemonTranscript")).davidTennantDevilishDemonTranscript,
  "david-tennant-emoji-graham-norton": async () =>
    (await import("./transcripts/davidTennantEmojiTranscript")).davidTennantEmojiTranscript,
  "david-tennant-child-five-james-corden": async () =>
    (await import("./transcripts/davidTennantChildFiveTranscript")).davidTennantChildFiveTranscript,
  "david-tennant-red-hair-this-morning": async () =>
    (await import("./transcripts/davidTennantRedHairTranscript")).davidTennantRedHairTranscript,
  "david-tennant-fights-the-demon-of-imposter-syndrome": async () =>
    (await import("./transcripts/imposterSyndromeTranscript")).imposterSyndromeTranscript,
  "david-tennant-rsc-winter-2013": async () =>
    (await import("./transcripts/davidTennantRscWinter2013Transcript")).davidTennantRscWinter2013Transcript,
  "nta-2015-special-recognition": async () =>
    (await import("./transcripts/nta2015Transcript")).nta2015Transcript,

  "michael-sheen-national-treasure-david-tennant": async () =>
    (await import("./transcripts/michaelSheenNationalTreasureTranscript")).michaelSheenNationalTreasureTranscript,
  "david-michael-good-omens-premiere": async () =>
    (await import("./transcripts/davidMichaelGoodOmensPremiereTranscript")).davidMichaelGoodOmensPremiereTranscript,
  "jon-hamm-david-tennant-michael-sheen-dueling-hamlets": async () =>
    (await import("./transcripts/jonHammDuelingHamletsTranscript")).jonHammDuelingHamletsTranscript,
  "good-omens-nycc-2018": async () =>
    (await import("./transcripts/goodOmensNycc2018Transcript")).goodOmensNycc2018Transcript,

  "david-tennant-closet-picks": async () =>
    (await import("./transcripts/davidTennantClosetPicksTranscript")).davidTennantClosetPicksTranscript,
  "david-ty-tennant-best-moments": async () =>
    (await import("./transcripts/davidTyTennantBestMomentsTranscript")).davidTyTennantBestMomentsTranscript,
  "david-michael-good-omens-season-two-prime-video": async () =>
    (await import("./transcripts/davidMichaelGoodOmensSeasonTwoTranscript")).davidMichaelGoodOmensSeasonTwoTranscript,
  "david-tennant-broadchurch-secrets-this-morning": async () =>
    (await import("./transcripts/davidTennantBroadchurchSecretsTranscript")).davidTennantBroadchurchSecretsTranscript,
};

/** slugから基本情報と翻訳本文をまとめて取得します。 */
export async function getInterviewBySlug(slug: string): Promise<Interview | null> {
  const summary = interviewCatalog.find((item) => item.slug === slug);
  const loadTranscript = transcriptLoaders[slug];
  if (!summary || !loadTranscript) return null;
  return { ...summary, transcript: await loadTranscript() };
}

/**
 * 一覧ページから発言本文を検索します。翻訳ファイルは検索時だけサーバーで読み込み、
 * ブラウザには一致したslugだけを返すため、通常の一覧表示を重くしません。
 */
export async function searchInterviewSlugs(query: string): Promise<string[]> {
  const needle = query.normalize("NFKC").toLowerCase().trim();
  if (!needle) return interviewCatalog.map((item) => item.slug);

  const matches = await Promise.all(interviewCatalog.map(async (summary) => {
    const loadTranscript = transcriptLoaders[summary.slug];
    const transcript = loadTranscript ? await loadTranscript() : [];
    const searchable = [
      summary.title, summary.source, summary.description, ...getAllInterviewTags(summary.tagGroups),
      ...transcript.flatMap((line) => [line.speakerEn, line.speakerJa, line.en, line.ja]),
    ].join(" ").normalize("NFKC").toLowerCase();
    return searchable.includes(needle) ? summary.slug : null;
  }));
  return matches.filter((slug): slug is string => Boolean(slug));
}



