import { redirect } from "next/navigation";

type LegacyWorkPageProps = {
  params: Promise<{ slug: string }>;
};

/** 以前共有した作品専用URLを、新しい共有URLへ引き継ぎます。 */
export default async function LegacyWorkPage({
  params,
}: LegacyWorkPageProps) {
  const { slug } = await params;
  redirect(`/works/share/${encodeURIComponent(slug)}`);
}
