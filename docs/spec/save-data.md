# セーブデータ仕様

実装: [lib/storage.ts](../../lib/storage.ts)

## 保存先

ブラウザの `localStorage` に保存する（サーバー側には保存しない）。そのため、別のブラウザ・別の端末では引き継がれない。将来的に端末をまたいだ引き継ぎが必要になった場合は、サーバー保存＋アカウント機能の導入を検討する。

## データの分け方

| 種類 | キー | 内容 |
| --- | --- | --- |
| 共有データ（全ゲーム共通） | `akikun-games:global` | 共通通貨など、ゲームをまたいで使うデータ |
| ゲームごとのデータ | `akikun-games:game:<gameId>`（例: `akikun-games:game:game1`） | そのゲーム内でのみ使う進行状況など |

## 共有データ（`GlobalSaveData`）

```ts
interface GlobalSaveData {
  currency: number; // 共通通貨（モラ）
}
```

### 共通通貨（モラ）

- 単位表示：「モラ」
- 最小値：0
- 最大値：99,999,999
- 上記の範囲を超えないよう、保存時に自動でクランプ（丸め込み）される
- `addCurrency(amount)` で増減し、戻り値として更新後のデータを受け取れる
- 表示用に `formatCurrency(amount)` で「12,345 モラ」のような3桁区切り＋単位の文字列に変換できる
- **全ゲームで共有**。Game 1で稼いだ通貨をGame 2やGame 3でも参照・消費できるようにする、というのがこの仕組みの目的

## ゲームごとのデータ

各ゲームは `loadGameData<T>(gameId, defaultValue)` / `saveGameData<T>(gameId, data)` を使って、そのゲーム専用のデータを自由な形（型`T`）で保存できる。他のゲームからは参照できない想定。

`game1`のデータは[lib/game1-data.ts](../../lib/game1-data.ts)にまとめている。

```ts
interface InventoryEntry {
  itemId: string; // lib/items-info.tsのID（例: "i001"）
  quantity: number;
}

interface Game1SaveData {
  playCount: number; // Game1画面を開いた回数
  inventory: InventoryEntry[]; // 所持アイテム（バッグの中身画面で使用）
}
```

`inventory`は現状、アイテムを入手する仕組み（敵を倒す・報酬をもらうなど）が無いため、[バッグの中身画面](./screens/bag.md)の表示確認用にテストデータ（10種類）を初期値として持たせている。入手システムが決まったら、この初期値は撤去する想定。

## 命名の補足

localStorageのキー接頭辞は `akikun-games` を使用している（アプリの表示名「あきくんゲームズ」に対応する内部的な識別子。プロジェクト自体の内部名は `webapp-game` のままだが、ユーザー向けの表示や保存データの識別子は今後もアプリ名に合わせて更新していく）。
