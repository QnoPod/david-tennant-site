import type { Metadata } from "next";
import PageHero from "../components/PageHero";
import { siteUpdates } from "../data/content";

export const metadata: Metadata = { title: "サイトについて" };

export default function AboutPage() {
  return <main id="main-content"><PageHero eyebrow="ABOUT THIS ARCHIVE" title="ABOUT" description="このサイトの情報源、更新内容について。" />
    <section className="section shell about-grid"><article><p className="eyebrow">ABOUT</p><h2>サイトについて</h2><p>David Tennant Archiveは、デイヴィッド・テナントの出演作品、役柄、イベント情報、インタビューを日本語でまとめた非公式ファンサイトです。</p><p>作品情報はTMDB、参加予定はComiconomiconを参照し、外部情報には確認先へのリンクを付けています。</p></article><article><p className="eyebrow">DISCLAIMER</p><h2>掲載情報について</h2><p>イベントや配信状況は変更される場合があります。チケット購入や視聴前には、各公式サイトの最新情報をご確認ください。</p><p>画像、映像、作品名などの権利は、それぞれの権利者に帰属します。</p></article></section>
    <section className="section section--paper"><div className="shell"><div className="section-heading"><div><p className="eyebrow">CHANGELOG</p><h2>更新履歴</h2></div></div><div className="updates-list">{siteUpdates.map((item) => <div key={`${item.date}-${item.text}`}><time>{item.date}</time><p>{item.text}</p></div>)}</div></div></section>
  </main>;
}
