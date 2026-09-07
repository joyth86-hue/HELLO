# 戦闘背景（フィールド）素材

## 保存場所・命名規則

実際にアプリで使う画像は [public/backgrounds/fields/](../../public/backgrounds/fields/) に置く。

ファイル名: `f{連番2桁}_{地形}[_hiru|_yoru].png`（`f`はフィールドのf）

`_hiru`（昼）／`_yoru`（夜）は、その地形に昼夜バリエーションがある場合のみ付く。

| ファイル | 地形 | 時間帯 |
| --- | --- | --- |
| `f01_sougen_hiru.png` | 草原 | 昼 |
| `f02_sougen_yoru.png` | 草原 | 夜 |
| `f03_machi_hiru.png` | 街 | 昼 |
| `f04_machi_yoru.png` | 街 | 夜 |
| `f05_arechi.png` | 荒れ地 | （昼夜なし） |
| `f06_doukutsu.png` | 洞窟 | （昼夜なし） |
| `f07_shinrin.png` | 森林 | （昼夜なし） |
| `f08_kazan.png` | 火山 | （昼夜なし） |
| `f09_kaigan_hiru.png` | 海岸 | 昼 |

## 運用ルール

[characters.md](./characters.md)と同様、画像は外部の画像生成AIでユーザー側が用意し、`WebApp_game/サンプル画像/` フォルダに置いてもらう運用。`サンプル画像/` フォルダの中身は消したり移動させたりせず、使う画像は `public/backgrounds/fields/` に**コピー**する。`サンプル画像/` は `.gitignore` で除外している。

## 今後

- どの画面（戦闘画面など）でどう使うかは未定。実装が決まり次第、該当する画面の仕様書にリンクを追記する。
- 背景の透過処理は行っていない（そのまま1枚絵として表示する想定）。
