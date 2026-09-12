// BGMトラックの定義。docs/spec/audio.md参照。実データは音楽フォルダ（このアプリの
// リポジトリ外、`音楽/`）からユーザーが選定したものを`public/audio/bgm/`へコピーして
// 使っている（画像素材と同じ「元フォルダは変更せずコピーする」方針）。

export const START_BGM = "/audio/bgm/hajimari.mp3"; // ゲーム開始画面（タップして開始する）
export const HOME_BGM = "/audio/bgm/odayakana-toki.mp3"; // ホーム画面
export const STAGE_SELECT_BGM = "/audio/bgm/tsukanoma.mp3"; // ステージ選択画面
export const SHOP_BGM = "/audio/bgm/dokidoki-takarabako.mp3"; // ショップ（ガチャ）画面

export const STAGE_CLEAR_BGM = "/audio/bgm/chiisana-tasseikan.mp3"; // ボス戦を倒した時
export const DEFEAT_BGM = "/audio/bgm/haiboku-wo-shiru-monotachi.mp3"; // 全滅した時

// ボス戦（S-10）用BGM。バトルごとにこのプールからランダムに1つ選ぶ
// （ユーザー確認済み：ボス戦だけはランダム、それ以外の戦闘は下記の通りステージ固定）。
export const BOSS_BATTLE_BGM_POOL = [
  "/audio/bgm/kyouteki-arawaru.mp3",
  "/audio/bgm/shizukanaru-tatakai-2.mp3",
];

// ボス戦以外（S-1〜S-9）の戦闘BGM。ステージ番号ごとに固定の1曲を割り当て、
// 同じステージ内では変えない（ユーザー確認済み）。上記2つ・ホーム/開始/ステージ選択/
// ショップ用として個別に指定された曲を除いた「残りのファイル」がこのプール。
export const NORMAL_BATTLE_BGM_POOL = [
  "/audio/bgm/yuukan-na-senshi-tachi.mp3",
  "/audio/bgm/tenkakeru-ryuu-no-hirameki.mp3",
  "/audio/bgm/tsuki-no-sekai.mp3",
  "/audio/bgm/gekkou-ga-terasu-kemono.mp3",
  "/audio/bgm/kouya-ni-fuku-kaze.mp3",
  "/audio/bgm/shizukanaru-tatakai-1.mp3",
];

// ステージ番号から、そのステージのS-1〜S-9で固定して使うBGMを決める
// （ステージが変わっても同じ曲が続くことはあるが、毎回同じステージなら常に同じ曲になる）。
export function getNormalBattleBgmForStage(stage: number): string {
  const index = (stage - 1) % NORMAL_BATTLE_BGM_POOL.length;
  return NORMAL_BATTLE_BGM_POOL[index];
}

// ボス戦（S-10）に入るたびに呼び、プールからランダムに1つ選ぶ。
export function pickRandomBossBattleBgm(): string {
  const index = Math.floor(Math.random() * BOSS_BATTLE_BGM_POOL.length);
  return BOSS_BATTLE_BGM_POOL[index];
}

// ファイルパス → 曲名（図鑑のBGM一覧で表示用）。元の曲名は`/音楽`フォルダの
// 日本語ファイル名（例：「穏やかなとき.mp3」）そのもの。docs/spec/audio.mdの
// 「画面ごとのBGM割り当て」表と対応させている。
export const BGM_TITLES: Record<string, string> = {
  [START_BGM]: "はじまり",
  [HOME_BGM]: "穏やかなとき",
  [STAGE_SELECT_BGM]: "束の間",
  [SHOP_BGM]: "ドキドキ宝箱",
  [STAGE_CLEAR_BGM]: "小さな達成感",
  [DEFEAT_BGM]: "敗北を知る者たち",
  "/audio/bgm/yuukan-na-senshi-tachi.mp3": "勇敢な戦士たち",
  "/audio/bgm/tenkakeru-ryuu-no-hirameki.mp3": "天翔ける龍の閃き",
  "/audio/bgm/tsuki-no-sekai.mp3": "月の世界",
  "/audio/bgm/gekkou-ga-terasu-kemono.mp3": "月光が照らす獣",
  "/audio/bgm/kouya-ni-fuku-kaze.mp3": "荒野に吹く風",
  "/audio/bgm/shizukanaru-tatakai-1.mp3": "静かなる闘い1",
  "/audio/bgm/kyouteki-arawaru.mp3": "強敵現る",
  "/audio/bgm/shizukanaru-tatakai-2.mp3": "静かなる闘い2",
};

export interface BgmTrackEntry {
  src: string;
  title: string;
}

// 図鑑のBGMタブ用：ゲーム内で使っている全BGMを一覧表示する（聴いたことが
// あるかどうかに関わらず全曲聴ける、ユーザー確認済みの割り切り）。
export const ALL_BGM_TRACKS: BgmTrackEntry[] = Object.entries(BGM_TITLES).map(([src, title]) => ({
  src,
  title,
}));
