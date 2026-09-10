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
// 所持アイテム1個1個を指す実体。「ID＋所持数」ではなく個体（インスタンス）単位で
// 管理する（合成で個体ごとに強化度合いが変わるため、詳細はitems.md参照）。
interface ItemInstance {
  instanceId: string; // 個体ごとに一意なID
  itemId: string; // lib/items-info.tsのID（例: "i001"）
  plus: number; // 合成による強化値。端数（小数）まで正確に持つ。効果・表示は切り捨てて使う
  // 武器のみ：ドロップ時に1回だけ決まるランダムな追加能力枠（合成の対象外、ずっと固定）。
  // 詳細はitems.mdの「アイテムごとの能力差」参照。
  substatStat?: "hp" | "atk" | "def" | "critRate" | "critDamage" | "elementResist";
  substatValue?: number;
}

// キャラクター1体分の装備。武器スロット1つ＋アーティファクトスロット3つ固定。
// 値はアイテムIDではなく、所持アイテムの個体ID（ItemInstance.instanceId）。
interface CharacterEquipment {
  weapon: string | null;
  artifacts: [string | null, string | null, string | null];
}

interface Game1SaveData {
  schemaVersion: number; // セーブデータの構造バージョン。一致しない古いデータは自動的に初期状態にリセットする
  playCount: number; // Game1画面を開いた回数
  inventory: ItemInstance[]; // 所持アイテム（上限100個体、バッグの中身画面で使用）
  equipment: Record<string, CharacterEquipment>; // キャラID → 装備（キャラクター確認画面で使用）
  maxClearedStage: number; // クリア済みの最大ステージ番号（0=未クリア）
  activePartyIds: string[]; // バトルに参加させるキャラID（最大3人）
  expPoints: number; // 未振り分けの経験値ポイント（キャラクター育成用、「訓練」ボタンで消費）
  characterInvestedExp: Record<string, number>; // キャラID → これまでに投入した経験値ポイントの累計（キー無し＝0＝レベル1）。レベルはここから逆算する
  skillPoints: number; // 未振り分けのスキルポイント（経験値ポイントとは別資源。ステージ「クリア」時のみ固定量が加算される）
  skillInvestedPoints: Record<string, number>; // スキルID → これまでに投入したスキルポイントの累計（キー無し＝0＝未解放）。解放状況・強化段階（＋N）はここから逆算する
  shownIndividualMessageIds: string[]; // 戦闘結果フレームの個別メッセージ（仲間解放など）のうち表示済みのID一覧。同じステージを周回しても再表示しないための記録（詳細はscreens/battle-test.md参照）
  testMode: boolean; // テストモード（全ステージ・全アイテム解放）。詳細はtest-mode.md参照
}
```

`inventory`の初期値は空配列（`[]`）。アイテムは[アイテムドロップ](./adventure-system.md#アイテムドロップ)でしか入手できない、正式なスタート状態。個体の管理・上限・合成の詳細は[items.md](./items.md#アイテムの個体管理合成のための前提)参照。

`equipment`はキーにキャラクターIDが無い（＝一度も装備操作をしていない）場合、装備なし（`{ weapon: null, artifacts: [null, null, null] }`）として扱う（`getCharacterEquipment()`ヘルパー）。詳細は[character-view.md](./screens/character-view.md)参照。

`maxClearedStage` / `activePartyIds`は[冒険システム設計](./adventure-system.md)で使う。キャラクターの仲間解放は`maxClearedStage`から`isCharacterUnlocked()`で判定し、新しく解放されたキャラクターは編成が3人未満なら`syncActivePartyWithUnlocks()`で自動的に`activePartyIds`へ追加する。

`characterInvestedExp`は累計値のみを保存し、レベルは都度[lib/character-growth.ts](../../lib/character-growth.ts)の`levelFromInvestedExp()`で逆算する（`getCharacterLevel()`経由）。詳細は[adventure-system.md](./adventure-system.md#経験値とレベル成長)参照。

`skillInvestedPoints`も累計値のみを保存し、解放状況・強化段階（＋N）は都度[lib/skill-progression.ts](../../lib/skill-progression.ts)の`isSkillUnlocked()`/`skillPlusLevel()`で逆算する。詳細は[skills.md](./skills.md#スキルの解放強化スキルポイント)参照。

### `schemaVersion`によるセーブデータの互換性

`Game1SaveData`の構造（特に`inventory`の形）を変える際は、[lib/game1-data.ts](../../lib/game1-data.ts)の`SAVE_SCHEMA_VERSION`をインクリメントする。`loadGame1Data()`は保存されている生データを`readRawGameData()`でマージ無しに読み、そのバージョンが現在のものと一致しない（＝古い構造のまま、またはバージョン自体が無い）場合は初期状態（`defaultGame1Data`）を返す。これにより、構造が変わった後に古い形式のデータを誤って読み込んで表示や計算が壊れることを防ぐ（読み込み時点では実際のlocalStorageへの書き戻しは行わず、その後何らかの保存操作が発生した時点で新しい構造として上書きされる）。

## 命名の補足

localStorageのキー接頭辞は `akikun-games` を使用している（アプリの表示名「あきくんゲームズ」に対応する内部的な識別子。プロジェクト自体の内部名は `webapp-game` のままだが、ユーザー向けの表示や保存データの識別子は今後もアプリ名に合わせて更新していく）。
