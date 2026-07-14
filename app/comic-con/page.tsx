import type { Metadata } from "next";
import PageHero from "../components/PageHero";
import ConventionExplorer from "../components/conventions/ConventionExplorer";
import { pastConventionAppearances } from "../data/pastConventionAppearances";
import { COMICONOMICON_SOURCE_URL, getConventionAppearances } from "../lib/comiconomicon";

export const metadata: Metadata = { title: "コミコン参加情報" };

/** 今後の自動取得情報と、手動で確認した過去の参加記録をまとめて表示します。 */
export default async function ComicConPage() {
  const events = await getConventionAppearances();
  return <main id="main-content"><PageHero eyebrow="COMIC CON & APPEARANCES" title="COMIC CON" description="デイヴィッド・テナントの出演発表、参加確認済みの記録、キャンセル情報を状態別にまとめています。" />
    <section className="archive-section shell">
      <div className="source-notice"><span>LIVE + ARCHIVE</span><p>今後の参加予定はComiconomiconから定期取得し、過去分は実際のパネルや開催後記録を確認した固定データです。予約前には必ず主催者の公式情報をご確認ください。</p><a href={COMICONOMICON_SOURCE_URL} target="_blank" rel="noreferrer">取得元を見る ↗</a></div>
      <ConventionExplorer upcoming={events} past={pastConventionAppearances} />
      <p className="archive-footnote">出演発表のみの予定やキャンセルも削除せず、状態が分かる形で保存しています。</p>
    </section>
  </main>;
}
