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
  CHARACTER_UNLOCK_STAGE,
  getCharacterEquipment,
  getCharacterLevel,
  loadGame1Data,
  saveGame1Data,
  type Game1SaveData,
} from "@/lib/game1-data";
import {
  calculateEquipmentBonus,
  applyEquipmentBonusToStats,
  describeItemEffect,
} from "@/lib/item-effects";
import { rollDropForBattle, type DroppedItem } from "@/lib/item-drop";
import { getItemBaseInfo, RARITY_COLOR, type ItemBaseInfo } from "@/lib/items-info";
import { SYNTHESIS_PLUS_STEP_PERCENT } from "@/lib/item-synthesis";
import {
  getCharacterSkillKit,
  type BuffStat,
  type SkillBaseInfo,
  type SkillElement,
} from "@/lib/skills-info";
import {
  isSkillUnlocked,
  skillPlusLevel,
  SKILL_POINTS_PER_STAGE_CLEAR,
} from "@/lib/skill-progression";
import { addBattleWins, addStageClear } from "@/lib/daily-missions";
import { loadGlobalData } from "@/lib/storage";
import {
  getNormalBattleBgmForStage,
  pickRandomBossBattleBgm,
  STAGE_CLEAR_BGM,
  DEFEAT_BGM,
} from "@/lib/audio-tracks";
import BgmPlayer from "@/components/BgmPlayer";

// 本実装のステージ内10バトル連戦（S-1〜S-10）。詳細はdocs/spec/screens/battle.md参照。
// ステージ選択画面（/games/game1/stages）からは ?stage=N 付きで遷移してくる。
//
// 1ステージ＝10バトル連戦。S-1〜S-9は敵3体、S-10（ボス）は敵1体。HPは連戦中
// ずっと持ち越し（S-1開始時に全回復）。全滅したらそのステージは未クリアの
// まま、経験値も加算されない。S-10のボスを倒すとステージクリアとなり、
// 貯まった経験値ポイント・スキルポイントとmaxClearedStageをまとめて保存する。
const BATTLES_PER_STAGE = 10;
const NORMAL_ENEMY_COUNT = 3;

// HPゲージの色。割合に応じて緑→黄→赤に変える（残量が一目で分かるようにするため）。
const HP_BAR_COLOR_HIGH = "#5be08a"; // 50%より上：緑
const HP_BAR_COLOR_MID = "#ffc25c"; // 20〜50%：黄
const HP_BAR_COLOR_LOW = "#ff6b6b"; // 20%以下：赤

function hpBarColor(ratio: number): string {
  if (ratio <= 0.2) return HP_BAR_COLOR_LOW;
  if (ratio <= 0.5) return HP_BAR_COLOR_MID;
  return HP_BAR_COLOR_HIGH;
}

// 左右対称の配置。Artifactで検討したモックアップ（top 42/55/68%, 幅16%）と同じ値。
const SLOT_POSITIONS = [
  { top: "42%", z: 3 },
  { top: "55%", z: 2 },
  { top: "68%", z: 1 },
];
// 敵1体（ボス戦）のときは中央のスロットに配置する。
const BOSS_SLOT_INDEX = 1;

type Pose = "idle" | "attack" | "damage";
type PopupPhase = "hidden" | "in" | "visible" | "out";
type PopupKind = "damage" | "heal";

interface ActiveBuff {
  stat: BuffStat;
  percentOrPoints: number;
  // このバフを受けた側の「自分の手番」が何回目に達したら切れるか（含む）。
  expiresAtOwnTurn: number;
}

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
  elementResistPoints: number; // 装備（ブローチ）による属性耐性pt。敵は常に0
  exp: number; // 敵のみ使用（倒したときに加算する経験値）
  alive: boolean;
  pose: Pose;
  stepped: boolean;
  popupPhase: PopupPhase;
  popupKind: PopupKind;
  popupValue: number;
  popupCrit: boolean;
  // CT（スキルのクールタイム）は「自分の手番が何回回ってきたか」で数える
  // （グローバルなターン数ではない）。ステージ内の10連戦をまたいで持ち越し、
  // ステージ開始（S-1）時のみリセットされる（HPの持ち越しと同じ扱い）。
  ownTurnCounter: number;
  // skillId -> 「自分の手番カウンターがこの値を超えたら使用可能」になる閾値。
  skillAvailableAtTurn: Record<string, number>;
  buffs: ActiveBuff[];
  // 妨害効果（お静かに／蔦縛りの矢）を受けている場合、次の自分の手番を1回失う。
  skipNextTurn: boolean;
}

