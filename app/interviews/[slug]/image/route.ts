import sharp from "sharp";
import { getPublishedInterviews } from "../../../data/interviews/catalog";

type InterviewImageRouteProps = {
  params: Promise<{ slug: string }>;
};

export const runtime = "nodejs";
export const revalidate = 86400;

/**
 * Node.jsのBufferを、Web標準Responseが確実に受け取れる
 * ArrayBufferへコピーします。
 */
function toResponseArrayBuffer(bytes: Buffer): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function escapeXml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;",
    })[character] || character,
  );
}

function wrapText(
  value: string,
  maxCharacters = 38,
  maxLines = 3,
) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return ["INTERVIEW"];

  const words = normalized.split(" ");
  const lines: string[] = [];

  if (words.length === 1) {
    for (
      let index = 0;
      index < normalized.length && lines.length < maxLines;
      index += maxCharacters
    ) {
      lines.push(
        normalized.slice(index, index + maxCharacters),
      );
    }
    return lines;
  }

  let current = "";
  for (const word of words) {
    const candidate = current
      ? `${current} ${word}`
      : word;

    if (
      candidate.length <= maxCharacters
      || !current
    ) {
      current = candidate;
      continue;
    }

    lines.push(current);
    current = word;
    if (lines.length >= maxLines - 1) break;
  }

  if (
    current
    && lines.length < maxLines
  ) {
    lines.push(current);
  }

  return lines;
}

async function fetchThumbnail(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "image/avif,image/webp,image/png,image/jpeg,*/*",
      "User-Agent":
        "Mozilla/5.0 (compatible; DavidTennantArchive/1.0)",
    },
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    throw new Error(
      `Interview thumbnail request failed: ${response.status}`,
    );
  }

  return Buffer.from(await response.arrayBuffer());
}

/**
 * 動画・記事画像を、拡張子や元形式に関係なく
 * X向け1200×630 WebPへ変換します。
 */
async function createThumbnailCard(
  thumbnailUrl: string,
) {
  const source = await fetchThumbnail(thumbnailUrl);

  return sharp(source, {
    failOn: "none",
    limitInputPixels: 268_402_689,
  })
    .rotate()
    .resize({
      width: 1200,
      height: 630,
      fit: "cover",
      position: "centre",
    })
    .webp({
      quality: 84,
      effort: 4,
    })
    .toBuffer();
}

/**
 * サムネイルが取得できない場合も、インタビューごとの
 * 英題・掲載元を入れた固有カードを返します。
 */
async function createInterviewFallback({
  title,
  source,
  year,
}: {
  title: string;
  source: string;
  year: string;
}) {
  const lines = wrapText(title);
  const fontSize =
    title.length > 90
      ? 43
      : title.length > 60
        ? 50
        : 58;
  const lineHeight = fontSize + 15;

  const titleMarkup = lines
    .map((line, index) => (
      `<tspan x="72" dy="${index === 0 ? 0 : lineHeight}">`
      + `${escapeXml(line)}</tspan>`
    ))
    .join("");

  const safeSource = escapeXml(source);
  const safeYear = escapeXml(year);
  const svg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630"
      xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#111116"/>
      <rect x="0" y="0" width="1200" height="18" fill="#c59a38"/>
      <circle cx="1040" cy="90" r="245"
        fill="none" stroke="#c59a38" stroke-width="3" opacity=".36"/>
      <circle cx="950" cy="670" r="360"
        fill="none" stroke="#fffef9" stroke-width="2" opacity=".13"/>
      <text x="72" y="104" fill="#c59a38"
        font-family="Arial, sans-serif" font-size="25"
        font-weight="700" letter-spacing="7">INTERVIEW</text>
      <text x="72" y="235" fill="#fffef9"
        font-family="Arial, sans-serif"
        font-size="${fontSize}" font-weight="700">
        ${titleMarkup}
      </text>
      <text x="72" y="500" fill="#d8d4ca"
        font-family="Arial, sans-serif" font-size="27">
        ${safeYear} · ${safeSource}
      </text>
      <text x="72" y="565" fill="#fffef9"
        font-family="Arial, sans-serif" font-size="23"
        font-weight="700" letter-spacing="5">
        DAVID TENNANT ARCHIVE
      </text>
    </svg>
  `;

  return sharp(Buffer.from(svg))
    .webp({ quality: 84, effort: 4 })
    .toBuffer();
}

export async function GET(
  _request: Request,
  { params }: InterviewImageRouteProps,
) {
  const { slug } = await params;
  const interview = getPublishedInterviews().find(
    (item) => item.slug === slug,
  );

  if (!interview) {
    return new Response("Not found", { status: 404 });
  }

  let bytes: Buffer;
  try {
    bytes = await createThumbnailCard(
      interview.thumbnailUrl,
    );
  } catch {
    bytes = await createInterviewFallback({
      title: interview.titleEn || interview.title,
      source: interview.source,
      year: interview.year,
    });
  }

  const body = toResponseArrayBuffer(bytes);

  return new Response(body, {
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(body.byteLength),
      "Cache-Control":
        "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function HEAD(
  request: Request,
  context: InterviewImageRouteProps,
) {
  const response = await GET(request, context);
  return new Response(null, {
    status: response.status,
    headers: response.headers,
  });
}
