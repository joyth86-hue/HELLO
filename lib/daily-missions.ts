// デイリーミッション。docs/spec/screens/game1-home.mdの「デイリーミッション」節参照。
// ユーザー確認済みのルール：
// - ミッションは5つ（ログイン／バトル勝利／ステージクリア／育成／コンプリート）
// - 「達成」と「受取」は別。達成しても、受取をタップするまで報酬は入らない
// - 報酬でガチャチケットが出るのはステージクリアとコンプリートの2つだけ（1日最大2枚）
// - 日付が変わったら（ローカル日付基準）、その日の進捗・受取状態は自動でリセットされる

import type { Game1SaveData } from "./game1-data";

export type MissionKey = "login" | "battle" | "stage" | "train" | "complete";

export interface MissionClaimedState {
  login: boolean;
  battle: boolean;
  stage: boolean;
  train: boolean;
  complete: boolean;
}

export interface DailyMissionState {
  date: string; // ローカル日付（YYYY-MM-DD）。この日付の分の進捗であることを示す
  battleWinCount: number; // 今日、勝利したバトル（ステージ内の1戦ごと）の数
  stageClearCount: number; // 今日、クリアした（ボスを倒した）ステージの数
  trainOrSynthesizeCount: number; // 今日、訓練または合成を行った回数
  claimed: MissionClaimedState;
}

export const BATTLE_WIN_GOAL = 3;
export const STAGE_CLEAR_GOAL = 1;
export const TRAIN_OR_SYNTHESIZE_GOAL = 1;

// dateを""にしておくことで、実際の日付（YYYY-MM-DD）とは絶対に一致せず、
// 初回ロード時に必ずgetEffectiveDailyMissions()でリセットされる。
export const defaultDailyMissionState: DailyMissionState = {
  date: "",
  battleWinCount: 0,
  stageClearCount: 0,
  trainOrSynthesizeCount: 0,
  claimed: { login: false, battle: false, stage: false, train: false, complete: false },
};

export function getTodayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 保存されているdailyMissionsが今日の分でなければ、その場で今日分の初期状態を返す
// （実際の書き戻しは呼び出し側がsaveGame1Data()する時点で行われる）。
export function getEffectiveDailyMissions(data: Game1SaveData): DailyMissionState {
  const today = getTodayDateString();
  if (data.dailyMissions.date === today) return data.dailyMissions;
  return { ...defaultDailyMissionState, date: today };
}

export function isMissionComplete(state: DailyMissionState, key: MissionKey): boolean {
  switch (key) {
    case "login":
      return true; // ホーム画面を開いた時点（＝この状態が存在する時点）で自動達成扱い
    case "battle":
      return state.battleWinCount >= BATTLE_WIN_GOAL;
    case "stage":
      return state.stageClearCount >= STAGE_CLEAR_GOAL;
    case "train":
      return state.trainOrSynthesizeCount >= TRAIN_OR_SYNTHESIZE_GOAL;
    case "complete":
      // 他4つを「受取済み」まで済ませていることをコンプリートの条件にする
      // （達成しただけ・未受取の状態でコンプリートだけ受け取れてしまうのを防ぐため）。
      return state.claimed.login && state.claimed.battle && state.claimed.stage && state.claimed.train;
  }
}

export function addBattleWins(data: Game1SaveData, count: number): Game1SaveData {
  if (count <= 0) return data;
  const state = getEffectiveDailyMissions(data);
  return { ...data, dailyMissions: { ...state, battleWinCount: state.battleWinCount + count } };
}

export function addStageClear(data: Game1SaveData): Game1SaveData {
  const state = getEffectiveDailyMissions(data);
  return { ...data, dailyMissions: { ...state, stageClearCount: state.stageClearCount + 1 } };
}

export function markTrainOrSynthesize(data: Game1SaveData): Game1SaveData {
  const state = getEffectiveDailyMissions(data);
  return {
    ...data,
    dailyMissions: { ...state, trainOrSynthesizeCount: state.trainOrSynthesizeCount + 1 },
  };
}

// ミッション報酬を受け取る。未達成・受取済みの場合は何もしない（dataをそのまま返す）。
export function claimMission(data: Game1SaveData, key: MissionKey): Game1SaveData {
  const state = getEffectiveDailyMissions(data);
  if (state.claimed[key] || !isMissionComplete(state, key)) return data;

  const next: Game1SaveData = {
    ...data,
    dailyMissions: { ...state, claimed: { ...state.claimed, [key]: true } },
  };

  switch (key) {
    case "login":
      return { ...next, expPoints: next.expPoints + 20 };
    case "battle":
      return { ...next, expPoints: next.expPoints + 30 };
    case "stage":
      return { ...next, gachaTickets: next.gachaTickets + 1 };
    case "train":
      return { ...next, skillPoints: next.skillPoints + 5 };
    case "complete":
      return { ...next, gachaTickets: next.gachaTickets + 1 };
  }
}

export interface MissionListEntry {
  key: MissionKey;
  title: string;
  description: string;
  rewardLabel: string;
  goal: (state: DailyMissionState) => number;
  progress: (state: DailyMissionState) => number;
}

export const MISSION_LIST: MissionListEntry[] = [
  {
    key: "login",
    title: "ログインボーナス",
    description: "ゲームを開く",
    rewardLabel: "経験値+20pt",
    goal: () => 1,
    progress: () => 1,
  },
  {
    key: "battle",
    title: "バトル勝利",
    description: `バトルに${BATTLE_WIN_GOAL}回勝利する`,
    rewardLabel: "経験値+30pt",
    goal: () => BATTLE_WIN_GOAL,
    progress: (s) => s.battleWinCount,
  },
  {
    key: "stage",
    title: "ステージクリア",
    description: "ステージを1つクリアする",
    rewardLabel: "ガチャチケット×1",
    goal: () => STAGE_CLEAR_GOAL,
    progress: (s) => s.stageClearCount,
  },
  {
    key: "train",
    title: "育成",
    description: "訓練または合成を1回行う",
    rewardLabel: "スキルポイント+5pt",
    goal: () => TRAIN_OR_SYNTHESIZE_GOAL,
    progress: (s) => s.trainOrSynthesizeCount,
  },
  {
    key: "complete",
    title: "コンプリートボーナス",
    description: "上記すべてを受け取る",
    rewardLabel: "ガチャチケット×1",
    goal: () => 4,
    progress: (s) => [s.claimed.login, s.claimed.battle, s.claimed.stage, s.claimed.train].filter(Boolean).length,
  },
];
