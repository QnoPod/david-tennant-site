import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "../components/PageHero";
import ReportIssueButton from "../components/ReportIssueButton";
import { getInterviewsNewestFirst } from "../data/interviews/catalog";
import { getConventionAppearances } from "../lib/comiconomicon";
import { buildAutomaticSiteUpdates } from "../lib/siteUpdates";
import { getUpcomingWorks } from "../lib/upcoming";

export const metadata: Metadata = { title: "サイトについて" };

export default async function AboutPage() {
  const [upcoming, conventions] = await Promise.all([
    getUpcomingWorks(),
    getConventionAppearances(),
  ]);
  const siteUpdates = buildAutomaticSiteUpdates({
    interviews: getInterviewsNewestFirst(),
    upcoming,
    conventions,
  });

  return (
    <main id="main-content">
      <PageHero
        eyebrow="ABOUT THIS ARCHIVE"
        title="ABOUT"
        description="このサイトの情報源、更新内容について"
      />

      <section className="section shell about-grid">
        <article>
          <p className="eyebrow">ABOUT</p>
          <h2>サイトについて</h2>
          <p>
            David Tennant Archiveは、デイヴィッド・テナントの
            出演作品、役柄、イベント情報、インタビューを日本語で
            まとめた非公式ファンサイトです。
          </p>
          <p>
            作品情報はTMDB、参加予定はComiconomiconを参照し、
            外部情報には確認先へのリンクを付けています。
          </p>
        </article>

        <article>
          <p className="eyebrow">DISCLAIMER</p>
          <h2>掲載情報について</h2>
          <p>
            イベントや配信状況は変更される場合があります。
            チケット購入や視聴前には、各公式サイトの最新情報を
            ご確認ください。
          </p>
          <p>
            画像、映像、作品名などの権利は、それぞれの権利者に
            帰属します。
          </p>
        </article>
      </section>

      <section className="section shell about-contact">
        <div className="about-contact__copy">
          <p className="eyebrow">CONTACT</p>
          <h2>サイト管理者への連絡</h2>
          <p>
            掲載内容についての質問、機能や表示の不具合、追加してほしい情報、<br />
            サイトへの要望はこちらからお知らせください。
          </p>
          <p>
            作品・キャラクターなど個別情報の誤りは、それぞれの詳細画面にある<br />
            「情報の誤りを報告」から送ると対象情報が自動入力されます。
          </p>
          <small>
            GitHubアカウントやログインは不要です。<br />
            送信内容は公開管理票として登録されるため、個人情報や公開されたくない内容は記入しないでください。<br />
            送信後に表示される受付番号から対応状況を確認できます。
          </small>
        </div>

        <ReportIssueButton
          mode="contact"
          targetType="サイトへの連絡"
          targetTitle="David Tennant Archive"
          targetKey="about-contact"
        />
      </section>

      <section className="section section--paper">
        <div className="shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow">CHANGELOG</p>
              <h2>更新履歴</h2>
            </div>
          </div>
          <div className="updates-list">
            {siteUpdates.map((item) => (
              <div key={`${item.date}-${item.text}`}>
                <time>{item.date.replaceAll("-", ".")}</time>
                <p>
                  <span>{item.category}</span>
                  <Link href={item.href}>{item.text}</Link>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
