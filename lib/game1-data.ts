// Game1専用のセーブデータ（lib/storage.tsのloadGameData/saveGameDataを使う）。
// 他のゲームからは参照しない想定。詳細はdocs/spec/save-data.mdを参照。

import { loadGameData, saveGameData } from "./storage";

export interface InventoryEntry {
  itemId: string;
  quantity: number;
}

// キャラクター1体分の装備。武器スロット1つ＋アーティファクトスロット3つ固定。
export interface CharacterEquipment {
  weapon: string | null;
  artifacts: [string | null, string | null, string | null];
}

// キャラクターID → 装備。まだ何も装備していないキャラクターはキー自体が無い
// （getCharacterEquipmentで空の装備として扱う）。
export type EquipmentState = Record<string, CharacterEquipment>;

export interface Game1SaveData {
  playCount: number;
  inventory: InventoryEntry[];
  equipment: EquipmentState;
}

export const GAME1_ID = "game1";

const EMPTY_EQUIPMENT: CharacterEquipment = { weapon: null, artifacts: [null, null, null] };

export function getCharacterEquipment(
  data: Game1SaveData,
  characterId: string
): CharacterEquipment {
  return data.equipment[characterId] ?? EMPTY_EQUIPMENT;
}

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
  equipment: {},
};

export function loadGame1Data(): Game1SaveData {
  return loadGameData(GAME1_ID, defaultGame1Data);
}

export function saveGame1Data(data: Game1SaveData) {
  saveGameData(GAME1_ID, data);
}
