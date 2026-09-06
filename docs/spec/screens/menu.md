# ゲームメニュー画面（`/menu`）

実装: [app/menu/page.tsx](../../../app/menu/page.tsx)

## 概要

スタート画面のStartボタンから遷移する、遊ぶゲームを選ぶ画面。

## 表示要素

- 画面右上：所持している共通通貨（モラ）を黒背景の丸ピルで表示。仕様は [../save-data.md](../save-data.md) を参照
- 中央上部：「Game Menu」の見出し
- ゲーム一覧（縦に並ぶボタン／カード）
  - **Game 1**：タップ可能。`/games/game1` へ遷移する（黒背景・白文字）
  - **Game 2**：タップ不可。「Coming soon...」と併記し、グレーアウト表示
  - **Game 3**：タップ不可。「Coming soon...」と併記し、グレーアウト表示

## 今後ゲームを追加する場合

`app/menu/page.tsx` 内の `games` 配列に `{ id, label, href, available }` を追加し、対応する `/games/gameN/page.tsx` を実装したら `available: true` にする。あわせてこの仕様書と [screens/gameN.md](./) を追加すること。
