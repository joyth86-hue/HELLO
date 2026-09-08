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
  const [expPoints, setExpPoints] = useState(0);

  useEffect(() => {
    setCurrency(loadGlobalData().currency);

    const data = loadGame1Data();
    const next = { ...data, playCount: data.playCount + 1 };
    saveGame1Data(next);
    setExpPoints(next.expPoints);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <img
        src={HOME_BACKGROUND}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute right-4 top-4 z-10 w-[240px] rounded-xl border border-[rgba(201,195,255,0.5)] bg-[rgba(20,18,40,0.68)] px-3.5 py-2 text-[11px] font-medium text-[#eee9ff] backdrop-blur-sm">
        <p className="flex justify-between gap-2">
          <span>所持金：</span>
          <span className="tabular-nums">{formatCurrency(currency)}</span>
        </p>
        <p className="flex justify-between gap-2">
          <span>経験値：</span>
          <span className="tabular-nums">{expPoints.toLocaleString()}pt</span>
        </p>
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center gap-8 p-6 pb-28 pt-20 text-center">
        <Link
          href="/games/game1/stages"
          className={`${stickerButton} mt-auto rounded-full px-8 py-3`}
        >
          冒険に行く
        </Link>
      </div>
    </div>
  );
}
