/**
 * 自動取得した未公開作品を日本語で表示するための補完辞書です。
 *
 * TMDB以外のサービスは英語しか返さないことがあるため、原題を正規化した文字列を
 * キーにして邦題・役名・概要を上書きします。新しい作品が見つかった場合は、まず
 * upcomingWorks.tsへ公式情報を追加し、表記揺れだけを吸収したい場合はこちらへ追記します。
 */
export type UpcomingTranslation = {
  title: string;
  character?: string;
  overview?: string;
};

export const upcomingTranslations: Record<string, UpcomingTranslation> = {
  hide: {
    title: "HIDE／ハイド（仮題）",
    character: "役名未発表",
    overview: "『ジキル博士とハイド氏』を陰謀スリラーとして再構成する企画です。失脚した記者が、キャリアを立て直せる特ダネを目撃したことで正体不明の敵に追われ、事故をきっかけに自分にも異変が起きていることを知ります。",
  },
  time: {
    title: "TIME シリーズ3",
    character: "刑務官ベイリー（Prison Officer Bailey）",
    overview: "少年院を舞台に、収容される若者と、その更生や安全に責任を負う職員たちを描く全3話のドラマです。",
  },
  onlymurdersinthebuilding: {
    title: "マーダーズ・イン・ビルディング シーズン6",
    overview: "ニューヨークの高級アパートを舞台にしたミステリー・コメディの第6シーズン。デイヴィッド・テナントの出演が発表されています。",
  },
  theneverendingpillowfort: {
    title: "ネバーエンディング・ピロー・フォート（仮題）",
    overview: "子どもたちの想像力から生まれた世界を描く長編アニメーション映画。デイヴィッド・テナントは声の出演者として参加します。",
  },
  thefourseasons: {
    title: "ザ・フォー・シーズンズ シーズン3",
    character: "ジャンピエロ（Gianpiero）",
    overview: "長年の友人グループが四季ごとの旅行を重ねるコメディドラマの第3シーズンです。出演継続の詳細は追加発表を確認中です。",
  },
  doctorwhothetenthdoctoradventures: {
    title: "ドクター・フー：10代目ドクター・アドベンチャーズ",
    character: "10代目ドクター（The Tenth Doctor）",
    overview: "デイヴィッド・テナントが10代目ドクター役に復帰する、全15話のフルキャスト・オーディオドラマです。最初の12話は2027年夏から隔月で発売予定です。",
  },
};
