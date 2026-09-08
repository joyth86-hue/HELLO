"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadGame1Data } from "@/lib/game1-data";
import { getItemBaseInfo, type ItemBaseInfo, type ItemType } from "@/lib/items-info";
import { stickerButton } from "@/lib/ui";

interface OwnedItem {
  item: ItemBaseInfo;
  quantity: number;
}

type TabKey = "すべて" | ItemType;

const TABS: TabKey[] = ["すべて", "片手剣", "法器", "弓", "アーティファクト"];

const RARITY_COLOR: Record<string, string> = {
  SS: "#e0a233",
  S: "#9757e0",
  A: "#3b7cf0",
  B: "#2fa564",
  C: "#8b9096",
};

export default function BagPage() {
  const [owned, setOwned] = useState<OwnedItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("すべて");
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

  const counts = useMemo(() => {
    const map = {} as Record<TabKey, number>;
    for (const tab of TABS) {
      map[tab] = tab === "すべて" ? owned.length : owned.filter((o) => o.item.type === tab).length;
    }
    return map;
  }, [owned]);

  const filtered = activeTab === "すべて" ? owned : owned.filter((o) => o.item.type === activeTab);
  const selected = owned.find((entry) => entry.item.id === selectedId) ?? null;

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-background">
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

      <div className="px-4 pb-2 pr-20 pt-4">
        <h1 className="text-lg font-bold tracking-wide text-black">バッグの中身</h1>
        <p className="mt-1 text-[11px] font-medium tracking-wide text-zinc-500">
          所持アイテム {owned.length} 種類
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 pb-3">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 whitespace-nowrap rounded-full border-2 border-black px-3 py-1.5 text-xs font-bold transition-colors ${
              activeTab === tab ? "bg-black text-white" : "bg-white text-black"
            }`}
          >
            {tab}（{counts[tab] ?? 0}）
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="grid grid-cols-4 gap-3">
          {filtered.map(({ item, quantity }) => (
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
        {filtered.length === 0 && (
          <p className="pt-10 text-center text-sm text-zinc-500">
            このカテゴリのアイテムは持っていません
          </p>
        )}
      </div>

      {selected && (
        <>
          <div
            className="fixed inset-0 z-20 bg-black/45"
            onClick={() => setSelectedId(null)}
            aria-hidden="true"
          />
          <div className="fixed inset-x-0 bottom-0 z-30 rounded-t-2xl border-t-2 border-black bg-[#fffaf0] p-4 pb-6">
            <div className="flex items-start gap-3">
              <img
                src={selected.item.asset}
                alt={selected.item.name}
                className="h-16 w-16 flex-shrink-0 rounded-lg"
              />
              <div className="min-w-0">
                <p className="truncate font-bold text-black">{selected.item.name}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
                  <span>{selected.item.slot ?? selected.item.type}</span>
                  <span
                    className="inline-flex h-4 w-5 items-center justify-center rounded text-[10px] font-bold text-white"
                    style={{ backgroundColor: RARITY_COLOR[selected.item.rarity] }}
                  >
                    {selected.item.rarity}
                  </span>
                  {selected.quantity > 1 && <span>所持数 {selected.quantity}</span>}
                </p>
              </div>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm text-zinc-700">
              {selected.item.description}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
