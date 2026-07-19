import type { Metadata } from "next";
import PageHero from "../components/PageHero";
import ConventionExplorer from "../components/conventions/ConventionExplorer";
import { pastConventionAppearances } from "../data/pastConventionAppearances";
import { getConventionAppearances } from "../lib/comiconomicon";

export const metadata: Metadata = { title: "コミコン参加情報" };

/** 今後の自動取得情報と、手動で確認した過去の参加記録をまとめて表示します。 */
export default async function ComicConPage() {
  const events = await getConventionAppearances();
  const checkedAt = new Date().toISOString().slice(0, 10);
  return <main id="main-content"><PageHero eyebrow="COMIC CON & APPEARANCES" title="COMIC CON" description="COMIC CONの参加・キャンセル情報" />
    <section className="archive-section shell">
      <div className="source-notice comic-con-notice"><span>LIVE + ARCHIVE</span><p>今後の参加予定は定期取得し、過去分は実際のパネルや開催後記録を確認した固定データです。定期取得できた項目には掲載元を表示しています。予約前には必ず主催者の公式情報をご確認ください。</p></div>
      <p className="archive-updated-at">参加予定の最終確認：<time dateTime={checkedAt}>{checkedAt.replaceAll("-", ".")}</time></p>
      <ConventionExplorer upcoming={events} past={pastConventionAppearances} />
      <p className="archive-footnote">出演発表のみの予定やキャンセルも削除せず、状態が分かる形で保存しています。</p>
    </section>
  </main>;
}
