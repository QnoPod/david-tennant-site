/** 下層ページで共通利用するコンパクトなページ見出し。 */
export default function PageHero({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <section className="page-hero shell"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></section>;
}
