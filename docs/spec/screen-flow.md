# 画面構成・遷移フロー

各ゲームごとに専用の入り口画面を持つ構成にしている（複数ゲームをまとめるハブ画面は廃止した。経緯は[screens/start.md](./screens/start.md)参照）。

## 画面一覧

| パス | 画面名 | 説明 |
| --- | --- | --- |
| `/` | アプリ起動画面 | 黒背景→「hiro games」フェードイン→自動でGame1開始画面へ |
| `/games/game1` | Game 1 開始画面 | 背景＋タイトルのフェード演出のあと「タップして開始する」でホームへ |
| `/games/game1/home` | Game 1 ホーム画面 | 「冒険する」「キャラクター」「バッグの中身」「ゲームを終了」の4ボタン |
| `/games/game1/character` | キャラクター確認画面 | [screens/character-view.md](./screens/character-view.md)参照 |
| `/games/game1/bag` | バッグの中身画面 | [screens/bag.md](./screens/bag.md)参照 |

## 遷移フロー

```
/ (アプリ起動画面：黒背景→「hiro games」フェードイン、自動遷移)
  └─ 約2.5秒後、自動的に → /games/game1 (Game1開始画面：背景/タイトルのフェード演出)
                                └─ 演出後、画面タップ → 暗転＋Now Loading演出（約1.8秒）→ /games/game1/home (ホーム画面)
                                                            ├─ 「冒険する」（未実装）
                                                            ├─ 「キャラクター」→ /games/game1/character
                                                            │                       └─ ✕ボタン → /games/game1/home に戻る
                                                            ├─ 「バッグの中身」→ /games/game1/bag
                                                            │                       └─ ✕ボタン → /games/game1/home に戻る
                                                            └─ 「ゲームを終了」→ / (アプリ起動画面に戻る)
```

## 現状の制約・未実装事項

- URLを直接叩けば `/games/game1/home` に、起動画面・開始画面を経由せずアクセスできる（ルートガードは未実装）。
- Game 1ホーム画面の「冒険する」ボタンは見た目のみで、押しても何も起きない。
- 現状はGame 1のみ。別のゲームを追加する場合は、そのゲーム専用の起動画面・開始画面をこのアプリとは別に用意する想定（詳細は未定）。
