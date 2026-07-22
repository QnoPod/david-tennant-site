import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

/**
 * サイト内で参照している画像・外部リンク・YouTube動画を検査します。
 * 結果はDATA CHECKページが読むJSONへ保存し、一般ユーザーには公開しません。
 */
const ROOT = process.cwd();
const APP_DIR = join(ROOT, "app");
const PUBLIC_DIR = join(ROOT, "public");
const OUTPUT_FILE = join(APP_DIR, "data", "generated", "resourceChecks.json");
const LOCAL_ONLY = process.argv.includes("--local-only");
const TIMEOUT_MS = Number(process.env.RESOURCE_CHECK_TIMEOUT_MS || 12_000);
const CONCURRENCY = Math.max(1, Number(process.env.RESOURCE_CHECK_CONCURRENCY || 5));
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".json"]);
const GENERATED_RELATIVE_PATH = "app/data/generated/resourceChecks.json";

const externalUrlPattern = /https?:\/\/[^\s"'`<>\\)\]]+/g;
const localImagePattern = /(["'`])(\/[^"'`\n\r?#]+\.(?:avif|gif|ico|jpe?g|png|svg|webp)(?:[?#][^"'`\n\r]*)?)\1/gi;
const videoIdPattern = /\bvideoId\s*:\s*["']([A-Za-z0-9_-]{6,})["']/g;

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walk(path);
    return SOURCE_EXTENSIONS.has(extname(entry.name)) ? [path] : [];
  });
}

function sourceLine(source, offset) {
  return source.slice(0, offset).split("\n").length;
}

function cleanExternalUrl(value) {
  return value.replace(/[.,;:!?。、，；：！？]+$/u, "");
}

function youtubeVideoId(value) {
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] || null;
    if (url.hostname.endsWith("youtube.com")) {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      const parts = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(parts[0])) return parts[1] || null;
    }
  } catch {
    return null;
  }
  return null;
}

function addReference(map, target, kind, file, line) {
  const normalizedTarget = kind === "image" ? decodeURI(target.split(/[?#]/)[0]) : target;
  const key = `${kind}:${normalizedTarget}`;
  const reference = { file: relative(ROOT, file).replaceAll("\\", "/"), line };
  const current = map.get(key);
  if (current) {
    if (!current.references.some((item) => item.file === reference.file && item.line === reference.line)) {
      current.references.push(reference);
    }
    return;
  }
  map.set(key, { id: createHash("sha1").update(key).digest("hex").slice(0, 12), kind, target: normalizedTarget, references: [reference] });
}

function collectReferences() {
  const references = new Map();
  for (const file of walk(APP_DIR)) {
    const fileName = relative(ROOT, file).replaceAll("\\", "/");
    if (fileName === GENERATED_RELATIVE_PATH) continue;
    // API実装や変換処理内のサンプルパスは、画面で参照する静的素材ではありません。
    if (fileName.startsWith("app/api/") || fileName.startsWith("app/lib/")) continue;
    const source = readFileSync(file, "utf8");

    for (const match of source.matchAll(localImagePattern)) {
      addReference(references, match[2], "image", file, sourceLine(source, match.index));
    }

    for (const match of source.matchAll(externalUrlPattern)) {
      const target = cleanExternalUrl(match[0]);
      // 実行時に値を差し込むAPIテンプレートは、閲覧者向けリンクではないため除外します。
      if (target.includes("${")) continue;
      addReference(references, target, youtubeVideoId(target) ? "video" : "link", file, sourceLine(source, match.index));
    }

    // インタビューデータはURLではなくvideoIdだけを持つ場合があるため補完します。
    for (const match of source.matchAll(videoIdPattern)) {
      const target = `https://www.youtube.com/watch?v=${match[1]}`;
      addReference(references, target, "video", file, sourceLine(source, match.index));
    }
  }
  return [...references.values()].sort((a, b) => a.target.localeCompare(b.target, "ja"));
}

