"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AppStartPage() {
  const router = useRouter();
  const [showTitle, setShowTitle] = useState(false);

  useEffect(() => {
    const t1 = window.setTimeout(() => setShowTitle(true), 1000);
    const t2 = window.setTimeout(() => router.push("/games/game1"), 2500);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [router]);

  return (
    <div className="flex h-screen w-full touch-none items-center justify-center overflow-hidden bg-black">
      <p
        className={`text-3xl font-bold tracking-wide text-white transition-opacity duration-[800ms] ${
          showTitle ? "opacity-100" : "opacity-0"
        }`}
      >
        hiro games
      </p>
    </div>
  );
}
