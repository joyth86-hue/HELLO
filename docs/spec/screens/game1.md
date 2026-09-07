# Game 1 開始画面（`/games/game1`）

実装: [app/games/game1/page.tsx](../../../app/games/game1/page.tsx)、背景切り替え: [lib/background.ts](../../../lib/background.ts)

## 概要

メニュー画面でGame1を選んだ直後に表示される、演出だけの開始画面。ボタンは無く、画面のどこかをタップするとホーム画面（[game1-home.md](./game1-home.md)、`/games/game1/home`）に進む。

## 表示・演出

画面を開くと、以下の順にフェードインする（`Stage`の状態遷移：`initial → bg → logo → ready`）。

1. `initial`：白背景のみ
2. `bg`（約100ms後）：背景画像がフェードイン。画像は時間帯によって3種類のうちいずれか（下記参照）
3. `logo`（約1100ms後）：中央上寄りにタイトル文字「Game 1」（仮のロゴ表示）がフェードイン
4. `ready`（約2000ms後）：画面下部に白文字で「タップして開始する」がフェードイン＋点滅（`animate-pulse`）し、この時点で画面全体がタップ可能になる

`ready` になるまでは画面をタップしても何も起きない（`stage !== "ready"` の間はタップを無視する）。

この画面もスクロール不要なため、`touch-action: none`（Tailwindの`touch-none`）を指定し、上下方向のブラウザ標準スワイプ（スクロール）を無効化している（[character-view.md](./character-view.md)と同様の対応）。

### 背景画像（時間帯で切り替え）

画面を開いた時点の端末時刻（`new Date().getHours()`）に応じて、背景いっぱいに3種類のうちいずれかの画像を表示する。時刻判定は初回表示時の一度きり。

| 時間帯 | 時刻 | 画像 |
| --- | --- | --- |
| 昼 | 5:00〜15:59 | `public/backgrounds/top01.png` |
| 夕方 | 16:00〜18:59 | `public/backgrounds/top02.png` |
| 夜 | 19:00〜4:59 | `public/backgrounds/top03.png` |

## 今後

- タイトル「Game 1」はあくまで仮のロゴ表示。正式なロゴ素材ができ次第差し替える。
- フェードのタイミング（100ms / 1100ms / 2000ms）は仮の値。演出を見ながら調整可能。
