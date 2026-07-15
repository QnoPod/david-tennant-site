"use client";

import { useEffect } from "react";
import { recordRecentlyViewed, type RecentlyViewedItem } from "../lib/recentlyViewed";

/** Server Componentの詳細ページから、閲覧情報だけをlocalStorageへ記録します。 */
export default function RecentlyViewedTracker({ item }: { item: Omit<RecentlyViewedItem, "viewedAt"> }) {
  useEffect(() => recordRecentlyViewed(item), [item]);
  return null;
}
