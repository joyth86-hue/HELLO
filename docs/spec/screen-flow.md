# 画面構成・遷移フロー

各ゲームごとに専用の入り口画面を持つ構成にしている（複数ゲームをまとめるハブ画面は廃止した。経緯は[screens/start.md](./screens/start.md)参照）。

## 画面一覧

| パス | 画面名 | 説明 |
| --- | --- | --- |
| `/` | アプリ起動画面 | 黒背景→「hiro games」フェードイン→自動でGame1開始画面へ |
| `/games/game1` | Game 1 開始画面 | 背景＋タイトルのフェード演出のあと「タップして開始する」でホームへ |
| `/games/game1/home` | Game 1 ホーム画面（冒険タブ） | [screens/game1-home.md](./screens/game1-home.md)参照 |
| `/games/game1/map` | マップ画面 | 未実装（プレースホルダーのみ） |
| `/games/game1/shop` | ショップ画面 | 未実装（プレースホルダーのみ） |
| `/games/game1/character` | キャラクター確認画面（仲間タブ） | [screens/character-view.md](./screens/character-view.md)参照 |
| `/games/game1/bag` | バッグの中身画面 | [screens/bag.md](./screens/bag.md)参照 |
| `/games/game1/battle` | 戦闘画面（動作確認版） | [screens/battle-test.md](./screens/battle-test.md)参照。下部ナビゲーションバーの管理外の独立画面 |

上記5画面（ホーム/マップ/ショップ/キャラクター/バッグ）は、画面下部の[下部ナビゲーションバー](./screens/bottom-nav.md)（マップ/ショップ/冒険/仲間/バッグの5タブ）で直接切り替える構成になっている（以前の「ホーム画面から個別画面へ行って✕で戻る」構成から変更した）。

## 遷移フロー

```
/ (アプリ起動画面：黒背景→「hiro games」フェードイン、自動遷移)
  └─ 約2.5秒後、自動的に → /games/game1 (Game1開始画面：背景/タイトルのフェード演出)
                                └─ 演出後、画面タップ → 暗転＋Now Loading演出（約1.8秒）→ /games/game1/home (ホーム画面＝冒険タブ)
                                                            └─ 下部ナビゲーションバー（常時表示）で以下を直接切り替え
                                                                ├─ マップ → /games/game1/map（未実装）
                                                                ├─ ショップ → /games/game1/shop（未実装）
                                                                ├─ 冒険 → /games/game1/home
                                                                ├─ 仲間 → /games/game1/character
                                                                └─ バッグ → /games/game1/bag
                                                            └─ （動作確認用の仮ボタン）「⚔ 戦闘テスト（仮）」→ /games/game1/battle
                                                                            └─ 勝敗が決まると自動で /games/game1/home に戻る
```

## 現状の制約・未実装事項

- URLを直接叩けば `/games/game1/home` に、起動画面・開始画面を経由せずアクセスできる（ルートガードは未実装）。
- マップ・ショップ画面は未実装（タブとしては切り替わるが、中身は「準備中です」のプレースホルダーのみ）。
- 下部ナビゲーションバーへの移行にあたって、以前ホーム画面にあった「ゲームを終了」（`/`に戻る）ボタンは一旦なくなった。必要であれば別途検討する。
- 現状はGame 1のみ。別のゲームを追加する場合は、そのゲーム専用の起動画面・開始画面をこのアプリとは別に用意する想定（詳細は未定）。
