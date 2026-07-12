import { searchInterviewSlugs } from "../../../data/interviews/loadInterview";

/** インタビュー一覧の本文検索専用API。検索結果は記事slugだけを返します。 */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  return Response.json({ slugs: await searchInterviewSlugs(query) });
}
