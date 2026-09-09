"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { markEnteredViaSplash } from "@/lib/entry-guard";

export default function AppStartPage() {
  const router = useRouter();
  const [showTitle, setShowTitle] = useState(false);

  useEffect(() => {
    const t1 = window.setTimeout(() => setShowTitle(true), 1000);
    const t2 = window.setTimeout(() => {
      markEnteredViaSplash();
      router.push("/games/game1");
    }, 2500);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [router]);

  return (
    <div className="flex h-[100dvh] w-full touch-none items-center justify-center overflow-hidden bg-black">
      <img
        src="/logos/l01.png"
        alt="hiro games"
        className={`w-2/3 max-w-xs transition-opacity duration-[800ms] ${
          showTitle ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
