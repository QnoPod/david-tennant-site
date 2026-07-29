import { redirect } from "next/navigation";

type LegacyCharacterPageProps = {
  params: Promise<{ slug: string }>;
};

/** 以前共有したキャラクター専用URLを、新しい共有URLへ引き継ぎます。 */
export default async function LegacyCharacterPage({
  params,
}: LegacyCharacterPageProps) {
  const { slug } = await params;
  redirect(`/characters/share/${encodeURIComponent(slug)}`);
}
