# 仕様書 目次

このディレクトリに、アプリの仕様を機能・内容ごとに分けて記録する。
仕様が変わった・追加された場合は、都度該当ファイルを更新すること。
CLAUDE.md本体には仕様を書かず、常にこの分冊側を更新する。

## 構成

| ファイル | 内容 |
| --- | --- |
| [screen-flow.md](./screen-flow.md) | 画面全体の構成・遷移フロー |
| [screens/start.md](./screens/start.md) | アプリ起動画面（`/`）の仕様 |
| [screens/game1.md](./screens/game1.md) | Game 1 開始画面（背景/タイトルのフェード演出）の仕様 |
| [screens/game1-home.md](./screens/game1-home.md) | Game 1 ホーム画面（冒険する/キャラクター/バッグの中身/ゲームを終了）の仕様 |
| [screens/character-view.md](./screens/character-view.md) | キャラクター確認画面の仕様 |
| [screens/bag.md](./screens/bag.md) | バッグの中身画面（所持アイテム一覧）の仕様 |
| [screens/bottom-nav.md](./screens/bottom-nav.md) | 下部ナビゲーションバー（マップ/ショップ/冒険/仲間/バッグ）の仕様 |
| [screens/shop.md](./screens/shop.md) | ショップ（武器ガチャ）画面の仕様（現状は演出確認版） |
| [screens/battle.md](./screens/battle.md) | 戦闘画面のレイアウト設計（仲間・敵の配置） |
| [screens/battle-test.md](./screens/battle-test.md) | 戦闘画面・ターン制通常攻撃の動作確認版（`/games/game1/battle`） |
| [adventure-system.md](./adventure-system.md) | 冒険システム設計（ステージ進行・キャラクター解放・レベル成長・ドロップ・ダメージ計算） |
| [screens/stages.md](./screens/stages.md) | ステージ選択画面（`/games/game1/stages`）の仕様 |
| [save-data.md](./save-data.md) | セーブデータ（共有データ／ゲームごとのデータ）の仕様 |
| [characters.md](./characters.md) | 仲間キャラクター素材（画像）の管理方法 |
| [enemies.md](./enemies.md) | 敵キャラクター素材（画像）の管理方法 |
| [roster.md](./roster.md) | 仲間・敵キャラクターの基本情報一覧（名称・属性・武器種など） |
| [battle-stages.md](./battle-stages.md) | （不採用）ステージ手打ち定義の旧設計。現行の自動生成方式は[adventure-system.md](./adventure-system.md)参照 |
| [fields.md](./fields.md) | 戦闘背景（フィールド）素材の管理方法 |
| [items.md](./items.md) | アイテム（武器・アーティファクト）素材と基本情報、装備効果、個体管理・合成の仕様 |
| [visual-design.md](./visual-design.md) | 配色などビジュアルデザインの方針 |
| [ui-buttons.md](./ui-buttons.md) | 共通UIボタン素材（ホーム画面導線・戦闘画面の攻撃/スキルボタン用）の管理方法 |
| [skills.md](./skills.md) | スキルデータ（ID・表示名・説明・戦闘画面5枠への割り当て）※仮データ |
| [test-mode.md](./test-mode.md) | テストモード（合言葉で全ステージ・全アイテムを解放するテストプレイ用モード）の仕様 |

## 今後ファイルが増える場合の目安

- 新しいゲームを追加する → そのゲーム専用の入り口画面・`screens/gameN.md` を追加し、この表にも行を追加する（[screen-flow.md](./screen-flow.md)の方針欄も参照）
- 通貨以外の共有要素（アイテムなど）が増える → `save-data.md` に追記、肥大化したら分割を検討する
- 画面が増えて `screen-flow.md` の遷移図が複雑になってきたら、遷移図と各画面詳細をさらに分ける
