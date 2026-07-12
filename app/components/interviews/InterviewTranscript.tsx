"use client";

import { useMemo, useState } from "react";
import type { TranscriptLine } from "../../data/interviews/types";

/** 発言者、英語原文、日本語訳を読みやすい行として共通表示します。 */
export default function InterviewTranscript({ lines }: { lines: readonly TranscriptLine[] }) {
  const [query, setQuery] = useState("");
  const [speaker, setSpeaker] = useState("all");
  const speakers = useMemo(() => [...new Map(lines.map((line) => [line.speakerEn, { en: line.speakerEn, ja: line.speakerJa }])).values()], [lines]);
  const filtered = useMemo(() => {
    const needle = query.normalize("NFKC").toLowerCase().trim();
    return lines.map((line, index) => ({ line, index })).filter(({ line }) => {
      const searchable = `${line.speakerEn} ${line.speakerJa} ${line.en} ${line.ja}`.normalize("NFKC").toLowerCase();
      return (!needle || searchable.includes(needle)) && (speaker === "all" || line.speakerEn === speaker);
    });
  }, [lines, query, speaker]);

  const clear = () => { setQuery(""); setSpeaker("all"); };
  return <>
    <div className="transcript-controls" aria-label="原文と翻訳の検索">
      <div><label htmlFor="transcript-search">原文・訳文を検索</label><input id="transcript-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="発言内容を入力" />{query && <button type="button" onClick={() => setQuery("")} aria-label="検索文字を消す">×</button>}</div>
      <label>話者<select value={speaker} onChange={(event) => setSpeaker(event.target.value)}><option value="all">すべての話者</option>{speakers.map((item) => <option value={item.en} key={item.en}>{item.ja} / {item.en}</option>)}</select></label>
      <p><strong>{filtered.length}</strong> / {lines.length}件</p>
    </div>
    <div className="transcript-list">{filtered.map(({ line, index }) => <section className="transcript-row" key={`${line.speakerEn}-${index}`}>
    <div className="speaker"><span>{String(index + 1).padStart(2, "0")}</span><p><strong>{line.speakerEn}</strong><small>{line.speakerJa}</small></p></div>
    <div className="translation-grid"><div><span>ENGLISH</span><p lang="en">{line.en}</p></div><div><span>日本語訳</span><p>{line.ja}</p></div></div>
  </section>)}</div>
    {!filtered.length && <div className="empty-state"><p>条件に一致する発言がありません。</p><button type="button" onClick={clear}>すべて表示する</button></div>}
  </>;
}
