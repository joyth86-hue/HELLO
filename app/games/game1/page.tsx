"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  addCurrency,
  formatCurrency,
  loadGameData,
  loadGlobalData,
  saveGameData,
} from "@/lib/storage";

interface Game1SaveData {
  playCount: number;
}

const GAME_ID = "game1";
const defaultGame1Data: Game1SaveData = { playCount: 0 };

export default function Game1Page() {
  const [currency, setCurrency] = useState(0);
  const [playCount, setPlayCount] = useState(0);

  useEffect(() => {
    setCurrency(loadGlobalData().currency);

    const data = loadGameData(GAME_ID, defaultGame1Data);
    const next = { ...data, playCount: data.playCount + 1 };
    saveGameData(GAME_ID, next);
    setPlayCount(next.playCount);
  }, []);

  const handleEarn = () => {
    const updated = addCurrency(10);
    setCurrency(updated.currency);
  };

  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-white p-6 pt-20 text-center">
      <h1 className="text-2xl font-bold tracking-wide text-black">
        Game 1（仮画面）
      </h1>

      <div className="w-full max-w-sm rounded-2xl border border-zinc-300 bg-zinc-50 p-6 text-left text-zinc-700">
        <p>共通通貨（全ゲーム共有）: {formatCurrency(currency)}</p>
        <p>このゲームのプレイ回数: {playCount}</p>
      </div>

      <button
        onClick={handleEarn}
        className="rounded-full bg-black px-8 py-3 font-semibold text-white transition-colors active:bg-zinc-700"
      >
        通貨を10稼ぐ（テスト用）
      </button>

      <Link
        href="/menu"
        className="rounded-full border border-black px-8 py-3 font-semibold text-black transition-colors active:bg-zinc-100"
      >
        ゲーム選択に戻る
      </Link>
    </div>
  );
}
