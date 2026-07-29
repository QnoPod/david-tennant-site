import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  findWorkBySlug,
} from "../../../../lib/archiveSlugs";
import {
  getBackdropUrl,
  getPosterUrl,
  getWorks,
} from "../../../../lib/tmdb";
import {
  getDisplayTitle,
  getOriginalTitle,
} from "../../../../lib/workPresentation";

type WorkCardRouteProps = {
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
      `Work image request failed: ${response.status}`,
    );
  }

  return Buffer.from(await response.arrayBuffer());
}

async function createWorkCard(
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

async function createWorkFallback({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  const safeTitle = escapeXml(
    title || "WORK FILE",
  );
  const safeSubtitle = escapeXml(
    subtitle || "DAVID TENNANT ARCHIVE",
  );
  const svg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630"
      xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#111116"/>
      <rect width="1200" height="18" fill="#c59a38"/>
      <circle cx="1040" cy="100" r="235"
        fill="none" stroke="#c59a38"
        stroke-width="3" opacity=".35"/>
      <text x="72" y="110" fill="#c59a38"
        font-family="Arial, sans-serif"
        font-size="25" font-weight="700"
        letter-spacing="7">WORK FILE</text>
      <text x="72" y="310" fill="#fffef9"
        font-family="Arial, sans-serif"
        font-size="68" font-weight="700">${safeTitle}</text>
      <text x="72" y="385" fill="#d8d4ca"
        font-family="Arial, sans-serif"
        font-size="30">${safeSubtitle}</text>
      <text x="72" y="560" fill="#fffef9"
        font-family="Arial, sans-serif"
        font-size="24" font-weight="700"
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
  { params }: WorkCardRouteProps,
) {
  const { slug } = await params;
  const works = await getWorks();
  const work = findWorkBySlug(
    works,
    slug,
  );

  if (!work) {
    return new Response("Not found", {
      status: 404,
    });
  }

  const imageSource =
    getBackdropUrl(
      work.backdrop_path,
      work.backdropUrl,
    )
    || getPosterUrl(
      work.poster_path,
      work.posterUrl,
    );

  let bytes: Buffer;
  try {
    bytes = await createWorkCard(
      imageSource,
    );
  } catch {
    bytes = await createWorkFallback({
      title:
        getOriginalTitle(work)
        || getDisplayTitle(work),
      subtitle: getDisplayTitle(work),
    });
  }

  const body = toResponseArrayBuffer(bytes);

  return new Response(body, {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(body.byteLength),
      "Content-Disposition":
        'inline; filename="work-card.jpg"',
      "Cache-Control":
        "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function HEAD(
  request: Request,
  context: WorkCardRouteProps,
) {
  const response = await GET(request, context);
  return new Response(null, {
    status: response.status,
    headers: response.headers,
  });
}
