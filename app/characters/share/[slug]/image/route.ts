import {
  findCharacterBySlug,
} from "../../../../lib/archiveSlugs";
import { getCharacters } from "../../../../lib/characters";
import { getWorks } from "../../../../lib/tmdb";

type CharacterImageRouteProps = {
  params: Promise<{ slug: string }>;
};

type SupportedImageType =
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp";

export const runtime = "nodejs";
export const revalidate = 86400;

function startsWith(
  bytes: Uint8Array,
  signature: readonly number[],
) {
  return signature.every(
    (value, index) => bytes[index] === value,
  );
}

/**
 * レスポンスヘッダーや拡張子ではなく、画像バイト列から実際の形式を判定します。
 * Chromeなどで保存したAVIFが.png/.jpg名になっていても誤判定しません。
 */
function detectSupportedImageType(
  buffer: ArrayBuffer,
): SupportedImageType | null {
  const bytes = new Uint8Array(buffer);

  if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return "image/jpeg";
  }
  if (
    startsWith(
      bytes,
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    )
  ) {
    return "image/png";
  }
  if (
    startsWith(bytes, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61])
    || startsWith(bytes, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
  ) {
    return "image/gif";
  }
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46])
    && String.fromCharCode(
      ...bytes.slice(8, 12),
    ) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

async function readSupportedImage(
  response: Response,
) {
  if (!response.ok) {
    throw new Error(
      `Character image request failed: ${response.status}`,
    );
  }

  const bytes = await response.arrayBuffer();
  const contentType = detectSupportedImageType(bytes);
  if (!contentType) {
    throw new Error(
      "Character image format is not supported by X",
    );
  }

  return { bytes, contentType };
}

async function fetchOriginalImage(
  source: string,
  requestUrl: string,
) {
  const imageUrl = new URL(source, requestUrl);
  const response = await fetch(imageUrl, {
    next: { revalidate: 86400 },
  });
  return readSupportedImage(response);
}

/**
 * AVIFなどXがカード画像として扱えない形式は、
 * Next.jsの画像最適化を使ってWebPへ変換します。
 */
async function fetchOptimizedImage(
  source: string,
  requestUrl: string,
) {
  const requestOrigin = new URL(requestUrl).origin;
  const optimizerUrl = new URL(
    "/_next/image",
    requestOrigin,
  );
  optimizerUrl.searchParams.set("url", source);
  optimizerUrl.searchParams.set("w", "1200");
  optimizerUrl.searchParams.set("q", "82");

  const response = await fetch(optimizerUrl, {
    headers: {
      Accept: "image/webp,image/png,image/jpeg",
    },
    next: { revalidate: 86400 },
  });
  return readSupportedImage(response);
}

async function resolveCharacterImage(
  source: string,
  requestUrl: string,
) {
  try {
    return await fetchOriginalImage(
      source,
      requestUrl,
    );
  } catch {
    try {
      return await fetchOptimizedImage(
        source,
        requestUrl,
      );
    } catch {
      return fetchOriginalImage(
        "/images/default-character.jpg",
        requestUrl,
      );
    }
  }
}

/**
 * キャラクター画像を短いASCII URLから返します。
 * 拡張子と実データが違う画像も変換し、最終的に必ずX対応形式を返します。
 */
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

  const result = await resolveCharacterImage(
    character.image,
    request.url,
  );

  return new Response(result.bytes, {
    headers: {
      "Content-Type": result.contentType,
      "Content-Length": String(result.bytes.byteLength),
      "Cache-Control":
        "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
      Vary: "Accept",
    },
  });
}

/** Xの事前確認でHEADが使われても、画像形式とキャッシュ情報を返します。 */
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
