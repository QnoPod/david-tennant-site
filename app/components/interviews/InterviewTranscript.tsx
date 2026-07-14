"use client";

import { useMemo, useState } from "react";
import type { TranscriptLine } from "../../data/interviews/types";

type LanguageMode = "both" | "en" | "ja";

/** "01:23" / "1:02:03" をYouTubeリンクで使う秒数へ変換します。 */
function timestampToSeconds(timestamp: string) {
  const parts = timestamp.split(":").map(Number);
  const isValid = (parts.length === 2 || parts.length === 3)
    && parts.every((part) => Number.isInteger(part) && part >= 0)
    && parts.slice(1).every((part) => part < 60);
  if (!isValid) return null;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

/** Web Share APIがないブラウザでは、共有URLをクリップボードへコピーします。 */
async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

/** 発言者、英語原文、日本語訳を読みやすい行として共通表示します。 */
export default function InterviewTranscript({ lines, videoId }: { lines: readonly TranscriptLine[]; videoId: string | null }) {
  const [query, setQuery] = useState("");
  const [speaker, setSpeaker] = useState("all");
  const [languageMode, setLanguageMode] = useState<LanguageMode>("both");
  const [shareFeedback, setShareFeedback] = useState<{ index: number; text: string } | null>(null);
  const speakers = useMemo(() => [...new Map(lines.map((line) => [line.speakerEn, { en: line.speakerEn, ja: line.speakerJa }])).values()], [lines]);
  const filtered = useMemo(() => {
    const needle = query.normalize("NFKC").toLowerCase().trim();
    return lines.map((line, index) => ({ line, index })).filter(({ line }) => {
      const searchable = `${line.speakerEn} ${line.speakerJa} ${line.en} ${line.ja}`.normalize("NFKC").toLowerCase();
      return (!needle || searchable.includes(needle)) && (speaker === "all" || line.speakerEn === speaker);
    });
  }, [lines, query, speaker]);

  /** 発言番号をURLの末尾に付け、検索後も元の番号へ直接移動できるリンクを共有します。 */
  const shareStatement = async (line: TranscriptLine, index: number) => {
    const url = new URL(window.location.href);
    url.hash = `statement-${index + 1}`;
    const shareData = {
      title: document.title,
      text: `${line.speakerJa}：${line.ja}`,
      url: url.toString(),
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareFeedback({ index, text: "共有しました" });
      } else {
        await copyText(shareData.url);
        setShareFeedback({ index, text: "リンクをコピーしました" });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      await copyText(shareData.url);
      setShareFeedback({ index, text: "リンクをコピーしました" });
    }
  };

  const clear = () => { setQuery(""); setSpeaker("all"); };
  return <>
    <div className="transcript-controls" aria-label="原文と翻訳の検索">
      <div><label htmlFor="transcript-search">原文・訳文を検索</label><input id="transcript-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="発言内容を入力" />{query && <button type="button" onClick={() => setQuery("")} aria-label="検索文字を消す">×</button>}</div>
      <label>話者<select value={speaker} onChange={(event) => setSpeaker(event.target.value)}><option value="all">すべての話者</option>{speakers.map((item) => <option value={item.en} key={item.en}>{item.ja} / {item.en}</option>)}</select></label>
      <fieldset className="transcript-language-switch"><legend>表示言語</legend><div>{([{"value":"both","label":"両方"},{"value":"en","label":"英語"},{"value":"ja","label":"日本語"}] as const).map((option) => <button type="button" key={option.value} aria-pressed={languageMode === option.value} onClick={() => setLanguageMode(option.value)}>{option.label}</button>)}</div></fieldset>
      <p><strong>{filtered.length}</strong> / {lines.length}件</p>
    </div>
    {videoId && lines.some((line) => line.timestamp) && <p className="timestamp-guide">▶ 時刻を選ぶと、YouTubeでその発言から再生します。</p>}
    <div className="transcript-list">{filtered.map(({ line, index }) => {
      const seconds = line.timestamp ? timestampToSeconds(line.timestamp) : null;
      const timestampUrl = videoId && seconds !== null
        ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&t=${seconds}s`
        : null;
      return <section className="transcript-row" id={`statement-${index + 1}`} key={`${line.speakerEn}-${index}`}>
    <div className="speaker"><div className="speaker-marker"><span>{String(index + 1).padStart(2, "0")}</span>{timestampUrl && <a className="transcript-timestamp" href={timestampUrl} target="_blank" rel="noreferrer" aria-label={`${line.timestamp}からYouTubeで再生`}>▶ {line.timestamp}</a>}</div><p><strong>{line.speakerEn}</strong><small>{line.speakerJa}</small></p><div className="statement-share-wrap"><button className="statement-share" type="button" onClick={() => void shareStatement(line, index)}>発言を共有</button>{shareFeedback?.index === index && <small role="status">{shareFeedback.text}</small>}</div></div>
    <div className={`translation-grid translation-grid--${languageMode}`}>{languageMode !== "ja" && <div className="translation-panel--en"><span>ENGLISH</span><p lang="en">{line.en}</p></div>}{languageMode !== "en" && <div className="translation-panel--ja"><span>日本語訳</span><p>{line.ja}</p></div>}</div>
  </section>;
    })}</div>
    {!filtered.length && <div className="empty-state"><p>条件に一致する発言がありません。</p><button type="button" onClick={clear}>すべて表示する</button></div>}
  </>;
}
