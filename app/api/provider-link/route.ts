const STREAMING_API = "https://api.movieofthenight.com/v4";
const JUSTWATCH_GRAPHQL = "https://apis.justwatch.com/graphql";
const REQUEST_TIMEOUT_MS = 4_500;
const RESOLVE_TIMEOUT_MS = 10_000;

type StreamingOption = {
  type?: string;
  link?: string;
  service?: { name?: string };
  addon?: { name?: string };
};

type StreamingShow = {
  streamingOptions?: Record<string, StreamingOption[]>;
};

type JustWatchOffer = {
  monetizationType?: string;
  standardWebURL?: string | null;
  package?: {
    clearName?: string;
    shortName?: string;
    technicalName?: string;
  } | null;
};

type JustWatchNode = {
  objectType?: string;
  objectId?: number;
  content?: {
    title?: string;
    fullPath?: string;
    originalReleaseYear?: number | null;
  } | null;
  offers?: JustWatchOffer[] | null;
};

type JustWatchSearchResponse = {
  data?: {
    popularTitles?: {
      edges?: Array<{ node?: JustWatchNode | null }>;
    } | null;
  };
  errors?: Array<{ message?: string }>;
};

function canonicalProviderName(name: string) {
  const trimmed = name.trim();
  if (/BS10|STAR CHANNEL/i.test(trimmed)) return "BS10プレミアム for Prime Video";
  if (/^U-?NEXT$/i.test(trimmed)) return "U-NEXT";
  if (/^(?:Amazon Prime Video(?: with Ads)?|Prime Video)$/i.test(trimmed)) {
    return "Amazon Prime Video";
  }
  if (/^Disney(?:\s*Plus|\+)$/i.test(trimmed)) return "Disney Plus";
  if (/^Apple TV(?:\s*Plus|\+)$/i.test(trimmed)) return "Apple TV Plus";
  return trimmed;
}

function providerKey(name: string) {
  const normalized = canonicalProviderName(name)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s・+_\-]/g, "");

  if (normalized === "amazonprimevideo") return "amazonprimevideo";
  if (normalized === "unext") return "unext";
  if (normalized.includes("bs10") || normalized.includes("starchannel")) {
    return "bs10-prime-channel";
  }
  return normalized;
}

function optionProviderName(option: StreamingOption) {
  const serviceName = option.service?.name?.trim() ?? "";
  const addonName = option.addon?.name?.trim();

  if (!addonName) return canonicalProviderName(serviceName);

  if (/prime video|amazon/i.test(serviceName)) {
    return canonicalProviderName(`${addonName} Amazon Channel`);
  }
  if (/apple tv/i.test(serviceName)) {
    return canonicalProviderName(`${addonName} Apple TV Channel`);
  }
  return canonicalProviderName(addonName);
}

function isSafeHttpUrl(value?: string | null) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function fetchWithTimeout(url: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Streaming Availability API が利用できる場合はTMDB IDで作品を一意に指定します。
 * タイトル検索をしないため、別作品へ誤転送されません。
 */
async function findStreamingApiLink(
  mediaType: string,
  id: string,
  providerName: string,
) {
  const apiKey = process.env.STREAMING_AVAILABILITY_API_KEY?.trim();
  if (!apiKey || !["movie", "tv"].includes(mediaType) || !/^\d+$/.test(id)) {
    return undefined;
  }

  try {
    const tmdbId = `${mediaType}/${id}`;
    const url = new URL(`${STREAMING_API}/shows/${tmdbId}`);
    url.searchParams.set("country", "jp");
    url.searchParams.set("series_granularity", "show");

    const response = await fetchWithTimeout(url.toString(), {
      headers: { "X-API-Key": apiKey, Accept: "application/json" },
    });
    if (!response.ok) return undefined;

    const data = await response.json() as StreamingShow;
    const options = data.streamingOptions?.jp ?? data.streamingOptions?.JP ?? [];
    const wanted = providerKey(providerName);

    const candidates = options
      .filter((option) =>
        ["subscription", "addon"].includes(option.type ?? "")
        && providerKey(optionProviderName(option)) === wanted
        && isSafeHttpUrl(option.link))
      .sort((a, b) => {
        // 通常のサブスクを追加チャンネルより先に採用します。
        const rank = (option: StreamingOption) => option.type === "subscription" ? 0 : 1;
        return rank(a) - rank(b);
      });

    return candidates[0]?.link;
  } catch {
    return undefined;
  }
}

function normalizeTitle(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\p{P}\p{S}\s]/gu, "");
}

function titleMatchScore(candidate: string, references: string[]) {
  const candidateKey = normalizeTitle(candidate);
  if (!candidateKey) return 0;

  let best = 0;
  for (const reference of references) {
    const referenceKey = normalizeTitle(reference);
    if (!referenceKey) continue;

    if (candidateKey === referenceKey) {
      best = Math.max(best, 100);
      continue;
    }

    const shorter = candidateKey.length <= referenceKey.length
      ? candidateKey
      : referenceKey;
    const longer = candidateKey.length > referenceKey.length
      ? candidateKey
      : referenceKey;
    const ratio = shorter.length / Math.max(longer.length, 1);

    // 「Broadchurch」と「Broadchurch 〜...〜」のような表記差だけを許可。
    if (shorter.length >= 4 && longer.includes(shorter) && ratio >= 0.72) {
      best = Math.max(best, 70 + Math.round(ratio * 20));
    }
  }
  return best;
}

