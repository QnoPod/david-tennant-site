import {
  findWorkBySlug,
} from "../../../../lib/archiveSlugs";
import {
  getBackdropUrl,
  getPosterUrl,
  getWorks,
} from "../../../../lib/tmdb";

type WorkImageRouteProps = {
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
 * 拡張子やContent-Typeではなく、画像のバイト列から実形式を判定します。
 * .jpg/.png名で保存されたAVIFも、X対応画像として誤って返しません。
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
      `Work image request failed: ${response.status}`,
    );
  }

  const bytes = await response.arrayBuffer();
  const contentType = detectSupportedImageType(bytes);
  if (!contentType) {
    throw new Error(
      "Work image format is not supported by X",
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
 * AVIFなどX非対応の画像は、Next.jsの画像最適化でWebPへ変換します。
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

async function resolveWorkImage(
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
      // 最後はサイト共通の1200×630 PNGを返します。
      return fetchOriginalImage(
        "/opengraph-image",
        requestUrl,
      );
    }
  }
}

/**
 * 作品画像を短いASCII URLから返し、最終的に必ずX対応形式へ整えます。
 */
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
  const result = await resolveWorkImage(
    imageSource,
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

/** XがHEADで画像を確認する場合にも、同じ形式情報を返します。 */
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
