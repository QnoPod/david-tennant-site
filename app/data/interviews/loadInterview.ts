import { getPublishedInterviews } from "./catalog";
import { getAllInterviewTags, type Interview, type TranscriptLine } from "./types";

type TranscriptLoader = () => Promise<readonly TranscriptLine[]>;

/**
 * 詳細ページを開いたときだけ、該当する長い翻訳ファイルを読み込みます。
 * インタビューを追加したら、catalog.ts とこの対応表へ同じslugを追加してください。
 */
const transcriptLoaders: Record<string, TranscriptLoader> = {
  "david-tennant-masked-singer-daughter-kelly-clarkson": async () =>
    (await import("./transcripts/davidTennantMaskedSingerRevealTranscript")).davidTennantMaskedSingerRevealTranscript,
  "david-tennant-snack-wars-scotland-england": async () =>
    (await import("./transcripts/davidTennantSnackWarsTranscript")).davidTennantSnackWarsTranscript,
  "david-tennant-rivals-capital-fm-2026": async () =>
    (await import("./transcripts/davidTennantRivalsCapitalTranscript")).davidTennantRivalsCapitalTranscript,
  "david-tennant-film-firsts-bafta": async () =>
    (await import("./transcripts/davidTennantFilmFirstsBaftaTranscript")).davidTennantFilmFirstsBaftaTranscript,
  "michael-sheen-david-tennant-one-show-2020": async () =>
    (await import("./transcripts/davidMichaelOneShowTranscript")).davidMichaelOneShowTranscript,
  "jon-hamm-david-tennant-wired-autocomplete": async () =>
    (await import("./transcripts/jonHammDavidWiredTranscript")).jonHammDavidWiredTranscript,
  "david-michael-save-world-this-morning": async () =>
    (await import("./transcripts/davidMichaelSaveWorldThisMorningTranscript")).davidMichaelSaveWorldThisMorningTranscript,
  "david-michael-good-omens-interview-nycc": async () =>
    (await import("./transcripts/davidMichaelGoodOmensNyccInterviewTranscript")).davidMichaelGoodOmensNyccInterviewTranscript,
  "david-tennant-very-bad-scotsman-letterman": async () =>
    (await import("./transcripts/davidTennantLettermanTranscript")).davidTennantLettermanTranscript,
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
  "david-tennant-olivia-colman-broadchurch-fan-art": async () =>
    (await import("./transcripts/davidTennantOliviaBroadchurchFanArtTranscript")).davidTennantOliviaBroadchurchFanArtTranscript,
  "david-tennant-spills-broadchurch-beans": async () =>
    (await import("./transcripts/davidTennantSpillsBroadchurchBeansTranscript")).davidTennantSpillsBroadchurchBeansTranscript,
};

/** slugから基本情報と翻訳本文をまとめて取得します。 */
export async function getInterviewBySlug(slug: string): Promise<Interview | null> {
  const summary = getPublishedInterviews().find((item) => item.slug === slug);
  const loadTranscript = transcriptLoaders[slug];
  if (!summary) return null;
  // 自動取得した概要だけの記事も詳細を開けるよう、本文未登録時は空配列を返します。
  return { ...summary, transcript: loadTranscript ? await loadTranscript() : [] };
}

/**
 * 一覧ページから発言本文を検索します。翻訳ファイルは検索時だけサーバーで読み込み、
 * ブラウザには一致したslugだけを返すため、通常の一覧表示を重くしません。
 */
export async function searchInterviewSlugs(query: string): Promise<string[]> {
  const needle = query.normalize("NFKC").toLowerCase().trim();
  const publishedInterviews = getPublishedInterviews();
  if (!needle) return publishedInterviews.map((item) => item.slug);

  const matches = await Promise.all(publishedInterviews.map(async (summary) => {
    const loadTranscript = transcriptLoaders[summary.slug];
    const transcript = loadTranscript ? await loadTranscript() : [];
    const searchable = [
      summary.title, summary.titleEn, summary.source, summary.description, ...getAllInterviewTags(summary.tagGroups),
      ...transcript.flatMap((line) => [line.speakerEn, line.speakerJa, line.en, line.ja]),
    ].join(" ").normalize("NFKC").toLowerCase();
    return searchable.includes(needle) ? summary.slug : null;
  }));
  return matches.filter((slug): slug is string => Boolean(slug));
}
