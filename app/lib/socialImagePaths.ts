export type PreparedSocialImageGroup =
  | "characters"
  | "works"
  | "interviews";

function stableHash(value: string) {
  let hash = 2166136261;
  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

/**
 * public/characters・public/works・public/interviews内の画像を、
 * ビルド時に生成した本物のJPEGへ置き換えます。
 */
export function getPreparedSocialImagePath(
  source: string | null | undefined,
  group: PreparedSocialImageGroup,
) {
  if (!source) return null;

  const expectedPrefix = `/${group}/`;
  if (!source.startsWith(expectedPrefix)) {
    return null;
  }

  return `/social/${group}/${stableHash(source)}.jpg`;
}
