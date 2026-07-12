"use client";

/**
 * どのページからでも先頭・末尾へ移動できる固定ボタン。
 * smoothを指定し、現在位置から自然に自動スクロールします。
 */
export default function ScrollButtons() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const scrollToBottom = () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });

  return <nav className="scroll-buttons" aria-label="ページ内移動">
    <button type="button" onClick={scrollToTop} aria-label="ページの一番上へ移動"><span>↑</span><small>TOP</small></button>
    <button type="button" onClick={scrollToBottom} aria-label="ページの一番下へ移動"><span>↓</span><small>END</small></button>
  </nav>;
}
