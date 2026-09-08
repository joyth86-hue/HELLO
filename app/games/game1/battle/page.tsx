"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCharacterBaseInfo } from "@/lib/characters-info";
import { getEnemyBaseInfo } from "@/lib/enemies-info";

// テスト用の戦闘画面。まだ実際のパーティ編成・敵の出現テーブルとは
// 繋がっておらず、以下の仮データ・仮ステータスで通常攻撃だけを
// 一巡させて動作確認するためのもの。詳細はdocs/spec/screens/battle-test.md参照。
const TEST_ALLY_IDS = ["c01", "c02", "c03"];
const TEST_ENEMY_IDS = ["e01", "e02", "e03"];
const UNIT_HP = 200;
const ATTACK_POWER = 100;
const BACKGROUND = "/backgrounds/fields/f01_sougen_hiru.png";

// 左右対称の配置。Artifactで検討したモックアップ（top 42/55/68%, 幅16%）と同じ値。
const SLOT_POSITIONS = [
  { top: "42%", z: 3 },
  { top: "55%", z: 2 },
  { top: "68%", z: 1 },
];

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
  alive: boolean;
  pose: Pose;
  stepped: boolean;
  damagePhase: DamagePhase;
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

function buildInitialUnits(): BattleUnit[] {
  const allies: BattleUnit[] = TEST_ALLY_IDS.map((id, slot) => ({
    key: `ally-${slot}`,
    side: "ally",
    slot,
    id,
    name: getCharacterBaseInfo(id)?.name ?? id,
    hp: UNIT_HP,
    maxHp: UNIT_HP,
    alive: true,
    pose: "idle",
    stepped: false,
    damagePhase: "hidden",
  }));
  const enemies: BattleUnit[] = TEST_ENEMY_IDS.map((id, slot) => ({
    key: `enemy-${slot}`,
    side: "enemy",
    slot,
    id,
    name: getEnemyBaseInfo(id)?.name ?? id,
    hp: UNIT_HP,
    maxHp: UNIT_HP,
    alive: true,
    pose: "idle",
    stepped: false,
    damagePhase: "hidden",
  }));
  return [...allies, ...enemies];
}

export default function BattleTestPage() {
  const router = useRouter();
  const [units, setUnits] = useState<BattleUnit[]>(() => buildInitialUnits());
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [awaitingPlayer, setAwaitingPlayer] = useState(false);
  const [result, setResult] = useState<"victory" | "defeat" | null>(null);
  const [turnMessage, setTurnMessage] = useState("");

  const unitsRef = useRef<BattleUnit[]>(units);
  const startedRef = useRef(false);
  const resolvePlayerActionRef = useRef<(() => void) | null>(null);

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

    attacker.stepped = true;
    sync();
    await wait(300);

    attacker.pose = "attack";
    sync();
    await wait(300);

    target.hp = Math.max(0, target.hp - ATTACK_POWER);
    target.pose = "damage";
    target.damagePhase = "in";
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

  async function runTurn(order: string[], index: number) {
    try {
      await runTurnInner(order, index);
    } catch (err) {
      // 想定外のエラーで進行不能になった場合に、無言のまま固まるのを避ける保険。
      console.error("battle turn failed", err);
      setResult("defeat");
    }
  }

  async function runTurnInner(order: string[], index: number) {
    const alliesAlive = unitsRef.current.some((u) => u.side === "ally" && u.alive);
    const enemiesAlive = unitsRef.current.some((u) => u.side === "enemy" && u.alive);
    if (!enemiesAlive) {
      setActiveKey(null);
      setResult("victory");
      return;
    }
    if (!alliesAlive) {
      setActiveKey(null);
      setResult("defeat");
      return;
    }

    const key = order[index % order.length];
    const unit = getUnit(key);
    if (!unit.alive) {
      await runTurn(order, index + 1);
      return;
    }

    setActiveKey(key);
    setTurnMessage(`${unit.name}のターン`);

    if (unit.side === "enemy") {
      await wait(400);
      const target = randomAliveTarget("ally");
      await performAttack(unit.key, target.key);
      await runTurn(order, index + 1);
      return;
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
    await runTurn(order, index + 1);
  }

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const order = unitsRef.current.map((u) => u.key);
    runTurn(order, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!result) return;
    const t = window.setTimeout(() => {
      router.push("/games/game1/home");
    }, 1800);
    return () => window.clearTimeout(t);
  }, [result, router]);

  function handleNormalAttack() {
    resolvePlayerActionRef.current?.();
    resolvePlayerActionRef.current = null;
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      <img
        src={BACKGROUND}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {turnMessage && !result && (
        <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-xs font-bold text-white">
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
                -{ATTACK_POWER}
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
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
          <p className="text-3xl font-extrabold text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">
            {result === "victory" ? "勝利！" : "敗北…"}
          </p>
        </div>
      )}

      {awaitingPlayer && !result && (
        <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-around border-t border-[rgba(201,195,255,0.25)] bg-black/85 px-1 pb-4 pt-4">
          <button
            onClick={handleNormalAttack}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#c9c3ff] bg-[#2c2557] text-xs font-bold text-white">
              通常攻撃
            </div>
          </button>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex flex-1 flex-col items-center gap-1 opacity-40">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/30 bg-white/5 text-xs font-bold text-white">
                スキル{n}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
