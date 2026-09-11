// ダメージ計算式。docs/spec/adventure-system.md参照（Artifactの
// 「2. ダメージ計算式（案）」）。
//
// 属性相性はgetElementMultiplier()の輪（ユーザー確認済み）を参照。

import type { SkillElement } from "./skills-info";

// 基礎会心率（装備なし）。装備（アーティファクト）の会心率上昇はcritRateBonusとして
// 呼び出し側（lib/item-effects.ts）から加算される。
export const BASE_CRIT_RATE = 0.1;
// 会心時の倍率（装備なし）。装備の会心ダメージ上昇はcritDamageBonusとして加算される。
export const CRIT_DAMAGE_MULTIPLIER = 1.5;

export interface DamageResult {
  damage: number;
  isCrit: boolean;
}

// 属性相性の輪（ユーザー確認済み）：矢印の先が弱点＝有利に攻撃できる相手。
// 水→炎→氷→草→岩→水
// この輪で直接つながっている（隣り合う）属性同士にだけ有利・不利の倍率を持たせ、
// それ以外の組み合わせ（2つ離れた属性・同じ属性）は等倍1.0のまま。
const ELEMENT_ADVANTAGE_CYCLE: SkillElement[] = ["水", "炎", "氷", "草", "岩"];
const ELEMENT_ADVANTAGE_MULTIPLIER = 1.25;
const ELEMENT_DISADVANTAGE_MULTIPLIER = 0.75;

// ブローチ（アーティファクト）の属性耐性ptによる軽減（ユーザー確認済み）。
// 弱点を突かれた（1.25倍を受ける）場合にのみ効き、1pt＝0.5%分だけ倍率を直接
// 減算する（会心率などの「1pt＝1%」の半分の効き）。床は0.75倍——耐性を
// 積み切ると、弱点だったはずの相手にも有利な側と同じ倍率まで持っていける。
// 有利（0.75倍）・無関係（1.0倍）のケースには一切影響しない。
const ELEMENT_RESIST_POINT_VALUE = 0.005; // 1pt = 0.5%
const ELEMENT_RESIST_FLOOR_MULTIPLIER = ELEMENT_DISADVANTAGE_MULTIPLIER;

// 属性相性倍率。通常攻撃は属性を持たない（attackerElement=null）ため、
// どちらかがnullの場合は常に1.0固定のままになる。defenderResistPointsは
// 防御側（ダメージを受ける側）の装備由来の属性耐性pt（[items.md]参照）。
export function getElementMultiplier(
  attackerElement: SkillElement,
  defenderElement: SkillElement,
  defenderResistPoints = 0
): number {
  if (!attackerElement || !defenderElement) return 1.0;
  const attackerIndex = ELEMENT_ADVANTAGE_CYCLE.indexOf(attackerElement);
  const defenderIndex = ELEMENT_ADVANTAGE_CYCLE.indexOf(defenderElement);
  if (attackerIndex === -1 || defenderIndex === -1) return 1.0;

  const cycleLength = ELEMENT_ADVANTAGE_CYCLE.length;
  if ((attackerIndex + 1) % cycleLength === defenderIndex) {
    const reduced = ELEMENT_ADVANTAGE_MULTIPLIER - defenderResistPoints * ELEMENT_RESIST_POINT_VALUE;
    return Math.max(ELEMENT_RESIST_FLOOR_MULTIPLIER, reduced);
  }
  if ((defenderIndex + 1) % cycleLength === attackerIndex) return ELEMENT_DISADVANTAGE_MULTIPLIER;
  return 1.0;
}

export function calculateDamage(
  attackerAtk: number,
  targetDef: number,
  critRateBonus = 0,
  critDamageBonus = 0,
  skillBaseValue = 0,
  attackerElement: SkillElement = null,
  defenderElement: SkillElement = null,
  defenderResistPoints = 0
): DamageResult {
  const effectiveAtk = attackerAtk + skillBaseValue;
  const base = (effectiveAtk * 100) / (100 + targetDef);
  const elementMultiplier = getElementMultiplier(attackerElement, defenderElement, defenderResistPoints);
  const isCrit = Math.random() < BASE_CRIT_RATE + critRateBonus;
  const critMultiplier = isCrit ? CRIT_DAMAGE_MULTIPLIER + critDamageBonus : 1;
  const damage = Math.max(1, Math.round(base * elementMultiplier * critMultiplier));
  return { damage, isCrit };
}