function expectedObjectType(mediaType: string) {
  return mediaType === "movie" ? "MOVIE" : mediaType === "tv" ? "SHOW" : undefined;
}

function offerPriority(type?: string) {
  switch ((type ?? "").toUpperCase()) {
    case "FLATRATE": return 0;
    case "FLATRATE_AND_BUY": return 1;
    case "ADS": return 2;
    default: return 99;
  }
}

const JUSTWATCH_SEARCH_QUERY = `
query GetSuggestedTitles(
  $country: Country!
  $language: Language!
  $first: Int!
  $filter: TitleFilter
) {
  popularTitles(country: $country, first: $first, filter: $filter) {
    edges {
      node {
        objectType
        objectId
        ... on Movie {
          content(country: $country, language: $language) {
            title
            fullPath
            originalReleaseYear
          }
          offers(country: $country, platform: WEB, filter: { bestOnly: false }) {
            monetizationType
            standardWebURL
            package {
              clearName
              shortName
              technicalName
            }
          }
        }
        ... on Show {
          content(country: $country, language: $language) {
            title
            fullPath
            originalReleaseYear
          }
          offers(country: $country, platform: WEB, filter: { bestOnly: false }) {
            monetizationType
            standardWebURL
            package {
              clearName
              shortName
              technicalName
            }
          }
        }
      }
    }
  }
}`;

async function searchJustWatch(
  searchQuery: string,
  mediaType: string,
) {
  const objectType = expectedObjectType(mediaType);
  if (!objectType) return [] as JustWatchNode[];

  try {
    const response = await fetchWithTimeout(JUSTWATCH_GRAPHQL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; DavidTennantArchive/1.0)",
      },
      body: JSON.stringify({
        operationName: "GetSuggestedTitles",
        variables: {
          country: "JP",
          // 英語表示にするとTMDBのoriginal_title / original_nameと照合しやすい。
          language: "en",
          first: 10,
          filter: {
            searchQuery,
            objectTypes: [objectType],
          },
        },
        query: JUSTWATCH_SEARCH_QUERY,
      }),
    });
    if (!response.ok) return [] as JustWatchNode[];

    const data = await response.json() as JustWatchSearchResponse;
    if (data.errors?.length) return [] as JustWatchNode[];

    return (data.data?.popularTitles?.edges ?? [])
      .map((edge) => edge.node)
      .filter((node): node is JustWatchNode => Boolean(node));
  } catch {
    return [] as JustWatchNode[];
  }
}

/**
 * JustWatchの検索HTMLをスクレイピングせず、GraphQLの検索結果を
 * 作品種別・タイトル・公開年で照合してから、その作品に紐づくofferだけを使います。
 * 一致を確認できない場合はURLを返さず、別作品への誤転送を防ぎます。
 */
