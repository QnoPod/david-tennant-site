"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ShareWorkRedirect({
  target,
  title,
}: {
  target: string;
  title: string;
}) {
  const router = useRouter();

  useEffect(() => {
    router.replace(target);
  }, [router, target]);

  return (
    <main
      id="main-content"
      className="archive-detail-page"
    >
      <div className="shell">
        <p className="eyebrow">WORK FILE</p>
        <h1>{title}</h1>
        <p>作品の詳細を開いています。</p>
        <Link className="text-link" href={target}>
          自動で開かない場合はこちら →
        </Link>
      </div>
    </main>
  );
}
