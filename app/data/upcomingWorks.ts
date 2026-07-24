import type { UpcomingWork } from "../lib/types";

/**
 * GitHub Actionsが自動更新するUPCOMINGデータです。
 * 新しい取得元・公開日・制作状況は既存作品へ統合し、内容が変わった場合だけコミットします。
 * 公開済み・キャンセル済み作品と、180日を過ぎた未確認発表は自動的に整理します。
 */
export const manualUpcomingWorks: UpcomingWork[] = [
  {
    "key": "tmdb-movie-1377495",
    "kind": "announcement",
    "mediaType": "movie",
    "title": "The Amazing Maurice: The Waters of Life",
    "originalTitle": "The Amazing Maurice: The Waters of Life",
    "character": "Dangerous Beans (voice)",
    "overview": "海賊、吸血鬼、狼男、セイレーンたちが登場するこの物語で、マリシア、キース、そしてクラン・ラッツの一行に、アドミラル・カッツという名の毛のない猫が加わり、伝説の「生命の水」を探す危険な旅へと旅立つ。",
    "status": "filming",
    "source": "TMDB",
    "sourceUrl": "https://www.themoviedb.org/movie/1377495",
    "confirmed": false,
    "sources": [
      {
        "name": "TMDB",
        "url": "https://www.themoviedb.org/movie/1377495"
      }
    ],
    "reviewReason": "TMDBの1取得元のみで、公式発表または別の独立した取得元による裏付けを確認できていないため。",
    "updatedAt": "2026-07-24",
    "lastCheckedAt": "2026-07-24"
  },
  {
    "key": "tmdb-movie-1736676",
    "kind": "work",
    "mediaType": "movie",
    "title": "The Joy of Sex",
    "originalTitle": "The Joy of Sex",
    "character": "",
    "overview": "軟体動物の生涯にわたる研究を専門とする英国の科学教授、アレックス・コンフォートは、自分が「戦争に対する解毒剤」を執筆しているのだと考えていた。彼と妻のルース、そしてルースの親友ジェーン――1970年代のロンドン北部、静かな郊外で暮らす型破りな3人組――は、社会の規範に挑み、その共同生活を10年間続けた。 その実験室こそが、マニュアルに記されたレシピや、毛深いヒッピーたちがセックスをしている様子を描いた、一目でそれとわかる手描きのスケッチが生まれた場所だった。この本は官能的であり、ユーモラスであり、かつ健全なもので、一般の人々のためのセックスと愛を再定義し、彼らに初めてセックスを楽しむことを許した。",
    "status": "filming",
    "source": "Deadline",
    "sourceUrl": "https://deadline.com/2026/07/sharon-maguire-directs-colin-firth-julianne-moore-joy-of-sex-1237001551/",
    "confirmed": true,
    "lastCheckedAt": "2026-07-24",
    "sources": [
      {
        "name": "Deadline",
        "url": "https://deadline.com/2026/07/sharon-maguire-directs-colin-firth-julianne-moore-joy-of-sex-1237001551/"
      },
      {
        "name": "TMDB",
        "url": "https://www.themoviedb.org/movie/1736676",
        "summary": "TMDBでは、「The Joy of Sex」が制作中・撮影中の作品として掲載されています。デイヴィッド・テナントの出演情報あり、公開・放送日は未定です。"
      },
      {
        "name": "ScreenRant Movie News",
        "url": "https://screenrant.com/joy-of-sex-movie-adaptation-colin-firth-david-tennant-casting/",
        "publishedDate": "2026-07-23",
        "summary": "ScreenRantでは、『The Joy of Sex』の映画化とデイヴィッド・テナントを含むキャスト情報が紹介されています。"
      }
    ],
    "updatedAt": "2026-07-24"
  },
  {
    "key": "official-neverending-pillow-fort",
    "kind": "work",
    "mediaType": "movie",
    "title": "ネバーエンディング・ピロー・フォート（仮題）",
    "originalTitle": "The Neverending Pillow Fort",
    "overview": "子どもたちの想像力から生まれた世界を描く長編アニメーション映画。デイヴィッド・テナントは声の出演者として参加します。",
    "status": "planned",
    "source": "Deadline",
    "sourceUrl": "https://deadline.com/2026/04/david-tennant-guy-pearce-to-star-the-neverending-pillow-fort-1236877211/",
    "confirmed": true,
    "sources": [
      {
        "name": "Deadline",
        "url": "https://deadline.com/2026/04/david-tennant-guy-pearce-to-star-the-neverending-pillow-fort-1236877211/"
      },
      {
        "name": "TMDB",
        "url": "https://www.themoviedb.org/movie/1685578",
        "summary": "TMDBでは、「ネバーエンディング・ピロー・フォート（仮題）」が制作予定として掲載されています。デイヴィッド・テナントの出演情報あり、公開・放送日は未定です。"
      }
    ],
    "updatedAt": "2026-07-17",
    "lastCheckedAt": "2026-07-17"
  },
  {
    "key": "tmdb-movie-850538",
    "kind": "announcement",
    "mediaType": "movie",
    "title": "The Wind in the Willows",
    "originalTitle": "The Wind in the Willows",
    "character": "Basil",
    "overview": "無謀運転の罪で投獄された、やんちゃなトード氏は、愛するトード・ホールが狡猾なイタチたちに脅かされることになり、刑務所から脱走せざるを得なくなった。イタチたちは、トード氏自身が彼らに売却したその牧草地に、ドッグフード工場を建設しようとしているのだ。",
    "status": "planned",
    "source": "TMDB",
    "sourceUrl": "https://www.themoviedb.org/movie/850538",
    "confirmed": false,
    "sources": [
      {
        "name": "TMDB",
        "url": "https://www.themoviedb.org/movie/850538"
      }
    ],
    "reviewReason": "TMDBの1取得元のみで、公式発表または別の独立した取得元による裏付けを確認できていないため。",
    "updatedAt": "2026-07-24",
    "lastCheckedAt": "2026-07-24"
  },
  {
    "key": "official-tenth-doctor-adventures-2027",
    "kind": "work",
    "mediaType": "other",
    "title": "ドクター・フー：10代目ドクター・アドベンチャーズ",
    "originalTitle": "Doctor Who: The Tenth Doctor Adventures",
    "character": "10代目ドクター（The Tenth Doctor）",
    "overview": "デイヴィッド・テナントが10代目ドクター役に復帰する、全15話のフルキャスト・オーディオドラマです。最初の12話は2027年夏から隔月で発売予定です。",
    "releaseDate": "2027",
    "status": "scheduled",
    "source": "Doctor Who公式 / Big Finish",
    "sourceUrl": "https://www.doctorwho.tv/news-and-features/the-tenth-doctor-returns-in-a-new-series-of-audio-adventures",
    "confirmed": true,
    "sources": [
      {
        "name": "Doctor Who公式 / Big Finish",
        "url": "https://www.doctorwho.tv/news-and-features/the-tenth-doctor-returns-in-a-new-series-of-audio-adventures"
      }
    ],
    "updatedAt": "2026-07-17",
    "lastCheckedAt": "2026-07-17"
  },
  {
    "key": "scraped-article-lfr2xk",
    "kind": "announcement",
    "mediaType": "other",
    "title": "メディアセンター",
    "originalTitle": "Media Centre",
    "overview": "BBCに関する最新ニュース、メディア向け資料、番組情報",
    "status": "unknown",
    "source": "BBC Media Centre",
    "sourceUrl": "https://www.bbc.co.uk/mediacentre/",
    "confirmed": false,
    "sources": [
      {
        "name": "BBC Media Centre",
        "url": "https://www.bbc.co.uk/mediacentre/"
      }
    ],
    "reviewReason": "出演情報と、制作中・公開予定であることを同時に確認できる根拠が不足しているため。",
    "updatedAt": "2026-07-18",
    "lastCheckedAt": "2026-07-18"
  },
  {
    "key": "tvmaze-tv-57469",
    "kind": "announcement",
    "mediaType": "tv",
    "title": "HIDE／ハイド（仮題）",
    "originalTitle": "Hide",
    "character": "役名未発表",
    "overview": "『ジキル博士とハイド氏』を陰謀スリラーとして再構成する企画です。失脚した記者が、キャリアを立て直せる特ダネを目撃したことで正体不明の敵に追われ、事故をきっかけに自分にも異変が起きていることを知ります。",
    "status": "planned",
    "source": "TVmaze",
    "sourceUrl": "https://www.tvmaze.com/shows/57469/hide",
    "confirmed": false,
    "sources": [
      {
        "name": "TVmaze",
        "url": "https://www.tvmaze.com/shows/57469/hide"
      }
    ],
    "reviewReason": "TVmazeの1取得元のみで、公式発表または別の独立した取得元による裏付けを確認できていないため。",
    "updatedAt": "2026-07-17",
    "lastCheckedAt": "2026-07-17"
  },
  {
    "key": "official-only-murders-season-6",
    "kind": "work",
    "mediaType": "tv",
    "title": "マーダーズ・イン・ビルディング シーズン6",
    "originalTitle": "Only Murders in the Building",
    "overview": "ニューヨークの高級アパートを舞台にしたミステリー・コメディの第6シーズン。デイヴィッド・テナントの出演が発表され、制作が進められています。",
    "status": "filming",
    "source": "Deadline",
    "sourceUrl": "https://deadline.com/2026/06/only-murders-in-the-building-david-tennant-nicola-coughlan-1236955027/",
    "confirmed": true,
    "sources": [
      {
        "name": "Deadline",
        "url": "https://deadline.com/2026/06/only-murders-in-the-building-david-tennant-nicola-coughlan-1236955027/"
      }
    ],
    "updatedAt": "2026-07-17",
    "lastCheckedAt": "2026-07-17"
  },
  {
    "key": "official-four-seasons-season-3",
    "kind": "announcement",
    "mediaType": "tv",
    "title": "ザ・フォー・シーズンズ シーズン3",
    "originalTitle": "The Four Seasons",
    "character": "ジャンピエロ（Gianpiero）",
    "overview": "長年の友人グループが四季ごとの旅行を重ねるコメディドラマの第3シーズンです。出演継続の詳細は追加発表を確認中です。",
    "status": "rumored",
    "source": "Netflix Tudum",
    "sourceUrl": "https://www.netflix.com/tudum/articles/the-four-seasons-renewed-season-3",
    "confirmed": false,
    "sources": [
      {
        "name": "Netflix Tudum",
        "url": "https://www.netflix.com/tudum/articles/the-four-seasons-renewed-season-3"
      }
    ],
    "reviewReason": "デイヴィッド・テナントの出演、または出演継続を示す正式発表を確認できていないため。",
    "updatedAt": "2026-07-17",
    "lastCheckedAt": "2026-07-17"
  },
  {
    "key": "official-time-series-3",
    "kind": "work",
    "mediaType": "tv",
    "title": "TIME シリーズ3",
    "originalTitle": "Time",
    "character": "刑務官ベイリー（Prison Officer Bailey）",
    "overview": "少年院を舞台に、収容される若者と、その更生や安全に責任を負う職員たちを描く全3話のドラマです。",
    "status": "filming",
    "source": "BritBox / BBC発表",
    "sourceUrl": "https://www.thefutoncritic.com/news/2026/03/17/britbox-announces-additional-casting-start-of-production-for-season-three-of-jimmy-mcgoverns-award-winning-drama-series-time-822310/20260317britbox01/",
    "sources": [
      {
        "name": "BritBox / BBC発表",
        "url": "https://www.thefutoncritic.com/news/2026/03/17/britbox-announces-additional-casting-start-of-production-for-season-three-of-jimmy-mcgoverns-award-winning-drama-series-time-822310/20260317britbox01/"
      },
      {
        "name": "BritBox：『タイム』シーズン3 初公開画像",
        "url": "https://press.britbox.com/post/britbox-reveals-first-look-at-david-tennant-and-siobhan-finneran",
        "publishedDate": "2026-07-17",
        "summary": "BritBox：『タイム』シーズン3 初公開画像では、「TIME シリーズ3」の初公開画像または最新ビジュアルが紹介されています。デイヴィッド・テナントの出演役は刑務官ベイリー（Prison Officer Bailey）、公開・放送日は未定です。"
      }
    ],
    "confirmed": true,
    "updatedAt": "2026-07-17",
    "lastCheckedAt": "2026-07-17"
  }
];
