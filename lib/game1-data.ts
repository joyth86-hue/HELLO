// Game1専用のセーブデータ（lib/storage.tsのloadGameData/saveGameDataを使う）。
// 他のゲームからは参照しない想定。詳細はdocs/spec/save-data.mdを参照。

import { loadGameData, saveGameData } from "./storage";

export interface InventoryEntry {
  itemId: string;
  quantity: number;
}

export interface Game1SaveData {
  playCount: number;
  inventory: InventoryEntry[];
}

export const GAME1_ID = "game1";

// 敵を倒す・報酬をもらうといった「アイテムを入手する仕組み」がまだ無いため、
// バッグ画面の表示を作って確認するための仮の初期所持アイテム。
// 入手システムが決まったら、この初期値は撤去して空の配列にする。
export const defaultGame1Data: Game1SaveData = {
  playCount: 0,
  inventory: [
    { itemId: "i001", quantity: 1 },
    { itemId: "i005", quantity: 2 },
    { itemId: "i011", quantity: 1 },
    { itemId: "i026", quantity: 1 },
    { itemId: "i041", quantity: 1 },
    { itemId: "i051", quantity: 1 },
    { itemId: "i066", quantity: 1 },
    { itemId: "i076", quantity: 3 },
    { itemId: "i101", quantity: 1 },
    { itemId: "i226", quantity: 1 },
  ],
};

export function loadGame1Data(): Game1SaveData {
  return loadGameData(GAME1_ID, defaultGame1Data);
}

export function saveGame1Data(data: Game1SaveData) {
  saveGameData(GAME1_ID, data);
}
