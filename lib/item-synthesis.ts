// アイテムの合成（強化）ロジック。docs/spec/items.md参照。
//
// ルール概要（ユーザー確認済み）：
// - 同じ武器種同士、同じアーティファクトslot同士のみ合成できる（種類を跨がない）
// - 合成後に残る個体（生存者）は、合成に使った中で一番レア度が高いもの。
//   同レア度どうしの場合はプレイヤーが「対象」として選んだ方が残る
// - 素材1個につき、（その素材自身の＋値 + 1）に「レア度差の割引」を掛けた分だけ
//   生存者の＋値に加算する（割引が無い＝同レア度なら1倍）
// - レア度差の割引は段差ごとに半分：1段差=1/2, 2段差=1/4, 3段差=1/8, 4段差=1/16
//   （2^段差で割る）
// - ＋値は内部では端数（小数）まで正確に保持し、実際の効果・表示には切り捨てた
//   整数値を使う（端数を毎回切り捨てて確定させると、低レアの端数がいつまでも
//   積み上がらず「素材を何個足しても+0のまま」になってしまうため）

import { getItemBaseInfo, rarityRank, type ItemBaseInfo, type ItemRarity } from "./items-info";
import {
  unequipInstanceEverywhere,
  type Game1SaveData,
  type ItemInstance,
} from "./game1-data";

// 合成1回（＋1）あたりの効果上昇率：アイテム自身の元の基礎値の5%。
export const SYNTHESIS_PLUS_STEP_PERCENT = 0.05;

export function flooredPlus(instance: ItemInstance): number {
  return Math.floor(instance.plus);
}

// 生存者側から見た「素材のレア度が何段差下か」に応じた割引率。
// 段差が無い（同レア度）か、素材の方が高レア（起こらない想定）なら割引なし。
function rarityGapDiscount(materialRarity: ItemRarity, survivorRarity: ItemRarity): number {
  const gap = rarityRank(survivorRarity) - rarityRank(materialRarity);
  if (gap <= 0) return 1;
  return 1 / Math.pow(2, gap);
}

// 同じ「合成グループ」（武器種、またはアーティファクトの同じslot）かどうか。
export function isSameSynthesisGroup(a: ItemBaseInfo, b: ItemBaseInfo): boolean {
  if (a.type !== b.type) return false;
  if (a.type === "アーティファクト") return a.slot === b.slot;
  return true;
}

export interface SynthesisPreview {
  survivorInstanceId: string;
  survivorItem: ItemBaseInfo;
  beforePlusFloored: number;
  resultPlus: number; // 内部の正確な値（端数あり）
  resultPlusFloored: number; // 表示・効果に使う値
  consumedInstanceIds: string[]; // 合成で消える個体（生存者以外）
  usedMaterialCount: number; // 合成グループ不一致などで無視された分を除いた、実際に使われた素材数
}

// targetInstanceIdをプレイヤーが選んだ「軸」として、materialInstanceIdsを合成した
// 結果をプレビューする（実際のセーブデータは書き換えない）。
// 合成グループが違う素材は無視する（本来はUI側の候補一覧で除外される想定だが、
// 念のためここでも防御的にチェックする）。
export function previewSynthesis(
  data: Game1SaveData,
  targetInstanceId: string,
  materialInstanceIds: string[]
): SynthesisPreview | null {
  const target = data.inventory.find((i) => i.instanceId === targetInstanceId);
  if (!target) return null;
  const targetItem = getItemBaseInfo(target.itemId);
  if (!targetItem) return null;

  const rawMaterials = materialInstanceIds
    .filter((id) => id !== targetInstanceId)
    .map((id) => data.inventory.find((i) => i.instanceId === id))
    .filter((i): i is ItemInstance => !!i);

  const materials = rawMaterials.filter((m) => {
    const item = getItemBaseInfo(m.itemId);
    return item && isSameSynthesisGroup(item, targetItem);
  });
  if (materials.length === 0) return null;

  // 生存者＝レア度が一番高い個体（同点なら選んだtargetのまま）。
  let survivor = target;
  let survivorItem = targetItem;
  for (const m of materials) {
    const mItem = getItemBaseInfo(m.itemId)!;
    if (rarityRank(mItem.rarity) > rarityRank(survivorItem.rarity)) {
      survivor = m;
      survivorItem = mItem;
    }
  }

  const allInvolved = [target, ...materials];
  let resultPlus = survivor.plus;
  for (const m of allInvolved) {
    if (m.instanceId === survivor.instanceId) continue;
    const mItem = getItemBaseInfo(m.itemId)!;
    const discount = rarityGapDiscount(mItem.rarity, survivorItem.rarity);
    resultPlus += (m.plus + 1) * discount;
  }

  const consumedInstanceIds = allInvolved
    .map((i) => i.instanceId)
    .filter((id) => id !== survivor.instanceId);

  return {
    survivorInstanceId: survivor.instanceId,
    survivorItem,
    beforePlusFloored: flooredPlus(survivor),
    resultPlus,
    resultPlusFloored: Math.floor(resultPlus),
    consumedInstanceIds,
    usedMaterialCount: materials.length,
  };
}

// previewSynthesisの結果を実際にセーブデータへ適用する（消費した個体を削除し、
// 生存者の＋値を更新、装備欄から消費した個体を外す）。
export function applySynthesis(data: Game1SaveData, preview: SynthesisPreview): Game1SaveData {
  let next = data;
  for (const id of preview.consumedInstanceIds) {
    next = unequipInstanceEverywhere(next, id);
  }
  const consumedSet = new Set(preview.consumedInstanceIds);
  const inventory = next.inventory
    .filter((i) => !consumedSet.has(i.instanceId))
    .map((i) =>
      i.instanceId === preview.survivorInstanceId ? { ...i, plus: preview.resultPlus } : i
    );
  return { ...next, inventory };
}
