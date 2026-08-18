import { getConventionAppearances } from "../../../lib/comiconomicon";

/** GitHub Actionsへ、当日のコミコン取得・キャンセル判定結果を渡します。 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const events = await getConventionAppearances();
  return Response.json(
    { ok: true, events, generatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
