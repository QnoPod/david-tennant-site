import type { InterviewSummary } from "../data/interviews/types";
import type { ConventionAppearance, UpcomingWork } from "./types";

export type AutomaticSiteUpdate = {
  date: string;
  text: string;
  href: string;
  category: "INTERVIEW" | "UPCOMING" | "COMIC CON";
};

/** 登録済みデータの日付から、HOMEの更新履歴を自動生成します。 */
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
  const upcomingUpdates = [...upcoming].sort((a, b) => b.lastCheckedAt.localeCompare(a.lastCheckedAt)).slice(0, 3).map((item) => ({
    date: item.lastCheckedAt,
    text: `${item.kind === "announcement" ? "出演発表候補" : "今後の出演予定"}「${item.title}」を確認`,
    href: "/upcoming",
    category: "UPCOMING" as const,
  }));
  const checkedAt = new Date().toISOString().slice(0, 10);
  const conventionUpdates = conventions.slice(0, 2).map((item) => ({
      date: checkedAt,
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
