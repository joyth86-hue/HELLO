"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CHARACTER_BASE_INFO, getCharacterBaseInfo } from "@/lib/characters-info";
import { getCharacterStatsAtLevel } from "@/lib/character-growth";
import { BASE_CRIT_RATE, CRIT_DAMAGE_MULTIPLIER } from "@/lib/combat";
import { calculateEquipmentBonus, applyEquipmentBonusToStats } from "@/lib/item-effects";
import {
  findEquippedOwner,
  getCharacterEquipment,
  getCharacterLevel,
  getItemInstance,
  getUnlockedCharacterIds,
  investExpInCharacter,
  investSkillPoints,
  isInstanceEquippedElsewhere,
  loadGame1Data,
  saveGame1Data,
  syncActivePartyWithUnlocks,
  MAX_PARTY_SIZE,
  type CharacterEquipment,
  type Game1SaveData,
  type ItemInstance,
} from "@/lib/game1-data";
import {
  applySynthesis,
  flooredPlus,
  isSameSynthesisGroup,
  previewSynthesis,
  type SynthesisPreview,
} from "@/lib/item-synthesis";
import { getEffectiveGame1Data } from "@/lib/test-mode";
import { getItemBaseInfo, type ItemBaseInfo } from "@/lib/items-info";
import { getCharacterSkillKit } from "@/lib/skills-info";
import {
  isSkillUnlocked,
  pointsToNextStep,
  skillPlusLevel,
  SKILL_POINT_COST_PER_STEP,
} from "@/lib/skill-progression";
import GameBackground from "@/components/GameBackground";
import TestModeBadge from "@/components/TestModeBadge";

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

// キャラクターごとの背景色。GameBackgroundのbaseGradient（背景のベース
// そのもの、今までの濃紺〜紫グラデーションに相当する部分）をキャラごとに
// 丸ごと差し替え、glow（中央上部のうっすらした光）とtext（「hiro games」
// が流れる文字）も同じ色味で揃えることで、画面全体がはっきり別の色に見え
// るようにしている。単なる光の演出ではなく、背景色そのものの変更が目的。
// 立ち絵自体の色味と被って埋もれないよう、あえて補色寄りの色を選んでいる
// （アカネ＝赤系なのでピンク、コユキ＝青系なので紫、など）。
const CHARACTER_BG_COLORS: Record<string, { base: string; glow: string; text: string }> = {
  c01: {
    // アカネ：ローズ・ワイン
    base: "linear-gradient(165deg, #3d1526 0%, #4a1c30 55%, #2a0f1c 100%)",
    glow: "#7a2f52",
    text: "#ff9ec9",
  },
  c02: {
    // カエデ：暖色・アンバー
    base: "linear-gradient(165deg, #3a2712 0%, #4a3018 55%, #26190c 100%)",
    glow: "#7a5220",
    text: "#ffcf8a",
  },
  c03: {
    // コユキ：マゼンタ・紫
    base: "linear-gradient(165deg, #2f1238 0%, #3d1a48 55%, #200c28 100%)",
    glow: "#6a2f82",
    text: "#d9a8ff",
  },
  c04: {
    // サユミ：寒色・ティール
    base: "linear-gradient(165deg, #0f2b28 0%, #163a35 55%, #091c1a 100%)",
    glow: "#1f6a5e",
    text: "#8ce9e0",
  },
};

