import type { InterviewSummary } from "../data/interviews/types";
import type { ConventionAppearance, UpcomingWork } from "./types";

export type AutomaticSiteUpdate = {
  date: string;
  text: string;
  href: string;
  category: "INTERVIEW" | "UPCOMING" | "COMIC CON";
};

/** 登録済みデータの日付から、HOMEとABOUTの更新履歴を自動生成します。 */
export function buildAutomaticSiteUpdates({
  interviews,
  upcoming,
  conventions,
  limit = 8,
}: {
  interviews: readonly InterviewSummary[];
  upcoming: UpcomingWork[];
  conventions: ConventionAppearance[];
  limit?: number;
}): AutomaticSiteUpdate[] {
  const interviewUpdates = interviews.slice(0, 4).map((item) => ({
    date: item.publishedDate,
    text: `インタビュー「${item.title}」を掲載`,
    href: `/interviews/${item.slug}`,
    category: "INTERVIEW" as const,
  }));

  // 日次取得や記事の公開日ではなく、前回保存時から内容が変わった日だけを履歴へ反映します。
  const upcomingUpdates: AutomaticSiteUpdate[] = [...upcoming]
    .flatMap((item) => {
      const date = item.updatedAt;
      return date ? [{
        date,
        text: `${item.kind === "announcement" ? "出演発表候補" : "今後の出演予定"}「${item.title}」を更新`,
        href: "/upcoming",
        category: "UPCOMING" as const,
      }] : [];
    })
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  // 定期取得しただけでは日付を変えず、内容更新日があるイベントだけを履歴へ載せます。
  const conventionUpdates = [...conventions]
    .filter((item): item is ConventionAppearance & { updatedAt: string } => Boolean(item.updatedAt))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 2)
    .map((item) => ({
      date: item.updatedAt,
      text: `${item.name}の${item.status === "cancelled" ? "キャンセル情報" : "参加情報"}を掲載`,
      href: "/comic-con",
      category: "COMIC CON" as const,
    }));

  const unique = new Map<string, AutomaticSiteUpdate>();
  for (const update of [...interviewUpdates, ...upcomingUpdates, ...conventionUpdates].sort((a, b) => b.date.localeCompare(a.date))) {
    const key = `${update.category}-${update.text}`;
    if (!unique.has(key)) unique.set(key, update);
  }
  return [...unique.values()].slice(0, limit);
}
