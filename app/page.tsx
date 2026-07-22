import Link from "next/link";
import SectionHeading from "./components/SectionHeading";
import { featuredWorks, homeSiteMap } from "./data/content";
import { getInterviewsNewestFirst } from "./data/interviews/catalog";
import { getCharacters } from "./lib/characters";
import { getConventionAppearances } from "./lib/comiconomicon";
import { getWorks } from "./lib/tmdb";
import { buildAutomaticSiteUpdates } from "./lib/siteUpdates";
import { getUpcomingWorks } from "./lib/upcoming";

/** トップページ。サイト内の各アーカイブへ迷わず移動できる入口です。 */
export default async function HomePage() {
  const [appearances, works, upcoming] = await Promise.all([getConventionAppearances(), getWorks(), getUpcomingWorks()]);
  const nextAppearance = appearances[0];
  const interviews = getInterviewsNewestFirst();
  const latestInterview = interviews[0];
  const siteUpdates = buildAutomaticSiteUpdates({ interviews, upcoming, conventions: appearances });
  // 公開年が確認できる役を新しい順に並べ、トップには最新6人だけを表示します。
  const latestCharacters = getCharacters(works).filter((character) => /^\d{4}$/.test(character.year)).slice(0, 6);

  return (
    <main id="main-content">
      <section className="hero shell" aria-labelledby="hero-title">
        <div className="hero__copy">
          <p className="eyebrow">ACTOR · PERFORMER · STORYTELLER</p>
          <h1 id="hero-title">DAVID<br /><span>TENNANT</span></h1>
          <p className="hero__lead">
            映像、舞台、声の出演まで。<br />
            デイヴィッド・テナントの非公式ファンサイト。<br />
            PC表示推奨です。<br />
            ※※※　現在、試運転中　※※※
          </p>
          <div className="button-row">
            <Link className="button button--primary" href="/works">出演作品を見る</Link>
            <Link className="button button--ghost" href="/interviews">インタビューを読む</Link>
          </div>
        </div>
        <div className="hero__portrait" aria-label="デイヴィッド・テナントの写真">
          <img src="/images/david-tennant-optimized.webp" alt="笑顔のデイヴィッド・テナント" width="1600" height="900" fetchPriority="high" decoding="async" />
          <span className="hero__year">1971 —</span>
        </div>
      </section>

      <section className="section shell">
        <SectionHeading eyebrow="SELECTED WORKS" title="代表作" linkHref="/works" linkLabel="すべての作品" />
        <div className="featured-grid">
          {featuredWorks.map((work, index) => (
            <Link className={`feature-card feature-card--${index + 1}`} href={`/works?q=${encodeURIComponent(work.title)}`} key={work.title}>
              <span className="feature-card__number">0{index + 1}</span>
              <div>
                <p>{work.year} · {work.medium}</p>
                <h3>{work.title}</h3>
                <span className={work.title === "Doctor Who" ? "featured-role featured-role--doctor" : "featured-role"}>{work.role}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section section--paper">
        <div className="shell">
          <SectionHeading eyebrow="EXPLORE THE ARCHIVE" title={<><span className="mobile-title-break">作品とキャラクター</span><span className="mobile-title-break">から探す</span></>} />
          <div className="portal-grid">
            <Link className="portal-card" href="/works">
              <span className="portal-card__index">01</span>
              <p className="eyebrow">FILMOGRAPHY</p>
              <h3>出演作品アーカイブ</h3>
              <p>映画・ドラマ・舞台・声の出演を検索。</p>
              <span className="text-link">作品を見る →</span>
            </Link>
            <Link className="portal-card portal-card--dark" href="/characters">
              <span className="portal-card__index">02</span>
              <p className="eyebrow">CHARACTER FILES</p>
              <h3><span className="mobile-title-break">キャラクター</span><span className="mobile-title-break">アーカイブ</span></h3>
              <p>演じた人物を画像、年代、属性から検索。</p>
              <span className="text-link">キャラクターを見る →</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="section shell">
        <SectionHeading eyebrow="LATEST CHARACTERS" title={<span className="mobile-title-nowrap">最新のキャラクター</span>} linkHref="/characters" linkLabel={<><span className="mobile-link-break">キャラクター</span><span className="mobile-link-break">一覧→</span></>} />
        <div className="character-strip">
          {latestCharacters.map((character) => (
            <Link href={`/characters?q=${encodeURIComponent(character.name)}`} key={character.key} className="mini-character">
              <img src={character.image} alt="" loading="lazy" decoding="async" />
              <div><strong>{character.name}</strong><span>{character.year} · {character.displayWorkTitle}</span></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section section--blue">
        <div className="shell home-split">
          <div>
            <SectionHeading eyebrow="UPCOMING APPEARANCE" title="次に会える場所" />
            {nextAppearance ? (
              <article className="event-highlight">
                <p>{nextAppearance.date}</p>
                <h3>{nextAppearance.name}</h3>
                <span>{nextAppearance.venue}</span>
                <div className="button-row">
                  <Link className="button button--light" href="/comic-con">参加情報を見る</Link>
                  {nextAppearance.officialUrl && <a className="button button--line-light" href={nextAppearance.officialUrl} target="_blank" rel="noreferrer">公式サイト ↗</a>}
                </div>
              </article>
            ) : <p>現在、表示できる参加予定はありません。</p>}
          </div>

          <div>
            <SectionHeading eyebrow="LATEST INTERVIEW" title="インタビュー・記事を読む" />
            <Link className="interview-teaser" href={`/interviews/${latestInterview.slug}`}>
              <span className="interview-teaser__play">{latestInterview.mediaType === "video" ? "▶" : "記事"}</span>
              <div>
                <p>{latestInterview.publishedDate.replaceAll("-", ".")} · {latestInterview.source.toUpperCase()}</p>
                <h3>{latestInterview.title}</h3>
                <span>英語原文と日本語訳を収録 →</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="section section--paper">
        <div className="shell">
          <SectionHeading eyebrow="SITE MAP" title="サイトマップ" />
          <p className="home-sitemap__lead">見たい情報に合わせて、サイト内の各アーカイブへ移動できます。</p>
          <nav className="home-sitemap" aria-label="サイトマップ">
            {homeSiteMap.map((item, index) => <Link href={item.href} className="home-sitemap__item" key={item.href}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><p>{item.label}</p><h3>{item.title}</h3><small>{item.description}</small></div>
              <b aria-hidden="true">→</b>
            </Link>)}
          </nav>
        </div>
      </section>

      <section className="section shell">
        <SectionHeading eyebrow="LATEST UPDATES" title="更新履歴" linkHref="/about" linkLabel="サイトについて" />
        <div className="updates-list">
          {siteUpdates.map((update) => (
            <div key={`${update.date}-${update.text}`}><time>{update.date.replaceAll("-", ".")}</time><p><span>{update.category}</span><Link href={update.href}>{update.text}</Link></p></div>
          ))}
        </div>
      </section>
    </main>
  );
}
