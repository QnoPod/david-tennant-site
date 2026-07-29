import sharp from "sharp";
import {
  findCharacterBySlug,
} from "../../../../lib/archiveSlugs";
import { getCharacters } from "../../../../lib/characters";
import { getWorks } from "../../../../lib/tmdb";

type CharacterImageRouteProps = {
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
      `Character image request failed: ${response.status}`,
    );
  }

  return Buffer.from(await response.arrayBuffer());
}

/**
 * 拡張子やContent-Typeに関係なく、実画像をsharpで読み込み、
 * Xが確実に扱える正方形WebPへ変換します。
 */
async function createCharacterWebp(
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
      height: 1200,
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
 * 元画像自体が欠落・破損している場合だけ使う、
 * キャラクター固有の代替カードです。
 */
async function createCharacterFallback({
  name,
  workTitle,
}: {
  name: string;
  workTitle: string;
}) {
  const safeName = escapeXml(name || "CHARACTER FILE");
  const safeWork = escapeXml(workTitle || "DAVID TENNANT ARCHIVE");
  const svg = `
    <svg width="1200" height="1200" viewBox="0 0 1200 1200"
      xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="1200" fill="#111116"/>
      <rect x="0" y="0" width="1200" height="24" fill="#c59a38"/>
      <circle cx="990" cy="190" r="250"
        fill="none" stroke="#c59a38" stroke-width="3" opacity=".35"/>
      <circle cx="920" cy="1040" r="330"
        fill="none" stroke="#fffef9" stroke-width="2" opacity=".13"/>
      <text x="84" y="150" fill="#c59a38"
        font-family="Arial, sans-serif" font-size="34"
        font-weight="700" letter-spacing="8">CHARACTER FILE</text>
      <text x="84" y="505" fill="#fffef9"
        font-family="Arial, sans-serif" font-size="86"
        font-weight="700">${safeName}</text>
      <text x="84" y="590" fill="#d8d4ca"
        font-family="Arial, sans-serif" font-size="38">${safeWork}</text>
      <text x="84" y="1080" fill="#fffef9"
        font-family="Arial, sans-serif" font-size="30"
        font-weight="700" letter-spacing="5">DAVID TENNANT ARCHIVE</text>
    </svg>
  `;

  return sharp(Buffer.from(svg))
    .webp({ quality: 84, effort: 4 })
    .toBuffer();
}

export async function GET(
  request: Request,
  { params }: CharacterImageRouteProps,
) {
  const { slug } = await params;
  const works = await getWorks();
  const character = findCharacterBySlug(
    getCharacters(works),
    slug,
  );

  if (!character) {
    return new Response("Not found", { status: 404 });
  }

  let bytes: Buffer;
  try {
    bytes = await createCharacterWebp(
      character.image,
      request.url,
    );
  } catch {
    bytes = await createCharacterFallback({
      name: character.englishName || character.name,
      workTitle: character.displayWorkTitle,
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
  context: CharacterImageRouteProps,
) {
  const response = await GET(request, context);
  return new Response(null, {
    status: response.status,
    headers: response.headers,
  });
}
