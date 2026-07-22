"use client";

/** オンラインへ復帰したあと、現在のページを再取得します。 */
export default function OfflineReloadButton() {
  return <button className="button button--ghost" type="button" onClick={() => window.location.reload()}>ページを再読み込み</button>;
}
