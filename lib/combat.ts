// ダメージ計算式。docs/spec/adventure-system.md参照（Artifactの
// 「2. ダメージ計算式（案）」）。
//
// 属性相性表はまだ未定のため、属性倍率は一旦なし（常に×1.0固定）としている
// （ユーザー確認済み）。表が決まり次第、ここに組み込む。

// 基礎会心率（装備なし）。装備（アーティファクト）の会心率上昇はcritRateBonusとして
// 呼び出し側（lib/item-effects.ts）から加算される。
export const BASE_CRIT_RATE = 0.1;
// 会心時の倍率（装備なし）。装備の会心ダメージ上昇はcritDamageBonusとして加算される。
export const CRIT_DAMAGE_MULTIPLIER = 1.5;

export interface DamageResult {
  damage: number;
  isCrit: boolean;
}

export function calculateDamage(
  attackerAtk: number,
  targetDef: number,
  critRateBonus = 0,
  critDamageBonus = 0
): DamageResult {
  const base = (attackerAtk * 100) / (100 + targetDef);
  const isCrit = Math.random() < BASE_CRIT_RATE + critRateBonus;
  const multiplier = isCrit ? CRIT_DAMAGE_MULTIPLIER + critDamageBonus : 1;
  const damage = Math.max(1, Math.round(base * multiplier));
  return { damage, isCrit };
}