async function findJustWatchLink(
  mediaType: string,
  titles: string[],
  releaseYear: string,
  providerName: string,
) {
  const uniqueTitles = [...new Set(titles.map((title) => title.trim()).filter(Boolean))]
    .slice(0, 2);
  if (!uniqueTitles.length) return undefined;

  const expectedType = expectedObjectType(mediaType);
  if (!expectedType) return undefined;
  const wantedProvider = providerKey(providerName);
  const expectedYear = /^\d{4}$/.test(releaseYear) ? Number(releaseYear) : undefined;

  // 原題・邦題を並列検索。検索ページ中の無関係な人気作品は採用しません。
  const resultGroups = await Promise.all(
    uniqueTitles.map((title) => searchJustWatch(title, mediaType)),
  );

  const nodes = new Map<string, JustWatchNode>();
  for (const node of resultGroups.flat()) {
    const key = `${node.objectType ?? ""}:${node.objectId ?? node.content?.fullPath ?? ""}`;
    if (!nodes.has(key)) nodes.set(key, node);
  }

  const ranked = [...nodes.values()]
    .flatMap((node) => {
      if ((node.objectType ?? "").toUpperCase() !== expectedType) return [];
      const candidateTitle = node.content?.title?.trim() ?? "";
      const titleScore = titleMatchScore(candidateTitle, uniqueTitles);

      // タイトルが十分に一致しない候補は絶対に採用しない。
      if (titleScore < 70) return [];

      const candidateYear = node.content?.originalReleaseYear ?? undefined;
      if (
        expectedYear
        && candidateYear
        && Math.abs(candidateYear - expectedYear) > 1
      ) return [];

      const yearScore = expectedYear && candidateYear === expectedYear ? 30 : 0;
      return [{ node, score: titleScore + yearScore }];
    })
    .sort((a, b) => b.score - a.score);

  for (const { node } of ranked) {
    const offers = (node.offers ?? [])
      .filter((offer) =>
        offerPriority(offer.monetizationType) < 99
        && isSafeHttpUrl(offer.standardWebURL)
        && providerKey(offer.package?.clearName ?? "") === wantedProvider)
      .sort((a, b) => offerPriority(a.monetizationType) - offerPriority(b.monetizationType));

    const link = offers[0]?.standardWebURL;
    if (isSafeHttpUrl(link)) return link ?? undefined;
  }

  return undefined;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function loadingPage(requestUrl: URL, providerName: string, title: string) {
  const resolveUrl = new URL(requestUrl);
  resolveUrl.searchParams.set("resolve", "1");

  const safeProvider = escapeHtml(providerName);
  const safeTitle = escapeHtml(title);
  const resolveHref = JSON.stringify(resolveUrl.pathname + resolveUrl.search);

  return new Response(
    `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>配信ページを確認中</title>
  <style>
    :root { color-scheme: light dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
      background: #111;
      color: #f7f2ea;
    }
    main {
      width: min(560px, calc(100% - 32px));
      padding: 34px;
      border: 1px solid #5c3330;
      background: #181514;
    }
    .spinner {
      width: 34px;
      height: 34px;
      margin-bottom: 22px;
      border: 3px solid #5b5550;
      border-top-color: #fff;
      border-radius: 999px;
      animation: spin .8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h1 { margin: 0 0 12px; font-size: 22px; }
    p { margin: 7px 0; line-height: 1.7; color: #cfc7bf; }
    strong { color: #fff; }
    #error { color: #ffb7ae; }
    button {
      margin-top: 18px;
      padding: 10px 16px;
      border: 1px solid #aaa;
      background: transparent;
      color: inherit;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <main>
    <div class="spinner" id="spinner" aria-hidden="true"></div>
    <h1>配信ページを確認しています…</h1>
    <p><strong>${safeTitle}</strong></p>
    <p>${safeProvider} の作品ページを照合しています。</p>
    <p id="error" hidden></p>
    <button id="back" type="button" hidden onclick="window.close(); history.back();">戻る</button>
  </main>
  <script>
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ${RESOLVE_TIMEOUT_MS + 1500});
    fetch(${resolveHref}, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store"
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.url) {
          throw new Error(data.message || "作品ページを確認できませんでした。");
        }
        location.replace(data.url);
      })
      .catch((error) => {
        document.getElementById("spinner").hidden = true;
        const errorNode = document.getElementById("error");
        errorNode.hidden = false;
        errorNode.textContent = error.name === "AbortError"
          ? "確認に時間がかかっています。もう一度お試しください。"
          : error.message;
        document.getElementById("back").hidden = false;
      })
      .finally(() => clearTimeout(timeout));
  </script>
</body>
</html>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}

async function resolveProviderLink(
  mediaType: string,
  id: string,
  providerName: string,
  title: string,
  originalTitle: string,
  releaseYear: string,
) {
  const apiLink = await findStreamingApiLink(mediaType, id, providerName);
  if (apiLink && isSafeHttpUrl(apiLink)) {
    return { url: apiLink, source: "streaming-availability-api" };
  }

  // originalTitleを先にすることで英題の照合精度を上げます。
  const titles = [...new Set([originalTitle, title].filter(Boolean))];
  const justWatchLink = await findJustWatchLink(
    mediaType,
    titles,
    releaseYear,
    providerName,
  );
  if (justWatchLink && isSafeHttpUrl(justWatchLink)) {
    return { url: justWatchLink, source: "justwatch-graphql" };
  }

  return undefined;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const mediaType = requestUrl.searchParams.get("mediaType") ?? "";
  const id = requestUrl.searchParams.get("id") ?? "";
  const providerName = requestUrl.searchParams.get("provider")?.trim() ?? "";
  const title = requestUrl.searchParams.get("title")?.trim() ?? "";
  const originalTitle = requestUrl.searchParams.get("originalTitle")?.trim() ?? "";
  const releaseYear = requestUrl.searchParams.get("year")?.trim() ?? "";
  const isResolveRequest = requestUrl.searchParams.get("resolve") === "1";

  if (!providerName || !title) {
    if (isResolveRequest) {
      return json({ message: "作品または配信サービスの情報が不足しています。" }, 400);
    }
    return new Response("作品または配信サービスの情報が不足しています。", {
      status: 400,
    });
  }

  if (!isResolveRequest) {
    return loadingPage(requestUrl, providerName, title);
  }

  try {
    const result = await Promise.race([
      resolveProviderLink(
        mediaType,
        id,
        providerName,
        title,
        originalTitle,
        releaseYear,
      ),
      new Promise<undefined>((resolve) =>
        setTimeout(() => resolve(undefined), RESOLVE_TIMEOUT_MS),
      ),
    ]);

    if (result?.url) return json(result);

    return json(
      {
        message: `${providerName} の「${title}」作品ページを正確に特定できませんでした。誤った作品には転送しません。`,
      },
      404,
    );
  } catch {
    return json({ message: "配信ページの確認中にエラーが発生しました。" }, 500);
  }
}
