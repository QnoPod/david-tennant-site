import { getUpcomingWorks } from "../../../lib/upcoming";

/**
 * GitHub Actionsへ、手入力と当日の自動取得を統合したUPCOMING一覧を渡します。
 * 公開APIにはせず、VercelとGitHubに登録したCRON_SECRETが一致する場合だけ応答します。
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const works = await getUpcomingWorks();
  return Response.json(
    { ok: true, works, generatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
