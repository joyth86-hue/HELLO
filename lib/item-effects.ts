// 装備（武器・アーティファクト）によるステータス加算。
// docs/spec/items.mdの「今後」に挙がっていた効果値を、ユーザー確認済みの仮の
// 対応表・数値で埋めたもの。すべて後から係数を書き換えるだけで調整できる。

import type { ItemRarity, ItemType, ArtifactSlot } from "./items-info";
import { getItemBaseInfo } from "./items-info";
import type { CharacterEquipment } from "./game1-data";
import type { CharacterStatsAtLevel } from "./character-growth";

export type EquipmentEffectStat =
  | "hp"
  | "atk"
  | "def"
  | "critRate"
  | "critDamage"
  | "elementResist"
  | "allRound";

// HP/攻撃力/防御力に効く装備：そのステータスの基礎値（レベルなりの値）に対する割合加算。
export const MAGNITUDE_BONUS_PERCENT: Record<ItemRarity, number> = {
  C: 0.03,
  B: 0.06,
  A: 0.1,
  S: 0.16,
  SS: 0.25,
};

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

// 武器種（片手剣・法器・弓）はすべて攻撃力に効く。
const WEAPON_EFFECT_STAT: EquipmentEffectStat = "atk";

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
  defPercent: number;
  critRatePoints: number;
  critDamagePoints: number;
  elementResistPoints: number;
}

const EMPTY_BONUS: EquipmentBonusTotals = {
  hpPercent: 0,
  atkPercent: 0,
  defPercent: 0,
  critRatePoints: 0,
  critDamagePoints: 0,
  elementResistPoints: 0,
};

// 装備中の武器＋アーティファクト3枠すべての効果を合算する。
export function calculateEquipmentBonus(equipment: CharacterEquipment): EquipmentBonusTotals {
  const totals = { ...EMPTY_BONUS };
  const equippedIds = [equipment.weapon, ...equipment.artifacts].filter(
    (id): id is string => id !== null
  );

  for (const id of equippedIds) {
    const item = getItemBaseInfo(id);
    if (!item) continue;
    const stat = getEffectStatForItem(item.type, item.slot);

    if (stat === "allRound") {
      const half = MAGNITUDE_BONUS_PERCENT[item.rarity] / ALL_ROUND_DIVISOR;
      totals.hpPercent += half;
      totals.atkPercent += half;
      totals.defPercent += half;
    } else if (stat === "hp") {
      totals.hpPercent += MAGNITUDE_BONUS_PERCENT[item.rarity];
    } else if (stat === "atk") {
      totals.atkPercent += MAGNITUDE_BONUS_PERCENT[item.rarity];
    } else if (stat === "def") {
      totals.defPercent += MAGNITUDE_BONUS_PERCENT[item.rarity];
    } else if (stat === "critRate") {
      totals.critRatePoints += RATE_BONUS_POINTS[item.rarity];
    } else if (stat === "critDamage") {
      totals.critDamagePoints += RATE_BONUS_POINTS[item.rarity];
    } else if (stat === "elementResist") {
      totals.elementResistPoints += RATE_BONUS_POINTS[item.rarity];
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
    atk: Math.round(base.atk * (1 + bonus.atkPercent)),
    def: Math.round(base.def * (1 + bonus.defPercent)),
  };
}
