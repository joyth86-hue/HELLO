// Game1専用のセーブデータ（lib/storage.tsのloadGameData/saveGameDataを使う）。
// 他のゲームからは参照しない想定。詳細はdocs/spec/save-data.mdを参照。

import { loadGameData, saveGameData } from "./storage";
import { levelFromInvestedExp } from "./character-growth";

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
  // まだキャラクターに割り振っていない経験値ポイント（戦闘のステージクリアで加算、
  // キャラクター画面の「訓練」でキャラに投入して消費する）。
  expPoints: number;
  // キャラID → そのキャラにこれまで投入した経験値ポイントの累計。
  // レベルはここから逆算する（lib/character-growth.tsのlevelFromInvestedExp）。
  // キー自体が無いキャラは0（＝レベル1）として扱う。
  characterInvestedExp: Record<string, number>;
  // テストプレイ用の全解放モード。詳細はlib/test-mode.ts参照。
  testMode: boolean;
}

export const GAME1_ID = "game1";

const EMPTY_EQUIPMENT: CharacterEquipment = { weapon: null, artifacts: [null, null, null] };

export function getCharacterEquipment(
  data: Game1SaveData,
  characterId: string
): CharacterEquipment {
  return data.equipment[characterId] ?? EMPTY_EQUIPMENT;
}

// 装備スロット1つを指す参照（武器スロットは"weapon"、アーティファクトスロットは0-2）。
export type EquipmentSlotRef = { characterId: string; slot: "weapon" | 0 | 1 | 2 };

// 指定したアイテムIDが、キャラクター全員の装備欄に合計何個使われているかを数える
// （同じ個体を複数箇所に付けられないよう、所持数と比較するために使う）。
// excludeで指定したスロットは集計から除外する（そのスロット自身の現在の中身を
// 「空き」として扱い、同じアイテムを選び直せるようにするため）。
export function countEquippedInstances(
  equipment: EquipmentState,
  itemId: string,
  exclude?: EquipmentSlotRef
): number {
  let count = 0;
  for (const [characterId, eq] of Object.entries(equipment)) {
    const isExcludedChar = exclude?.characterId === characterId;
    if (eq.weapon === itemId && !(isExcludedChar && exclude!.slot === "weapon")) count++;
    eq.artifacts.forEach((id, i) => {
      if (id === itemId && !(isExcludedChar && exclude!.slot === i)) count++;
    });
  }
  return count;
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

export function getCharacterLevel(data: Game1SaveData, characterId: string): number {
  return levelFromInvestedExp(data.characterInvestedExp[characterId] ?? 0);
}

// 未振り分けの経験値ポイントから、指定した量をキャラクターに投入してレベルを上げる。
// amountがexpPointsを超える場合は、超えた分は投入せずexpPoints全額を使う
// （マイナス残高にはしない）。amountが0以下の場合は何もしない。
export function investExpInCharacter(
  data: Game1SaveData,
  characterId: string,
  amount: number
): Game1SaveData {
  const spend = Math.max(0, Math.min(Math.floor(amount), data.expPoints));
  if (spend <= 0) return data;
  const currentInvested = data.characterInvestedExp[characterId] ?? 0;
  return {
    ...data,
    expPoints: data.expPoints - spend,
    characterInvestedExp: {
      ...data.characterInvestedExp,
      [characterId]: currentInvested + spend,
    },
  };
}

// アイテムドロップで入手したアイテムを所持数に加算する。同じIDが複数個渡された
// 場合はまとめて加算し、既に持っているアイテムは数量を増やす（無ければ新規追加）。
export function addItemsToInventory(data: Game1SaveData, itemIds: string[]): Game1SaveData {
  if (itemIds.length === 0) return data;
  const addCounts = new Map<string, number>();
  for (const id of itemIds) {
    addCounts.set(id, (addCounts.get(id) ?? 0) + 1);
  }
  const inventory = data.inventory.map((entry) => ({ ...entry }));
  for (const [itemId, addQuantity] of addCounts) {
    const existing = inventory.find((entry) => entry.itemId === itemId);
    if (existing) {
      existing.quantity += addQuantity;
    } else {
      inventory.push({ itemId, quantity: addQuantity });
    }
  }
  return { ...data, inventory };
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

// 正式なスタート状態：アイテムはドロップ（lib/item-drop.ts）でしか入手できないため、
// 所持なしから始まる。
export const defaultGame1Data: Game1SaveData = {
  playCount: 0,
  inventory: [],
  equipment: {},
  maxClearedStage: 0,
  activePartyIds: ["c01"],
  expPoints: 0,
  characterInvestedExp: {},
  testMode: false,
};

export function loadGame1Data(): Game1SaveData {
  return loadGameData(GAME1_ID, defaultGame1Data);
}

export function saveGame1Data(data: Game1SaveData) {
  saveGameData(GAME1_ID, data);
}
