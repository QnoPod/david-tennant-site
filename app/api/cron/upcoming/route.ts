import { revalidatePath, revalidateTag } from "next/cache";
import { getUpcomingWorks } from "../../../lib/upcoming";

/**
 * Vercel Cronから1日1回呼び出し、未公開作品の取得キャッシュを更新します。
 * Vercelの環境変数CRON_SECRETとAuthorizationヘッダーが一致した場合だけ実行します。
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // 監視結果の小さなキャッシュだけを失効させ、巨大な取得元HTMLは保存しません。
  revalidateTag("upcoming-article-monitor", { expire: 0 });
  const works = await getUpcomingWorks();
  // 翌日のアクセスで最新のスクレイピング結果を再生成できるよう、ページを更新対象にします。
  revalidatePath("/upcoming");
  return Response.json({
    ok: true,
    count: works.length,
    checkedAt: new Date().toISOString(),
  });
}
