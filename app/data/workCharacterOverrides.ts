import type { WorkCharacter } from "../lib/types";

export type WorkCharacterOverride = {
  /** 作品一覧の検索にも使う英語の共通役名。 */
  character: string;
  /** WORKS詳細に表示する役名・出演形態・説明。 */
  characters: WorkCharacter[];
};

const SELF_IMAGE = "/characters/self-icon.png";
const NARRATOR_IMAGE = "/characters/narrator-icon.jpg";
const TENTH_DOCTOR_IMAGE = "/characters/10thDoctor.jpg";

/**
 * TMDBでSelf、Presenter、Readerなど表記が分かれる作品の手動補正です。
 * 作品詳細で「本人」だけでなく、実際の出演形態も確認できるようにします。
 */
export const workCharacterOverrides: Record<string, WorkCharacterOverride> = {
  "Doctor Who: Farewell to Matt Smith": {
    character: "Self / The Tenth Doctor",
    characters: [
      {
        name: "本人",
        englishName: "Self",
        image: SELF_IMAGE,
        appearanceNote: "インタビュ出演",
        description: "デイヴィッド・テナント本人が、『ドクター・フー』とマット・スミスについて語るインタビュー映像で登場。",
      },
      {
        name: "10代目ドクター",
        englishName: "The Tenth Doctor",
        image: TENTH_DOCTOR_IMAGE,
        appearanceNote: "過去映像のみ",
        description: "10代目ドクターとして過去の本編映像に登場。この番組のために撮影された新規の演技ではありません。",
      },
    ],
  },
  "Comedy World Cup": {
    character: "Self",
    characters: [{
      name: "本人",
      englishName: "Self",
      image: SELF_IMAGE,
      appearanceNote: "司会・プレゼンター",
      description: "デイヴィッド・テナント本人が、コメディに関するクイズを出題し、出演者たちの対戦を進行する。",
    }],
  },
  "Shakespeare's Sonnets": {
    character: "Self",
    characters: [{
      name: "本人",
      englishName: "Self",
      image: SELF_IMAGE,
      appearanceNote: "朗読者",
      description: "デイヴィッド・テナント本人が、シェイクスピアのソネットを朗読する。",
    }],
  },
  "Earthflight": {
    character: "Narrator",
    characters: [{
      name: "ナレーター",
      englishName: "Narrator",
      image: NARRATOR_IMAGE,
      appearanceNote: "ナレーション（声）",
      description: "デイヴィッド・テナントが、鳥たちの視点から世界の自然をたどる映像のナレーションを担当。",
    }],
  },
  "Doctor Who: Tales Lost in Time": {
    character: "Self",
    characters: [{
      name: "本人",
      englishName: "Self",
      image: SELF_IMAGE,
      appearanceNote: "インタビュ出演",
      description: "デイヴィッド・テナント本人が、映像の失われた『ドクター・フー』の過去エピソードについて語る。",
    }],
  },
  "Come in Number Five": {
    character: "Self",
    characters: [{
      name: "本人",
      englishName: "Self",
      image: SELF_IMAGE,
      appearanceNote: "司会・プレゼンター",
      description: "デイヴィッド・テナント本人が案内役を務め、5代目ドクターとピーター・デイヴィソンの出演時代を振り返る。",
    }],
  },
  "Bring Something Back: The Making of 'The Quatermass Experiment'": {
    character: "Self",
    characters: [{
      name: "本人",
      englishName: "Self",
      image: SELF_IMAGE,
      appearanceNote: "メイキング・インタビュー出演",
      description: "デイヴィッド・テナント本人が、生放送ドラマ『The Quatermass Experiment』の制作過程を記録したメイキングに登場。",
    }],
  },
};
