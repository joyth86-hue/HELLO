"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency, loadGlobalData } from "@/lib/storage";
import { loadGame1Data, saveGame1Data } from "@/lib/game1-data";
import { stickerButton } from "@/lib/ui";

// 仲間が増えるたびに背景も賑やかになる想定（home_01=1人〜home_04=4人）。
// パーティ編成の仕組みがまだ無いため、現状はテストとしてhome_04で固定。
const HOME_BACKGROUND = "/backgrounds/home/home_04_akane_koyuki_kaede_sayumi.png";

export default function Game1HomePage() {
  const [currency, setCurrency] = useState(0);
  const [playCount, setPlayCount] = useState(0);

  useEffect(() => {
    setCurrency(loadGlobalData().currency);

    const data = loadGame1Data();
    const next = { ...data, playCount: data.playCount + 1 };
    saveGame1Data(next);
    setPlayCount(next.playCount);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <img
        src={HOME_BACKGROUND}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center gap-8 p-6 pt-20 text-center">
        <h1 className="text-2xl font-bold tracking-wide text-[#f4f1ff] [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]">
          Game 1
        </h1>

        <div className="w-full max-w-sm rounded-2xl border-2 border-[rgba(201,195,255,0.55)] bg-[rgba(20,18,40,0.68)] p-6 text-left text-[#eee9ff] backdrop-blur-sm">
          <p>共通通貨（全ゲーム共有）: {formatCurrency(currency)}</p>
          <p>このゲームのプレイ回数: {playCount}</p>
        </div>

        <button className={`${stickerButton} rounded-full px-8 py-3`}>冒険する</button>

        <Link href="/games/game1/character" className={`${stickerButton} rounded-full px-8 py-3`}>
          キャラクター
        </Link>

        <Link href="/games/game1/bag" className={`${stickerButton} rounded-full px-8 py-3`}>
          バッグの中身
        </Link>

        <Link href="/" className={`${stickerButton} rounded-full px-8 py-3`}>
          ゲームを終了
        </Link>
      </div>
    </div>
  );
}
