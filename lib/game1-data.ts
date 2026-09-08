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
  // クリア済みの最大ステージ番号（0=まだ1つもクリアしていない＝ステージ1のみ挑戦可）。
  maxClearedStage: number;
  // バトルに参加させる（編成中の）キャラクターID。最大3人。
  activePartyIds: string[];
}

export const GAME1_ID = "game1";

const EMPTY_EQUIPMENT: CharacterEquipment = { weapon: null, artifacts: [null, null, null] };

export function getCharacterEquipment(
  data: Game1SaveData,
  characterId: string
): CharacterEquipment {
  return data.equipment[characterId] ?? EMPTY_EQUIPMENT;
}

export const MAX_PARTY_SIZE = 3;

// キャラクターが仲間になるステージ（そのステージ番号をクリアした時点で解放）。
// 未掲載のキャラクターは最初から解放済み扱い。
// 参照: docs/spec/screens/adventure.md
export const CHARACTER_UNLOCK_STAGE: Record<string, number> = {
  c03: 3, // コユキ
  c02: 6, // カエデ
  c04: 9, // サユミ
};

// キャラクターが仲間になる順番（c01は最初から仲間）。
export const CHARACTER_UNLOCK_ORDER = ["c01", "c03", "c02", "c04"];

export function isCharacterUnlocked(data: Game1SaveData, characterId: string): boolean {
  const requiredStage = CHARACTER_UNLOCK_STAGE[characterId] ?? 0;
  return data.maxClearedStage >= requiredStage;
}

export function getUnlockedCharacterIds(data: Game1SaveData): string[] {
  return CHARACTER_UNLOCK_ORDER.filter((id) => isCharacterUnlocked(data, id));
}

// 新しく仲間になったキャラクターを、編成人数が3人未満の間は自動で編成に加える
// （「4人揃うまではデフォルトでON、それ以降は手動で入れ替える」という仕様のため）。
export function syncActivePartyWithUnlocks(data: Game1SaveData): Game1SaveData {
  const unlocked = getUnlockedCharacterIds(data);
  const active = data.activePartyIds.filter((id) => unlocked.includes(id));
  for (const id of unlocked) {
    if (active.length >= MAX_PARTY_SIZE) break;
    if (!active.includes(id)) active.push(id);
  }
  if (
    active.length === data.activePartyIds.length &&
    active.every((id, i) => id === data.activePartyIds[i])
  ) {
    return data;
  }
  return { ...data, activePartyIds: active };
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
  maxClearedStage: 0,
  activePartyIds: ["c01"],
};

export function loadGame1Data(): Game1SaveData {
  return loadGameData(GAME1_ID, defaultGame1Data);
}

export function saveGame1Data(data: Game1SaveData) {
  saveGameData(GAME1_ID, data);
}
