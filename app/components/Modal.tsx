"use client";

import { useEffect } from "react";

/** 作品・キャラクター詳細の背景、閉じる操作、Esc操作を共通化。 */
export default function Modal({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: React.ReactNode; label: string }) {
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    document.body.classList.add("modal-open");
    return () => { window.removeEventListener("keydown", closeOnEscape); document.body.classList.remove("modal-open"); };
  }, [open, onClose]);

  if (!open) return null;
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal-panel" role="dialog" aria-modal="true" aria-label={label} onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose} aria-label="閉じる">×</button>{children}</section></div>;
}
