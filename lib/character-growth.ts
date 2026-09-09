// キャラクターのレベル成長（ステータス・必要経験値）。
// 数値の出所はdocs/spec/adventure-system.md参照（Artifact「冒険システム設計案」の
// 「5. キャラクターのレベル成長（案）」）。すべて仮の値で、係数を書き換えるだけで
// 後から調整できる。

export const MAX_LEVEL = 100;

export interface CharacterGrowth {
  baseHp: number;
  growHp: number;
  baseAtk: number;
  growAtk: number;
  baseDef: number;
  growDef: number;
}

// キャラID → レベル成長パラメータ。ステータス(Lv) = base + (Lv-1) × grow の線形成長。
export const CHARACTER_GROWTH: Record<string, CharacterGrowth> = {
  c01: { baseHp: 220, growHp: 46, baseAtk: 32, growAtk: 6.0, baseDef: 24, growDef: 4.4 }, // アカネ：バランス型
  c02: { baseHp: 190, growHp: 39, baseAtk: 36, growAtk: 7.0, baseDef: 18, growDef: 3.4 }, // カエデ：魔法特化型
  c03: { baseHp: 190, growHp: 39, baseAtk: 36, growAtk: 7.0, baseDef: 18, growDef: 3.4 }, // コユキ：魔法特化型
  c04: { baseHp: 200, growHp: 41, baseAtk: 35, growAtk: 6.6, baseDef: 21, growDef: 3.8 }, // サユミ：機動バランス型
};

export interface CharacterStatsAtLevel {
  hp: number;
  atk: number;
  def: number;
}

export function getCharacterStatsAtLevel(characterId: string, level: number): CharacterStatsAtLevel {
  const growth = CHARACTER_GROWTH[characterId];
  if (!growth) return { hp: 0, atk: 0, def: 0 };
  const lv = Math.max(1, Math.min(MAX_LEVEL, level));
  return {
    hp: Math.round(growth.baseHp + (lv - 1) * growth.growHp),
    atk: Math.round(growth.baseAtk + (lv - 1) * growth.growAtk),
    def: Math.round(growth.baseDef + (lv - 1) * growth.growDef),
  };
}

// --- 経験値ポイントによるレベルアップ ---
//
// 「戦闘で貯めた経験値ポイントを、キャラクター画面で好きなキャラに任意で割り振る」
// 方式（docs/spec/adventure-system.md）。レベルLからL+1に上げるのに必要なポイント数
// はまだ未定だったため、仮に「10 × 到達後のレベル」という単純な右肩上がりの式にして
// いる（Lv1→2で10pt、Lv2→3で20pt…Lv99→100で990pt）。ユーザー確認済みの仮数値で、
// この関数の中身を変えるだけで調整できる。

export function expCostForLevel(level: number): number {
  return 10 * level;
}

// レベル1から指定レベルに到達するのに必要な累計経験値ポイント。
export function cumulativeExpForLevel(level: number): number {
  let total = 0;
  for (let lv = 2; lv <= level; lv++) {
    total += expCostForLevel(lv);
  }
  return total;
}

// 累計で投入した経験値ポイントから、今のレベルを逆算する。
export function levelFromInvestedExp(investedExp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && investedExp >= cumulativeExpForLevel(level + 1)) {
    level++;
  }
  return level;
}