async function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      redirect: "follow",
      ...init,
      signal: controller.signal,
      headers: {
        "user-agent": "David-Tennant-Archive-Resource-Check/1.0",
        accept: "text/html,application/json,image/*;q=0.8,*/*;q=0.5",
        ...init.headers,
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

function responseResult(status, target) {
  if (status >= 200 && status < 400) return { status: "ok", httpStatus: status, message: "正常に応答しました。" };
  if (status === 404 || status === 410) return { status: "broken", httpStatus: status, message: "リンク先が見つからないか、削除されています。" };
  if ([401, 403, 429].includes(status)) return { status: "warning", httpStatus: status, message: "アクセス制限により自動確認できません。ブラウザで確認してください。" };
  return { status: "warning", httpStatus: status, message: `${target} はHTTP ${status}を返しました。` };
}

async function checkExternal(item) {
  if (LOCAL_ONLY) return { status: "unchecked", httpStatus: null, message: "ローカル画像だけを検査したため未確認です。" };

  try {
    if (item.kind === "video") {
      const id = youtubeVideoId(item.target);
      const watchUrl = `https://www.youtube.com/watch?v=${id}`;
      const response = await fetchWithTimeout(`https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`);
      return responseResult(response.status, item.target);
    }

    let response = await fetchWithTimeout(item.target, { method: "HEAD" });
    // HEADを拒否するサイトでは、本文を保存せず先頭1バイトだけGETして再確認します。
    if ([400, 403, 405, 501].includes(response.status)) {
      response = await fetchWithTimeout(item.target, { method: "GET", headers: { range: "bytes=0-0" } });
    }
    return responseResult(response.status, item.target);
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return {
      status: "warning",
      httpStatus: null,
      message: timedOut ? "確認がタイムアウトしました。ブラウザで確認してください。" : `自動確認できませんでした：${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function checkLocalImage(item) {
  let decoded;
  try {
    decoded = decodeURIComponent(item.target);
  } catch {
    return { status: "broken", httpStatus: null, message: "画像パスを正しく読み取れません。" };
  }
  const file = resolve(PUBLIC_DIR, `.${decoded}`);
  const insidePublic = file === PUBLIC_DIR || file.startsWith(`${PUBLIC_DIR}/`);
  if (!insidePublic || !existsSync(file)) return { status: "broken", httpStatus: null, message: `public${decoded} が見つかりません。` };
  if (!statSync(file).isFile()) return { status: "broken", httpStatus: null, message: `public${decoded} は画像ファイルではありません。` };
  return { status: "ok", httpStatus: null, message: "画像ファイルを確認しました。" };
}

async function mapConcurrent(items, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length || 1) }, run));
  return results;
}

function readPrevious() {
  try {
    return JSON.parse(readFileSync(OUTPUT_FILE, "utf8"));
  } catch {
    return { updatedAt: null, items: [] };
  }
}

function comparable(item) {
  return JSON.stringify({ kind: item.kind, target: item.target, references: item.references, status: item.status, httpStatus: item.httpStatus, message: item.message });
}

async function main() {
  const collected = collectReferences();
  const previous = readPrevious();
  const previousById = new Map(previous.items.map((item) => [item.id, item]));
  const checked = await mapConcurrent(collected, async (item) => ({
    ...item,
    ...(item.kind === "image" ? checkLocalImage(item) : await checkExternal(item)),
  }));

  let changed = checked.length !== previous.items.length;
  const now = new Date().toISOString();
  const items = checked.map((item) => {
    const old = previousById.get(item.id);
    const same = old && comparable(old) === comparable(item);
    if (!same) changed = true;
    return { ...item, checkedAt: same ? old.checkedAt : now };
  });
  const count = (status) => items.filter((item) => item.status === status).length;
  const output = {
    updatedAt: changed ? now : previous.updatedAt,
    mode: LOCAL_ONLY ? "local-only" : "full",
    summary: { total: items.length, ok: count("ok"), broken: count("broken"), warning: count("warning"), unchecked: count("unchecked") },
    items,
  };
  writeFileSync(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Resource check: ${output.summary.total}件（切れ ${output.summary.broken} / 要手動確認 ${output.summary.warning} / 未確認 ${output.summary.unchecked}）`);
}

await main();
