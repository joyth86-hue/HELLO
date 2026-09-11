"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { markEnteredViaSplash } from "@/lib/entry-guard";

// ここでの最初のタップが、このタブでの最初のユーザー操作になる。
// ブラウザは「一度もユーザー操作が無い」状態での音声再生を許さないため、
// 次の開始画面（/games/game1）のBGMを表示直後から鳴らすには、この画面で
// 一度タップさせておく必要がある（タップ無しで自動遷移していた頃は、
// 開始画面のBGMが常に自動再生ポリシーで拒否されてしまっていた）。
const TEXT_SHADOW = "0 2px 10px rgba(0,0,0,0.55), 0 0 4px rgba(0,0,0,0.8)";

export default function AppStartPage() {
  const router = useRouter();
  const [showTitle, setShowTitle] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t1 = window.setTimeout(() => setShowTitle(true), 1000);
    const t2 = window.setTimeout(() => setReady(true), 1800);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  const handleTap = () => {
    if (!ready) return;
    markEnteredViaSplash();
    router.push("/games/game1");
  };

  return (
    <div
      className={`relative flex h-[100dvh] w-full touch-none items-center justify-center overflow-hidden bg-black ${ready ? "cursor-pointer" : ""}`}
      onClick={handleTap}
    >
      <img
        src="/logos/l01.png"
        alt="hiro games"
        className={`w-2/3 max-w-xs transition-opacity duration-[800ms] ${
          showTitle ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`absolute inset-x-0 bottom-[16%] flex justify-center transition-opacity duration-700 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      >
        <p
          className={`text-lg font-semibold text-white ${ready ? "animate-pulse" : ""}`}
          style={{ textShadow: TEXT_SHADOW }}
        >
          タップして開始する
        </p>
      </div>
    </div>
  );
}
