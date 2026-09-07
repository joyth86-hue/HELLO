"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  formatCurrency,
  loadGameData,
  loadGlobalData,
  saveGameData,
} from "@/lib/storage";
import { stickerButton } from "@/lib/ui";

interface Game1SaveData {
  playCount: number;
}

const GAME_ID = "game1";
const defaultGame1Data: Game1SaveData = { playCount: 0 };

export default function Game1HomePage() {
  const [currency, setCurrency] = useState(0);
  const [playCount, setPlayCount] = useState(0);

  useEffect(() => {
    setCurrency(loadGlobalData().currency);

    const data = loadGameData(GAME_ID, defaultGame1Data);
    const next = { ...data, playCount: data.playCount + 1 };
    saveGameData(GAME_ID, next);
    setPlayCount(next.playCount);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-background p-6 pt-20 text-center">
      <h1 className="text-2xl font-bold tracking-wide text-black">Game 1</h1>

      <div className="w-full max-w-sm rounded-2xl border-2 border-black bg-white p-6 text-left text-zinc-700">
        <p>共通通貨（全ゲーム共有）: {formatCurrency(currency)}</p>
        <p>このゲームのプレイ回数: {playCount}</p>
      </div>

      <button className={`${stickerButton} rounded-full px-8 py-3`}>冒険する</button>

      <Link href="/games/game1/character" className={`${stickerButton} rounded-full px-8 py-3`}>
        キャラクター
      </Link>

      <button className={`${stickerButton} rounded-full px-8 py-3`}>バッグの中身</button>

      <Link href="/menu" className={`${stickerButton} rounded-full px-8 py-3`}>
        ゲームを終了
      </Link>
    </div>
  );
}
