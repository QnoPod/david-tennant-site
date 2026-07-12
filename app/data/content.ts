/**
 * ナビゲーション、トップページ、ABOUTで使う短い固定コンテンツ。
 * インタビューは data/interviews/ に分離し、不要な長文読み込みを防いでいます。
 */

export const navigation = [
  { href: "/", label: "HOME" },
  { href: "/profile", label: "PROFILE" },
  { href: "/works", label: "WORKS" },
  { href: "/characters", label: "CHARACTERS" },
  { href: "/comic-con", label: "COMIC CON" },
  { href: "/interviews", label: "INTERVIEWS" },
  { href: "/about", label: "ABOUT" },
];

export const featuredWorks = [
  { title: "Doctor Who", year: "2005—", medium: "TV", role: "10代目／14代目ドクター" },
  { title: "Broadchurch", year: "2013—2017", medium: "TV", role: "アレック・ハーディ" },
  { title: "Good Omens", year: "2019—", medium: "TV", role: "クロウリー" },
  { title: "Rivals", year: "2024—", medium: "TV", role: "トニー・バディンガム" },
];

export const featuredCharacters = [
  { name: "10代目ドクター", work: "Doctor Who", image: "/characters/10thDoctor.jpg" },
  { name: "アレック・ハーディ", work: "Broadchurch", image: "/characters/AlecHardy.png" },
  { name: "クロウリー", work: "Good Omens", image: "/characters/Crowley.jpg" },
  { name: "フィリアス・フォッグ", work: "Around the World in 80 Days", image: "/characters/Phileas Fogg.jpg" },
  { name: "キルグレイヴ", work: "Jessica Jones", image: "/characters/Kevin Thompson.webp" },
  { name: "トニー・バディンガム", work: "Rivals", image: "/characters/Tony Baddingham.webp" },
];

export const careerTimeline = [
  { year: "1971", title: "Born in Scotland", text: "4月18日、スコットランドのウェスト・ロージアン州バスゲイトに生まれる。" },
  { year: "1991", title: "Drama school", text: "Royal Scottish Academy of Music and Dramaで演技を学び、舞台を中心に活動を広げる。" },
  { year: "1994", title: "Takin' Over the Asylum", text: "キャンベル・ベイン役が初期キャリアを代表する重要な役となる。" },
  { year: "2005", title: "Doctor Who", text: "10代目ドクターとして初登場。のちに2023年には14代目ドクターとして戻る。" },
  { year: "2008", title: "Hamlet", text: "Royal Shakespeare Companyの『Hamlet』でタイトルロールを演じる。" },
  { year: "2013", title: "Broadchurch", text: "アレック・ハーディ役で新たな代表作を生み、2017年まで3シリーズ出演。" },
  { year: "2015", title: "Special Recognition", text: "National Television AwardsのSpecial Recognition Awardを受賞。" },
  { year: "2019", title: "Good Omens", text: "悪魔クロウリー役で幅広いファンを魅了する。" },
  { year: "2020", title: "Des & Staged", text: "実在の人物デニス・ニルセンを演じ、同年から『Staged』にも出演。" },
  { year: "2023", title: "Macbeth", text: "Donmar Warehouseの『Macbeth』でマクベスを演じ、2024年にWest Endへ移る。" },
  { year: "2024", title: "Rivals", text: "『Rivals』でトニー・バディンガムを演じる。" },
  { year: "2025", title: "The Hack & The Thursday Murder Club", text: "ニック・デイヴィス、イアン・ヴェンサムという異なる実在／フィクションの人物を演じる。" },
];

export const siteUpdates = [
  { date: "2026.07.12", text: "ファンアーカイブを全面リニューアルしました。" },
];
