// スキルの解放・強化（スキルポイントの消費）に関する計算。
// ユーザー確認済みのルール：
// - 各キャラの1枠目（lib/skills-info.tsのSTARTER_SKILLS）は最初から解放済み
// - それ以外のスキルは、解放にスキルポイントを消費する（解放コストは装備の合成と
//   同じ「10pt＝1段階」に合わせ、解放も10ptで＋0の状態になる形にしている）
// - 解放後は、さらに10ptにつき＋1ずつ強化できる（装備の合成と同じ固定コスト）
// - スキルポイントは経験値ポイントとは別の資源。ステージクリア時に経験値と一緒に
//   加算されるが、金額は固定（ステージが進んでも増えない）——経験値との違いを
//   出すための仕様（ユーザー確認済み）

import { isStarterSkill } from "./skills-info";

export const SKILL_POINT_COST_PER_STEP = 10; // 解放1回・強化+1につき必要なpt（固定）
export const SKILL_POINTS_PER_STAGE_CLEAR = 5; // ステージクリア時に貰える固定量

export function isSkillUnlocked(skillId: string, investedPoints: number): boolean {
  if (isStarterSkill(skillId)) return true;
  return investedPoints >= SKILL_POINT_COST_PER_STEP;
}

// スキルの強化段階（＋N）。starterスキルは解放コスト無しでそのまま10pt単位で＋N。
// 非starterスキルは、最初の10ptが「解放」に使われ、その後の10pt単位で＋N。
export function skillPlusLevel(skillId: string, investedPoints: number): number {
  if (isStarterSkill(skillId)) {
    return Math.floor(investedPoints / SKILL_POINT_COST_PER_STEP);
  }
  if (investedPoints < SKILL_POINT_COST_PER_STEP) return 0;
  return Math.floor((investedPoints - SKILL_POINT_COST_PER_STEP) / SKILL_POINT_COST_PER_STEP);
}

// 次の1段階（未解放なら解放、解放済みならさらに+1）に必要な残りpt。
export function pointsToNextStep(skillId: string, investedPoints: number): number {
  const nextThreshold =
    (Math.floor(investedPoints / SKILL_POINT_COST_PER_STEP) + 1) * SKILL_POINT_COST_PER_STEP;
  return nextThreshold - investedPoints;
}
