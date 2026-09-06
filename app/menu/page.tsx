"use client";

import Link from "next/link";

const games = [
  { id: "game1", label: "Game 1", href: "/games/game1", available: true },
  { id: "game2", label: "Game 2", href: "/games/game2", available: false },
  { id: "game3", label: "Game 3", href: "/games/game3", available: false },
];

export default function MenuPage() {
  return (
    <div className="flex min-h-screen flex-col items-center gap-10 bg-black p-6 pt-20 text-center">
      <h1 className="text-2xl font-bold tracking-wide text-white">
        Game Menu
      </h1>

      <div className="flex w-full max-w-sm flex-col gap-4">
        {games.map((game) =>
          game.available ? (
            <Link
              key={game.id}
              href={game.href}
              className="rounded-2xl border border-zinc-700 bg-zinc-900 px-6 py-5 text-lg font-semibold text-white transition-colors active:bg-zinc-800"
            >
              {game.label}
            </Link>
          ) : (
            <div
              key={game.id}
              aria-disabled="true"
              className="rounded-2xl border border-zinc-800 bg-zinc-950 px-6 py-5 text-lg font-semibold text-zinc-600"
            >
              {game.label}
              <span className="ml-2 text-sm font-normal text-zinc-700">
                (Coming soon...)
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
