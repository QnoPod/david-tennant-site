"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ShareRedirect({
  target,
  title,
  eyebrow,
  message,
}: {
  target: string;
  title: string;
  eyebrow: string;
  message: string;
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
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{message}</p>
        <Link className="text-link" href={target}>
          自動で開かない場合はこちら →
        </Link>
      </div>
    </main>
  );
}
