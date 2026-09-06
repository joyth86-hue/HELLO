"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency, loadGlobalData } from "@/lib/storage";

const games = [
  { id: "game1", label: "Game 1", href: "/games/game1", available: true },
  { id: "game2", label: "Game 2", href: "/games/game2", available: false },
  { id: "game3", label: "Game 3", href: "/games/game3", available: false },
];

export default function MenuPage() {
  const [currency, setCurrency] = useState<number | null>(null);

  useEffect(() => {
    setCurrency(loadGlobalData().currency);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center gap-10 bg-white p-6 pt-20 text-center">
      {currency !== null && (
        <p className="absolute right-4 top-4 rounded-full bg-black px-4 py-1.5 text-sm font-semibold text-white">
          {formatCurrency(currency)}
        </p>
      )}

      <h1 className="text-2xl font-bold tracking-wide text-black">
        Game Menu
      </h1>

      <div className="flex w-full max-w-sm flex-col gap-4">
        {games.map((game) =>
          game.available ? (
            <Link
              key={game.id}
              href={game.href}
              className="rounded-2xl bg-black px-6 py-5 text-lg font-semibold text-white transition-colors active:bg-zinc-700"
            >
              {game.label}
            </Link>
          ) : (
            <div
              key={game.id}
              aria-disabled="true"
              className="rounded-2xl border border-zinc-300 bg-zinc-100 px-6 py-5 text-lg font-semibold text-zinc-400"
            >
              {game.label}
              <span className="ml-2 text-sm font-normal text-zinc-400">
                (Coming soon...)
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
