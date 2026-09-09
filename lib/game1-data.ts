// Game1専用のセーブデータ（lib/storage.tsのloadGameData/saveGameDataを使う）。
// 他のゲームからは参照しない想定。詳細はdocs/spec/save-data.mdを参照。

import { loadGameData, saveGameData, readRawGameData } from "./storage";
import { levelFromInvestedExp } from "./character-growth";

// アイテムの所持数上限（個体数ベース）。超えるドロップは受け取れない。
export const INVENTORY_CAP = 100;

// 所持アイテム1個1個を指す実体。同じitemIdでも個体ごとに合成の＋値が異なりうる
// ため、「itemId＋所持数」ではなく個体（インスタンス）単位で管理する。
export interface ItemInstance {
  instanceId: string;
  itemId: string;
  // 合成による強化値。内部では端数（小数）まで正確に保持し、実際の効果・表示には
  // 切り捨てた整数値を使う（lib/item-synthesis.tsのflooredPlus参照）。
  plus: number;
}

function generateInstanceId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `inst-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// キャラクター1体分の装備。武器スロット1つ＋アーティファクトスロット3つ固定。
// 値はアイテムID**ではなく**、所持アイテムの個体ID（ItemInstance.instanceId）。
export interface CharacterEquipment {
  weapon: string | null;
  artifacts: [string | null, string | null, string | null];
}

// キャラクターID → 装備。まだ何も装備していないキャラクターはキー自体が無い
// （getCharacterEquipmentで空の装備として扱う）。
export type EquipmentState = Record<string, CharacterEquipment>;

// セーブデータの構造を変える際にインクリメントする。読み込み時にこれと一致しない
// （＝古い構造の）データは初期状態として扱う（詳細はloadGame1Data参照）。
export const SAVE_SCHEMA_VERSION = 2;

export interface Game1SaveData {
  schemaVersion: number;
  playCount: number;
  inventory: ItemInstance[];
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

export function getItemInstance(data: Game1SaveData, instanceId: string): ItemInstance | undefined {
  return data.inventory.find((i) => i.instanceId === instanceId);
}

// 装備スロット1つを指す参照（武器スロットは"weapon"、アーティファクトスロットは0-2）。
export type EquipmentSlotRef = { characterId: string; slot: "weapon" | 0 | 1 | 2 };

// 指定した個体（instanceId）が、exclude以外のどこかのスロットに装備されているかを調べる
// （同じ個体を複数箇所に付けられないようにするため）。excludeで指定したスロットは
// 「今まさにそこに入っている個体を選び直せるように」判定から除外する。
export function isInstanceEquippedElsewhere(
  equipment: EquipmentState,
  instanceId: string,
  exclude?: EquipmentSlotRef
): boolean {
  for (const [characterId, eq] of Object.entries(equipment)) {
    const isExcludedChar = exclude?.characterId === characterId;
    if (eq.weapon === instanceId && !(isExcludedChar && exclude!.slot === "weapon")) return true;
    for (let i = 0; i < eq.artifacts.length; i++) {
      if (eq.artifacts[i] === instanceId && !(isExcludedChar && exclude!.slot === i)) return true;
    }
  }
  return false;
}

// 指定した個体を今装備しているキャラクターID（いなければnull）。
export function findEquippedOwner(equipment: EquipmentState, instanceId: string): string | null {
  for (const [characterId, eq] of Object.entries(equipment)) {
    if (eq.weapon === instanceId || eq.artifacts.includes(instanceId)) return characterId;
  }
  return null;
}

// 指定した個体を、装備している全キャラクターの装備欄から外す
// （合成で消費される個体を装備から確実に外すために使う）。
export function unequipInstanceEverywhere(data: Game1SaveData, instanceId: string): Game1SaveData {
  let changed = false;
  const equipment: EquipmentState = {};
  for (const [characterId, eq] of Object.entries(data.equipment)) {
    let next = eq;
    if (next.weapon === instanceId) {
      next = { ...next, weapon: null };
      changed = true;
    }
    if (next.artifacts.includes(instanceId)) {
      next = {
        ...next,
        artifacts: next.artifacts.map((id) => (id === instanceId ? null : id)) as CharacterEquipment["artifacts"],
      };
      changed = true;
    }
    equipment[characterId] = next;
  }
  return changed ? { ...data, equipment } : data;
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

export interface AddItemsResult {
  data: Game1SaveData;
  acceptedCount: number;
  rejectedCount: number;
}

// アイテムドロップで入手したアイテムを、新しい個体として所持数に加える。
// 所持数の上限（INVENTORY_CAP）に達している分は受け取れない（rejectedCountに計上、
// 何のアイテムだったかは呼び出し側にも渡さない——バッグ画面などで「受け取れな
// かった」旨だけ表示し、中身は見せない仕様のため）。
export function addItemsToInventory(data: Game1SaveData, itemIds: string[]): AddItemsResult {
  if (itemIds.length === 0) return { data, acceptedCount: 0, rejectedCount: 0 };
  const inventory = [...data.inventory];
  let acceptedCount = 0;
  let rejectedCount = 0;
  for (const itemId of itemIds) {
    if (inventory.length >= INVENTORY_CAP) {
      rejectedCount++;
      continue;
    }
    inventory.push({ instanceId: generateInstanceId(), itemId, plus: 0 });
    acceptedCount++;
  }
  return { data: { ...data, inventory }, acceptedCount, rejectedCount };
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
  schemaVersion: SAVE_SCHEMA_VERSION,
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
  // 古い構造のセーブデータ（アイテムが個体管理になる前のものなど）をそのまま読むと
  // 表示や計算が壊れるため、保存されている生データのバージョンが一致しない場合は
  // 初期状態にリセットする。readRawGameData()はマージをしないので、バージョン
  // フィールド自体が無い（＝旧形式の）データも確実に検出できる。
  const raw = readRawGameData(GAME1_ID) as { schemaVersion?: number } | null;
  if (raw !== null && raw.schemaVersion !== SAVE_SCHEMA_VERSION) return defaultGame1Data;
  return loadGameData(GAME1_ID, defaultGame1Data);
}

export function saveGame1Data(data: Game1SaveData) {
  saveGameData(GAME1_ID, data);
}
