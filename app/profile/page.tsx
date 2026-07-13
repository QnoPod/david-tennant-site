import type { Metadata } from "next";
import PageHero from "../components/PageHero";
import SectionHeading from "../components/SectionHeading";

export const metadata: Metadata = { title: "プロフィール" };

const careerAreas = [
  { number: "01", title: "Screen", text: "『Doctor Who』のドクター、『Broadchurch』のアレック・ハーディ、『Good Omens』のクロウリーなど、長編シリーズで複雑な人物像を演じる。" },
  { number: "02", title: "Stage", text: "Royal Shakespeare Companyをはじめ英国演劇の舞台に継続的に出演。『Hamlet』『Richard II』『Much Ado About Nothing』『Macbeth』など、シェイクスピア作品でも長いキャリアを持つ。" },
  { number: "03", title: "Voice", text: "『DuckTales』のスクルージ・マクダック、『Star Wars: The Clone Wars』『Ahsoka』のヒュイヤンなど、アニメーションやゲーム、ラジオドラマ、朗読でも多数の役を担当。" },
  { number: "04", title: "Host & Podcast", text: "授賞式やテレビ番組の司会に加え、『David Tennant Does a Podcast With…』では俳優、作家、政治家らとの一対一の対話を届けている。" },
];

const recognition = [
  { year: "2015", title: "NTA Special Recognition", text: "National Television Awardsで長年の功績を称える特別表彰を受賞。" },
  { year: "2016", title: "Honorary Doctor of Drama", text: "母校Royal Conservatoire of Scotlandから名誉博士号を授与。" },
  { year: "2021", title: "International Emmy", text: "『Des』でInternational Emmy AwardのBest Performance by an Actorを受賞。" },
];

/** 人物紹介、活動分野、年表、受賞、学びへの支援をまとめたプロフィール。 */
export default function ProfilePage() {
  return <main id="main-content">
    <PageHero eyebrow="PROFILE" title="DAVID TENNANT" description="" />

    <section className="section shell profile-intro">
      <img src="/images/david-tennant.png" alt="デイヴィッド・テナント" />
      <div><p className="eyebrow">AT A GLANCE</p><p>大胆なエネルギーと繊細な内面表現を併せ持ちながら、ヒーローから悪役、実在の人物、シェイクスピア作品まで幅広い役を演じる。テレビの人気シリーズだけでなく、劇場、ラジオ、アニメーション、朗読でも活動を続けている。</p>
        <dl><div><dt>芸名</dt><dd>David Tennant</dd></div><div><dt>出生名</dt><dd>David John McDonald</dd></div><div><dt>生年月日</dt><dd>1971年4月18日</dd></div><div><dt>出生地</dt><dd>Bathgate, West Lothian, Scotland</dd></div><div><dt>教育</dt><dd>Royal Scottish Academy of Music and Drama（現Royal Conservatoire of Scotland）</dd></div><div><dt>活動分野</dt><dd>映画・テレビ・舞台・ラジオ・声の出演</dd></div></dl>
      </div>
    </section>

    <section className="section section--paper"><div className="shell"><SectionHeading eyebrow="ACROSS EVERY MEDIUM" title="4つの活動領域" /><div className="profile-area-grid">{careerAreas.map((area) => <article key={area.title}><span>{area.number}</span><h3>{area.title}</h3><p>{area.text}</p></article>)}</div></div></section>

    <section className="section section--blue"><div className="shell"><SectionHeading eyebrow="RECOGNITION" title="主な受賞・栄誉" /><div className="recognition-grid">{recognition.map((item) => <article key={item.title}><time>{item.year}</time><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></div></section>

    <section className="section shell profile-scholarship"><div><p className="eyebrow">GIVING BACK</p><h2><span className="mobile-title-break">次の世代が学ぶ</span><span className="mobile-title-break">機会を支える</span></h2></div><div><p>2026年、Georgia Tennantとともに母校Royal Conservatoire of Scotlandで、英国在住のSchool of Stage and Screenの学生を支援する奨学金を設立しました。</p><a className="button button--ghost" href="https://www.rcs.ac.uk/news-stories/georgia-and-david-tennant-establish-scholarship-at-royal-conservatoire-of-scotland/" target="_blank" rel="noreferrer">RCSの記事を読む ↗</a></div></section>

    <aside className="profile-sources section--paper"><div className="shell"><p className="eyebrow">SOURCES & FURTHER READING</p><div><a href="https://www.rcs.ac.uk/support-us/ways-to-support/scholarship-funds/georgia-david-tennant/" target="_blank" rel="noreferrer">Royal Conservatoire of Scotland ↗</a><a href="https://www.pbs.org/wgbh/masterpiece/specialfeatures/five-intriguing-facts-about-actor-david-tennant/" target="_blank" rel="noreferrer">PBS Masterpiece ↗</a></div></div></aside>
  </main>;
}

