// ブラウザのlocalStorageにセーブデータを保存するための共通ヘルパー。
// ゲーム全体で共有するデータ（通貨・ユーザー名など）と、ゲームごとの個別データを分けて管理する。
// 詳細な仕様は docs/spec/save-data.md を参照。

const GLOBAL_KEY = "akikun-games:global";
const gameKey = (gameId: string) => `akikun-games:game:${gameId}`;

export const CURRENCY_MIN = 0;
export const CURRENCY_MAX = 99_999_999;
export const CURRENCY_UNIT = "モラ";

export interface GlobalSaveData {
  currency: number;
  userName: string;
}

const defaultGlobalData: GlobalSaveData = {
  currency: 0,
  userName: "",
};

function clampCurrency(value: number): number {
  return Math.min(CURRENCY_MAX, Math.max(CURRENCY_MIN, value));
}

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
  const data = readJson(GLOBAL_KEY, defaultGlobalData);
  return { ...data, currency: clampCurrency(data.currency) };
}

export function saveGlobalData(data: GlobalSaveData) {
  writeJson(GLOBAL_KEY, { ...data, currency: clampCurrency(data.currency) });
}

export function addCurrency(amount: number): GlobalSaveData {
  const current = loadGlobalData();
  const next = { ...current, currency: clampCurrency(current.currency + amount) };
  saveGlobalData(next);
  return next;
}

export function setUserName(name: string): GlobalSaveData {
  const current = loadGlobalData();
  const next = { ...current, userName: name };
  saveGlobalData(next);
  return next;
}

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString("ja-JP")} ${CURRENCY_UNIT}`;
}

export function loadGameData<T>(gameId: string, defaultValue: T): T {
  return readJson(gameKey(gameId), defaultValue);
}

export function saveGameData<T>(gameId: string, data: T) {
  writeJson(gameKey(gameId), data);
}
