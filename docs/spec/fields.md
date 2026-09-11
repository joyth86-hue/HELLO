# 戦闘画面用 背景素材

すべて「戦闘画面」で使う背景（ユーザー確認済み）。冒険（[game1-home.md](./screens/game1-home.md)の「冒険する」）を、戦闘画面だけで構成するか、戦闘外の探索フィールドを別途用意してイベント発生時に戦闘画面へ切り替える構成にするかは、まだ決まっていない。

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
| `f10_kaigan_yoru.png` | 海岸 | 夜 |

## 運用ルール

[characters.md](./characters.md)と同様、画像は外部の画像生成AIでユーザー側が用意し、`WebApp_game/サンプル画像/` フォルダに置いてもらう運用。`サンプル画像/` フォルダの中身は消したり移動させたりせず、使う画像は `public/backgrounds/fields/` に**コピー**する。`サンプル画像/` は `.gitignore` で除外している。

コピー漏れを防ぐため、ファイルを拾う際は `f0*` のような桁数を仮定したパターンではなく、`f*` のように接頭辞のみで網羅的に検索すること（`f10` 以降が `f0*` では引っかからず一度取りこぼした実績あり）。

## 地面拡張版への差し替え（v1）

元データ: `C:\Users\田中宏樹\Documents\Codex\hirogames_images\assets\backgrounds\battle\ground_expanded_v1\`（このアプリのリポジトリ外にある画像制作用フォルダ、`README.md`に仕様あり）。

キャラクターを配置できる地面のスペースが少なすぎるという指摘を受け、10種類すべてを「遠景（空・海・建物など）を上部20%に集約し、下部80%を地面として確保」した加工版（941×1672px）に差し替えた（ユーザー確認済み）。ファイル名・`f{連番2桁}`の対応関係・[lib/enemy-scaling.ts](../../lib/enemy-scaling.ts)の`getFieldImagePathForStage()`は変更していない（同じファイル名のまま中身だけ差し替え）。対応関係は以下の通り（元データ側のファイル名 → このアプリでのファイル名）。

| 元データ | このアプリ |
| --- | --- |
| `grass_day.png` | `f01_sougen_hiru.png` |
| `grass_night.png` | `f02_sougen_yoru.png` |
| `town_day.png` | `f03_machi_hiru.png` |
| `town_night.png` | `f04_machi_yoru.png` |
| `wasteland.png` | `f05_arechi.png` |
| `cave.png` | `f06_doukutsu.png` |
| `forest.png` | `f07_shinrin.png` |
| `volcano.png` | `f08_kazan.png` |
| `beach_day.png` | `f09_kaigan_hiru.png` |
| `beach_night.png` | `f10_kaigan_yoru.png` |

この差し替えに合わせて、キャラクター・敵の表示サイズを大きくする調整を別途行う予定（本差し替えではファイルの入れ替えのみ行い、配置・サイズの調整はまだ行っていない）。

## 今後

- 冒険の画面構成（戦闘のみ／探索フィールド＋戦闘の切り替え）が決まり次第、該当する画面の仕様書を追加し、ここからリンクする。
- 背景の透過処理は行っていない（そのまま1枚絵として表示する想定）。
