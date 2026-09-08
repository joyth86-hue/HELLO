"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadGame1Data } from "@/lib/game1-data";
import { getItemBaseInfo, type ItemBaseInfo } from "@/lib/items-info";
import { stickerButton } from "@/lib/ui";

interface OwnedItem {
  item: ItemBaseInfo;
  quantity: number;
}

export default function BagPage() {
  const [owned, setOwned] = useState<OwnedItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const data = loadGame1Data();
    const list = data.inventory
      .map((entry) => {
        const item = getItemBaseInfo(entry.itemId);
        return item ? { item, quantity: entry.quantity } : null;
      })
      .filter((entry): entry is OwnedItem => entry !== null);
    setOwned(list);
  }, []);

  const selected = owned.find((entry) => entry.item.id === selectedId) ?? null;

  return (
    <div className="relative min-h-screen bg-background pb-10">
      <Link
        href="/games/game1/home"
        aria-label="Game1のメイン画面に戻る"
        className={`${stickerButton} absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full`}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <line x1="2" y1="2" x2="16" y2="16" stroke="#171717" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="16" y1="2" x2="2" y2="16" stroke="#171717" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </Link>

      <div className="px-4 pr-20 pt-4">
        <h1 className="text-lg font-bold tracking-wide text-black">バッグの中身</h1>
        <p className="mt-1 text-[11px] font-medium tracking-wide text-zinc-500">
          所持アイテム {owned.length} 種類
        </p>
      </div>

      <div className="px-4 py-3">
        <div className="grid grid-cols-4 gap-3">
          {owned.map(({ item, quantity }) => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              aria-pressed={selectedId === item.id}
              className={`relative rounded-xl border-2 bg-white p-1.5 transition-all ${
                selectedId === item.id
                  ? "border-black shadow-[3px_3px_0_0_#171717]"
                  : "border-zinc-300"
              }`}
            >
              <img
                src={item.asset}
                alt={item.name}
                className="aspect-square w-full rounded-lg object-cover"
                draggable={false}
              />
              {quantity > 1 && (
                <span className="absolute bottom-1 right-1 rounded-full bg-black px-1.5 py-0.5 text-[10px] font-bold text-white">
                  ×{quantity}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-1">
        {selected ? (
          <div className="rounded-xl border-2 border-black bg-white p-4 text-left">
            <div className="flex items-start gap-3">
              <img
                src={selected.item.asset}
                alt={selected.item.name}
                className="h-16 w-16 flex-shrink-0 rounded-lg"
              />
              <div className="min-w-0">
                <p className="truncate font-bold text-black">{selected.item.name}</p>
                <p className="text-xs text-zinc-500">
                  {selected.item.slot ?? selected.item.type} / {selected.item.rarity}
                  {selected.quantity > 1 ? ` / 所持数 ${selected.quantity}` : ""}
                </p>
              </div>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm text-zinc-700">
              {selected.item.description}
            </p>
          </div>
        ) : (
          <p className="text-center text-sm text-zinc-500">
            アイテムをタップすると詳細が表示されます
          </p>
        )}
      </div>
    </div>
  );
}
