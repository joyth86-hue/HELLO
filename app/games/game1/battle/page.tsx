"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCharacterBaseInfo } from "@/lib/characters-info";
import { getCharacterStatsAtLevel } from "@/lib/character-growth";
import { getEnemyBaseInfo } from "@/lib/enemies-info";
import {
  getScaledEnemyStats,
  getFieldImagePathForStage,
  pickRandomEnemyFromPattern,
} from "@/lib/enemy-scaling";
import { calculateDamage } from "@/lib/combat";
import {
  addItemsToInventory,
  getCharacterEquipment,
  getCharacterLevel,
  loadGame1Data,
  saveGame1Data,
  type Game1SaveData,
} from "@/lib/game1-data";
import { calculateEquipmentBonus, applyEquipmentBonusToStats } from "@/lib/item-effects";
import { rollDropForBattle, type DroppedItem } from "@/lib/item-drop";
import { getItemBaseInfo, type ItemBaseInfo } from "@/lib/items-info";
import { getCharacterSkillKit } from "@/lib/skills-info";

// 本実装のステージ内10バトル連戦（S-1〜S-10）。詳細はdocs/spec/screens/battle.md参照。
// ステージ選択画面（/games/game1/stages）からは ?stage=N 付きで遷移してくる。
//
// 1ステージ＝10バトル連戦。S-1〜S-9は敵3体、S-10（ボス）は敵1体。HPは連戦中
// ずっと持ち越し（S-1開始時に全回復）。全滅したらそのステージは未クリアの
// まま、経験値も加算されない。S-10のボスを倒すとステージクリアとなり、
// 貯まった経験値ポイントとmaxClearedStageをまとめて保存する。
const BATTLES_PER_STAGE = 10;
const NORMAL_ENEMY_COUNT = 3;

// 左右対称の配置。Artifactで検討したモックアップ（top 42/55/68%, 幅16%）と同じ値。
const SLOT_POSITIONS = [
  { top: "42%", z: 3 },
  { top: "55%", z: 2 },
  { top: "68%", z: 1 },
];
// 敵1体（ボス戦）のときは中央のスロットに配置する。
const BOSS_SLOT_INDEX = 1;

type Pose = "idle" | "attack" | "damage";
type DamagePhase = "hidden" | "in" | "visible" | "out";

