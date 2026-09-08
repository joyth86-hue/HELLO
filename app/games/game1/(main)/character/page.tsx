"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CHARACTERS, getCharacterByIndex } from "@/lib/characters";
import { getCharacterBaseInfo } from "@/lib/characters-info";
import {
  getCharacterEquipment,
  getCharacterLevel,
  getUnlockedCharacterIds,
  loadGame1Data,
  saveGame1Data,
  syncActivePartyWithUnlocks,
  MAX_PARTY_SIZE,
  type CharacterEquipment,
  type Game1SaveData,
} from "@/lib/game1-data";
import { getItemBaseInfo, type ItemBaseInfo } from "@/lib/items-info";
import GameBackground from "@/components/GameBackground";

const SWIPE_THRESHOLD = 60;
const SNAP_DURATION = 250;

// 待機アニメーションのスプライトシート仕様（hirogames_images/CHARACTER_SCREEN_ASSETS.md参照）。
// 1コマ486x810px、8列×5行、40コマを100ms間隔でループ。
const IDLE_SHEET_COLUMNS = 8;
const IDLE_SHEET_ROWS = 5;
const IDLE_FRAME_COUNT = 40;
const IDLE_FRAME_DURATION_MS = 100;
const IDLE_FRAME_ASPECT = "486 / 810";

function idleFrameBackgroundPosition(frame: number) {
  const col = frame % IDLE_SHEET_COLUMNS;
  const row = Math.floor(frame / IDLE_SHEET_COLUMNS);
  const x = (col / (IDLE_SHEET_COLUMNS - 1)) * 100;
  const y = (row / (IDLE_SHEET_ROWS - 1)) * 100;
  return `${x}% ${y}%`;
}

const EMPTY_EQUIPMENT: CharacterEquipment = { weapon: null, artifacts: [null, null, null] };

// 会心率・会心ダメージの基礎値（docs/spec/adventure-system.mdのダメージ計算式案）。
// アーティファクトの効果値がまだ無いため、装備による上乗せ分は今は反映していない。
const BASE_CRIT_RATE = 10;
const BASE_CRIT_DAMAGE = 150;
// 属性相性表が未定のため、属性耐性は仮に0%表示。
const PLACEHOLDER_ELEMENT_RESISTANCE = 0;

type PickerTarget = { kind: "weapon" } | { kind: "artifact"; index: 0 | 1 | 2 };

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

function CharacterPane({ id, frame }: { id: string; frame: number }) {
  const idleSheet = getCharacterBaseInfo(id)?.assets.idleSheet;
  return (
    <div className="flex h-full w-1/3 flex-shrink-0 items-center justify-center overflow-hidden">
      {idleSheet && (
        <div
          role="img"
          aria-label={id}
          className="select-none"
          style={{
            aspectRatio: IDLE_FRAME_ASPECT,
            // 額縁の縁（マット風のinset box-shadow）にキャラクターの足元などが
            // 重ならないよう、あえて額縁より一回り小さく表示して余白を持たせる。
            height: "94%",
            maxWidth: "94%",
            backgroundImage: `url(${idleSheet})`,
            backgroundSize: `${IDLE_SHEET_COLUMNS * 100}% ${IDLE_SHEET_ROWS * 100}%`,
            backgroundPosition: idleFrameBackgroundPosition(frame),
            backgroundRepeat: "no-repeat",
            imageRendering: "pixelated",
          }}
        />
      )}
    </div>
  );
}

function EquipSlot({
  caption,
  item,
  onClick,
}: {
  caption: string;
  item: ItemBaseInfo | undefined;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1">
      <div
        className={`flex aspect-square w-full items-center justify-center rounded-xl border-2 p-1.5 ${
          item
            ? "border-black bg-white"
            : "border-dashed border-[rgba(201,195,255,0.4)] bg-[rgba(255,255,255,0.06)]"
        }`}
      >
        {item ? (
          <img src={item.asset} alt={item.name} className="h-full w-full rounded-lg object-cover" />
        ) : (
          <span className="text-2xl font-bold text-[rgba(201,195,255,0.5)]">+</span>
        )}
      </div>
      <span className="text-[9px] font-medium text-[#8f89b3]">{caption}</span>
    </button>
  );
}