// 会心率・会心ダメージの基礎値（装備なし）。lib/combat.tsの実際の戦闘計算と同じ値を使う。
// 装備による上乗せ分はlib/item-effects.tsのcalculateEquipmentBonus()で別途加算する。
const CRIT_RATE_PERCENT = Math.round(BASE_CRIT_RATE * 100);
const CRIT_DAMAGE_PERCENT = Math.round(CRIT_DAMAGE_MULTIPLIER * 100);
// 属性相性表が未定のため、属性耐性の基礎値は仮に0%（装備による上乗せ分だけ表示に反映）。
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
            // 上下（ヘッダー／装備欄）にぴったりくっつかないよう少し余白を持たせる。
            height: "96%",
            maxWidth: "92%",
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
  entry,
  onClick,
}: {
  caption: string;
  entry: { instance: ItemInstance; item: ItemBaseInfo } | undefined;
  onClick: () => void;
}) {
  const plus = entry ? flooredPlus(entry.instance) : 0;
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1">
      <div
        className={`relative flex aspect-square w-full items-center justify-center rounded-xl border-2 p-1.5 ${
          entry
            ? "border-black bg-white"
            : "border-dashed border-[rgba(201,195,255,0.4)] bg-[rgba(255,255,255,0.06)]"
        }`}
      >
        {entry ? (
          <img
            src={entry.item.asset}
            alt={entry.item.name}
            className="h-full w-full rounded-lg object-cover"
          />
        ) : (
          <span className="text-2xl font-bold text-[rgba(201,195,255,0.5)]">+</span>
        )}
        {plus > 0 && (
          <span className="absolute bottom-0.5 right-0.5 rounded-full bg-black px-1 py-0.5 text-[8px] font-bold text-white">
            +{plus}
          </span>
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
  const [showTrainSheet, setShowTrainSheet] = useState(false);
  const [trainInput, setTrainInput] = useState("");
  const [trainMessage, setTrainMessage] = useState<string | null>(null);
  const [showSkillSheet, setShowSkillSheet] = useState(false);
  const [skillMessage, setSkillMessage] = useState<string | null>(null);
  const [showSynthesis, setShowSynthesis] = useState(false);
  const [synthesisTargetId, setSynthesisTargetId] = useState<string | null>(null);
  const [synthesisMaterialIds, setSynthesisMaterialIds] = useState<string[]>([]);
  const [synthesisMessage, setSynthesisMessage] = useState<string | null>(null);
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

  const effectiveData = saveData ? getEffectiveGame1Data(saveData) : null;
  const unlockedIds = effectiveData ? getUnlockedCharacterIds(effectiveData) : ["c01"];
  const unlockedCharacters = CHARACTER_BASE_INFO.filter((c) => unlockedIds.includes(c.id));
  const safeIndex = mod(index, unlockedCharacters.length);
  const prevId = unlockedCharacters[mod(safeIndex - 1, unlockedCharacters.length)].id;
  const currentId = unlockedCharacters[safeIndex].id;
  const nextId = unlockedCharacters[mod(safeIndex + 1, unlockedCharacters.length)].id;
  const currentBaseInfo = getCharacterBaseInfo(currentId);
  const isInParty = saveData ? saveData.activePartyIds.includes(currentId) : false;
  const level = saveData ? getCharacterLevel(saveData, currentId) : 1;
  const baseStats = getCharacterStatsAtLevel(currentId, level);

  const currentEquipment = saveData ? getCharacterEquipment(saveData, currentId) : EMPTY_EQUIPMENT;
  const currentSkillKit = getCharacterSkillKit(currentId);

  function resolveEquipped(instanceId: string | null) {
    if (!saveData || !instanceId) return undefined;
    const instance = getItemInstance(saveData, instanceId);
    if (!instance) return undefined;
    const item = getItemBaseInfo(instance.itemId);
    return item ? { instance, item } : undefined;
  }
  const weaponEntry = resolveEquipped(currentEquipment.weapon);
  const artifactEntries = currentEquipment.artifacts.map((id) => resolveEquipped(id));

  // 装備の実効果はテストモード中の仮所持アイテムも試着できるよう、effectiveData
  // （lib/test-mode.ts）の在庫を使って解決する（装備欄の参照先instanceIdは常に
  // 実データ側だが、テストモード中はeffectiveDataの在庫にも同じ形の個体が乗る）。
  const equipmentBonus = calculateEquipmentBonus(currentEquipment, effectiveData?.inventory ?? []);
  const stats = applyEquipmentBonusToStats(baseStats, equipmentBonus);
  const displayedCritRate = CRIT_RATE_PERCENT + equipmentBonus.critRatePoints;
  const displayedCritDamage = CRIT_DAMAGE_PERCENT + equipmentBonus.critDamagePoints;
  const displayedElementResist = PLACEHOLDER_ELEMENT_RESISTANCE + equipmentBonus.elementResistPoints;

  const owned = useMemo(() => {
    if (!effectiveData) return [];
    return effectiveData.inventory
      .map((instance) => {
        const item = getItemBaseInfo(instance.itemId);
        return item ? { instance, item } : null;
      })
      .filter((entry): entry is { instance: ItemInstance; item: ItemBaseInfo } => entry !== null);
  }, [effectiveData]);

  const candidates = useMemo(() => {
    if (!picker || !saveData) return [];
    const slotRef = { characterId: currentId, slot: picker.kind === "weapon" ? ("weapon" as const) : picker.index };
    const isAvailable = (instance: ItemInstance) =>
      !isInstanceEquippedElsewhere(saveData.equipment, instance.instanceId, slotRef);

    if (picker.kind === "weapon") {
      return owned.filter(
        ({ item, instance }) => item.type === currentBaseInfo?.weaponType && isAvailable(instance)
      );
    }
    const equippedElsewhereSameChar = new Set(
      currentEquipment.artifacts.filter((id, i) => id !== null && i !== picker.index)
    );
    return owned.filter(
      ({ item, instance }) =>
        item.type === "アーティファクト" &&
        !equippedElsewhereSameChar.has(instance.instanceId) &&
        isAvailable(instance)
    );
  }, [picker, owned, currentBaseInfo, currentEquipment, saveData, currentId]);

  // 合成は実データ（テストモードの仮アイテムは対象外）を対象にする。
  // 候補：未装備のもの、または「今表示中のキャラ自身」が装備中のもの
  // （他のキャラの装備は合成の材料にできない＝画面に見えていないキャラの
  // 装備が知らないうちに消費されるのを防ぐため）。
  const synthesisEligible = useMemo(() => {
    if (!saveData) return [];
    return saveData.inventory
      .map((instance) => {
        const item = getItemBaseInfo(instance.itemId);
        return item ? { instance, item } : null;
      })
      .filter((entry): entry is { instance: ItemInstance; item: ItemBaseInfo } => entry !== null)
      .filter(({ instance }) => {
        const owner = findEquippedOwner(saveData.equipment, instance.instanceId);
        return owner === null || owner === currentId;
      });
  }, [saveData, currentId]);

  const synthesisTargetEntry = synthesisTargetId
    ? synthesisEligible.find((e) => e.instance.instanceId === synthesisTargetId)
    : undefined;

  const synthesisMaterialCandidates = useMemo(() => {
    if (!synthesisTargetEntry) return [];
    return synthesisEligible.filter(
      ({ instance, item }) =>
        instance.instanceId !== synthesisTargetEntry.instance.instanceId &&
        isSameSynthesisGroup(item, synthesisTargetEntry.item)
    );
  }, [synthesisEligible, synthesisTargetEntry]);

  const synthesisPreview: SynthesisPreview | null = useMemo(() => {
    if (!saveData || !synthesisTargetId || synthesisMaterialIds.length === 0) return null;
    return previewSynthesis(saveData, synthesisTargetId, synthesisMaterialIds);
  }, [saveData, synthesisTargetId, synthesisMaterialIds]);

  function openSynthesis() {
    setSynthesisTargetId(null);
    setSynthesisMaterialIds([]);
    setSynthesisMessage(null);
    setShowSynthesis(true);
  }

  function closeSynthesis() {
    setShowSynthesis(false);
    setSynthesisTargetId(null);
    setSynthesisMaterialIds([]);
    setSynthesisMessage(null);
  }

  function pickSynthesisTarget(instanceId: string) {
    setSynthesisTargetId(instanceId);
    setSynthesisMaterialIds([]);
  }

  function toggleSynthesisMaterial(instanceId: string) {
    setSynthesisMaterialIds((ids) =>
      ids.includes(instanceId) ? ids.filter((id) => id !== instanceId) : [...ids, instanceId]
    );
  }

  function confirmSynthesis() {
    if (!saveData || !synthesisPreview) return;
    const next = applySynthesis(saveData, synthesisPreview);
    saveGame1Data(next);
    setSaveData(next);
    setSynthesisMessage(
      `${synthesisPreview.survivorItem.name} +${synthesisPreview.resultPlusFloored} になりました`
    );
    setSynthesisTargetId(null);
    setSynthesisMaterialIds([]);
  }

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

  function openTrainSheet() {
    setTrainInput("");
    setTrainMessage(null);
    setShowTrainSheet(true);
  }

  function submitTrain() {
    if (!saveData) return;
    const amount = Math.floor(Number(trainInput));
    if (!Number.isFinite(amount) || amount <= 0) {
      setTrainMessage("1以上の数値を入力してください");
      return;
    }
    if (amount > saveData.expPoints) {
      setTrainMessage("経験値ポイントが足りません");
      return;
    }
    const beforeLevel = getCharacterLevel(saveData, currentId);
    const next = investExpInCharacter(saveData, currentId, amount);
    saveGame1Data(next);
    setSaveData(next);
    const afterLevel = getCharacterLevel(next, currentId);
    setTrainInput("");
    setTrainMessage(
      afterLevel > beforeLevel
        ? `Lv${beforeLevel} → Lv${afterLevel} になりました`
        : `${amount}pt投入しました（レベルは変わらず）`
    );
  }

  function openSkillSheet() {
    setSkillMessage(null);
    setShowSkillSheet(true);
  }

  function submitSkillInvest(skillId: string, wasUnlocked: boolean) {
    if (!saveData) return;
    if (saveData.skillPoints < SKILL_POINT_COST_PER_STEP) {
      setSkillMessage("スキルポイントが足りません");
      return;
    }
    const next = investSkillPoints(saveData, skillId);
    saveGame1Data(next);
    setSaveData(next);
    setSkillMessage(wasUnlocked ? "強化しました" : "解放しました");
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

  function equip(instanceId: string) {
    if (!picker) return;
    if (picker.kind === "weapon") {
      updateEquipment({ ...currentEquipment, weapon: instanceId });
    } else {
      const artifacts = [...currentEquipment.artifacts] as CharacterEquipment["artifacts"];
      artifacts[picker.index] = instanceId;
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

  const swipeEnabled = unlockedCharacters.length > 1;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!swipeEnabled || isSettling) return;
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
      <GameBackground
        baseGradient={CHARACTER_BG_COLORS[currentId]?.base}
        glowColor={CHARACTER_BG_COLORS[currentId]?.glow}
        textColor={CHARACTER_BG_COLORS[currentId]?.text}
      />

      <div className="relative z-10 flex h-full touch-none flex-col">
        <div className="relative flex flex-shrink-0 items-center justify-center bg-black px-16 pb-3.5 pt-[calc(0.875rem_+_env(safe-area-inset-top))]">
          {saveData?.testMode && (
            <TestModeBadge className="absolute left-3 top-1/2 -translate-y-1/2" />
          )}
          <p className="text-xl font-bold tracking-wide text-white">{currentBaseInfo?.name ?? ""}</p>
          <button
            onClick={toggleParty}
            className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold text-white"
          >
            <span
              className={`flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded border-2 ${
                isInParty ? "border-[#c9c3ff] bg-[#c9c3ff]" : "border-white/50 bg-transparent"
              }`}
            >
              {isInParty && (
                <svg width="9" height="9" viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M2 6l3 3 5-6" stroke="#171717" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            {partyWarning ? "上限3人" : "参加"}
          </button>
        </div>

        <div
          ref={frameRef}
          className="relative flex-1 touch-none overflow-hidden"
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

        <div className="px-4 pb-3">
          <p className="mb-1.5 text-[11px] font-medium tracking-wide text-[#b8b3d9]">装備</p>
          <div className="grid grid-cols-4 gap-3">
            <EquipSlot caption="武器" entry={weaponEntry} onClick={() => setPicker({ kind: "weapon" })} />
            {([0, 1, 2] as const).map((i) => (
              <EquipSlot
                key={i}
                caption="アーティファクト"
                entry={artifactEntries[i]}
                onClick={() => setPicker({ kind: "artifact", index: i })}
              />
            ))}
          </div>
        </div>

        <div className="px-4 pb-28">
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
                <span className="font-bold tabular-nums">{displayedCritRate}%</span>
              </div>
              <div className="flex justify-between">
                <span>攻撃力</span>
                <span className="font-bold tabular-nums">{stats.atk.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>会心ダメージ</span>
                <span className="font-bold tabular-nums">{displayedCritDamage}%</span>
              </div>
              <div className="flex justify-between">
                <span>防御力</span>
                <span className="font-bold tabular-nums">{stats.def.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>属性耐性</span>
                <span className="font-bold tabular-nums">{displayedElementResist}%</span>
              </div>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2">
            <button
              onClick={openTrainSheet}
              className="rounded-xl border border-[rgba(201,195,255,0.4)] bg-[rgba(255,255,255,0.09)] py-2.5 text-sm font-bold text-[#eee9ff] backdrop-blur-sm"
            >
              訓練
            </button>
            <button
              onClick={openSynthesis}
              className="rounded-xl border border-[rgba(201,195,255,0.4)] bg-[rgba(255,255,255,0.09)] py-2.5 text-sm font-bold text-[#eee9ff] backdrop-blur-sm"
            >
              合成
            </button>
            <button
              onClick={openSkillSheet}
              className="rounded-xl border border-[rgba(201,195,255,0.4)] bg-[rgba(255,255,255,0.09)] py-2.5 text-sm font-bold text-[#eee9ff] backdrop-blur-sm"
            >
              スキル
            </button>
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
              <div className="grid grid-cols-8 gap-1.5">
                {candidates.map(({ item, instance }) => {
                  const plus = flooredPlus(instance);
                  return (
                    <button
                      key={instance.instanceId}
                      onClick={() => equip(instance.instanceId)}
                      className="relative rounded-lg border-2 border-zinc-300 bg-white p-1"
                    >
                      <img
                        src={item.asset}
                        alt={item.name}
                        className="aspect-square w-full rounded object-cover"
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
            )}
          </div>
        </>
      )}

      {showTrainSheet && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/45"
            onClick={() => setShowTrainSheet(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-x-0 bottom-0 z-[61] rounded-t-2xl border-t-2 border-black bg-[#fffaf0] p-4 pb-6">
            <p className="mb-1 font-bold text-black">
              {currentBaseInfo?.name ?? ""}を訓練（Lv{level}）
            </p>
            <p className="mb-3 text-xs text-zinc-500">
              経験値ポイントを渡してレベルを上げます。所持：{(saveData?.expPoints ?? 0).toLocaleString()}pt
            </p>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={trainInput}
              onChange={(e) => setTrainInput(e.target.value)}
              placeholder="渡すポイント数"
              className="w-full rounded-lg border-2 border-zinc-300 px-3 py-2 text-sm text-black outline-none focus:border-black"
            />
            {trainMessage && <p className="mt-2 text-xs font-bold text-[#4a3f86]">{trainMessage}</p>}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowTrainSheet(false)}
                className="flex-1 rounded-full border-2 border-zinc-300 py-2 text-sm font-bold text-zinc-600"
              >
                閉じる
              </button>
              <button
                onClick={submitTrain}
                className="flex-1 rounded-full border-2 border-black bg-[#c9c3ff] py-2 text-sm font-bold text-black"
              >
                決定
              </button>
            </div>
          </div>
        </>
      )}

      {showSkillSheet && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/45"
            onClick={() => setShowSkillSheet(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-x-0 bottom-0 z-[61] max-h-[80vh] overflow-y-auto rounded-t-2xl border-t-2 border-black bg-[#fffaf0] p-4 pb-6">
            <p className="mb-1 font-bold text-black">{currentBaseInfo?.name ?? ""}のスキル</p>
            <p className="mb-3 text-xs text-zinc-500">
              スキルポイント{SKILL_POINT_COST_PER_STEP}ptで解放・強化ができます。所持：
              {(saveData?.skillPoints ?? 0).toLocaleString()}pt
            </p>
            <div className="flex flex-col gap-2">
              {currentSkillKit.map((skill) => {
                const invested = saveData?.skillInvestedPoints[skill.id] ?? 0;
                const unlocked = isSkillUnlocked(skill.id, invested);
                const plus = skillPlusLevel(skill.id, invested);
                const remainingToNext = pointsToNextStep(skill.id, invested);
                const canInvest = (saveData?.skillPoints ?? 0) >= SKILL_POINT_COST_PER_STEP;
                return (
                  <div
                    key={skill.id}
                    className="flex items-center gap-3 rounded-xl border-2 border-zinc-300 bg-white p-2"
                  >
                    {unlocked ? (
                      <img
                        src={skill.icon}
                        alt={skill.name}
                        className="h-12 w-12 flex-shrink-0 rounded-lg object-contain"
                      />
                    ) : (
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-xl">
                        🔒
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      {unlocked ? (
                        <>
                          <p className="truncate text-sm font-bold text-black">
                            {skill.name}　+{plus}
                          </p>
                          <p className="truncate text-[11px] text-zinc-500">{skill.description}</p>
                        </>
                      ) : (
                        <>
                          <p className="truncate text-sm font-bold text-zinc-400">？？？</p>
                          <p className="truncate text-[11px] text-zinc-400">未解放のスキル</p>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => submitSkillInvest(skill.id, unlocked)}
                      disabled={!canInvest}
                      className="flex-shrink-0 rounded-full border-2 border-black bg-[#c9c3ff] px-3 py-1.5 text-xs font-bold text-black disabled:opacity-40"
                    >
                      {unlocked ? "強化" : "解放"}
                      <span className="ml-1 text-[10px] font-medium">
                        ({remainingToNext}pt)
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
            {skillMessage && <p className="mt-3 text-xs font-bold text-[#4a3f86]">{skillMessage}</p>}
            <button
              onClick={() => setShowSkillSheet(false)}
              className="mt-4 w-full rounded-full border-2 border-zinc-300 py-2 text-sm font-bold text-zinc-600"
            >
              閉じる
            </button>
          </div>
        </>
      )}

      {showSynthesis && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/45" onClick={closeSynthesis} aria-hidden="true" />
          <div className="fixed inset-x-0 bottom-0 z-[61] max-h-[80vh] overflow-y-auto rounded-t-2xl border-t-2 border-black bg-[#fffaf0] p-4 pb-6">
            {!synthesisTargetEntry ? (
              <>
                <p className="mb-1 font-bold text-black">合成：残す方を選ぶ</p>
                <p className="mb-3 text-xs text-zinc-500">
                  強化したい武器・アーティファクトを選んでください（{currentBaseInfo?.name ?? ""}が今装備中のものも選べます）。
                </p>
                {synthesisEligible.length === 0 ? (
                  <p className="py-6 text-center text-sm text-zinc-500">合成できるアイテムを持っていません</p>
                ) : (
                  <div className="grid grid-cols-8 gap-1.5">
                    {synthesisEligible.map(({ instance, item }) => {
                      const plus = flooredPlus(instance);
                      return (
                        <button
                          key={instance.instanceId}
                          onClick={() => pickSynthesisTarget(instance.instanceId)}
                          className="relative rounded-lg border-2 border-zinc-300 bg-white p-1"
                        >
                          <img src={item.asset} alt={item.name} className="aspect-square w-full rounded object-cover" />
                          {plus > 0 && (
                            <span className="absolute bottom-0.5 right-0.5 rounded-full bg-black px-1 py-0.5 text-[8px] font-bold text-white">
                              +{plus}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                <button
                  onClick={closeSynthesis}
                  className="mt-4 w-full rounded-full border-2 border-zinc-300 py-2 text-sm font-bold text-zinc-600"
                >
                  閉じる
                </button>
              </>
            ) : (
              <>
                <div className="mb-3 flex items-center gap-2">
                  <img
                    src={synthesisTargetEntry.item.asset}
                    alt={synthesisTargetEntry.item.name}
                    className="h-12 w-12 rounded-lg border-2 border-black bg-white object-cover"
                  />
                  <div>
                    <p className="font-bold text-black">
                      {synthesisTargetEntry.item.name} +{flooredPlus(synthesisTargetEntry.instance)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      レア度 {synthesisTargetEntry.item.rarity} ・ 素材を選んでください（複数選択可）
                    </p>
                  </div>
                </div>

                {synthesisMaterialCandidates.length === 0 ? (
                  <p className="py-6 text-center text-sm text-zinc-500">
                    合成できる同じ種類のアイテムを他に持っていません
                  </p>
                ) : (
                  <div className="grid grid-cols-8 gap-1.5">
                    {synthesisMaterialCandidates.map(({ instance, item }) => {
                      const plus = flooredPlus(instance);
                      const selected = synthesisMaterialIds.includes(instance.instanceId);
                      return (
                        <button
                          key={instance.instanceId}
                          onClick={() => toggleSynthesisMaterial(instance.instanceId)}
                          className={`relative rounded-lg border-2 bg-white p-1 ${
                            selected ? "border-[#4a3f86] shadow-[2px_2px_0_0_#4a3f86]" : "border-zinc-300"
                          }`}
                        >
                          <img src={item.asset} alt={item.name} className="aspect-square w-full rounded object-cover" />
                          {plus > 0 && (
                            <span className="absolute bottom-0.5 right-0.5 rounded-full bg-black px-1 py-0.5 text-[8px] font-bold text-white">
                              +{plus}
                            </span>
                          )}
                          {selected && (
                            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#4a3f86] text-[9px] font-bold text-white">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {synthesisPreview && (
                  <p className="mt-3 rounded-lg bg-[rgba(74,63,134,0.08)] px-3 py-2 text-xs font-bold text-[#4a3f86]">
                    {synthesisPreview.survivorItem.name}　+{synthesisPreview.beforePlusFloored} → +
                    {synthesisPreview.resultPlusFloored}
                  </p>
                )}
                {synthesisMessage && (
                  <p className="mt-3 text-xs font-bold text-[#4a3f86]">{synthesisMessage}</p>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setSynthesisTargetId(null)}
                    className="flex-1 rounded-full border-2 border-zinc-300 py-2 text-sm font-bold text-zinc-600"
                  >
                    戻る
                  </button>
                  <button
                    onClick={confirmSynthesis}
                    disabled={!synthesisPreview}
                    className="flex-1 rounded-full border-2 border-black bg-[#c9c3ff] py-2 text-sm font-bold text-black disabled:opacity-40"
                  >
                    合成する
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
