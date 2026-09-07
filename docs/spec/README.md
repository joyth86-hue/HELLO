# あきくんゲームズ 仕様書 目次

このディレクトリに、アプリの仕様を機能・内容ごとに分けて記録する。
仕様が変わった・追加された場合は、都度該当ファイルを更新すること。
CLAUDE.md本体には仕様を書かず、常にこの分冊側を更新する。

## 構成

| ファイル | 内容 |
| --- | --- |
| [screen-flow.md](./screen-flow.md) | 画面全体の構成・遷移フロー |
| [screens/start.md](./screens/start.md) | スタート画面の仕様 |
| [screens/menu.md](./screens/menu.md) | ゲームメニュー画面の仕様 |
| [screens/game1.md](./screens/game1.md) | Game 1（仮画面）の仕様 |
| [user-profile.md](./user-profile.md) | ユーザー名登録・ログイン表示の仕様 |
| [save-data.md](./save-data.md) | セーブデータ（共有データ／ゲームごとのデータ）の仕様 |
| [visual-design.md](./visual-design.md) | 配色などビジュアルデザインの方針 |

## 今後ファイルが増える場合の目安

- 新しいゲームを追加する → `screens/gameN.md` を追加し、この表にも行を追加する
- 通貨以外の共有要素（アイテムなど）が増える → `save-data.md` に追記、肥大化したら分割を検討する
- 画面が増えて `screen-flow.md` の遷移図が複雑になってきたら、遷移図と各画面詳細をさらに分ける
