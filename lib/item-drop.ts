// アイテムドロップ（レアリティ抽選）。
// 数値の出所はdocs/spec/adventure-system.md参照（Artifact「冒険システム設計案」の
// 「3. アイテムのレアリティ抽選テーブル（案）」）。すべて仮の値で、係数・テーブルを
// 書き換えるだけで後から調整できる。

import { ITEM_BASE_INFO, type ItemRarity } from "./items-info";

// バトルごとの独立抽選：まず「そのバトルで何か1つ落ちるか」を判定する。
export function dropChance(isBoss: boolean): number {
  return isBoss ? 0.05 : 0.03;
}

interface RarityBlock {
  // このブロックが対象とする最大ステージ番号（前のブロックの続きから、この値まで）。
  maxStage: number;
  weights: Record<ItemRarity, number>;
}

// ステージ番号を10刻みでブロック分けしたレアリティ抽選テーブル。
const RARITY_BLOCKS: RarityBlock[] = [
  { maxStage: 10, weights: { C: 100, B: 0, A: 0, S: 0, SS: 0 } },
  { maxStage: 20, weights: { C: 82, B: 18, A: 0, S: 0, SS: 0 } },
  { maxStage: 30, weights: { C: 63, B: 30, A: 7, S: 0, SS: 0 } },
  { maxStage: 40, weights: { C: 47, B: 33, A: 18, S: 2, SS: 0 } },
  { maxStage: 50, weights: { C: 34, B: 33, A: 25, S: 7, SS: 1 } },
  { maxStage: 60, weights: { C: 24, B: 30, A: 29, S: 15, SS: 2 } },
  { maxStage: 70, weights: { C: 16, B: 25, A: 32, S: 24, SS: 3 } },
  { maxStage: 80, weights: { C: 10, B: 20, A: 32, S: 34, SS: 4 } },
  { maxStage: 90, weights: { C: 6, B: 15, A: 30, S: 44, SS: 5 } },
  { maxStage: 100, weights: { C: 3, B: 10, A: 27, S: 55, SS: 5 } },
];

function getRarityBlock(stage: number): RarityBlock {
  const clamped = Math.min(Math.max(Math.floor(stage), 1), 100);
  return RARITY_BLOCKS.find((block) => clamped <= block.maxStage) ?? RARITY_BLOCKS[RARITY_BLOCKS.length - 1];
}

function rollRarity(stage: number): ItemRarity {
  const { weights } = getRarityBlock(stage);
  const total = (Object.values(weights) as number[]).reduce((sum, w) => sum + w, 0);
  let roll = Math.random() * total;
  for (const rarity of Object.keys(weights) as ItemRarity[]) {
    roll -= weights[rarity];
    if (roll < 0) return rarity;
  }
  return "C";
}

export interface DroppedItem {
  itemId: string;
  rarity: ItemRarity;
}

// 1バトル分のドロップ判定。落ちなければnull。レアリティが決まった後は、その
// レアリティの全アイテム（武器種問わず）から均等ランダムで1つ選ぶ。
export function rollDropForBattle(stage: number, isBoss: boolean): DroppedItem | null {
  if (Math.random() >= dropChance(isBoss)) return null;
  const rarity = rollRarity(stage);
  const candidates = ITEM_BASE_INFO.filter((item) => item.rarity === rarity);
  if (candidates.length === 0) return null;
  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  return { itemId: picked.id, rarity };
}
