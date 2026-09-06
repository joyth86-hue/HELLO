// ブラウザのlocalStorageにセーブデータを保存するための共通ヘルパー。
// ゲーム全体で共有するデータ（通貨など）と、ゲームごとの個別データを分けて管理する。

const GLOBAL_KEY = "kanata-games:global";
const gameKey = (gameId: string) => `kanata-games:game:${gameId}`;

export interface GlobalSaveData {
  currency: number;
}

const defaultGlobalData: GlobalSaveData = {
  currency: 0,
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadGlobalData(): GlobalSaveData {
  return readJson(GLOBAL_KEY, defaultGlobalData);
}

export function saveGlobalData(data: GlobalSaveData) {
  writeJson(GLOBAL_KEY, data);
}

export function addCurrency(amount: number): GlobalSaveData {
  const current = loadGlobalData();
  const next = { ...current, currency: current.currency + amount };
  saveGlobalData(next);
  return next;
}

export function loadGameData<T>(gameId: string, defaultValue: T): T {
  return readJson(gameKey(gameId), defaultValue);
}

export function saveGameData<T>(gameId: string, data: T) {
  writeJson(gameKey(gameId), data);
}
