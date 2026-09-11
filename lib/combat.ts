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

// 属性相性倍率。通常攻撃は属性を持たない（attackerElement=null）ため、
// どちらかがnullの場合は常に1.0固定のままになる。
export function getElementMultiplier(
  attackerElement: SkillElement,
  defenderElement: SkillElement
): number {
  if (!attackerElement || !defenderElement) return 1.0;
  const attackerIndex = ELEMENT_ADVANTAGE_CYCLE.indexOf(attackerElement);
  const defenderIndex = ELEMENT_ADVANTAGE_CYCLE.indexOf(defenderElement);
  if (attackerIndex === -1 || defenderIndex === -1) return 1.0;

  const cycleLength = ELEMENT_ADVANTAGE_CYCLE.length;
  if ((attackerIndex + 1) % cycleLength === defenderIndex) return ELEMENT_ADVANTAGE_MULTIPLIER;
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
  defenderElement: SkillElement = null
): DamageResult {
  const effectiveAtk = attackerAtk + skillBaseValue;
  const base = (effectiveAtk * 100) / (100 + targetDef);
  const elementMultiplier = getElementMultiplier(attackerElement, defenderElement);
  const isCrit = Math.random() < BASE_CRIT_RATE + critRateBonus;
  const critMultiplier = isCrit ? CRIT_DAMAGE_MULTIPLIER + critDamageBonus : 1;
  const damage = Math.max(1, Math.round(base * elementMultiplier * critMultiplier));
  return { damage, isCrit };
}
