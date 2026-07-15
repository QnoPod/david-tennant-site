import type { UpcomingWork } from "../types";

function needsJapanese(value = "") {
  return Boolean(value) && /[A-Za-z]/.test(value) && !/[ぁ-んァ-ヶ一-龠]/.test(value);
}

async function translateChunk(values: string[], apiKey: string) {
  const body = new URLSearchParams({ target_lang: "JA", preserve_formatting: "1" });
  for (const value of values) body.append("text", value);
  const endpoint = process.env.DEEPL_API_URL
    || (apiKey.endsWith(":fx") ? "https://api-free.deepl.com/v2/translate" : "https://api.deepl.com/v2/translate");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `DeepL-Auth-Key ${apiKey}`, "Content-Type": "application/x-www-form-urlencoded" },
    body, cache: "no-store", signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) return values;
  const data = await response.json() as { translations?: Array<{ text?: string }> };
  return values.map((value, index) => data.translations?.[index]?.text?.trim() || value);
}

/** DeepLキーがある環境だけ、英語の確認待ち見出しと要約を日本語化します。 */
export async function translateAnnouncements(items: UpcomingWork[]) {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) return items;
  const targets: Array<{ itemIndex: number; field: "title" | "overview"; value: string }> = [];
  items.forEach((item, itemIndex) => {
    if (needsJapanese(item.title)) targets.push({ itemIndex, field: "title", value: item.title.slice(0, 500) });
    if (needsJapanese(item.overview)) targets.push({ itemIndex, field: "overview", value: item.overview!.slice(0, 1800) });
  });
  if (!targets.length) return items;
  const translated: string[] = [];
  for (let index = 0; index < targets.length; index += 40) {
    const chunk = targets.slice(index, index + 40);
    try { translated.push(...await translateChunk(chunk.map((target) => target.value), apiKey)); }
    catch { translated.push(...chunk.map((target) => target.value)); }
  }
  return items.map((item, itemIndex) => {
    const next = { ...item };
    targets.forEach((target, targetIndex) => {
      if (target.itemIndex !== itemIndex || translated[targetIndex] === target.value) return;
      if (target.field === "title") {
        next.originalTitle = item.originalTitle || item.title;
        next.title = translated[targetIndex];
      } else next.overview = translated[targetIndex];
    });
    return next;
  });
}
