// 装備（武器・アーティファクト）によるステータス加算。
// docs/spec/items.mdの「今後」に挙がっていた効果値を、ユーザー確認済みの仮の
// 対応表・数値で埋めたもの。すべて後から係数を書き換えるだけで調整できる。

import type { ItemBaseInfo, ItemRarity, ItemType, ArtifactSlot } from "./items-info";
import { getItemBaseInfo, ITEM_BASE_INFO } from "./items-info";
import type { CharacterEquipment, ItemInstance } from "./game1-data";
import type { CharacterStatsAtLevel } from "./character-growth";
import { SYNTHESIS_PLUS_STEP_PERCENT, flooredPlus } from "./item-synthesis";

export type EquipmentEffectStat =
  | "hp"
  | "atk"
  | "atkFlat"
  | "def"
  | "critRate"
  | "critDamage"
  | "elementResist"
  | "allRound";

// HP/防御力、およびアーティファクト経由の攻撃力に効く装備：そのステータスの
// 基礎値（レベルなりの値）に対する割合加算。
export const MAGNITUDE_BONUS_PERCENT: Record<ItemRarity, number> = {
  C: 0.03,
  B: 0.06,
  A: 0.1,
  S: 0.16,
  SS: 0.25,
};

// 武器に効く攻撃力：キャラのステータスへの割合ではなく、固定値の加算
// （ゲームデザイン上の好みとして「武器は足し算」にしたいとのユーザー指定）。
// レベルアップでの伸び幅（例：アカネは+6.0/レベル）と比べて、装備を替えたと
// はっきり実感できる大きさになるよう仮の値を置いている。
// 同じレア度でも武器5種類にばらつきを持たせる（ユーザー確認済み）：中心値の
// ±15%程度の幅を5段階に均等配分し、レア度＋種類（片手剣/法器/弓）ブロック内で
// ID順（昇順）に低い値から高い値を割り当てる。
export const WEAPON_FLAT_ATK_RANGE: Record<ItemRarity, [number, number, number, number, number]> = {
  C: [26, 28, 30, 32, 34],
  B: [51, 55, 60, 65, 69],
  A: [94, 102, 110, 118, 126],
  S: [153, 166, 180, 194, 207],
  SS: [255, 277, 300, 322, 345],
};

// 同じ種類・同じレア度の武器グループ内で、そのアイテムが何番目か（0-4）を返す。
function weaponVarianceIndex(item: ItemBaseInfo): number {
  const siblings = ITEM_BASE_INFO.filter((i) => i.type === item.type && i.rarity === item.rarity).sort(
    (a, b) => a.id.localeCompare(b.id)
  );
  const index = siblings.findIndex((i) => i.id === item.id);
  return index < 0 ? 2 : index; // 見つからない場合は中央値にフォールバック
}

export function weaponFlatAtkForItem(item: ItemBaseInfo): number {
  return WEAPON_FLAT_ATK_RANGE[item.rarity][weaponVarianceIndex(item)];
}

// 会心率・会心ダメージ・属性耐性に効く装備：ポイント（%pt）を直接加算。
export const RATE_BONUS_POINTS: Record<ItemRarity, number> = {
  C: 2,
  B: 4,
  A: 7,
  S: 11,
  SS: 16,
};

// 帯留め（万能枠）は「少しずつ」なので、上記の割合加算を半分にしてHP/攻撃力/防御力の
// 3つ全てに乗せる。
const ALL_ROUND_DIVISOR = 2;

// 武器種（片手剣・法器・弓）は固定値の攻撃力加算。
const WEAPON_EFFECT_STAT: EquipmentEffectStat = "atkFlat";

// アーティファクトのslot（装備部位）ごとの効果ステータス対応表。
export const ARTIFACT_SLOT_EFFECT: Record<ArtifactSlot, EquipmentEffectStat> = {
  護符: "hp",
  指輪: "atk",
  腕輪: "def",
  首飾り: "critRate",
  耳飾り: "critDamage",
  ブローチ: "elementResist", // 属性システム自体が未実装のため、当面は表示のみで戦闘には影響しない
  帯留め: "allRound",
};

export function getEffectStatForItem(type: ItemType, slot?: ArtifactSlot): EquipmentEffectStat {
  if (type === "アーティファクト") return slot ? ARTIFACT_SLOT_EFFECT[slot] : "allRound";
  return WEAPON_EFFECT_STAT;
}

