# 戦闘ステージ

**この設計（`bs{ワールド}-{ステージ}`形式のID・ステージごとの手打ちデータ）は不採用となり、`lib/battle-stages.ts`は削除済み。** 実際の100ステージ実装は、ステージ番号（1〜100）から敵の出現パターン・強さ・背景を計算式で自動生成する方式にした。詳細・実装は[adventure-system.md](./adventure-system.md)（ルール面）と[lib/enemy-scaling.ts](../../lib/enemy-scaling.ts)（実装）を参照。

## 現状の仕組み（要点）

- 敵の出現パターンはステージ番号の4パターン・ローテーションで決まる（`lib/enemy-scaling.ts`の`getEnemyPatternForStage()` / `pickRandomEnemyFromPattern()`）
- 敵の強さは「基礎値 × ステージ係数 ± 個体差」（`getScaledEnemyStats()`）。`S-10`（ボス）だけ追加補正
- 背景はステージ番号から`getFieldImagePathForStage()`で1ステージ＝1背景を割り当て（`f01`〜`f10`を10刻みで繰り返し）

手打ちのステージ定義ファイルは無くなったため、個別ステージのカスタム調整（特定ステージだけ特殊な敵構成にする、など）をしたくなった場合は改めて設計が必要。
