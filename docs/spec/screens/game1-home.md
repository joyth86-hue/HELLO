# Game 1 ホーム画面（`/games/game1/home`）

実装: [app/games/game1/home/page.tsx](../../../app/games/game1/home/page.tsx)

## 概要

[Game 1開始画面](./game1.md)でタップした後に表示される、Game1のメイン画面。他画面（[character-view.md](./character-view.md)、[bag.md](./bag.md)）が使う[流れる文字パターンの共通背景](../visual-design.md#背景流れる文字パターン)（`GameBackground`）とは別に、この画面専用の背景イラストを敷いている。

## 背景イラスト

仲間の拠点（ギルドホール風の部屋）のイラストで、**編成している仲間の人数に応じて背景に描かれるキャラクターの人数も増える**想定（`home_01`=1人〜`home_04`=4人）。画像は[public/backgrounds/home/](../../../public/backgrounds/home/)に4種類（`home_01_akane.png` / `home_02_akane_koyuki.png` / `home_03_akane_koyuki_kaede.png` / `home_04_akane_koyuki_kaede_sayumi.png`）が揃っている。

パーティ編成の仕組みがまだ無いため、**現状は`home_04`（4人とも揃った版）で固定**している（テスト目的、`app/games/game1/home/page.tsx`の`HOME_BACKGROUND`定数）。編成の仕組みができたら、人数に応じて動的に切り替える。

## 表示要素

- 見出し「Game 1」（背景イラストの上でも読めるよう、文字に影を付けている）
- ステータスカード：共通通貨（全ゲーム共有）の現在値、このゲームのプレイ回数（画面を開くたびに+1し、`game1`のセーブデータに保存）。背景イラストの上でも読めるよう、不透明度の高いダークガラス風のカードにしている
- ボタン4つ（縦に配置）
  1. 「冒険する」：未実装（押しても何も起きない）
  2. 「キャラクター」：[キャラクター確認画面](./character-view.md)（`/games/game1/character`）に遷移する
  3. 「バッグの中身」：[バッグの中身画面](./bag.md)（`/games/game1/bag`）に遷移する
  4. 「ゲームを終了」：`/`（アプリ起動画面）に戻る

## 今後

- 「冒険する」の中身が決まり次第、この仕様書と実装を更新する。
- ボタンの配置は現状「とりあえずのテスト」段階。`home_04`だと、「キャラクター」「バッグの中身」ボタンの端がキャラクターの頭に軽く重なっているため、配置・背景の調整を検討する。
- パーティ編成の仕組みができたら、`HOME_BACKGROUND`を編成人数に応じて`home_01`〜`home_04`から動的に選ぶよう変更する。
