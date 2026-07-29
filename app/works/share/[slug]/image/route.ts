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

type WorkImageRouteProps = {
  params: Promise<{ slug: string }>;
};

export const runtime = "nodejs";
export const revalidate = 86400;

/**
 * Node.jsのBufferをWeb標準Responseが確実に受け取れるArrayBufferへコピーします。
 * TypeScript 5.9ではBuffer<ArrayBufferLike>をBodyInitへ直接渡せません。
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

async function fetchSourceImage(
  source: string,
  requestUrl: string,
) {
  const imageUrl = new URL(source, requestUrl);
  const response = await fetch(imageUrl, {
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    throw new Error(
      `Work image request failed: ${response.status}`,
    );
  }

  return Buffer.from(await response.arrayBuffer());
}

/**
 * TMDB画像・ローカル画像・拡張子偽装AVIFを、
 * すべて1200×630のX対応WebPへ統一します。
 */
async function createWorkJpeg(
  source: string,
  requestUrl: string,
) {
  const input = await fetchSourceImage(source, requestUrl);

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

/** 元画像が欠落・破損している場合だけ使う、作品固有の代替カードです。 */
async function createWorkFallback({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  const safeTitle = escapeXml(title || "WORK FILE");
  const safeSubtitle = escapeXml(
    subtitle || "DAVID TENNANT ARCHIVE",
  );
  const svg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630"
      xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#111116"/>
      <rect x="0" y="0" width="1200" height="18" fill="#c59a38"/>
      <circle cx="1040" cy="100" r="235"
        fill="none" stroke="#c59a38" stroke-width="3" opacity=".35"/>
      <circle cx="960" cy="650" r="350"
        fill="none" stroke="#fffef9" stroke-width="2" opacity=".13"/>
      <text x="72" y="105" fill="#c59a38"
        font-family="Arial, sans-serif" font-size="25"
        font-weight="700" letter-spacing="7">WORK FILE</text>
      <text x="72" y="305" fill="#fffef9"
        font-family="Arial, sans-serif" font-size="68"
        font-weight="700">${safeTitle}</text>
      <text x="72" y="375" fill="#d8d4ca"
        font-family="Arial, sans-serif" font-size="30">${safeSubtitle}</text>
      <text x="72" y="560" fill="#fffef9"
        font-family="Arial, sans-serif" font-size="24"
        font-weight="700" letter-spacing="5">DAVID TENNANT ARCHIVE</text>
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
  { params }: WorkImageRouteProps,
) {
  const { slug } = await params;
  const works = await getWorks();
  const work = findWorkBySlug(works, slug);

  if (!work) {
    return new Response("Not found", { status: 404 });
  }

  const imageSource =
    getBackdropUrl(work.backdrop_path, work.backdropUrl)
    || getPosterUrl(work.poster_path, work.posterUrl);

  let bytes: Buffer;
  try {
    bytes = await createWorkJpeg(
      imageSource,
      request.url,
    );
  } catch {
    bytes = await createWorkFallback({
      title: getOriginalTitle(work) || getDisplayTitle(work),
      subtitle: getDisplayTitle(work),
    });
  }

  const body = toResponseArrayBuffer(bytes);

  return new Response(body, {
    headers: {
      "Content-Type": "image/jpeg",
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
  context: WorkImageRouteProps,
) {
  const response = await GET(request, context);
  return new Response(null, {
    status: response.status,
    headers: response.headers,
  });
}
