import sharp from "sharp";
import {
  findWorkBySlug,
} from "../../../lib/archiveSlugs";
import {
  getBackdropUrl,
  getPosterUrl,
  getWorks,
} from "../../../lib/tmdb";
import {
  getDisplayTitle,
  getOriginalTitle,
} from "../../../lib/workPresentation";

type Props = {
  params: Promise<{ id: string }>;
};

export const runtime = "nodejs";
export const revalidate = 86400;

function toResponseArrayBuffer(
  bytes: Buffer,
): ArrayBuffer {
  const copy = new Uint8Array(
    bytes.byteLength,
  );
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

async function fetchImage(
  source: string,
  requestUrl: string,
) {
  if (!source) {
    throw new Error(
      "No work image source",
    );
  }

  const imageUrl = new URL(
    source,
    requestUrl,
  );
  const response = await fetch(
    imageUrl,
    {
      headers: {
        Accept:
          "image/avif,image/webp,image/png,image/jpeg,*/*",
        "User-Agent":
          "Mozilla/5.0 (compatible; DavidTennantArchive/1.0)",
      },
      next: {
        revalidate: 86400,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Work image request failed: ${response.status}`,
    );
  }

  return Buffer.from(
    await response.arrayBuffer(),
  );
}

async function createImageCard(
  source: string,
  requestUrl: string,
) {
  const input = await fetchImage(
    source,
    requestUrl,
  );

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
    })
    .toBuffer();
}

function wrapTitle(
  value: string,
  maxLength = 34,
) {
  const normalized = value
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.length <= maxLength) {
    return [normalized];
  }

  const words = normalized.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current
      ? `${current} ${word}`
      : word;

    if (
      next.length <= maxLength
      || !current
    ) {
      current = next;
      continue;
    }

    lines.push(current);
    current = word;

    if (lines.length === 2) {
      break;
    }
  }

  if (
    current
    && lines.length < 3
  ) {
    lines.push(current);
  }

  return lines.slice(0, 3);
}

async function createFallback({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  const lines = wrapTitle(
    title || "WORK FILE",
  );
  const fontSize =
    title.length > 70
      ? 46
      : title.length > 45
        ? 54
        : 64;
  const lineHeight = fontSize + 13;

  const titleMarkup = lines
    .map(
      (line, index) =>
        `<tspan x="72" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`,
    )
    .join("");

  const svg = `
    <svg width="1200" height="630"
      viewBox="0 0 1200 630"
      xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630"
        fill="#111116"/>
      <rect width="1200" height="18"
        fill="#c59a38"/>
      <circle cx="1040" cy="100" r="235"
        fill="none" stroke="#c59a38"
        stroke-width="3" opacity=".35"/>
      <text x="72" y="105"
        fill="#c59a38"
        font-family="Arial, sans-serif"
        font-size="25" font-weight="700"
        letter-spacing="7">WORK FILE</text>
      <text x="72" y="255"
        fill="#fffef9"
        font-family="Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="700">
        ${titleMarkup}
      </text>
      <text x="72" y="500"
        fill="#d8d4ca"
        font-family="Arial, sans-serif"
        font-size="28">
        ${escapeXml(subtitle)}
      </text>
      <text x="72" y="565"
        fill="#fffef9"
        font-family="Arial, sans-serif"
        font-size="23" font-weight="700"
        letter-spacing="5">
        DAVID TENNANT ARCHIVE
      </text>
    </svg>
  `;

  return sharp(Buffer.from(svg))
    .jpeg({
      quality: 88,
      progressive: true,
    })
    .toBuffer();
}

export async function GET(
  request: Request,
  { params }: Props,
) {
  const { id } = await params;
  const works = await getWorks();
  const work = findWorkBySlug(
    works,
    id,
  );

  if (!work) {
    return new Response(
      "Not found",
      { status: 404 },
    );
  }

  const backdrop =
    getBackdropUrl(
      work.backdrop_path,
      work.backdropUrl,
    );
  const poster =
    getPosterUrl(
      work.poster_path,
      work.posterUrl,
    );

  let bytes: Buffer;

  try {
    bytes = await createImageCard(
      backdrop || poster,
      request.url,
    );
  } catch {
    try {
      bytes = await createImageCard(
        poster,
        request.url,
      );
    } catch {
      bytes = await createFallback({
        title:
          getOriginalTitle(work)
          || getDisplayTitle(work),
        subtitle: getDisplayTitle(work),
      });
    }
  }

  const body =
    toResponseArrayBuffer(bytes);

  return new Response(body, {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length":
        String(body.byteLength),
      "Content-Disposition":
        'inline; filename="work-card.jpg"',
      "Cache-Control":
        "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options":
        "nosniff",
    },
  });
}

export async function HEAD(
  request: Request,
  context: Props,
) {
  const response = await GET(
    request,
    context,
  );

  return new Response(null, {
    status: response.status,
    headers: response.headers,
  });
}
