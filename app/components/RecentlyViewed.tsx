"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearRecentlyViewed, readRecentlyViewed, RECENTLY_VIEWED_EVENT, type RecentlyViewedItem } from "../lib/recentlyViewed";

const typeLabels: Record<RecentlyViewedItem["type"], string> = {
  work: "WORK",
  character: "CHARACTER",
  interview: "INTERVIEW",
};

/** ブラウザに保存した直近の作品・役柄・インタビューをHOMEへ表示します。 */
export default function RecentlyViewed({ embedded = false }: { embedded?: boolean }) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => { setItems(readRecentlyViewed()); setReady(true); };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(RECENTLY_VIEWED_EVENT, sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener(RECENTLY_VIEWED_EVENT, sync); };
  }, []);

  if (!ready || !items.length) return null;
  return <section className={`${embedded ? "my-archive-section" : "section shell"} recently-viewed`}>
    <div className="recently-viewed__heading"><div><p className="eyebrow">RECENTLY VIEWED</p><h2>最近見た項目</h2></div><button type="button" onClick={clearRecentlyViewed}>履歴を消去</button></div>
    <div className="recently-viewed__list">{items.slice(0, 6).map((item) => <Link href={item.href} key={item.key}>
      {item.image ? <img src={item.image} alt="" loading="lazy" decoding="async" /> : <span aria-hidden="true">DT</span>}
      <div><p>{typeLabels[item.type]}</p><h3>{item.title}</h3>{item.subtitle && <small>{item.subtitle}</small>}</div>
    </Link>)}</div>
  </section>;
}
