import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  getPublishedInterviews,
} from "../../../data/interviews/catalog";

type InterviewCardRouteProps = {
  params: Promise<{ slug: string }>;
};

export const runtime = "nodejs";
export const revalidate = 86400;

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
  const normalized = value
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return ["INTERVIEW"];

  const words = normalized.split(" ");
  const lines: string[] = [];

  if (words.length === 1) {
    for (
      let index = 0;
      index < normalized.length
        && lines.length < maxLines;
      index += maxCharacters
    ) {
      lines.push(
        normalized.slice(
          index,
          index + maxCharacters,
        ),
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
    if (lines.length >= maxLines - 1) {
      break;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  return lines;
}

async function readImageSource(
  source: string,
) {
  if (source.startsWith("/") && !source.startsWith("//")) {
    const relative = decodeURIComponent(source)
      .replace(/^\/+/, "");
    if (!relative || relative.includes("..")) {
      throw new Error("Invalid local image path");
    }
    return readFile(
      path.join(process.cwd(), "public", relative),
    );
  }

  const response = await fetch(source, {
    headers: {
      Accept: "image/avif,image/webp,image/png,image/jpeg,*/*",
      "User-Agent":
        "Mozilla/5.0 (compatible; DavidTennantArchive/1.0)",
    },
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    throw new Error(
      `Interview image request failed: ${response.status}`,
    );
  }

  return Buffer.from(await response.arrayBuffer());
}

async function createInterviewCard(
  source: string,
) {
  const input = await readImageSource(source);

  return sharp(input, {
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
    .flatten({
      background: {
        r: 17,
        g: 17,
        b: 22,
      },
    })
    .jpeg({
      quality: 88,
      progressive: true,
      mozjpeg: true,
    })
    .toBuffer();
}

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

  const svg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630"
      xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#111116"/>
      <rect width="1200" height="18" fill="#c59a38"/>
      <circle cx="1040" cy="90" r="245"
        fill="none" stroke="#c59a38"
        stroke-width="3" opacity=".36"/>
      <text x="72" y="104" fill="#c59a38"
        font-family="Arial, sans-serif"
        font-size="25" font-weight="700"
        letter-spacing="7">INTERVIEW</text>
      <text x="72" y="235" fill="#fffef9"
        font-family="Arial, sans-serif"
        font-size="${fontSize}" font-weight="700">
        ${titleMarkup}
      </text>
      <text x="72" y="500" fill="#d8d4ca"
        font-family="Arial, sans-serif"
        font-size="27">
        ${escapeXml(year)} · ${escapeXml(source)}
      </text>
      <text x="72" y="565" fill="#fffef9"
        font-family="Arial, sans-serif"
        font-size="23" font-weight="700"
        letter-spacing="5">DAVID TENNANT ARCHIVE</text>
    </svg>
  `;

  return sharp(Buffer.from(svg))
    .jpeg({
      quality: 88,
      progressive: true,
      mozjpeg: true,
    })
    .toBuffer();
}

export async function GET(
  _request: Request,
  { params }: InterviewCardRouteProps,
) {
  const { slug } = await params;
  const interview = getPublishedInterviews()
    .find((item) => item.slug === slug);

  if (!interview) {
    return new Response("Not found", {
      status: 404,
    });
  }

  let bytes: Buffer;
  try {
    bytes = await createInterviewCard(
      interview.thumbnailUrl,
    );
  } catch {
    bytes = await createInterviewFallback({
      title:
        interview.titleEn
        || interview.title,
      source: interview.source,
      year: interview.year,
    });
  }

  const body = toResponseArrayBuffer(bytes);

  return new Response(body, {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(body.byteLength),
      "Content-Disposition":
        'inline; filename="interview-card.jpg"',
      "Cache-Control":
        "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function HEAD(
  request: Request,
  context: InterviewCardRouteProps,
) {
  const response = await GET(request, context);
  return new Response(null, {
    status: response.status,
    headers: response.headers,
  });
}
