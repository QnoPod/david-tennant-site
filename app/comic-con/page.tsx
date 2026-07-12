import type { Metadata } from "next";
import PageHero from "../components/PageHero";
import { COMICONOMICON_SOURCE_URL, getConventionAppearances } from "../lib/comiconomicon";

export const metadata: Metadata = { title: "コミコン参加情報" };

/** Comiconomiconから取得した参加予定を、公式確認リンクとともに表示します。 */
export default async function ComicConPage() {
  const events = await getConventionAppearances();
  return <main id="main-content"><PageHero eyebrow="COMIC CON & APPEARANCES" title="COMIC CON" description="デイヴィッド・テナントのコミコン／コンベンション参加予定をまとめています。" />
    <section className="archive-section shell">
      <div className="source-notice"><span>LIVE SOURCE</span><p>参加予定はComiconomiconから定期取得しています。変更される場合があるため、予約前に必ず主催者の公式サイトをご確認ください。</p><a href={COMICONOMICON_SOURCE_URL} target="_blank" rel="noreferrer">取得元を見る ↗</a></div>
      <div className="event-count"><p className="eyebrow">ALL KNOWN APPEARANCES</p><strong>現在確認できる参加予定を全{events.length}件表示しています</strong></div>
      <div className="event-list">{events.map((event, index) => <article className="event-card" key={`${event.name}-${event.date}`}><div className="event-card__date"><span>{String(index + 1).padStart(2, "0")}</span><strong>{event.date}</strong></div><div className="event-card__body"><p className="eyebrow">APPEARANCE LISTING</p><h2>{event.name}</h2><p>{event.venue}</p><div className="button-row">{event.officialUrl && <a className="button button--primary" href={event.officialUrl} target="_blank" rel="noreferrer">公式サイト ↗</a>}{event.detailUrl && <a className="button button--ghost" href={event.detailUrl} target="_blank" rel="noreferrer">掲載ページ ↗</a>}</div></div></article>)}</div>
      <p className="archive-footnote">最終表示時刻を基準に取得しています。Comiconomicon側でも、自動判定された情報をイベント公式サイトで再確認するよう案内されています。</p>
    </section>
  </main>;
}
