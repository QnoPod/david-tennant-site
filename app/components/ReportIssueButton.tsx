"use client";

import { type FormEvent, useId, useState } from "react";

const correctionCategories = [
  "タイトル・原題",
  "あらすじ・説明",
  "役名・人物情報",
  "公開日・制作状況",
  "配信情報",
  "画像",
  "翻訳・文字起こし",
  "取得元・リンク",
  "その他",
] as const;

const contactCategories = [
  "掲載情報について",
  "機能・表示の不具合",
  "追加してほしい情報",
  "サイトへの要望",
  "その他",
] as const;

type ReportMode = "correction" | "contact";

type ReportIssueButtonProps = {
  targetType: string;
  targetTitle: string;
  targetKey?: string;
  sourceUrl?: string;
  compact?: boolean;
  mode?: ReportMode;
};

type ReportResponse = {
  ok?: boolean;
  issueUrl?: string;
  issueNumber?: number;
  message?: string;
};

/**
 * GitHubアカウントを持たない閲覧者も、サイト内から報告を送信できます。
 * 秘密トークンはブラウザへ渡さず、/api/report が管理用Issueを作成します。
 */
export default function ReportIssueButton({
  targetType,
  targetTitle,
  targetKey,
  sourceUrl,
  compact = false,
  mode = "correction",
}: ReportIssueButtonProps) {
  const id = useId();
  const isContact = mode === "contact";
  const categories = isContact
    ? contactCategories
    : correctionCategories;

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>(categories[0]);
  const [incorrect, setIncorrect] = useState("");
  const [correction, setCorrection] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submittedIssueUrl, setSubmittedIssueUrl] = useState("");
  const [submittedIssueNumber, setSubmittedIssueNumber] =
    useState<number | null>(null);

  const panelId = `${id}-panel`;
  const buttonLabel = isContact
    ? "サイト管理者へ連絡"
    : "情報の誤りを報告";
  const heading = isContact
    ? "サイトについて連絡する"
    : "修正内容を報告";
  const requiredLabel = isContact
    ? "お問い合わせ・ご連絡内容"
    : "誤っている箇所・内容";
  const optionalLabel = isContact
    ? "希望する対応・提案"
    : "正しいと思われる内容";
  const requiredPlaceholder = isContact
    ? "質問、要望、不具合の状況などを入力してください。"
    : "どの文章や情報が、どのように誤っているか入力してください。";
  const optionalPlaceholder = isContact
    ? "追加してほしい機能や、希望する対応があれば入力してください。"
    : "修正後の文章や正しい情報が分かる場合に入力してください。";

  const toggleForm = () => {
    setOpen((current) => {
      const next = !current;
      if (next) {
        setStartedAt(Date.now());
        setSubmitError("");
      }
      return next;
    });
  };

  const submitReport = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!incorrect.trim() || submitting) return;

    setSubmitting(true);
    setSubmitError("");
    setSubmittedIssueUrl("");
    setSubmittedIssueNumber(null);

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          targetType,
          targetTitle,
          targetKey,
          sourceUrl,
          category,
          message: incorrect,
          suggestedCorrection: correction,
          evidenceUrl,
          notes,
          pageUrl: window.location.href,
          website,
          startedAt,
        }),
      });

      const data = await response.json() as ReportResponse;
      if (!response.ok || !data.ok) {
        throw new Error(
          data.message
            || "送信できませんでした。時間をおいて再度お試しください。",
        );
      }

      setSubmittedIssueUrl(data.issueUrl || "");
      setSubmittedIssueNumber(data.issueNumber ?? null);
      setIncorrect("");
      setCorrection("");
      setEvidenceUrl("");
      setNotes("");
      setWebsite("");
      setStartedAt(Date.now());
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "送信できませんでした。時間をおいて再度お試しください。",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className={[
        "report-issue",
        compact ? "report-issue--compact" : "",
        isContact ? "report-issue--contact" : "",
      ].filter(Boolean).join(" ")}
      aria-label={`${targetTitle}について連絡`}
    >
      <button
        className="report-issue__toggle"
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggleForm}
      >
        <span aria-hidden="true">{isContact ? "✉" : "!"}</span>
        {buttonLabel}
      </button>

      {open && (
        <div className="report-issue__panel" id={panelId}>
          <div className="report-issue__heading">
            <div>
              <p className="eyebrow">
                {isContact
                  ? "CONTACT THE ARCHIVE"
                  : "REPORT A CORRECTION"}
              </p>
              <h3>{heading}</h3>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="連絡フォームを閉じる"
            >
              ×
            </button>
          </div>

          <p className="report-issue__target">
            <b>{targetType}</b>
            <span>{targetTitle}</span>
          </p>

          <form onSubmit={submitReport}>
            <label htmlFor={`${id}-category`}>
              {isContact ? "連絡の種類" : "修正する項目"}
              <select
                id={`${id}-category`}
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)}
              >
                {categories.map((item) => (
                  <option value={item} key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label htmlFor={`${id}-incorrect`}>
              {requiredLabel}
              <textarea
                id={`${id}-incorrect`}
                required
                maxLength={4000}
                value={incorrect}
                onChange={(event) =>
                  setIncorrect(event.target.value)}
                placeholder={requiredPlaceholder}
                rows={5}
              />
            </label>

            <label htmlFor={`${id}-correction`}>
              {optionalLabel}
              <textarea
                id={`${id}-correction`}
                maxLength={4000}
                value={correction}
                onChange={(event) =>
                  setCorrection(event.target.value)}
                placeholder={optionalPlaceholder}
                rows={4}
              />
            </label>

            <label htmlFor={`${id}-evidence`}>
              参考URL
              <input
                id={`${id}-evidence`}
                type="url"
                inputMode="url"
                maxLength={1000}
                value={evidenceUrl}
                onChange={(event) =>
                  setEvidenceUrl(event.target.value)}
                placeholder="https://..."
              />
            </label>

            <label htmlFor={`${id}-notes`}>
              補足
              <textarea
                id={`${id}-notes`}
                maxLength={2000}
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)}
                placeholder="追加で伝えたいことがあれば入力してください。"
                rows={3}
              />
            </label>

            <label
              className="report-issue__honeypot"
              htmlFor={`${id}-website`}
              aria-hidden="true"
            >
              Website
              <input
                id={`${id}-website`}
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(event) =>
                  setWebsite(event.target.value)}
              />
            </label>

            <p className="report-issue__privacy">
              GitHubアカウントやログインは不要です。
              送信内容はサイトの公開管理票として登録されるため、
              氏名、メールアドレス、電話番号などの個人情報は
              入力しないでください。
            </p>

            <div className="report-issue__actions">
              <button
                className="button button--primary"
                type="submit"
                disabled={!incorrect.trim() || submitting}
              >
                {submitting ? "送信中…" : "内容を送信する"}
              </button>
              <button
                className="button button--ghost"
                type="button"
                disabled={submitting}
                onClick={() => setOpen(false)}
              >
                閉じる
              </button>
            </div>

            <div
              className="report-issue__result"
              aria-live="polite"
            >
              {submitError && (
                <p className="report-issue__error">
                  {submitError}
                </p>
              )}

              {submittedIssueNumber && (
                <p className="report-issue__success">
                  送信しました。受付番号は
                  {" "}
                  <strong>#{submittedIssueNumber}</strong>
                  です。
                  {submittedIssueUrl && (
                    <>
                      {" "}
                      <a
                        href={submittedIssueUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        受付内容を確認する ↗
                      </a>
                    </>
                  )}
                </p>
              )}
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
