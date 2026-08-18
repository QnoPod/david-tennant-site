import type { Metadata } from "next";
import PageHero from "../components/PageHero";
import ConventionExplorer from "../components/conventions/ConventionExplorer";
import autoConventionHistoryData from "../data/autoConventionHistory.json";
import { pastConventionAppearances } from "../data/pastConventionAppearances";
import { getConventionAppearances } from "../lib/comiconomicon";
import type { ConventionAppearance } from "../lib/types";

export const metadata: Metadata = { title: "コミコン参加情報" };

const MONTHS: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

function normalizedEventName(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[()\[\]{}–—-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidEventName(value: string) {
  const normalized = normalizedEventName(value);
  return Boolean(normalized)
    && !/^(?:site|website|official site|official website)$/.test(normalized);
}

function eventKey(event: Pick<ConventionAppearance, "name" | "date">) {
  return `${normalizedEventName(event.name)}::${event.date}`;
}

function eventDateKey(event: ConventionAppearance) {
  if (event.appearanceDate) return event.appearanceDate;
  const match = event.date.match(/(\d{1,2})(?:\s*-\s*(\d{1,2}))?\s+([A-Z][a-z]{2}),\s+(\d{4})/);
  if (!match) return event.updatedAt ?? "0000-00-00";
  const day = String(Number(match[2] ?? match[1])).padStart(2, "0");
  return `${match[4]}-${MONTHS[match[3]] ?? "01"}-${day}`;
}

function mergePastEvents(
  liveCancelled: ConventionAppearance[],
) {
  const automaticHistory =
    autoConventionHistoryData as ConventionAppearance[];
  const merged = new Map<string, ConventionAppearance>();

  // 自動履歴 → 当日の検出 → 手動確認済み固定データの順で上書きし、
  // 手作業で整えた過去記録がある場合はそれを最優先します。
  for (const event of automaticHistory) {
    if (!isValidEventName(event.name)) continue;
    merged.set(eventKey(event), { ...event, isHistorical: true });
  }
  for (const event of liveCancelled) {
    merged.set(eventKey(event), { ...event, isHistorical: true });
  }
  for (const event of pastConventionAppearances) {
    merged.set(eventKey(event), event);
  }

  return [...merged.values()].sort(
    (a, b) => eventDateKey(b).localeCompare(eventDateKey(a)),
  );
}

/** 定期取得でキャンセルになったイベントは、自動的に過去の参加情報へ移します。 */
export default async function ComicConPage() {
  const events = await getConventionAppearances();
  const upcomingEvents = events.filter((event) => event.status !== "cancelled");
  const liveCancelled = events.filter((event) => event.status === "cancelled");
  const pastEvents = mergePastEvents(liveCancelled);
  const checkedAt = new Date().toISOString().slice(0, 10);

  return <main id="main-content"><PageHero eyebrow="COMIC CON & APPEARANCES" title="COMIC CON" description="COMIC CONの参加・キャンセル情報" />
    <section className="archive-section shell">
      <div className="source-notice comic-con-notice"><span>LIVE + ARCHIVE</span><p>今後の参加予定は定期取得し、キャンセルを検出したイベントは自動的に過去の参加情報へ移動して保存します。過去分は実際のパネルや開催後記録を確認した固定データと自動履歴を統合しています。予約前には必ず主催者の公式情報をご確認ください。</p></div>
      <p className="archive-updated-at">参加予定の最終確認：<time dateTime={checkedAt}>{checkedAt.replaceAll("-", ".")}</time></p>
      <ConventionExplorer upcoming={upcomingEvents} past={pastEvents} />
      <p className="archive-footnote">出演発表のみの予定やキャンセルも削除せず、状態が分かる形で保存しています。</p>
    </section>
  </main>;
}
