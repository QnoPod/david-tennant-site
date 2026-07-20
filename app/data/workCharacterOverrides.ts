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

/** WORKS詳細だけに表示する10代目ドクターの作品別説明を作ります。 */
function tenthDoctorAppearance(appearanceNote: string, description: string): WorkCharacterOverride {
  return {
    character: "The Tenth Doctor",
    characters: [{
      name: "10代目ドクター",
      englishName: "The Tenth Doctor",
      image: TENTH_DOCTOR_IMAGE,
      appearanceNote,
      description,
      // この補正からCHARACTERS一覧へ個別データを追加しません。
      excludeFromCharacters: true,
    }],
  };
}

/**
 * TMDBでSelf、Presenter、Readerなど表記が分かれる作品の手動補正です。
 * 作品詳細で「本人」だけでなく、実際の出演形態も確認できるようにします。
 */
export const workCharacterOverrides: Record<string, WorkCharacterOverride> = {
  "Doctor Who: Dreamland": tenthDoctorAppearance(
    "アニメーション（声）",
    "1958年のアメリカを訪れた10代目ドクターが、ロズウェル事件とエイリアンの陰謀に巻き込まれる。デイヴィッド・テナントはアニメーションの10代目ドクターの声を担当。",
  ),
  "Doctor Who: Music of the Spheres - Doctor Who at the Proms 2008": tenthDoctorAppearance(
    "実写ミニエピソード",
    "ロイヤル・アルバート・ホールでのプロムス公演と連動するミニエピソード。10代目ドクターが「天球の音楽」を作りながら、会場のオーケストラと観客へメッセージを送る。",
  ),
  "Doctor Who: The Infinite Quest": tenthDoctorAppearance(
    "アニメーション（声）",
    "10代目ドクターがマーサ・ジョーンズと共に、願いをかなえるとされる伝説の宇宙船「インフィニット」を探す銀河横断の冒険へ挑む。デイヴィッド・テナントはアニメーションの10代目ドクターの声を担当。",
  ),
  "Doctor Who: The Christmas Invasion": tenthDoctorAppearance(
    "実写出演",
    "9代目から再生した10代目ドクターが、クリスマスのロンドンを侵略するシコラックスに立ち向かう。10代目ドクターとしての最初の本格的なエピソード。",
  ),
  // TMDBが日本語の作品名だけを返した場合にも同じ詳細を使います。
  "ドクター・フー：クリスマスの侵略者": tenthDoctorAppearance(
    "実写出演",
    "9代目から再生した10代目ドクターが、クリスマスのロンドンを侵略するシコラックスに立ち向かう。10代目ドクターとしての最初の本格的なエピソード。",
  ),
  "Doctor Who: Farewell to Matt Smith": {
    character: "Self / The Tenth Doctor",
    characters: [
      {
        name: "本人",
        englishName: "Self",
        image: SELF_IMAGE,
        appearanceNote: "インタビュー出演",
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
      appearanceNote: "インタビュー出演",
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
