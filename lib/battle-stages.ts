// 戦闘ステージの定義。
//
// ID は "bs{ワールド2桁}-{ステージ2桁}" 形式（マリオの 1-1, 1-2 ... 2-1 と同じ発想）。
// 1ステージにつき、使う戦闘背景と、1体目〜3体目に出す敵が一意に決まる。
// 2体目・3体目は null にすると「敵なし」（配置しない）。

import type { EnemyBaseInfo } from "./enemies-info";

export interface BattleStage {
  id: string;
  backgroundId: string; // docs/spec/fields.md の f01 など（先頭の "f" は付けない）
  enemyIds: [string | null, string | null, string | null];
}

export const BATTLE_STAGES: BattleStage[] = [
  {
    id: "bs01-01",
    backgroundId: "f01",
    enemyIds: ["e01", null, null],
  },
];

export function getBattleStage(id: string): BattleStage | undefined {
  return BATTLE_STAGES.find((s) => s.id === id);
}

export function getStageEnemyIds(stage: BattleStage): EnemyBaseInfo["id"][] {
  return stage.enemyIds.filter((id): id is string => id !== null);
}
