/**
 * 検索・絞り込み条件をURLへ保存するための共通関数です。
 * 空値と初期値はURLから省き、共有しやすい短いURLを保ちます。
 */
export type SearchParamsReader = Pick<URLSearchParams, "get" | "getAll" | "has" | "toString">;

export function readEnumParam<T extends string>(
  params: SearchParamsReader,
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const value = params.get(key);
  return value && allowed.includes(value as T) ? value as T : fallback;
}

export function readBooleanParam(params: SearchParamsReader, key: string) {
  return ["1", "true", "yes", "on"].includes((params.get(key) || "").toLowerCase());
}

export function readListParam(params: SearchParamsReader, key: string) {
  return [...new Set(params.getAll(key).map((value) => value.trim()).filter(Boolean))];
}

export function sameStringList(left: readonly string[], right: readonly string[]) {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

export function setStringParam(
  params: URLSearchParams,
  key: string,
  value: string,
  defaultValue = "",
) {
  const normalized = value.trim();
  if (!normalized || normalized === defaultValue) params.delete(key);
  else params.set(key, normalized);
}

export function setBooleanParam(params: URLSearchParams, key: string, value: boolean) {
  if (value) params.set(key, "1");
  else params.delete(key);
}

export function setListParam(
  params: URLSearchParams,
  key: string,
  values: readonly string[],
) {
  params.delete(key);
  for (const value of [...new Set(values.map((item) => item.trim()).filter(Boolean))]) {
    params.append(key, value);
  }
}

export function buildSearchUrl(pathname: string, params: URLSearchParams) {
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
