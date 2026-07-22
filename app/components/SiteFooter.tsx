import Link from "next/link";
import { navigation } from "../data/content";
import PwaSupport from "./PwaSupport";

/** 免責事項と主要導線をまとめた共通フッター。 */
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__grid">
        <div><div className="brand brand--footer"><span>DT</span><strong>DAVID TENNANT<br />ARCHIVE</strong></div><p>Stories, roles and moments worth remembering.</p><PwaSupport /></div>
        <nav aria-label="フッターナビゲーション">{navigation.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}</nav>
      </div>
      <div className="shell site-footer__legal">
        <p>非公式ファンサイトです。画像・映像・作品情報の権利は各権利者に帰属します。</p>
        <p>© 2026 DAVID TENNANT ARCHIVE</p>
      </div>
    </footer>
  );
}