interface BattleUnit {
  key: string; // "ally-0" 等、表示スロットに紐づく一意キー
  side: "ally" | "enemy";
  slot: number;
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  critRateBonus: number; // 装備による会心率加算（フラクション。敵は常に0）
  critDamageBonus: number; // 装備による会心ダメージ加算（フラクション。敵は常に0）
  exp: number; // 敵のみ使用（倒したときに加算する経験値）
  alive: boolean;
  pose: Pose;
  stepped: boolean;
  damagePhase: DamagePhase;
  lastDamage: number;
  lastCrit: boolean;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function poseAsset(unit: BattleUnit): string {
  const assets =
    unit.side === "ally"
      ? getCharacterBaseInfo(unit.id)?.assets
      : getEnemyBaseInfo(unit.id)?.assets;
  if (!assets) return "";
  if (unit.pose === "attack") return assets.battleAttack;
  if (unit.pose === "damage") return assets.battleDamage;
  return assets.battleIdle;
}

function buildAllyUnits(partyIds: string[], saveData: Game1SaveData): BattleUnit[] {
  return partyIds.map((id, slot) => {
    const level = getCharacterLevel(saveData, id);
    const baseStats = getCharacterStatsAtLevel(id, level);
    const bonus = calculateEquipmentBonus(getCharacterEquipment(saveData, id));
    const stats = applyEquipmentBonusToStats(baseStats, bonus);
    return {
      key: `ally-${slot}`,
      side: "ally",
      slot,
      id,
      name: getCharacterBaseInfo(id)?.name ?? id,
      hp: stats.hp,
      maxHp: stats.hp,
      atk: stats.atk,
      def: stats.def,
      critRateBonus: bonus.critRatePoints / 100,
      critDamageBonus: bonus.critDamagePoints / 100,
      exp: 0,
      alive: true,
      pose: "idle",
      stepped: false,
      damagePhase: "hidden",
      lastDamage: 0,
      lastCrit: false,
    };
  });
}

function buildEnemyUnits(stage: number, isBoss: boolean): BattleUnit[] {
  const count = isBoss ? 1 : NORMAL_ENEMY_COUNT;
  return Array.from({ length: count }, (_, i) => {
    const enemyId = pickRandomEnemyFromPattern(stage);
    const scaled = getScaledEnemyStats(enemyId, stage, isBoss);
    return {
      key: `enemy-${i}`,
      side: "enemy",
      slot: isBoss ? BOSS_SLOT_INDEX : i,
      id: enemyId,
      name: getEnemyBaseInfo(enemyId)?.name ?? enemyId,
      hp: scaled.hp,
      maxHp: scaled.hp,
      atk: scaled.atk,
      def: scaled.def,
      critRateBonus: 0,
      critDamageBonus: 0,
      exp: scaled.exp,
      alive: true,
      pose: "idle",
      stepped: false,
      damagePhase: "hidden",
      lastDamage: 0,
      lastCrit: false,
    };
  });
}

export default function BattlePage() {
  const router = useRouter();
  const [units, setUnits] = useState<BattleUnit[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [awaitingPlayer, setAwaitingPlayer] = useState(false);
  const [result, setResult] = useState<"clear" | "defeat" | null>(null);
  const [turnMessage, setTurnMessage] = useState("");
  const [stageLabel, setStageLabel] = useState(1);
  const [subBattleLabel, setSubBattleLabel] = useState(1);
  const [expEarned, setExpEarned] = useState(0);
  const [droppedItemSummary, setDroppedItemSummary] = useState<
    { item: ItemBaseInfo; quantity: number }[]
  >([]);

  const unitsRef = useRef<BattleUnit[]>([]);
  const startedRef = useRef(false);
  const resolvePlayerActionRef = useRef<(() => void) | null>(null);
  const stageNumberRef = useRef(1);

  function sync() {
    setUnits(unitsRef.current.map((u) => ({ ...u })));
  }

  function getUnit(key: string) {
    return unitsRef.current.find((u) => u.key === key)!;
  }

  function randomAliveTarget(side: "ally" | "enemy") {
    const candidates = unitsRef.current.filter((u) => u.side === side && u.alive);
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  async function performAttack(attackerKey: string, targetKey: string) {
    const attacker = getUnit(attackerKey);
    const target = getUnit(targetKey);
    const { damage, isCrit } = calculateDamage(
      attacker.atk,
      target.def,
      attacker.critRateBonus,
      attacker.critDamageBonus
    );

    attacker.stepped = true;
    sync();
    await wait(300);

    attacker.pose = "attack";
    sync();
    await wait(300);

    target.hp = Math.max(0, target.hp - damage);
    target.pose = "damage";
    target.damagePhase = "in";
    target.lastDamage = damage;
    target.lastCrit = isCrit;
    sync();
    // requestAnimationFrameはタブが非表示（バックグラウンド）だと発火しないため、
    // CSSトランジションの開始待ちにはsetTimeoutベースのwait()を使う。
    await wait(20);
    target.damagePhase = "visible";
    sync();
    await wait(500);
    target.damagePhase = "out";
    sync();
    await wait(150);
    target.damagePhase = "hidden";
    target.alive = target.hp > 0;
    target.pose = "idle";
    sync();

    attacker.pose = "idle";
    sync();
    await wait(200);
    attacker.stepped = false;
    sync();
    await wait(300);
  }

  // 1回分のバトル（S-s）を、決着がつくまで進める。
  async function runBattleLoop(): Promise<"victory" | "defeat"> {
    let index = 0;
    const order = unitsRef.current.map((u) => u.key);
    for (;;) {
      const alliesAlive = unitsRef.current.some((u) => u.side === "ally" && u.alive);
      const enemiesAlive = unitsRef.current.some((u) => u.side === "enemy" && u.alive);
      if (!enemiesAlive) {
        setActiveKey(null);
        return "victory";
      }
      if (!alliesAlive) {
        setActiveKey(null);
        return "defeat";
      }

      const key = order[index % order.length];
      index++;
      const unit = getUnit(key);
      if (!unit.alive) continue;

      setActiveKey(key);
      setTurnMessage(`${unit.name}のターン`);

      if (unit.side === "enemy") {
        await wait(400);
        const target = randomAliveTarget("ally");
        await performAttack(unit.key, target.key);
        continue;
      }

      // 仲間のターン：通常攻撃ボタンが押されるまで待つ
      setAwaitingPlayer(true);
      await new Promise<void>((resolve) => {
        resolvePlayerActionRef.current = resolve;
      });
      setAwaitingPlayer(false);

      const target = randomAliveTarget("enemy");
      if (target) {
        await performAttack(unit.key, target.key);
      }
    }
  }

  // ステージ全体（S-1〜S-10）を通しで進める。
  async function playStage(stage: number, saveData: Game1SaveData) {
    try {
      let allies = buildAllyUnits(saveData.activePartyIds, saveData);
      let totalExp = 0;
      const droppedItems: DroppedItem[] = [];

      for (let sub = 1; sub <= BATTLES_PER_STAGE; sub++) {
        setSubBattleLabel(sub);
        const isBoss = sub === BATTLES_PER_STAGE;
        const enemies = buildEnemyUnits(stage, isBoss);
        unitsRef.current = [...allies, ...enemies];
        sync();

        const outcome = await runBattleLoop();
        if (outcome === "defeat") {
          // 全滅した場合は経験値・アイテムいずれも加算しない（クリアボーナス扱いのため）。
          setExpEarned(0);
          setResult("defeat");
          return;
        }

        totalExp += enemies.reduce((sum, e) => sum + e.exp, 0);
        const drop = rollDropForBattle(stage, isBoss);
        if (drop) droppedItems.push(drop);
        allies = unitsRef.current.filter((u) => u.side === "ally");

        if (sub < BATTLES_PER_STAGE) {
          setTurnMessage(`${sub}戦目クリア！`);
          await wait(700);
        }
      }

      // S-10（ボス）を撃破：ステージクリア
      const data = loadGame1Data();
      let next: Game1SaveData = {
        ...data,
        maxClearedStage: Math.max(data.maxClearedStage, stage),
        expPoints: data.expPoints + totalExp,
      };
      next = addItemsToInventory(next, droppedItems.map((d) => d.itemId));
      saveGame1Data(next);
      setExpEarned(totalExp);

      const summaryCounts = new Map<string, number>();
      for (const d of droppedItems) {
        summaryCounts.set(d.itemId, (summaryCounts.get(d.itemId) ?? 0) + 1);
      }
      setDroppedItemSummary(
        Array.from(summaryCounts.entries())
          .map(([itemId, quantity]) => {
            const item = getItemBaseInfo(itemId);
            return item ? { item, quantity } : null;
          })
          .filter((entry): entry is { item: ItemBaseInfo; quantity: number } => entry !== null)
      );
      setResult("clear");
    } catch (err) {
      // 想定外のエラーで進行不能になった場合に、無言のまま固まるのを避ける保険。
      console.error("battle stage failed", err);
      setResult("defeat");
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stage = Number(params.get("stage"));
    const resolvedStage = Number.isFinite(stage) && stage > 0 ? stage : 1;
    stageNumberRef.current = resolvedStage;
    setStageLabel(resolvedStage);

    if (startedRef.current) return;
    startedRef.current = true;

    const saveData = loadGame1Data();
    if (saveData.activePartyIds.length === 0) {
      router.push("/games/game1/home");
      return;
    }
    playStage(resolvedStage, saveData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!result) return;
    // ドロップアイテムがある場合は読む時間を少し長めに取る。
    const delay = result === "clear" && droppedItemSummary.length > 0 ? 3000 : 1800;
    const t = window.setTimeout(() => {
      router.push("/games/game1/home");
    }, delay);
    return () => window.clearTimeout(t);
  }, [result, router, droppedItemSummary]);

  function handleNormalAttack() {
    resolvePlayerActionRef.current?.();
    resolvePlayerActionRef.current = null;
  }

  const background = getFieldImagePathForStage(stageNumberRef.current);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black">
      <img
        src={background}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute left-4 top-[calc(1rem_+_env(safe-area-inset-top))] z-20 rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold text-white">
        ステージ {stageLabel} - {subBattleLabel}/{BATTLES_PER_STAGE}
        {subBattleLabel === BATTLES_PER_STAGE ? "（ボス）" : ""}
      </div>

      {turnMessage && !result && (
        <div className="absolute left-1/2 top-[calc(1rem_+_env(safe-area-inset-top))] z-20 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-xs font-bold text-white">
          {turnMessage}
        </div>
      )}

      {units.map((unit) => {
        const pos = SLOT_POSITIONS[unit.slot];
        const sideKey = unit.side === "ally" ? "left" : "right";
        const stepPx = unit.side === "ally" ? 24 : -24;
        return (
          <div
            key={unit.key}
            className="absolute flex flex-col items-center"
            style={{
              [sideKey]: "6%",
              top: pos.top,
              width: "16%",
              zIndex: pos.z,
              transform: `translateX(${unit.stepped ? stepPx : 0}px)`,
              transition: "transform 300ms ease-out, opacity 300ms ease-out",
              opacity: unit.alive ? 1 : 0.25,
            } as React.CSSProperties}
          >
            {activeKey === unit.key && !result && (
              <div className="mb-1 h-2 w-2 animate-pulse rounded-full bg-yellow-300" />
            )}
            <div className="relative w-full">
              <span
                className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-base font-extrabold text-[#ff6b6b] [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]"
                style={{
                  opacity: unit.damagePhase === "visible" ? 1 : 0,
                  transition: "opacity 150ms ease-out",
                }}
              >
                -{unit.lastDamage}
                {unit.lastCrit ? " 会心!" : ""}
              </span>
              <img
                src={poseAsset(unit)}
                alt={unit.name}
                className="w-full select-none object-contain"
                draggable={false}
              />
            </div>
            <div className="mt-1 w-full rounded-full bg-black/55 px-1 py-0.5 text-center text-[9px] font-bold text-white">
              {unit.name} {unit.hp}/{unit.maxHp}
            </div>
          </div>
        );
      })}

      {result && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-black/60">
          <p className="text-3xl font-extrabold text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">
            {result === "clear" ? "ステージクリア！" : "敗北…"}
          </p>
          {result === "clear" && (
            <>
              <p className="text-sm font-bold text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]">
                獲得経験値：{expEarned}pt
              </p>
              {droppedItemSummary.length > 0 && (
                <div className="mt-1 flex flex-wrap items-center justify-center gap-2 px-6">
                  {droppedItemSummary.map(({ item, quantity }) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-1.5 rounded-full bg-black/55 py-1 pl-1 pr-2.5"
                    >
                      <img
                        src={item.asset}
                        alt={item.name}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                      <span className="text-[11px] font-bold text-white">
                        {item.name}
                        {quantity > 1 ? ` ×${quantity}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {awaitingPlayer && !result && (() => {
        const activeUnit = units.find((u) => u.key === activeKey);
        const baseInfo = activeUnit ? getCharacterBaseInfo(activeUnit.id) : undefined;
        // スキルは将来的に「初期は通常攻撃＋スキル1つのみ解放、以降はスキル
        // ポイントで順次解放・育成」という設計にする予定（docs/spec/skills.md
        // 参照）。解放状況を持つセーブデータがまだ無いため、動作確認として
        // 一旦キットの4枠を全て表示している（ここが将来、解放済み分だけに
        // 絞り込む・未解放は鍵アイコン表示にする、などの分岐ポイントになる）。
        const skillKit = activeUnit ? getCharacterSkillKit(activeUnit.id) : [];
        return (
          <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-around border-t border-[rgba(201,195,255,0.25)] bg-black/85 px-1 pb-4 pt-4">
            <button
              onClick={handleNormalAttack}
              className="flex flex-1 flex-col items-center gap-1"
            >
              {baseInfo && (
                <img
                  src={baseInfo.assets.normalAttackIcon}
                  alt="通常攻撃"
                  className="h-14 w-14 rounded-xl object-contain"
                  draggable={false}
                />
              )}
            </button>
            {skillKit.map((skill) => (
              <div key={skill.id} className="flex flex-1 flex-col items-center gap-1 opacity-40">
                <img
                  src={skill.icon}
                  alt={skill.name}
                  className="h-14 w-14 rounded-xl object-contain"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
