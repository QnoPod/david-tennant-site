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

async function fetchImage(
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

  const contentType =
    response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error("Character image is not an image");
  }

  return {
    bytes: await response.arrayBuffer(),
    contentType,
  };
}

/**
 * キャラクター画像を短いASCII URLから返します。
 * 元画像が取得できない場合も既定画像を返し、カード全体の失敗を防ぎます。
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

  let result;
  try {
    result = await fetchImage(
      character.image,
      request.url,
    );
  } catch {
    result = await fetchImage(
      "/images/default-character.jpg",
      request.url,
    );
  }

  return new Response(result.bytes, {
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control":
        "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
