import type { Metadata } from "next";
import Link from "next/link";
import OfflineReloadButton from "./OfflineReloadButton";

export const metadata: Metadata = { title: "オフライン" };

/** 未保存のページをオフラインで開いた場合に表示する軽量な案内ページです。 */
export default function OfflinePage() {
  return <main id="main-content" className="offline-page shell">
    <p className="eyebrow">OFFLINE</p>
    <h1>現在オフラインです</h1>
    <p>通信状況を確認して、もう一度お試しください。一度表示したページはオフラインでも開ける場合があります。</p>
    <div className="button-row"><Link className="button button--primary" href="/">ホームへ戻る</Link><OfflineReloadButton /></div>
  </main>;
}
