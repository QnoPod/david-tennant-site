import Link from "next/link";

export type RelatedLinkItem = {
  href: string;
  title: string;
  meta: string;
  description?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

/** WORKS・CHARACTERS・INTERVIEWSで共用する関連コンテンツ欄。 */
export default function RelatedLinks({ title, items }: { title: string; items: readonly RelatedLinkItem[] }) {
  if (!items.length) return null;
  return <section className="detail-section related-content">
    <h3>{title}</h3>
    <div className="related-content__grid">{items.map((item) => <article key={`${item.href}-${item.title}`}>
      <p>{item.meta}</p>
      <Link href={item.href}>{item.title}<span aria-hidden="true"> →</span></Link>
      {item.description && <small>{item.description}</small>}
      {item.secondaryHref && item.secondaryLabel && <Link className="related-content__secondary" href={item.secondaryHref}>{item.secondaryLabel} →</Link>}
    </article>)}</div>
  </section>;
}
