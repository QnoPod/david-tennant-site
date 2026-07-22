"use client";

import { useEffect, useState } from "react";

type ReadingSize = "small" | "standard" | "large" | "xlarge";
type LineSpacing = "standard" | "relaxed";
type Preferences = { size: ReadingSize; lineSpacing: LineSpacing; highContrast: boolean; reduceMotion: boolean };

const STORAGE_KEY = "david-tennant-readability-v1";
const DEFAULTS: Preferences = { size: "standard", lineSpacing: "standard", highContrast: false, reduceMotion: false };

/** 保存値が壊れていても既定値へ安全に戻します。 */
function readPreferences(): Preferences {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<Preferences>;
    return {
      size: saved.size === "small" || saved.size === "large" || saved.size === "xlarge" ? saved.size : "standard",
      lineSpacing: saved.lineSpacing === "relaxed" ? "relaxed" : "standard",
      highContrast: saved.highContrast === true,
      reduceMotion: saved.reduceMotion === true,
    };
  } catch { return DEFAULTS; }
}

/** CSSから参照するdata属性をhtml要素へ反映します。 */
function applyPreferences(value: Preferences) {
  const root = document.documentElement;
  root.dataset.readabilitySize = value.size;
  root.dataset.readabilitySpacing = value.lineSpacing;
  root.dataset.readabilityContrast = value.highContrast ? "high" : "standard";
  root.dataset.readabilityMotion = value.reduceMotion ? "reduced" : "standard";
}

/** 全ページ共通の読みやすさ設定。選択内容はこのブラウザへ保存します。 */
export default function ReadabilitySettings() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>(DEFAULTS);

  useEffect(() => {
    const saved = readPreferences();
    setPreferences(saved);
    applyPreferences(saved);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    applyPreferences(preferences);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [loaded, preferences]);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    addEventListener("keydown", close);
    return () => removeEventListener("keydown", close);
  }, [open]);

  const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) =>
    setPreferences((current) => ({ ...current, [key]: value }));

  return <aside className="readability-settings">
    <button type="button" className="readability-settings__trigger" aria-expanded={open} aria-controls="readability-settings-panel" onClick={() => setOpen((value) => !value)}>
      <span aria-hidden="true">Aa</span><strong>読みやすさ</strong>
    </button>
    {open && <section id="readability-settings-panel" className="readability-settings__panel" aria-label="読みやすさ設定">
      <header><div><p>READABILITY</p><h2>読みやすさ設定</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="読みやすさ設定を閉じる">×</button></header>
      <fieldset><legend>本文の文字サイズ</legend><div className="readability-settings__choices">
        {(["small", "standard", "large", "xlarge"] as const).map((size) => <button type="button" className={preferences.size === size ? "is-active" : ""} aria-pressed={preferences.size === size} onClick={() => update("size", size)} key={size}>{size === "small" ? "小" : size === "standard" ? "標準" : size === "large" ? "大" : "特大"}</button>)}
      </div></fieldset>
      <fieldset><legend>本文の行間</legend><div className="readability-settings__choices readability-settings__choices--two">
        <button type="button" className={preferences.lineSpacing === "standard" ? "is-active" : ""} aria-pressed={preferences.lineSpacing === "standard"} onClick={() => update("lineSpacing", "standard")}>標準</button>
        <button type="button" className={preferences.lineSpacing === "relaxed" ? "is-active" : ""} aria-pressed={preferences.lineSpacing === "relaxed"} onClick={() => update("lineSpacing", "relaxed")}>ゆったり</button>
      </div></fieldset>
      <label className="readability-settings__toggle"><span><strong>高コントラスト</strong><small>文字と背景の差を強くします</small></span><input type="checkbox" checked={preferences.highContrast} onChange={(event) => update("highContrast", event.target.checked)} /></label>
      <label className="readability-settings__toggle"><span><strong>動きを軽減</strong><small>スクロールや画面効果を抑えます</small></span><input type="checkbox" checked={preferences.reduceMotion} onChange={(event) => update("reduceMotion", event.target.checked)} /></label>
      <button type="button" className="readability-settings__reset" onClick={() => setPreferences(DEFAULTS)}>設定をリセット</button>
      <p className="readability-settings__note" aria-live="polite">設定はこのブラウザに自動保存されます。</p>
    </section>}
  </aside>;
}
