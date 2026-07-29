"use client";

import { useState } from "react";

type ShareButtonsProps = {
  url: string;
  title: string;
  text?: string;
};

const PRODUCTION_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim()
  || "https://david-tennant-site.vercel.app";

/**
 * Xへ渡すURLは本番サイトの専用ページへ固定します。
 * localhostやVercel Previewから共有しても、閲覧者は公開中の作品／キャラクターページへ移動します。
 */
function getAbsoluteUrl(url: string) {
  return new URL(url, PRODUCTION_SITE_URL).toString();
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

/** X投稿、端末の共有メニュー、URLコピーを共通化します。 */
export default function ShareButtons({
  url,
  title,
  text,
}: ShareButtonsProps) {
  const [status, setStatus] = useState("");

  const shareText = text || title;
  const xHashtags = ["DavidTennantArchive"];

  const shareToX = () => {
    const absoluteUrl = getAbsoluteUrl(url);
    const params = new URLSearchParams({
      text: shareText,
      url: absoluteUrl,
    });
    if (xHashtags.length) {
      params.set("hashtags", xHashtags.join(","));
    }
    window.open(
      `https://twitter.com/intent/tweet?${params.toString()}`,
      "_blank",
      "noopener,noreferrer,width=720,height=640",
    );
  };

  const shareFromDevice = async () => {
    const absoluteUrl = getAbsoluteUrl(url);

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: absoluteUrl,
        });
        setStatus("共有しました");
      } catch (error) {
        if (
          error instanceof DOMException
          && error.name === "AbortError"
        ) return;
        setStatus("共有できませんでした");
      }
      return;
    }

    try {
      await copyText(absoluteUrl);
      setStatus("リンクをコピーしました");
    } catch {
      setStatus("リンクをコピーできませんでした");
    }
  };

  const copyLink = async () => {
    try {
      await copyText(getAbsoluteUrl(url));
      setStatus("リンクをコピーしました");
    } catch {
      setStatus("リンクをコピーできませんでした");
    }
  };

  return (
    <div className="share-actions" aria-label={`${title}を共有`}>
      <span className="share-actions__label">SHARE</span>
      <button type="button" onClick={shareToX}>
        Xで共有
      </button>
      <button type="button" onClick={shareFromDevice}>
        共有
      </button>
      <button type="button" onClick={copyLink}>
        リンクをコピー
      </button>
      <span
        className="share-actions__status"
        role="status"
        aria-live="polite"
      >
        {status}
      </span>
    </div>
  );
}
