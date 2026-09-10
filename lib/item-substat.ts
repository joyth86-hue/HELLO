// 武器のランダム個体差（追加能力枠）。docs/spec/items.md参照。
// ユーザー確認済みのルール：
// - 対象は武器のみ（アーティファクトには付かない）
// - ドロップした瞬間に「何の能力か」「何%か」がレア度ごとのレンジ表からランダムに
//   決まり、その個体が存在する限りずっと固定（合成の＋値強化の対象外）
// - 候補となる能力は、アーティファクトの効果と同じ6種（HP/攻撃力/防御力/会心率/
//   会心ダメージ/属性耐性）。会心率・会心ダメージ・属性耐性が選ばれた場合は、
//   ロールした数値をそのままpt（%ポイント）として使う

import { getItemBaseInfo, type ItemRarity } from "./items-info";

export type WeaponSubstatKind = "hp" | "atk" | "def" | "critRate" | "critDamage" | "elementResist";

const SUBSTAT_KINDS: WeaponSubstatKind[] = ["hp", "atk", "def", "critRate", "critDamage", "elementResist"];

// レア度ごとの%レンジ（最小・最大）。ユーザー確認済みの仮数値。
const SUBSTAT_RANGE: Record<ItemRarity, [number, number]> = {
  C: [1.0, 2.0],
  B: [1.5, 3.0],
  A: [2.5, 4.5],
  S: [4.0, 7.0],
  SS: [6.5, 10.0],
};

export interface WeaponSubstat {
  stat: WeaponSubstatKind;
  value: number; // %（会心率などが選ばれた場合はptとしてそのまま使う）
}

// 武器（type !== "アーティファクト"）の場合のみ、ドロップ時に1回だけ呼ぶ。
// アーティファクトや存在しないitemIdの場合はundefinedを返す。
export function rollWeaponSubstat(itemId: string): WeaponSubstat | undefined {
  const item = getItemBaseInfo(itemId);
  if (!item || item.type === "アーティファクト") return undefined;
  const [min, max] = SUBSTAT_RANGE[item.rarity];
  const stat = SUBSTAT_KINDS[Math.floor(Math.random() * SUBSTAT_KINDS.length)];
  const value = Math.round((min + Math.random() * (max - min)) * 10) / 10; // 小数点1桁
  return { stat, value };
}
