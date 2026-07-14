"use client";

import { useMemo, useState } from "react";
import type { ConventionAppearance } from "../../lib/types";

type ConventionStatus = NonNullable<ConventionAppearance["status"]>;

const statusPresentation: Record<ConventionStatus, { eyebrow: string; label: string }> = {
  upcoming: { eyebrow: "UPCOMING APPEARANCE", label: "参加予定" },
  attended: { eyebrow: "ATTENDANCE CONFIRMED", label: "参加確認済み" },
  announced: { eyebrow: "APPEARANCE ANNOUNCED", label: "出演発表・参加予定" },
  cancelled: { eyebrow: "APPEARANCE CANCELLED", label: "出演キャンセル" },
};

/** 同じ主催が複数国で開催していても、選んだ国だけを対象にできる検索キーです。 */
function organizerFilterKey(event: Pick<ConventionAppearance, "country" | "organizer">) {
  return `${event.country}::${event.organizer}`;
}

/** 今後の自動取得情報と、状態を確認した過去記録を同じページで切り替えます。 */
export default function ConventionExplorer({
  upcoming,
  past,
}: {
  upcoming: ConventionAppearance[];
  past: readonly ConventionAppearance[];
}) {
  const [view, setView] = useState<"upcoming" | "past">("upcoming");
  const [selectedOrganizerKeys, setSelectedOrganizerKeys] = useState<string[]>([]);
  const events = view === "upcoming" ? upcoming : past;
  const organizerGroups = useMemo(() => {
    const grouped = new Map<string, Set<string>>();
    for (const event of [...upcoming, ...past]) {
      const organizers = grouped.get(event.country) ?? new Set<string>();
      organizers.add(event.organizer);
      grouped.set(event.country, organizers);
    }
    return [...grouped.entries()]
      .sort(([countryA], [countryB]) => countryA.localeCompare(countryB, "ja"))
      .map(([country, organizers]) => ({
        country,
        organizers: [...organizers].sort((a, b) => a.localeCompare(b, "ja")),
      }));
  }, [upcoming, past]);
  const visibleEvents = selectedOrganizerKeys.length
    ? events.filter((event) => selectedOrganizerKeys.includes(organizerFilterKey(event)))
    : events;

  function toggleOrganizer(key: string) {
    setSelectedOrganizerKeys((current) => current.includes(key)
      ? current.filter((item) => item !== key)
      : [...current, key]);
  }

  /** 国のチェックで、その国に属する主催をまとめて選択・解除します。 */
  function toggleCountry(country: string, organizers: string[]) {
    const countryKeys = organizers.map((organizer) => organizerFilterKey({ country, organizer }));
    setSelectedOrganizerKeys((current) => {
      const allSelected = countryKeys.every((key) => current.includes(key));
      return allSelected
        ? current.filter((key) => !countryKeys.includes(key))
        : [...new Set([...current, ...countryKeys])];
    });
  }

  return <>
    <div className="convention-tabs" role="tablist" aria-label="コミコン情報の表示切替">
      <button type="button" role="tab" aria-selected={view === "upcoming"} onClick={() => setView("upcoming")}>今後の参加予定 <span>{upcoming.length}</span></button>
      <button type="button" role="tab" aria-selected={view === "past"} onClick={() => setView("past")}>過去の参加情報 <span>{past.length}</span></button>
    </div>

    <details className="convention-filter">
      <summary>主催で絞り込む <span>{selectedOrganizerKeys.length ? `${selectedOrganizerKeys.length}件選択中` : "すべて"}</span></summary>
      <div className="convention-filter__body">
        <div className="convention-filter__groups">
          {organizerGroups.map(({ country, organizers }) => {
            const countryKeys = organizers.map((organizer) => organizerFilterKey({ country, organizer }));
            const allSelected = countryKeys.every((key) => selectedOrganizerKeys.includes(key));
            return <section className="convention-filter__group" key={country}>
              <label className="convention-filter__country">
                <input type="checkbox" checked={allSelected} onChange={() => toggleCountry(country, organizers)} />
                <span>{country}</span>
                <small>すべて</small>
              </label>
              <div className="convention-filter__options">
                {organizers.map((organizer) => {
                const key = organizerFilterKey({ country, organizer });
                return <label key={key}>
                  <input type="checkbox" checked={selectedOrganizerKeys.includes(key)} onChange={() => toggleOrganizer(key)} />
                  <span>{organizer}</span>
                </label>;
                })}
              </div>
            </section>;
          })}
        </div>
        <button type="button" className="filter-reset" disabled={!selectedOrganizerKeys.length} onClick={() => setSelectedOrganizerKeys([])}>主催の条件をリセット</button>
      </div>
    </details>

    <div className="event-count">
      <p className="eyebrow">{view === "upcoming" ? "UPCOMING APPEARANCES" : "PAST APPEARANCES"}</p>
      <strong>{view === "upcoming"
        ? `現在確認できる出演発表・参加予定 ${visibleEvents.length}件 / 全${events.length}件`
        : `参加・出演発表・キャンセル ${visibleEvents.length}件 / 全${events.length}件`}</strong>
    </div>

    <div className={`event-list ${view === "past" ? "event-list--past" : ""}`}>
      {visibleEvents.map((event, index) => {
        const status = event.status ?? (view === "past" ? "attended" : "announced");
        const presentation = statusPresentation[status];
        const hasUpcomingLinks = view === "upcoming" && Boolean(event.officialUrl || event.detailUrl);

        return <article className={`event-card event-card--${status}`} key={`${event.name}-${event.date}`}>
          <div className="event-card__date">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{event.date}</strong>
            {event.appearanceLabel && <small>{event.appearanceLabel}</small>}
          </div>
          <div className="event-card__body">
            <p className="eyebrow">{presentation.eyebrow}</p>
            <p className={`event-status event-status--${status}`}>{presentation.label}</p>
            <h2>{event.name}</h2>
            <div className="event-card__meta"><span>開催国：{event.country}</span><span>主催：{event.organizer}</span></div>
            <p>{event.venue}</p>
            {event.statusNote && <p className="event-card__note">{event.statusNote}</p>}
            {hasUpcomingLinks && <div className="button-row">
              {event.officialUrl && <a className="button button--primary" href={event.officialUrl} target="_blank" rel="noreferrer">公式サイト ↗</a>}
              {event.detailUrl && <a className="button button--ghost" href={event.detailUrl} target="_blank" rel="noreferrer">掲載ページ ↗</a>}
            </div>}
          </div>
        </article>;
      })}
      {!visibleEvents.length && <p className="convention-empty">選択した国・主催に該当するイベントはありません。</p>}
    </div>
  </>;
}
