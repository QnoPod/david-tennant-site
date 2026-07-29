import type { Character, Work } from "./types";
import { getDisplayTitle } from "./workPresentation";

/** URLに使える短い英数字へ変換します。ID／ハッシュも含めるため、日本語名でも衝突しません。 */
function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

/** ブラウザとサーバーの両方で同じ結果になる、短い安定ハッシュです。 */
function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

/** 作品URLは媒体種別とIDを正本にし、タイトル変更後も解決できるようにします。 */
export function getWorkSlug(work: Work) {
  const sourceTitle =
    work.original_title
    || work.original_name
    || work.title
    || work.name
    || getDisplayTitle(work);
  const titleSlug = slugify(sourceTitle) || "work";
  return `${work.media_type}-${work.id}-${titleSlug}`;
}

export function findWorkBySlug(
  works: readonly Work[],
  slug: string,
) {
  const matched = slug.match(
    /^(movie|tv|stage)-(-?\d+)(?:-|$)/,
  );
  if (!matched) return undefined;

  const [, mediaType, idText] = matched;
  const id = Number(idText);
  return works.find(
    (work) =>
      work.media_type === mediaType
      && work.id === id,
  );
}

/**
 * Characterには共通の数値IDがないため、
 * 既存の一意キーから作るハッシュをURLの識別子にします。
 */
export function getCharacterSlug(character: Character) {
  const nameSlug = slugify(
    character.englishName || character.name,
  ) || "character";
  return `${nameSlug}-${stableHash(character.key)}`;
}

export function findCharacterBySlug(
  characters: readonly Character[],
  slug: string,
) {
  const exact = characters.find(
    (character) => getCharacterSlug(character) === slug,
  );
  if (exact) return exact;

  // 英語名の表記を後から直しても、キーが同じなら旧URLを維持します。
  const hash = slug.split("-").at(-1);
  return characters.find(
    (character) => stableHash(character.key) === hash,
  );
}

/** Xなどのリンクカードで使う、なるべく大きい作品画像を返します。 */
export function getWorkSocialImage(work: Work) {
  if (work.posterUrl) return work.posterUrl;
  return work.poster_path
    ? `https://image.tmdb.org/t/p/w780${work.poster_path}`
    : "/opengraph-image";
}

/** キャラクター画像はpublic配下のローカル画像をそのまま使用します。 */
export function getCharacterSocialImage(
  character: Character,
) {
  return character.image || "/images/default-character.jpg";
}
