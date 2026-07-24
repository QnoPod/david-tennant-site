const GITHUB_REPOSITORY = "QnoPod/david-tennant-site";
const GITHUB_API_VERSION = "2026-03-10";
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;

type ReportMode = "correction" | "contact";

type ReportPayload = {
  mode?: ReportMode;
  targetType?: string;
  targetTitle?: string;
  targetKey?: string;
  sourceUrl?: string;
  category?: string;
  message?: string;
  suggestedCorrection?: string;
  evidenceUrl?: string;
  notes?: string;
  pageUrl?: string;
  website?: string;
  startedAt?: number;
};

type GitHubIssueResponse = {
  number?: number;
  html_url?: string;
  message?: string;
};

const requestHistory = new Map<string, number[]>();

function cleanText(
  value: unknown,
  maximumLength: number,
) {
  return typeof value === "string"
    ? value.trim().slice(0, maximumLength)
    : "";
}

function cleanUrl(value: unknown) {
  const text = cleanText(value, 1000);
  if (!text) return "";

  try {
    const url = new URL(text);
    return ["http:", "https:"].includes(url.protocol)
      ? url.toString()
      : "";
  } catch {
    return "";
  }
}

function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim()
    || request.headers.get("x-real-ip")
    || ""
  );
}

function isRateLimited(ip: string) {
  if (!ip) return false;

  const now = Date.now();
  const recent = (requestHistory.get(ip) || [])
    .filter((timestamp) =>
      now - timestamp < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestHistory.set(ip, recent);
    return true;
  }

  recent.push(now);
  requestHistory.set(ip, recent);

  // Serverlessインスタンスが長時間残った場合の簡易的な掃除です。
  if (requestHistory.size > 500) {
    for (const [key, timestamps] of requestHistory) {
      const active = timestamps.filter((timestamp) =>
        now - timestamp < RATE_LIMIT_WINDOW_MS);
      if (active.length) requestHistory.set(key, active);
      else requestHistory.delete(key);
    }
  }

  return false;
}

function hasSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const forwardedHost =
    request.headers.get("x-forwarded-host")
    || request.headers.get("host");

  if (!origin || !forwardedHost) return true;

  try {
    return new URL(origin).host === forwardedHost;
  } catch {
    return false;
  }
}

function buildIssueBody(payload: ReportPayload) {
  const isContact = payload.mode === "contact";
  const targetType = cleanText(payload.targetType, 120);
  const targetTitle = cleanText(payload.targetTitle, 240);
  const targetKey = cleanText(payload.targetKey, 200);
  const category = cleanText(payload.category, 120);
  const message = cleanText(payload.message, 4000);
  const suggestedCorrection = cleanText(
    payload.suggestedCorrection,
    4000,
  );
  const notes = cleanText(payload.notes, 2000);
  const pageUrl = cleanUrl(payload.pageUrl);
  const sourceUrl = cleanUrl(payload.sourceUrl);
  const evidenceUrl = cleanUrl(payload.evidenceUrl);

  const titlePrefix = isContact
    ? "お問い合わせ"
    : "情報修正";
  const issueTitle = `[${titlePrefix}] ${targetType}: ${targetTitle}`
    .slice(0, 180);

  const issueBody = [
    "## 対象",
    `- 種類: ${targetType}`,
    `- 名称: ${targetTitle}`,
    targetKey ? `- 管理キー: ${targetKey}` : "",
    pageUrl ? `- サイト内ページ: ${pageUrl}` : "",
    sourceUrl ? `- 現在の取得元: ${sourceUrl}` : "",
    "",
    isContact ? "## 連絡の種類" : "## 修正する項目",
    category || "未選択",
    "",
    isContact
      ? "## お問い合わせ・ご連絡内容"
      : "## 誤っている箇所・内容",
    message,
    "",
    isContact
      ? "## 希望する対応・提案"
      : "## 正しいと思われる内容",
    suggestedCorrection || "未記入",
    "",
    "## 参考URL",
    evidenceUrl || "未記入",
    "",
    "## 補足",
    notes || "なし",
    "",
    "---",
    isContact
      ? "このIssueはDavid Tennant ArchiveのABOUTページにあるアカウント不要の連絡フォームから作成されました。"
      : "このIssueはDavid Tennant Archiveのアカウント不要の情報修正フォームから作成されました。",
  ].filter(Boolean).join("\n");

  return {
    issueTitle,
    issueBody,
    valid: Boolean(targetType && targetTitle && message),
  };
}

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return Response.json(
      {
        ok: false,
        message: "この送信元からは受け付けられません。",
      },
      { status: 403 },
    );
  }

  if (!request.headers
    .get("content-type")
    ?.toLowerCase()
    .includes("application/json")) {
    return Response.json(
      {
        ok: false,
        message: "送信形式が正しくありません。",
      },
      { status: 415 },
    );
  }

  let payload: ReportPayload;
  try {
    payload = await request.json() as ReportPayload;
  } catch {
    return Response.json(
      {
        ok: false,
        message: "送信内容を読み取れませんでした。",
      },
      { status: 400 },
    );
  }

  // 見えない入力欄へ値を入れる単純なボットは、
  // GitHubへ送らず成功レスポンスだけ返します。
  if (cleanText(payload.website, 100)) {
    return Response.json({ ok: true });
  }

  const startedAt = Number(payload.startedAt);
  if (
    Number.isFinite(startedAt)
    && Date.now() - startedAt < 800
  ) {
    return Response.json(
      {
        ok: false,
        message: "少し時間をおいてから送信してください。",
      },
      { status: 429 },
    );
  }

  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return Response.json(
      {
        ok: false,
        message:
          "短時間に送信できる回数を超えました。10分ほど待ってから再度お試しください。",
      },
      { status: 429 },
    );
  }

  const { issueTitle, issueBody, valid } =
    buildIssueBody(payload);

  if (!valid) {
    return Response.json(
      {
        ok: false,
        message: "必須項目を入力してください。",
      },
      { status: 400 },
    );
  }

  const token = process.env.GITHUB_REPORT_TOKEN;
  if (!token) {
    console.error(
      "GITHUB_REPORT_TOKEN is not configured.",
    );
    return Response.json(
      {
        ok: false,
        message:
          "現在、報告フォームの送信設定が完了していません。",
      },
      { status: 503 },
    );
  }

  const githubResponse = await fetch(
    `https://api.github.com/repos/${GITHUB_REPOSITORY}/issues`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
        "User-Agent": "david-tennant-archive-report-form",
      },
      body: JSON.stringify({
        title: issueTitle,
        body: issueBody,
      }),
      cache: "no-store",
    },
  );

  const githubData =
    await githubResponse.json() as GitHubIssueResponse;

  if (!githubResponse.ok) {
    console.error(
      "GitHub issue creation failed:",
      githubResponse.status,
      githubData.message,
    );
    return Response.json(
      {
        ok: false,
        message:
          "管理票を作成できませんでした。時間をおいて再度お試しください。",
      },
      { status: 502 },
    );
  }

  return Response.json({
    ok: true,
    issueUrl: githubData.html_url,
    issueNumber: githubData.number,
  });
}
