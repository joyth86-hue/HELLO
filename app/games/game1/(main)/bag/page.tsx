"use client";

import { useEffect, useMemo, useState } from "react";
import { INVENTORY_CAP, loadGame1Data, type Game1SaveData, type ItemInstance } from "@/lib/game1-data";
import { flooredPlus } from "@/lib/item-synthesis";
import { getEffectiveGame1Data } from "@/lib/test-mode";
import { getItemBaseInfo, type ItemBaseInfo, type ItemType } from "@/lib/items-info";
import GameBackground from "@/components/GameBackground";
import TestModeBadge from "@/components/TestModeBadge";

interface OwnedInstance {
  instance: ItemInstance;
  item: ItemBaseInfo;
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
  const [saveData, setSaveData] = useState<Game1SaveData | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("すべて");
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

  useEffect(() => {
    setSaveData(loadGame1Data());
  }, []);

  const owned = useMemo(() => {
    if (!saveData) return [];
    const effectiveData = getEffectiveGame1Data(saveData);
    return effectiveData.inventory
      .map((instance) => {
        const item = getItemBaseInfo(instance.itemId);
        return item ? { instance, item } : null;
      })
      .filter((entry): entry is OwnedInstance => entry !== null);
  }, [saveData]);

  const counts = useMemo(() => {
    const map = {} as Record<TabKey, number>;
    for (const tab of TABS) {
      map[tab] = tab === "すべて" ? owned.length : owned.filter((o) => o.item.type === tab).length;
    }
    return map;
  }, [owned]);

  const filtered = activeTab === "すべて" ? owned : owned.filter((o) => o.item.type === activeTab);
  const selected = owned.find((entry) => entry.instance.instanceId === selectedInstanceId) ?? null;

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-background">
      <GameBackground />

      {saveData?.testMode && (
        <TestModeBadge className="absolute right-4 top-[calc(1rem_+_env(safe-area-inset-top))]" />
      )}

      <div className="relative z-10 flex h-full flex-col">
        <div className="px-4 pb-2 pt-[calc(1rem_+_env(safe-area-inset-top))]">
          <h1 className="text-lg font-bold tracking-wide text-[#f4f1ff]">バッグの中身</h1>
          <p className="mt-1 text-[11px] font-medium tracking-wide text-[#b8b3d9]">
            所持アイテム {owned.length}/{INVENTORY_CAP}
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto px-4 pb-3">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 whitespace-nowrap rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-colors ${
                activeTab === tab
                  ? "border-black bg-white text-black"
                  : "border-[rgba(201,195,255,0.5)] bg-[rgba(255,255,255,0.06)] text-[#eee9ff]"
              }`}
            >
              {tab}（{counts[tab] ?? 0}）
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-28">
          <div className="grid grid-cols-8 gap-1.5">
            {filtered.map(({ instance, item }) => {
              const plus = flooredPlus(instance);
              return (
                <button
                  key={instance.instanceId}
                  onClick={() => setSelectedInstanceId(instance.instanceId)}
                  aria-pressed={selectedInstanceId === instance.instanceId}
                  className={`relative rounded-lg border-2 bg-[rgba(255,255,255,0.06)] p-1 transition-all ${
                    selectedInstanceId === instance.instanceId
                      ? "border-black shadow-[2px_2px_0_0_#4a3f86]"
                      : "border-[rgba(201,195,255,0.35)]"
                  }`}
                >
                  <img
                    src={item.asset}
                    alt={item.name}
                    className="aspect-square w-full rounded object-cover"
                    draggable={false}
                  />
                  {plus > 0 && (
                    <span className="absolute bottom-0.5 right-0.5 rounded-full bg-black px-1 py-0.5 text-[8px] font-bold text-white">
                      +{plus}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <p className="pt-10 text-center text-sm text-[#b8b3d9]">
              このカテゴリのアイテムは持っていません
            </p>
          )}
        </div>
      </div>

      {selected && (
        <>
          {/* 詳細シートはz-10でスタッキングコンテキストを作っている上のdivの外に置く。
              中に置くと、そのdivのz-10に上限が引きずられて、下部ナビバー(z-50)の
              裏に隠れてしまう（スタッキングコンテキストの外にz-indexは効かない）。 */}
          <div
            className="fixed inset-0 z-[60] bg-black/45"
            onClick={() => setSelectedInstanceId(null)}
            aria-hidden="true"
          />
          <div className="fixed inset-x-0 bottom-0 z-[61] rounded-t-2xl border-t-2 border-black bg-[#fffaf0] p-4 pb-6">
            <div className="flex items-start gap-3">
              <img
                src={selected.item.asset}
                alt={selected.item.name}
                className="h-16 w-16 flex-shrink-0 rounded-lg"
              />
              <div className="min-w-0">
                <p className="truncate font-bold text-black">
                  {selected.item.name}
                  {flooredPlus(selected.instance) > 0 && (
                    <span className="ml-1 text-[#4a3f86]">+{flooredPlus(selected.instance)}</span>
                  )}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
                  <span>{selected.item.slot ?? selected.item.type}</span>
                  <span
                    className="inline-flex h-4 w-5 items-center justify-center rounded text-[10px] font-bold text-white"
                    style={{ backgroundColor: RARITY_COLOR[selected.item.rarity] }}
                  >
                    {selected.item.rarity}
                  </span>
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
