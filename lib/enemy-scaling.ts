// 敵の強さスケーリング・出現パターン。
// 数値の出所はdocs/spec/adventure-system.md参照（Artifact「冒険システム設計案」の
// 「1. 敵の色分け」「4. 敵の強さスケーリング」）。すべて仮の値で、係数を書き換える
// だけで後から調整できる。

export interface EnemyBaseStats {
  hp: number;
  atk: number;
  def: number;
  exp: number;
}

export const ENEMY_BASE_STATS: Record<string, EnemyBaseStats> = {
  e01: { hp: 80, atk: 12, def: 5, exp: 8 }, // こどもゴブリン
  e02: { hp: 120, atk: 18, def: 8, exp: 14 }, // ゴブリン兄貴
  e03: { hp: 150, atk: 14, def: 14, exp: 16 }, // 古びたクマさん
  e04: { hp: 70, atk: 10, def: 4, exp: 7 }, // 歩くキノコ
  e05: { hp: 60, atk: 9, def: 6, exp: 6 }, // 水スラ
  e06: { hp: 65, atk: 10, def: 5, exp: 7 }, // 草スラ
};

// ステージ係数（HP/攻撃力/防御力用）：2次関数カーブ 1 + a×(S-1) + b×(S-1)²
// （a=0.02, b=0.001736、ステージ100で約20倍）。
// 複利（指数）カーブだと終盤だけ急激に跳ね上がり、レベル上限（100）に当たった
// 瞬間に詰みかける「崖」ができてしまっていたため、2次関数に変更した。2次関数は
// 「10ステージあたりの必要挑戦回数の伸び幅」自体がなだらかに直線的に増えていく
// 性質があり、崖ではなく徐々にきつくなる曲線になる（ユーザー確認済みの仮数値）。
// 武器合成やスキルなど「戦闘を楽にする」追加要素がまだ無い前提で強めに設定して
// いるため、それらを実装した段階で改めて数値を調整する想定。
const STAGE_COEFFICIENT_LINEAR = 0.02;
const STAGE_COEFFICIENT_QUADRATIC = 0.001736;
export function stageCoefficient(stage: number): number {
  const s = stage - 1;
  return 1 + STAGE_COEFFICIENT_LINEAR * s + STAGE_COEFFICIENT_QUADRATIC * s * s;
}

// 経験値係数：1 + (S-1) × 0.06（線形、ステージ100で約7倍）。あえてstageCoefficient
// とは別の緩やかな伸びにしている。同じ係数にすると「敵が強くなるほど経験値も同じ
// 倍率で増える」ため、キャラのレベルが敵の強さに常に追いつき続けてしまい、
// 上記の強化がステージ進行の歯ごたえに繋がらない（詳細はdocs/spec/adventure-system.md参照）。
export function expCoefficient(stage: number): number {
  return 1 + (stage - 1) * 0.06;
}

// 個体差：±10%、バトルごとに再抽選（HP/攻撃力/防御力にのみかける。経験値には
// ステージ係数だけをかける方式——docs/spec/adventure-system.md参照）。
const INDIVIDUAL_VARIANCE = 0.1;
function rollIndividualVariance(): number {
  return 1 + (Math.random() * 2 - 1) * INDIVIDUAL_VARIANCE;
}

// ボス（S-10）の追加補正：ステータス×1.6、経験値×3。
export const BOSS_STAT_MULTIPLIER = 1.6;
export const BOSS_EXP_MULTIPLIER = 3;

export interface ScaledEnemyStats {
  hp: number;
  atk: number;
  def: number;
  exp: number;
}

export function getScaledEnemyStats(enemyId: string, stage: number, isBoss: boolean): ScaledEnemyStats {
  const base = ENEMY_BASE_STATS[enemyId];
  if (!base) return { hp: 1, atk: 1, def: 0, exp: 0 };
  const coef = stageCoefficient(stage);
  const eCoef = expCoefficient(stage);
  const variance = rollIndividualVariance();
  const statMul = (isBoss ? BOSS_STAT_MULTIPLIER : 1) * variance;
  const expMul = isBoss ? BOSS_EXP_MULTIPLIER : 1;
  return {
    hp: Math.max(1, Math.round(base.hp * coef * statMul)),
    atk: Math.max(1, Math.round(base.atk * coef * statMul)),
    def: Math.max(0, Math.round(base.def * coef * statMul)),
    exp: Math.max(1, Math.round(base.exp * eCoef * expMul)),
  };
}

// 敵の出現パターン（4色ローテーション）。ステージ番号で4パターンを順に繰り返す。
// パターンA（草原・ゴブリン系）: stage % 4 === 1
// パターンB（クマ系）         : stage % 4 === 2
// パターンC（キノコ系）       : stage % 4 === 3
// パターンD（スライム系）     : stage % 4 === 0
const ENEMY_PATTERNS: string[][] = [
  ["e01", "e02"],
  ["e03"],
  ["e04"],
  ["e05", "e06"],
];

export function getEnemyPatternForStage(stage: number): string[] {
  const index = (stage - 1) % ENEMY_PATTERNS.length;
  return ENEMY_PATTERNS[index];
}

export function pickRandomEnemyFromPattern(stage: number): string {
  const pool = getEnemyPatternForStage(stage);
  return pool[Math.floor(Math.random() * pool.length)];
}

// ステージ背景（1ステージ＝1背景固定。docs/spec/fields.mdの10種類をステージ番号順に
// 単純に繰り返す）。
const FIELD_FILES = [
  "f01_sougen_hiru.png",
  "f02_sougen_yoru.png",
  "f03_machi_hiru.png",
  "f04_machi_yoru.png",
  "f05_arechi.png",
  "f06_doukutsu.png",
  "f07_shinrin.png",
  "f08_kazan.png",
  "f09_kaigan_hiru.png",
  "f10_kaigan_yoru.png",
];

export function getFieldImagePathForStage(stage: number): string {
  const index = (stage - 1) % FIELD_FILES.length;
  return `/backgrounds/fields/${FIELD_FILES[index]}`;
}
