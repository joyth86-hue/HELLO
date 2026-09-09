// テストプレイ用の「合言葉」による全解放モード。詳細はdocs/spec/test-mode.md参照。
//
// ホーム画面のプレゼントアイコンから開く「コードを入力」シートで、この
// コードを入力するとON/OFFが切り替わる（本来はギフトコード引き換え用の
// 入り口だが、この合言葉を入れた場合だけテストモードのトグルとして働く）。

import type { Game1SaveData } from "./game1-data";
import { ITEM_BASE_INFO } from "./items-info";

// 管理者用の合言葉。変更したい場合はここを書き換える。
export const TEST_MODE_CODE = "HIROTEST";

// テストモード中、maxClearedStageをこの値まで開放扱いにする
// （docs/spec/adventure-system.mdの「100ステージクリアをゴール」に合わせた値）。
export const TEST_MODE_MAX_STAGE = 100;

// テストモード時に、実際のセーブデータ（進行状況）は書き換えずに、
// 表示・解放判定用のデータだけ「全解放」に差し替えたものを返す。
// 装備・パーティ編成・コード入力などの書き込みは、常に元のGame1SaveData
// （実データ）に対して行うこと。このヘルパーは読み取り専用の用途にのみ使う。
export function getEffectiveGame1Data(data: Game1SaveData): Game1SaveData {
  if (!data.testMode) return data;
  return {
    ...data,
    maxClearedStage: TEST_MODE_MAX_STAGE,
    inventory: ITEM_BASE_INFO.map((item) => ({ itemId: item.id, quantity: 1 })),
  };
}
