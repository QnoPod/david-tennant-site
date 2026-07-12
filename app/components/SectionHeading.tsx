import Link from "next/link";

/** セクション見出しの文字サイズと余白を統一する小さな共通部品。 */
export default function SectionHeading({ eyebrow, title, linkHref, linkLabel }: { eyebrow: string; title: string; linkHref?: string; linkLabel?: string }) {
  return (
    <div className="section-heading">
      <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>
      {linkHref && linkLabel && <Link className="text-link" href={linkHref}>{linkLabel} →</Link>}
    </div>
  );
}