export interface EquipmentBonusTotals {
  hpPercent: number;
  atkPercent: number;
  atkFlat: number;
  defPercent: number;
  critRatePoints: number;
  critDamagePoints: number;
  elementResistPoints: number;
}

const EMPTY_BONUS: EquipmentBonusTotals = {
  hpPercent: 0,
  atkPercent: 0,
  atkFlat: 0,
  defPercent: 0,
  critRatePoints: 0,
  critDamagePoints: 0,
  elementResistPoints: 0,
};

// 合成の＋値による上乗せ倍率（＋1につき、そのアイテム自身の元の基礎値の5%増）。
// 端数を持つ内部値ではなく、切り捨てた整数の＋値を使う（表示上の＋Nと一致させるため）。
function synthesisMultiplier(instance: ItemInstance): number {
  return 1 + SYNTHESIS_PLUS_STEP_PERCENT * flooredPlus(instance);
}

// 装備中の武器＋アーティファクト3枠すべての効果を合算する。
// equipmentの値は所持アイテムの個体ID（instanceId）なので、inventoryを渡して
// 実体（itemId・＋値）を解決する。
export function calculateEquipmentBonus(
  equipment: CharacterEquipment,
  inventory: ItemInstance[]
): EquipmentBonusTotals {
  const totals = { ...EMPTY_BONUS };
  const equippedInstanceIds = [equipment.weapon, ...equipment.artifacts].filter(
    (id): id is string => id !== null
  );

  for (const instanceId of equippedInstanceIds) {
    const instance = inventory.find((i) => i.instanceId === instanceId);
    if (!instance) continue;
    const item = getItemBaseInfo(instance.itemId);
    if (!item) continue;
    const stat = getEffectStatForItem(item.type, item.slot);
    const mul = synthesisMultiplier(instance);

    if (stat === "allRound") {
      const half = (MAGNITUDE_BONUS_PERCENT[item.rarity] / ALL_ROUND_DIVISOR) * mul;
      totals.hpPercent += half;
      totals.atkPercent += half;
      totals.defPercent += half;
    } else if (stat === "hp") {
      totals.hpPercent += MAGNITUDE_BONUS_PERCENT[item.rarity] * mul;
    } else if (stat === "atk") {
      totals.atkPercent += MAGNITUDE_BONUS_PERCENT[item.rarity] * mul;
    } else if (stat === "atkFlat") {
      totals.atkFlat += weaponFlatAtkForItem(item) * mul;
    } else if (stat === "def") {
      totals.defPercent += MAGNITUDE_BONUS_PERCENT[item.rarity] * mul;
    } else if (stat === "critRate") {
      totals.critRatePoints += RATE_BONUS_POINTS[item.rarity] * mul;
    } else if (stat === "critDamage") {
      totals.critDamagePoints += RATE_BONUS_POINTS[item.rarity] * mul;
    } else if (stat === "elementResist") {
      totals.elementResistPoints += RATE_BONUS_POINTS[item.rarity] * mul;
    }

    // 武器のランダム個体差（追加能力枠）：ドロップ時に固定される値なので、
    // 合成の＋値強化（synthesisMultiplier）は適用しない。
    if (instance.substatStat && instance.substatValue !== undefined) {
      const value = instance.substatValue;
      if (instance.substatStat === "hp") {
        totals.hpPercent += value / 100;
      } else if (instance.substatStat === "atk") {
        totals.atkPercent += value / 100;
      } else if (instance.substatStat === "def") {
        totals.defPercent += value / 100;
      } else if (instance.substatStat === "critRate") {
        totals.critRatePoints += value;
      } else if (instance.substatStat === "critDamage") {
        totals.critDamagePoints += value;
      } else if (instance.substatStat === "elementResist") {
        totals.elementResistPoints += value;
      }
    }
  }

  return totals;
}

export function applyEquipmentBonusToStats(
  base: CharacterStatsAtLevel,
  bonus: EquipmentBonusTotals
): CharacterStatsAtLevel {
  return {
    hp: Math.round(base.hp * (1 + bonus.hpPercent)),
    atk: Math.round(base.atk * (1 + bonus.atkPercent)) + Math.round(bonus.atkFlat),
    def: Math.round(base.def * (1 + bonus.defPercent)),
  };
}
