import { redirect } from "next/navigation";

type WorkRedirectPageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * 以前共有した専用ページURLも、
 * WORKS一覧で該当作品の詳細を開いた状態へ引き継ぎます。
 */
export default async function WorkRedirectPage({
  params,
}: WorkRedirectPageProps) {
  const { slug } = await params;
  redirect(`/works?detail=${encodeURIComponent(slug)}`);
}