type PlayerAction = { type: "normal" } | { type: "skill"; skill: SkillBaseInfo; plusLevel: number };

// 戦闘全体のテンポ倍率（2.0＝2倍速）。演出の間の待ち時間（tempoWait）だけに掛かる。
// 値を変えるだけでテンポ調整できる（ユーザー確認済み、1.5倍→2.0倍に調整）。
const BATTLE_TEMPO_MULTIPLIER = 2.0;

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// 演出のテンポに関わる待ち時間はこちらを使う（BATTLE_TEMPO_MULTIPLIERで一括調整できる）。
// CSSトランジション開始待ちのような技術的な最小待ち（showPopupのwait(20)）には使わない。
function tempoWait(ms: number) {
  return wait(ms / BATTLE_TEMPO_MULTIPLIER);
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

// 敵の属性（スキルの属性相性計算用）。表が決まるまでは実際には常に×1.0だが、
// 計算式には組み込んでおく。
function enemyElement(id: string): SkillElement {
  const element = getEnemyBaseInfo(id)?.element;
  return (element as SkillElement) ?? null;
}

// ステージクリア結果画面の「個別メッセージ」（仲間解放・機能解放など）。
// idはGame1SaveData.shownIndividualMessageIdsでの表示済み判定に使う
// （同じステージを周回しても、一度表示したメッセージは出さないため）。
interface IndividualMessage {
  id: string;
  title: string;
  description?: string;
}

// このステージのボスをクリアしたことで発生しうる個別メッセージの候補一覧
// （表示済みかどうかのフィルタは呼び出し側で行う）。
// 現状は仲間解放（CHARACTER_UNLOCK_STAGE）のみだが、今後「〇〇機能が解放された」
// 系のメッセージが増えてもここに追加していけばよい。
function getIndividualMessagesForStageClear(stage: number): IndividualMessage[] {
  const messages: IndividualMessage[] = [];
  for (const [characterId, unlockStage] of Object.entries(CHARACTER_UNLOCK_STAGE)) {
    if (unlockStage === stage) {
      const name = getCharacterBaseInfo(characterId)?.name ?? characterId;
      messages.push({
        id: `character-unlock:${characterId}`,
        title: `${name}が仲間になった！`,
        description: "「仲間」タブから編成に加えられます。",
      });
    }
  }
  return messages;
}

function buildAllyUnits(partyIds: string[], saveData: Game1SaveData): BattleUnit[] {
  return partyIds.map((id, slot) => {
    const level = getCharacterLevel(saveData, id);
    const baseStats = getCharacterStatsAtLevel(id, level);
    const bonus = calculateEquipmentBonus(getCharacterEquipment(saveData, id), saveData.inventory);
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
      elementResistPoints: bonus.elementResistPoints,
      exp: 0,
      alive: true,
      pose: "idle",
      stepped: false,
      popupPhase: "hidden",
      popupKind: "damage",
      popupValue: 0,
      popupCrit: false,
      ownTurnCounter: 0,
      skillAvailableAtTurn: {},
      buffs: [],
      skipNextTurn: false,
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
      elementResistPoints: 0,
      exp: scaled.exp,
      alive: true,
      pose: "idle",
      stepped: false,
      popupPhase: "hidden",
      popupKind: "damage",
      popupValue: 0,
      popupCrit: false,
      ownTurnCounter: 0,
      skillAvailableAtTurn: {},
      buffs: [],
      skipNextTurn: false,
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
  const [bgmEnabled, setBgmEnabled] = useState(true);
  // ボス以外はステージ固定・ボス戦はランダム・クリア/全滅では専用曲に切り替える
  // （docs/spec/audio.md参照）。stageが確定するまではnullで無音のまま。
  const [bgmSrc, setBgmSrc] = useState<string | null>(null);
  const [expEarned, setExpEarned] = useState(0);
  const [skillPointsEarned, setSkillPointsEarned] = useState(0);
  const [droppedItemSummary, setDroppedItemSummary] = useState<
    { item: ItemBaseInfo; quantity: number }[]
  >([]);
  const [bagFullCount, setBagFullCount] = useState(0);
  // 結果画面の「ページ」。0=基本メッセージ、1以降=individualMessagesの該当インデックス。
  const [resultPage, setResultPage] = useState(0);
  const [individualMessages, setIndividualMessages] = useState<IndividualMessage[]>([]);
  // 獲得アイテムのアイコンをタップした時に、効果を見せるためのポップアップ状態。
  const [detailItem, setDetailItem] = useState<ItemBaseInfo | null>(null);

  const unitsRef = useRef<BattleUnit[]>([]);
  const startedRef = useRef(false);
  const resolvePlayerActionRef = useRef<((action: PlayerAction) => void) | null>(null);
  const stageNumberRef = useRef(1);
  // スキルの解放状況（skillId -> 投資済pt）はステージ中は変化しない
  // （スキルポイントの消費はキャラ育成画面側の操作のため）。
  const skillInvestedPointsRef = useRef<Record<string, number>>({});

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

  function mostWoundedAlly(): BattleUnit | undefined {
    const candidates = unitsRef.current.filter((u) => u.side === "ally" && u.alive);
    if (candidates.length === 0) return undefined;
    return candidates.reduce((worst, u) => (u.hp / u.maxHp < worst.hp / worst.maxHp ? u : worst));
  }

  function sumBuffFraction(unit: BattleUnit, stat: BuffStat): number {
    return unit.buffs
      .filter((b) => b.stat === stat)
      .reduce((sum, b) => sum + b.percentOrPoints / 100, 0);
  }

  async function showPopup(
    unitKey: string,
    popup: { kind: PopupKind; value: number; crit?: boolean }
  ) {
    const unit = getUnit(unitKey);
    if (popup.kind === "damage") unit.pose = "damage";
    unit.popupKind = popup.kind;
    unit.popupValue = popup.value;
    unit.popupCrit = popup.crit ?? false;
    unit.popupPhase = "in";
    sync();
    // requestAnimationFrameはタブが非表示（バックグラウンド）だと発火しないため、
    // CSSトランジションの開始待ちにはsetTimeoutベースのwait()を使う。
    await wait(20);
    unit.popupPhase = "visible";
    sync();
    await tempoWait(500);
    unit.popupPhase = "out";
    sync();
    await tempoWait(150);
    unit.popupPhase = "hidden";
    if (popup.kind === "damage") unit.pose = "idle";
    sync();
  }

  // 通常攻撃・スキル攻撃共通の1発分の処理。skillBaseValueは通常攻撃なら0、
  // elementは通常攻撃ならnull（通常攻撃は属性を持たない、ユーザー確認済み）。
  async function resolveHit(
    attackerKey: string,
    targetKey: string,
    skillBaseValue: number,
    element: SkillElement
  ) {
    const attacker = getUnit(attackerKey);
    const target = getUnit(targetKey);

    const effectiveAtk = Math.round(attacker.atk * (1 + sumBuffFraction(attacker, "atk")));
    const effectiveDef = Math.round(target.def * (1 + sumBuffFraction(target, "def")));
    const defenderElement = target.side === "enemy" ? enemyElement(target.id) : null;

    const { damage, isCrit } = calculateDamage(
      effectiveAtk,
      effectiveDef,
      attacker.critRateBonus + sumBuffFraction(attacker, "critRate"),
      attacker.critDamageBonus,
      skillBaseValue,
      element,
      defenderElement,
      target.elementResistPoints
    );

    attacker.stepped = true;
    sync();
    await tempoWait(300);

    attacker.pose = "attack";
    sync();
    await tempoWait(300);

    target.hp = Math.max(0, target.hp - damage);
    target.alive = target.hp > 0;
    await showPopup(targetKey, { kind: "damage", value: damage, crit: isCrit });

    attacker.pose = "idle";
    sync();
    await tempoWait(200);
    attacker.stepped = false;
    sync();
    await tempoWait(300);
  }

  // 敵全体スキル用：1回の攻撃モーションで、生存中の対象全員に同時にダメージを
  // 与える（対象ごとに踏み込み〜攻撃ポーズを繰り返すのではなく、一気に攻撃する
  // 見た目にしたいというユーザー指定）。ダメージ計算・ポップアップ表示は対象ごとに
  // 独立して行うが、それらをPromise.allでまとめて並行実行することで同時に見せる。
  async function resolveAoeHit(
    attackerKey: string,
    targetKeys: string[],
    skillBaseValue: number,
    element: SkillElement
  ) {
    const attacker = getUnit(attackerKey);

    attacker.stepped = true;
    sync();
    await tempoWait(300);

    attacker.pose = "attack";
    sync();
    await tempoWait(300);

    await Promise.all(
      targetKeys.map(async (targetKey) => {
        const target = getUnit(targetKey);
        if (!target.alive) return;

        const effectiveAtk = Math.round(attacker.atk * (1 + sumBuffFraction(attacker, "atk")));
        const effectiveDef = Math.round(target.def * (1 + sumBuffFraction(target, "def")));
        const defenderElement = target.side === "enemy" ? enemyElement(target.id) : null;

        const { damage, isCrit } = calculateDamage(
          effectiveAtk,
          effectiveDef,
          attacker.critRateBonus + sumBuffFraction(attacker, "critRate"),
          attacker.critDamageBonus,
          skillBaseValue,
          element,
          defenderElement,
          target.elementResistPoints
        );

        target.hp = Math.max(0, target.hp - damage);
        target.alive = target.hp > 0;
        await showPopup(targetKey, { kind: "damage", value: damage, crit: isCrit });
      })
    );

    attacker.pose = "idle";
    sync();
    await tempoWait(200);
    attacker.stepped = false;
    sync();
    await tempoWait(300);
  }

  // スキルの発動（攻撃／支援／回復）。CTのセットもここで行う。
  async function performSkillAction(attackerKey: string, skill: SkillBaseInfo, plusLevel: number) {
    const attacker = getUnit(attackerKey);
    if (skill.ct > 0) {
      attacker.skillAvailableAtTurn[skill.id] = attacker.ownTurnCounter + skill.ct;
    }

    // 合成・装備の＋値と同じ式：＋1につき元の基礎値の5%増（lib/item-synthesis.ts参照）。
    const scaledBaseValue = skill.baseValue
      ? Math.round(skill.baseValue * (1 + SYNTHESIS_PLUS_STEP_PERCENT * plusLevel))
      : 0;

    if (skill.kind === "攻撃") {
      if (skill.target === "敵全体") {
        const targetKeys = unitsRef.current
          .filter((u) => u.side === "enemy" && u.alive)
          .map((u) => u.key);

        for (let hit = 0; hit < skill.hits; hit++) {
          const aliveTargetKeys = targetKeys.filter((key) => getUnit(key).alive);
          if (aliveTargetKeys.length === 0) break;
          await resolveAoeHit(attackerKey, aliveTargetKeys, scaledBaseValue, skill.element);
          if (skill.effect?.skipNextTurn) {
            for (const key of aliveTargetKeys) getUnit(key).skipNextTurn = true;
          }
        }
        return;
      }

      const target = randomAliveTarget("enemy");
      const targets: BattleUnit[] = target ? [target] : [];

      for (const targetRef of targets) {
        for (let hit = 0; hit < skill.hits; hit++) {
          const current = getUnit(targetRef.key);
          if (!current.alive) break;
          await resolveHit(attackerKey, current.key, scaledBaseValue, skill.element);
          if (skill.effect?.skipNextTurn) {
            current.skipNextTurn = true;
          }
        }
      }
      return;
    }

    attacker.pose = "attack";
    sync();
    await tempoWait(300);

    if (skill.kind === "回復" && skill.effect?.healPercent) {
      const target = mostWoundedAlly();
      if (target) {
        const healAmount = Math.round((target.maxHp * skill.effect.healPercent) / 100);
        target.hp = Math.min(target.maxHp, target.hp + healAmount);
        await showPopup(target.key, { kind: "heal", value: healAmount });
      }
    } else if (skill.kind === "支援" && skill.effect?.buff) {
      const { stat, percentOrPoints, turns } = skill.effect.buff;
      for (const ally of unitsRef.current.filter((u) => u.side === "ally" && u.alive)) {
        ally.buffs.push({ stat, percentOrPoints, expiresAtOwnTurn: ally.ownTurnCounter + turns });
      }
      setTurnMessage(`${attacker.name}の${skill.name}！`);
      sync();
      await tempoWait(500);
    }

    attacker.pose = "idle";
    sync();
    await tempoWait(200);
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

      if (unit.side === "enemy") {
        setActiveKey(key);
        if (unit.skipNextTurn) {
          unit.skipNextTurn = false;
          setTurnMessage(`${unit.name}は動けない！`);
          sync();
          await tempoWait(700);
          continue;
        }
        setTurnMessage(`${unit.name}のターン`);
        await tempoWait(400);
        const target = randomAliveTarget("ally");
        if (target) await resolveHit(unit.key, target.key, 0, null);
        continue;
      }

      // 仲間の手番カウンターを進める（CT・バフの残りターンはこれを基準に数える）。
      unit.ownTurnCounter += 1;
      unit.buffs = unit.buffs.filter((b) => unit.ownTurnCounter <= b.expiresAtOwnTurn);
      sync();

      setActiveKey(key);
      setTurnMessage(`${unit.name}のターン`);

      if (unit.skipNextTurn) {
        unit.skipNextTurn = false;
        setTurnMessage(`${unit.name}は動けない！`);
        sync();
        await tempoWait(700);
        continue;
      }

      // 仲間のターン：通常攻撃またはスキルが選ばれるまで待つ
      setAwaitingPlayer(true);
      const action = await new Promise<PlayerAction>((resolve) => {
        resolvePlayerActionRef.current = resolve;
      });
      setAwaitingPlayer(false);

      if (action.type === "normal") {
        const target = randomAliveTarget("enemy");
        if (target) await resolveHit(unit.key, target.key, 0, null);
      } else {
        await performSkillAction(unit.key, action.skill, action.plusLevel);
      }
    }
  }

  // 稼いだ経験値・スキルポイント・ドロップ品を実際のセーブデータへ反映し、
  // クリア画面用の表示状態を整える。
  // 全滅時も「そこまでに倒した敵の分」の経験値は持ち帰れる（maxClearedStageは
  // 更新しない）。スキルポイントは経験値と違い、ステージクリア時のみ固定量が
  // 加算される（ユーザー確認済み：難易度が上がっても増減しない）。
  function commitRewards(
    totalExp: number,
    droppedItems: DroppedItem[],
    stage: number,
    cleared: boolean,
    subBattleWins: number
  ) {
    const data = loadGame1Data();
    let next: Game1SaveData = {
      ...data,
      expPoints: data.expPoints + totalExp,
      ...(cleared
        ? {
            maxClearedStage: Math.max(data.maxClearedStage, stage),
            skillPoints: data.skillPoints + SKILL_POINTS_PER_STAGE_CLEAR,
          }
        : {}),
    };

    // デイリーミッション：勝利したバトル数を加算し、ステージクリアならそちらもカウントする。
    next = addBattleWins(next, subBattleWins);
    if (cleared) next = addStageClear(next);

    // ステージクリア時のみ、未表示の個別メッセージ（仲間解放など）が無いか確認する。
    // 一度表示したメッセージは、同じステージを再クリアしても出さない。
    let newMessages: IndividualMessage[] = [];
    if (cleared) {
      newMessages = getIndividualMessagesForStageClear(stage).filter(
        (m) => !data.shownIndividualMessageIds.includes(m.id)
      );
      if (newMessages.length > 0) {
        next = {
          ...next,
          shownIndividualMessageIds: [
            ...data.shownIndividualMessageIds,
            ...newMessages.map((m) => m.id),
          ],
        };
      }
    }
    setIndividualMessages(newMessages);

    const addResult = addItemsToInventory(next, droppedItems.map((d) => d.itemId));
    next = addResult.data;
    saveGame1Data(next);
    setExpEarned(totalExp);
    setSkillPointsEarned(cleared ? SKILL_POINTS_PER_STAGE_CLEAR : 0);
    setBagFullCount(addResult.rejectedCount);

    // 所持数上限で受け取れなかった分は一覧から除く（中身を見せない仕様のため、
    // どのアイテムが弾かれたかは追跡しない＝先に加算できた分だけ集計する）。
    const acceptedDrops = droppedItems.slice(0, addResult.acceptedCount);
    const summaryCounts = new Map<string, number>();
    for (const d of acceptedDrops) {
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
  }

  // ステージ全体（S-1〜S-10）を通しで進める。
  async function playStage(stage: number, saveData: Game1SaveData) {
    try {
      let allies = buildAllyUnits(saveData.activePartyIds, saveData);
      let totalExp = 0;
      let subBattleWins = 0;
      const droppedItems: DroppedItem[] = [];

      for (let sub = 1; sub <= BATTLES_PER_STAGE; sub++) {
        setSubBattleLabel(sub);
        const isBoss = sub === BATTLES_PER_STAGE;
        if (isBoss) setBgmSrc(pickRandomBossBattleBgm());
        const enemies = buildEnemyUnits(stage, isBoss);
        unitsRef.current = [...allies, ...enemies];
        sync();

        const outcome = await runBattleLoop();
        if (outcome === "defeat") {
          // 全滅：このバトルで力尽きるまでに倒した分の経験値は持ち帰れる
          // （maxClearedStageは更新しない＝ステージ自体は未クリアのまま）。
          const partialExp = unitsRef.current
            .filter((u) => u.side === "enemy" && !u.alive)
            .reduce((sum, u) => sum + u.exp, 0);
          commitRewards(totalExp + partialExp, droppedItems, stage, false, subBattleWins);
          setBgmSrc(DEFEAT_BGM);
          setResult("defeat");
          return;
        }

        subBattleWins += 1;
        totalExp += enemies.reduce((sum, e) => sum + e.exp, 0);
        const drop = rollDropForBattle(stage, isBoss);
        if (drop) droppedItems.push(drop);
        allies = unitsRef.current.filter((u) => u.side === "ally");

        if (sub < BATTLES_PER_STAGE) {
          setTurnMessage(`${sub}戦目クリア！`);
          await tempoWait(700);
        }
      }

      // S-10（ボス）を撃破：ステージクリア
      commitRewards(totalExp, droppedItems, stage, true, subBattleWins);
      setBgmSrc(STAGE_CLEAR_BGM);
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
    setBgmEnabled(loadGlobalData().bgmEnabled);
    setBgmSrc(getNormalBattleBgmForStage(resolvedStage));

    if (startedRef.current) return;
    startedRef.current = true;

    const saveData = loadGame1Data();
    if (saveData.activePartyIds.length === 0) {
      router.push("/games/game1/home");
      return;
    }
    skillInvestedPointsRef.current = saveData.skillInvestedPoints;
    playStage(resolvedStage, saveData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 結果フレームをタップした時の進行：個別メッセージが残っていれば次のページへ、
  // 最後のページ（個別メッセージが無ければ基本メッセージそのもの）ならホームへ戻る。
  function handleResultTap() {
    const totalPages = 1 + individualMessages.length;
    if (resultPage < totalPages - 1) {
      setResultPage((p) => p + 1);
    } else {
      router.push("/games/game1/home");
    }
  }

  function handleNormalAttack() {
    resolvePlayerActionRef.current?.({ type: "normal" });
    resolvePlayerActionRef.current = null;
  }

  function handleSkillSelect(skill: SkillBaseInfo, plusLevel: number) {
    resolvePlayerActionRef.current?.({ type: "skill", skill, plusLevel });
    resolvePlayerActionRef.current = null;
  }

  const background = getFieldImagePathForStage(stageNumberRef.current);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black">
      {bgmSrc && <BgmPlayer src={bgmSrc} enabled={bgmEnabled} />}
      <img
        src={background}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* 上半分は背景のみで余白になっているため、ステージ表示はそこに大きめに
          置く（小さく左上に出すより目立たせても問題ない、ユーザー確認済み）。 */}
      <div className="absolute left-1/2 top-[13%] z-20 -translate-x-1/2 text-center">
        <p className="text-3xl font-extrabold tracking-wide text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.85)]">
          Stage {stageLabel}
        </p>
        <p className="mt-1 text-xl font-extrabold tracking-wide text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.85)]">
          Battle {subBattleLabel}
          {subBattleLabel === BATTLES_PER_STAGE ? " (Boss)" : ""}
        </p>
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
              opacity: unit.alive ? 1 : 0.25,
              transition: "opacity 300ms ease-out",
            } as React.CSSProperties}
          >
            {/* 攻撃時の「1歩前に出る」演出（stepped）はキャラ画像だけに掛ける。
                HPゲージまで一緒に動かす指示は無いため、ゲージはこのtransformの
                外（兄弟要素）に置いて常に位置を固定している。 */}
            <div
              className="relative w-full"
              style={{
                transform: `translateX(${unit.stepped ? stepPx : 0}px)`,
                transition: "transform 300ms ease-out",
              }}
            >
              <span
                className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xl font-extrabold"
                style={{
                  opacity: unit.popupPhase === "visible" ? 1 : 0,
                  transition: "opacity 150ms ease-out",
                  // 通常ダメージ＝白／会心ダメージ＝赤／回復＝緑。符号（-/+）や「会心!」の
                  // 文字は付けず、色と黒フチだけで区別する（ユーザー確認済みのB案）。
                  color: unit.popupKind === "heal" ? "#7cffb2" : unit.popupCrit ? "#ff4d4d" : "#fff",
                  WebkitTextStroke: `3px ${unit.popupKind === "heal" ? "#0d2a1c" : "#14101f"}`,
                  paintOrder: "stroke fill",
                  textShadow: unit.popupKind === "heal" ? undefined : "0 3px 5px rgba(0,0,0,0.4)",
                }}
              >
                {unit.popupKind === "heal" ? `${unit.popupValue} 回復` : `${unit.popupValue}`}
              </span>
              <img
                src={poseAsset(unit)}
                alt={unit.name}
                className="w-full select-none object-contain"
                draggable={false}
              />
            </div>
            {/* HPは実数値（unit.hp/unit.maxHp）を内部で保持しつつ、表示はゲージの
                長さだけで表現する（名前・数値表示の枠がキャラと重なって見づらかった
                ため撤去、ユーザー確認済み）。 */}
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/55">
              <div
                className="h-full rounded-full transition-[width] duration-300 ease-out"
                style={{
                  width: `${Math.max(0, Math.min(100, (unit.hp / unit.maxHp) * 100))}%`,
                  backgroundColor: hpBarColor(unit.hp / unit.maxHp),
                }}
              />
            </div>
          </div>
        );
      })}

      {result && (() => {
        const totalPages = 1 + individualMessages.length;
        const isBasePage = resultPage === 0;
        const message = isBasePage ? null : individualMessages[resultPage - 1];
        const isLastPage = resultPage === totalPages - 1;

        return (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 px-6"
            onClick={handleResultTap}
          >
            <div className="w-full max-w-[320px] rounded-2xl border border-[rgba(201,195,255,0.5)] px-4 py-4 [box-shadow:0_8px_24px_rgba(0,0,0,0.45)]" style={{ background: "#241f47" }}>
              {isBasePage ? (
                <>
                  <p
                    className="text-center text-lg font-extrabold"
                    style={{ color: result === "clear" ? "#ffd27a" : "#d99aa3" }}
                  >
                    {result === "clear" ? "ボスを倒した！" : "全滅してしまった…"}
                  </p>
                  <p className="mb-2.5 text-center text-xs font-bold text-[#b8b3d9]">
                    {result === "clear" ? "次のステージに進もう。" : "訓練して出直そう。"}
                  </p>
                  <div className="mb-2.5 h-px bg-white/10" />
                  {expEarned > 0 && (
                    <div className="flex justify-between px-0.5 py-0.5 text-xs font-bold">
                      <span className="text-[#b8b3d9]">獲得経験値</span>
                      <span className="tabular-nums text-[#eee9ff]">{expEarned}pt</span>
                    </div>
                  )}
                  {skillPointsEarned > 0 && (
                    <div className="flex justify-between px-0.5 py-0.5 text-xs font-bold">
                      <span className="text-[#b8b3d9]">獲得スキルpt</span>
                      <span className="tabular-nums text-[#eee9ff]">{skillPointsEarned}pt</span>
                    </div>
                  )}
                  {droppedItemSummary.length > 0 && (
                    <>
                      <p className="mb-1.5 mt-2 text-[11px] font-bold text-[#b8b3d9]">
                        獲得アイテム（タップで効果を確認）
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {droppedItemSummary.map(({ item, quantity }) => (
                          <button
                            key={item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailItem(item);
                            }}
                            className="relative h-16 w-16 overflow-hidden rounded-xl border-2"
                            style={{ borderColor: RARITY_COLOR[item.rarity] }}
                          >
                            <img
                              src={item.asset}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                            {quantity > 1 && (
                              <span className="absolute bottom-0 right-0 rounded-tl bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                ×{quantity}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {bagFullCount > 0 && (
                    <p className="mt-2 text-[10px] font-bold text-[#ffb4b4]">
                      バッグの所持数が上限のため、{bagFullCount}個のアイテムを受け取れませんでした
                    </p>
                  )}
                </>
              ) : (
                message && (
                  <div className="flex flex-col items-center py-1 text-center">
                    <div
                      className="mb-2 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#c9c3ff] text-xl"
                      style={{ background: "linear-gradient(180deg,#3c3489,#26215c)" }}
                    >
                      ✦
                    </div>
                    <p className="text-sm font-extrabold text-[#ffd27a]">{message.title}</p>
                    {message.description && (
                      <p className="mt-1 text-[11px] leading-relaxed text-[#b8b3d9]">
                        {message.description}
                      </p>
                    )}
                  </div>
                )
              )}

              <div className="mt-3 flex flex-col items-center gap-1.5">
                {totalPages > 1 && (
                  <div className="flex gap-1.5">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: i === resultPage ? "#c9c3ff" : "rgba(255,255,255,0.25)" }}
                      />
                    ))}
                  </div>
                )}
                <p className="text-[10px] font-bold text-[#b8b3d9]">
                  {isLastPage ? "タップして閉じる" : "タップして次へ"}
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 獲得アイテムの効果確認ポップアップ。結果フレームより上（z-40）に重ねる。
          集計後のitemIdだけしか持っていないため、plus0・追加能力無しの仮の個体で
          効果を算出する（実際にドロップした個体の＋値・追加能力までは反映しない）。 */}
      {detailItem && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/55 px-6"
          onClick={() => setDetailItem(null)}
        >
          <div
            className="w-full max-w-[300px] rounded-2xl border border-[rgba(201,195,255,0.5)] px-4 py-4 [box-shadow:0_8px_24px_rgba(0,0,0,0.45)]"
            style={{ background: "#241f47" }}
          >
            <div className="flex flex-col items-center gap-2">
              <img
                src={detailItem.asset}
                alt={detailItem.name}
                className="h-20 w-20 rounded-xl border-2 object-cover"
                style={{ borderColor: RARITY_COLOR[detailItem.rarity] }}
              />
              <p className="text-center text-base font-extrabold text-[#eee9ff]">{detailItem.name}</p>
              <p className="text-xs font-bold" style={{ color: RARITY_COLOR[detailItem.rarity] }}>
                {detailItem.rarity}ランク
              </p>
            </div>
            <div className="my-2.5 h-px bg-white/10" />
            <div className="flex flex-col gap-1">
              {describeItemEffect({ instanceId: "preview", itemId: detailItem.id, plus: 0 }, detailItem).map(
                (line) => (
                  <div key={line.label} className="flex justify-between text-xs font-bold">
                    <span className="text-[#b8b3d9]">{line.label}</span>
                    <span className="text-[#5be08a]">{line.value}</span>
                  </div>
                )
              )}
            </div>
            <p className="mt-3 text-center text-[10px] font-bold text-[#b8b3d9]">タップして閉じる</p>
          </div>
        </div>
      )}

      {awaitingPlayer && !result && (() => {
        const activeUnit = units.find((u) => u.key === activeKey);
        const baseInfo = activeUnit ? getCharacterBaseInfo(activeUnit.id) : undefined;
        const skillKit = activeUnit ? getCharacterSkillKit(activeUnit.id) : [];
        const investedPoints = skillInvestedPointsRef.current;

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
            {activeUnit &&
              skillKit.map((skill) => {
                const invested = investedPoints[skill.id] ?? 0;
                const unlocked = isSkillUnlocked(skill.id, invested);
                const plusLevel = skillPlusLevel(skill.id, invested);
                const availableAt = activeUnit.skillAvailableAtTurn[skill.id] ?? 0;
                // 使用可能になるのは「自分の手番カウンターがavailableAtを超えたら」
                // （＝availableAtと同じ手番はまだロック中。CTの「1ターン分は必ず
                // 空ける」という仕様に対応する境界値）。
                const cooldownRemaining = unlocked
                  ? Math.max(0, availableAt - activeUnit.ownTurnCounter + 1)
                  : 0;
                const usable = unlocked && cooldownRemaining === 0;
                return (
                  <button
                    key={skill.id}
                    onClick={() => usable && handleSkillSelect(skill, plusLevel)}
                    disabled={!usable}
                    className="relative flex flex-1 flex-col items-center gap-1"
                  >
                    <img
                      src={skill.icon}
                      alt={skill.name}
                      className="h-14 w-14 rounded-xl object-contain"
                      draggable={false}
                      style={{ opacity: usable ? 1 : 0.35 }}
                    />
                    {!unlocked && (
                      <span className="absolute inset-0 flex items-center justify-center text-lg [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
                        🔒
                      </span>
                    )}
                    {unlocked && cooldownRemaining > 0 && (
                      <span className="absolute inset-0 flex items-center justify-center text-lg font-extrabold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
                        {cooldownRemaining}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        );
      })()}
    </div>
  );
}
