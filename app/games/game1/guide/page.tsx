"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadGame1Data, type Game1SaveData } from "@/lib/game1-data";
import { ITEM_BASE_INFO, RARITY_COLOR, type ItemBaseInfo, type ItemType } from "@/lib/items-info";
import { ALL_BGM_TRACKS } from "@/lib/audio-tracks";
import GameBackground from "@/components/GameBackground";
import TestModeBadge from "@/components/TestModeBadge";

// docs/spec/adventure-system.mdの「100ステージクリアをゴール」に合わせた値。
const STAGE_GOAL = 100;

type MainTab = "実績" | "装備" | "BGM";
const MAIN_TABS: MainTab[] = ["実績", "装備", "BGM"];

type ItemTab = "すべて" | ItemType;
const ITEM_TABS: ItemTab[] = ["すべて", "片手剣", "法器", "弓", "アーティファクト"];

const tabButtonClass = (active: boolean) =>
  `rounded-full border-2 font-bold transition-colors ${
    active
      ? "border-black bg-white text-black"
      : "border-[rgba(201,195,255,0.5)] bg-[rgba(255,255,255,0.06)] text-[#eee9ff]"
  }`;

export default function GuidePage() {
  const router = useRouter();
  const [saveData, setSaveData] = useState<Game1SaveData | null>(null);
  const [mainTab, setMainTab] = useState<MainTab>("実績");
  const [itemTab, setItemTab] = useState<ItemTab>("すべて");
  const [selectedItem, setSelectedItem] = useState<ItemBaseInfo | null>(null);
  const [playingSrc, setPlayingSrc] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 図鑑は「冒険してきた記録」を見る画面のため、テストモードの解放判定
    // （getEffectiveGame1Data）は使わず、常に実データをそのまま見せる。
    setSaveData(loadGame1Data());
  }, []);

  // BGMタブを離れたら再生を止める（他タブに切り替えても鳴り続けると分かりにくいため）。
  useEffect(() => {
    if (mainTab !== "BGM") {
      audioRef.current?.pause();
      setPlayingSrc(null);
    }
  }, [mainTab]);

  // 画面を離れる時も止める。
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const unlockedSet = useMemo(() => new Set(saveData?.unlockedItemIds ?? []), [saveData]);

  const itemCounts = useMemo(() => {
    const map = {} as Record<ItemTab, number>;
    for (const tab of ITEM_TABS) {
      map[tab] =
        tab === "すべて" ? ITEM_BASE_INFO.length : ITEM_BASE_INFO.filter((i) => i.type === tab).length;
    }
    return map;
  }, []);

  const filteredItems =
    itemTab === "すべて" ? ITEM_BASE_INFO : ITEM_BASE_INFO.filter((i) => i.type === itemTab);

  function toggleTrack(src: string) {
    if (playingSrc === src) {
      audioRef.current?.pause();
      setPlayingSrc(null);
      return;
    }
    if (!audioRef.current) {
      const audio = new Audio();
      audio.loop = true;
      audio.volume = 0.5;
      audioRef.current = audio;
    }
    audioRef.current.src = src;
    audioRef.current.play().catch(() => undefined);
    setPlayingSrc(src);
  }

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-background">
      <GameBackground />

      {saveData?.testMode && (
        <TestModeBadge className="absolute right-4 top-[calc(1rem_+_env(safe-area-inset-top))]" />
      )}

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center gap-2 px-4 pb-2 pt-[calc(1rem_+_env(safe-area-inset-top))]">
          <button onClick={() => router.push("/games/game1/home")} aria-label="戻る">
            <img
              src="/icons/buttons/ui_back.png"
              alt="戻る"
              className="h-11 w-11 rounded-lg object-contain"
              draggable={false}
            />
          </button>
          <h1 className="text-lg font-bold tracking-wide text-[#f4f1ff]">図鑑</h1>
        </div>

        <div className="flex gap-2 px-4 pb-3">
          {MAIN_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setMainTab(tab)}
              className={`flex-1 py-1.5 text-sm ${tabButtonClass(mainTab === tab)}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-28">
          {!saveData ? null : mainTab === "実績" ? (
            <AchievementsTab saveData={saveData} />
          ) : mainTab === "装備" ? (
            <>
              <div className="flex gap-2 overflow-x-auto pb-3">
                {ITEM_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setItemTab(tab)}
                    className={`flex-shrink-0 whitespace-nowrap px-3 py-1.5 text-xs ${tabButtonClass(
                      itemTab === tab
                    )}`}
                  >
                    {tab}（{itemCounts[tab] ?? 0}）
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {filteredItems.map((item) => {
                  const unlocked = unlockedSet.has(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={unlocked ? () => setSelectedItem(item) : undefined}
                      disabled={!unlocked}
                      className={`aspect-square rounded-lg border-2 p-1 transition-all ${
                        unlocked
                          ? "border-[rgba(201,195,255,0.35)] bg-[rgba(255,255,255,0.06)]"
                          : "border-[rgba(201,195,255,0.15)] bg-[rgba(0,0,0,0.25)]"
                      }`}
                    >
                      {unlocked ? (
                        <img
                          src={item.asset}
                          alt={item.name}
                          className="h-full w-full rounded object-cover"
                          draggable={false}
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xl text-[rgba(201,195,255,0.25)]">
                          ？
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-1">
              {ALL_BGM_TRACKS.map((track) => {
                const playing = playingSrc === track.src;
                return (
                  <button
                    key={track.src}
                    onClick={() => toggleTrack(track.src)}
                    className={`flex items-center justify-between px-3.5 py-3 text-sm ${tabButtonClass(
                      playing
                    )}`}
                  >
                    <span>{track.title}</span>
                    <span className="text-xs">{playing ? "■ 停止" : "▶ 再生"}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedItem && (
        <>
          {/* 詳細シートはz-10でスタッキングコンテキストを作っている上のdivの外に置く
              （バッグ画面と同じ理由。app/games/game1/(main)/bag/page.tsx参照）。 */}
          <div
            className="fixed inset-0 z-[60] bg-black/45"
            onClick={() => setSelectedItem(null)}
            aria-hidden="true"
          />
          <div className="fixed inset-x-0 bottom-0 z-[61] rounded-t-2xl border-t-2 border-black bg-[#fffaf0] p-4 pb-6">
            <div className="flex items-start gap-3">
              <img
                src={selectedItem.asset}
                alt={selectedItem.name}
                className="h-16 w-16 flex-shrink-0 rounded-lg"
              />
              <div className="min-w-0">
                <p className="truncate font-bold text-black">{selectedItem.name}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
                  <span>{selectedItem.slot ?? selectedItem.type}</span>
                  <span
                    className="inline-flex h-4 w-5 items-center justify-center rounded text-[10px] font-bold text-white"
                    style={{ backgroundColor: RARITY_COLOR[selectedItem.rarity] }}
                  >
                    {selectedItem.rarity}
                  </span>
                </p>
              </div>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm text-zinc-700">
              {selectedItem.description}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function AchievementsTab({ saveData }: { saveData: Game1SaveData }) {
  const rows = [
    { label: "到達ステージ", value: `${saveData.maxClearedStage} / ${STAGE_GOAL}` },
    {
      label: "入手アイテム数",
      value: `${saveData.unlockedItemIds.length} / ${ITEM_BASE_INFO.length}`,
    },
    { label: "ステージクリア数", value: `${saveData.totalBossClears}回` },
  ];
  return (
    <div className="flex flex-col gap-2 pt-1">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between rounded-xl border-2 border-[rgba(201,195,255,0.35)] bg-[rgba(255,255,255,0.06)] px-3.5 py-3"
        >
          <span className="text-sm font-bold text-[#eee9ff]">{row.label}</span>
          <span className="text-sm font-bold tabular-nums text-[#eee9ff]">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