export default function CharacterViewPage() {
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isSettling, setIsSettling] = useState(false);
  const [saveData, setSaveData] = useState<Game1SaveData | null>(null);
  const [picker, setPicker] = useState<PickerTarget | null>(null);
  const [partyWarning, setPartyWarning] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const pointerStartX = useRef<number | null>(null);
  const [idleFrame, setIdleFrame] = useState(0);

  useEffect(() => {
    const synced = syncActivePartyWithUnlocks(loadGame1Data());
    saveGame1Data(synced);
    setSaveData(synced);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIdleFrame((f) => (f + 1) % IDLE_FRAME_COUNT);
    }, IDLE_FRAME_DURATION_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setPicker(null);
  }, [index]);

  const unlockedIds = saveData ? getUnlockedCharacterIds(saveData) : ["c01"];
  const unlockedCharacters = CHARACTERS.filter((c) => unlockedIds.includes(c.id));
  const safeIndex = mod(index, unlockedCharacters.length);
  const stats = getCharacterByIndex(CHARACTERS.indexOf(unlockedCharacters[safeIndex]));
  const prevId = unlockedCharacters[mod(safeIndex - 1, unlockedCharacters.length)].id;
  const currentId = unlockedCharacters[safeIndex].id;
  const nextId = unlockedCharacters[mod(safeIndex + 1, unlockedCharacters.length)].id;
  const currentBaseInfo = getCharacterBaseInfo(currentId);
  const isInParty = saveData ? saveData.activePartyIds.includes(currentId) : false;
  const level = saveData ? getCharacterLevel(saveData, currentId) : 1;

  const currentEquipment = saveData ? getCharacterEquipment(saveData, currentId) : EMPTY_EQUIPMENT;
  const weaponItem = currentEquipment.weapon ? getItemBaseInfo(currentEquipment.weapon) : undefined;
  const artifactItems = currentEquipment.artifacts.map((id) => (id ? getItemBaseInfo(id) : undefined));

  const owned = useMemo(() => {
    if (!saveData) return [];
    return saveData.inventory
      .map((entry) => {
        const item = getItemBaseInfo(entry.itemId);
        return item ? { item, quantity: entry.quantity } : null;
      })
      .filter((entry): entry is { item: ItemBaseInfo; quantity: number } => entry !== null);
  }, [saveData]);

  const candidates = useMemo(() => {
    if (!picker) return [];
    if (picker.kind === "weapon") {
      return owned.filter((o) => o.item.type === currentBaseInfo?.weaponType);
    }
    const equippedElsewhere = new Set(
      currentEquipment.artifacts.filter((id, i) => id !== null && i !== picker.index)
    );
    return owned.filter(
      (o) => o.item.type === "アーティファクト" && !equippedElsewhere.has(o.item.id)
    );
  }, [picker, owned, currentBaseInfo, currentEquipment]);

  function toggleParty() {
    if (!saveData) return;
    const isMember = saveData.activePartyIds.includes(currentId);
    if (!isMember && saveData.activePartyIds.length >= MAX_PARTY_SIZE) {
      setPartyWarning(true);
      window.setTimeout(() => setPartyWarning(false), 1600);
      return;
    }
    const nextActive = isMember
      ? saveData.activePartyIds.filter((id) => id !== currentId)
      : [...saveData.activePartyIds, currentId];
    const next: Game1SaveData = { ...saveData, activePartyIds: nextActive };
    saveGame1Data(next);
    setSaveData(next);
  }

  function updateEquipment(next: CharacterEquipment) {
    if (!saveData) return;
    const nextSaveData: Game1SaveData = {
      ...saveData,
      equipment: { ...saveData.equipment, [currentId]: next },
    };
    saveGame1Data(nextSaveData);
    setSaveData(nextSaveData);
  }

  function equip(itemId: string) {
    if (!picker) return;
    if (picker.kind === "weapon") {
      updateEquipment({ ...currentEquipment, weapon: itemId });
    } else {
      const artifacts = [...currentEquipment.artifacts] as CharacterEquipment["artifacts"];
      artifacts[picker.index] = itemId;
      updateEquipment({ ...currentEquipment, artifacts });
    }
    setPicker(null);
  }

  function unequip() {
    if (!picker) return;
    if (picker.kind === "weapon") {
      updateEquipment({ ...currentEquipment, weapon: null });
    } else {
      const artifacts = [...currentEquipment.artifacts] as CharacterEquipment["artifacts"];
      artifacts[picker.index] = null;
      updateEquipment({ ...currentEquipment, artifacts });
    }
    setPicker(null);
  }

  const isSlotFilled =
    picker?.kind === "weapon"
      ? currentEquipment.weapon !== null
      : picker?.kind === "artifact"
        ? currentEquipment.artifacts[picker.index] !== null
        : false;

  const settle = (target: number, direction: 1 | -1 | 0) => {
    setIsSettling(true);
    setDragX(target);
    window.setTimeout(() => {
      setIsSettling(false);
      setDragX(0);
      if (direction !== 0) {
        setIndex((i) => mod(i + direction, unlockedCharacters.length));
      }
    }, SNAP_DURATION);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isSettling) return;
    pointerStartX.current = e.clientX;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (pointerStartX.current === null || isSettling) return;
    const width = frameRef.current?.offsetWidth || 1;
    const delta = e.clientX - pointerStartX.current;
    setDragX(Math.max(-width, Math.min(width, delta)));
  };

  const endDrag = () => {
    if (pointerStartX.current === null) return;
    pointerStartX.current = null;
    const width = frameRef.current?.offsetWidth || 1;

    if (dragX <= -SWIPE_THRESHOLD) {
      settle(-width, 1);
    } else if (dragX >= SWIPE_THRESHOLD) {
      settle(width, -1);
    } else {
      settle(0, 0);
    }
  };

  return (
    <div className="relative h-[100dvh] touch-none overflow-hidden bg-background">
      <GameBackground />

      <div className="relative z-10 flex h-full touch-none flex-col">
        <div className="px-4 pt-4">
          <p className="mb-1.5 text-[11px] font-medium tracking-wide text-[#b8b3d9]">STATUS</p>
          <div className="rounded-xl border border-[rgba(201,195,255,0.4)] bg-[rgba(255,255,255,0.09)] px-3.5 py-2.5 text-sm text-[#eee9ff] backdrop-blur-sm">
            <div className="mb-2 flex items-baseline justify-between border-b border-[rgba(201,195,255,0.25)] pb-2">
              <span className="text-[#b8b3d9]">レベル</span>
              <span className="font-bold tabular-nums">{level}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              <div className="flex justify-between">
                <span>HP</span>
                <span className="font-bold tabular-nums">{stats.hp.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>会心率</span>
                <span className="font-bold tabular-nums">{BASE_CRIT_RATE}%</span>
              </div>
              <div className="flex justify-between">
                <span>攻撃力</span>
                <span className="font-bold tabular-nums">{stats.atk.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>会心ダメージ</span>
                <span className="font-bold tabular-nums">{BASE_CRIT_DAMAGE}%</span>
              </div>
              <div className="flex justify-between">
                <span>防御力</span>
                <span className="font-bold tabular-nums">{stats.def.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>属性耐性</span>
                <span className="font-bold tabular-nums">{PLACEHOLDER_ELEMENT_RESISTANCE}%</span>
              </div>
            </div>
          </div>

          <button
            onClick={toggleParty}
            className="mt-2 flex w-full items-center gap-2 rounded-xl border border-[rgba(201,195,255,0.4)] bg-[rgba(255,255,255,0.09)] px-3.5 py-2 text-left text-sm text-[#eee9ff] backdrop-blur-sm"
          >
            <span
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 ${
                isInParty ? "border-[#c9c3ff] bg-[#c9c3ff]" : "border-[rgba(201,195,255,0.5)] bg-transparent"
              }`}
            >
              {isInParty && (
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M2 6l3 3 5-6" stroke="#171717" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            バトルに参加
            {partyWarning && (
              <span className="ml-auto text-[11px] font-bold text-[#ff9a9a]">最大3人まで</span>
            )}
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-hidden px-6 py-3">
          <div
            ref={frameRef}
            className="relative aspect-[2/3] h-auto max-h-full w-full max-w-[340px] touch-none overflow-hidden rounded-xl border-4 border-black bg-[#fffaf0] p-1.5 shadow-[inset_0_0_0_4px_#fffaf0,inset_0_0_0_5px_#171717]"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div
              className="flex h-full"
              style={{
                width: "300%",
                transform: `translateX(calc(-33.3333% + ${dragX}px))`,
                transition: isSettling ? `transform ${SNAP_DURATION}ms ease-out` : "none",
              }}
            >
              <CharacterPane id={prevId} frame={idleFrame} />
              <CharacterPane id={currentId} frame={idleFrame} />
              <CharacterPane id={nextId} frame={idleFrame} />
            </div>
          </div>
        </div>

        <div className="px-4 pb-28">
          <p className="mb-1.5 text-[11px] font-medium tracking-wide text-[#b8b3d9]">装備</p>
          <div className="grid grid-cols-4 gap-3">
            <EquipSlot caption="武器" item={weaponItem} onClick={() => setPicker({ kind: "weapon" })} />
            {([0, 1, 2] as const).map((i) => (
              <EquipSlot
                key={i}
                caption="アーティファクト"
                item={artifactItems[i]}
                onClick={() => setPicker({ kind: "artifact", index: i })}
              />
            ))}
          </div>
        </div>
      </div>

      {picker && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/45"
            onClick={() => setPicker(null)}
            aria-hidden="true"
          />
          <div className="fixed inset-x-0 bottom-0 z-[61] max-h-[70vh] overflow-y-auto rounded-t-2xl border-t-2 border-black bg-[#fffaf0] p-4 pb-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-bold text-black">
                {picker.kind === "weapon" ? "武器を選ぶ" : "アーティファクトを選ぶ"}
              </p>
              {isSlotFilled && (
                <button onClick={unequip} className="text-xs font-bold text-red-600 underline">
                  外す
                </button>
              )}
            </div>
            {candidates.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-500">
                {picker.kind === "weapon"
                  ? "装備できる武器を持っていません"
                  : "装備できるアーティファクトを持っていません"}
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {candidates.map(({ item, quantity }) => (
                  <button
                    key={item.id}
                    onClick={() => equip(item.id)}
                    className="relative rounded-xl border-2 border-zinc-300 bg-white p-1.5"
                  >
                    <img
                      src={item.asset}
                      alt={item.name}
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                    {quantity > 1 && (
                      <span className="absolute bottom-1 right-1 rounded-full bg-black px-1.5 py-0.5 text-[10px] font-bold text-white">
                        ×{quantity}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
