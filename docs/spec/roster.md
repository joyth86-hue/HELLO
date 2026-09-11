# 仲間・敵キャラクター 基本情報一覧

仲間キャラクター・敵キャラクターそれぞれの「1体につき一意に定まる基本情報」をまとめたもの。**ステータスの成長テーブルなど（HP・攻撃力の数値そのものなど）はここには含めず、別ファイルで正規化して管理する**（仲間キャラのレベル成長は[lib/character-growth.ts](../../lib/character-growth.ts)、敵の基礎ステータスは[lib/enemy-scaling.ts](../../lib/enemy-scaling.ts)を参照）。

実装（実データ）: [lib/characters-info.ts](../../lib/characters-info.ts)（仲間）、[lib/enemies-info.ts](../../lib/enemies-info.ts)（敵）

## 仲間キャラクター

| ID | 名称 | 属性 | 武器種 | キャラクター画面（待機アニメーション） | 通常 | 攻撃 | ダメージ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| c01 | アカネ | 炎 | 片手剣 | idle/c01_idle_sheet.png | c01_d01.png | c01_d02.png | c01_d03.png |
| c02 | カエデ | 草 | 法器 | idle/c02_idle_sheet.png | c02_d01.png | c02_d02.png | c02_d03.png |
| c03 | コユキ | 氷 | 法器 | idle/c03_idle_sheet.png | c03_d01.png | c03_d02.png | c03_d03.png |
| c04 | サユミ | 草 | 弓 | idle/c04_idle_sheet.png | c04_d01.png | c04_d02.png | c04_d03.png |

画像パスはすべて `public/characters/` 配下。キャラクター画面用の待機アニメーション（ドット絵スプライトシート）の詳細は[character-view.md](./screens/character-view.md)参照。詳細は [characters.md](./characters.md) 参照。

## 敵キャラクター

敵キャラクターに武器種は無し（概念自体を持たせていない）。

| ID | 名称 | 属性 | 通常 | 攻撃 | ダメージ |
| --- | --- | --- | --- | --- | --- |
| e01 | こどもゴブリン | 草 | e01_d01.png | e01_d02.png | e01_d03.png |
| e02 | ゴブリン兄貴 | 草 | e02_d01.png | e02_d02.png | e02_d03.png |
| e03 | 古びたクマさん | 岩 | e03_d01.png | e03_d02.png | e03_d03.png |
| e04 | 歩くキノコ | 草 | e04_d01.png | e04_d02.png | e04_d03.png |
| e05 | 水スラ | 水 | e05_d01.png | e05_d02.png | e05_d03.png |
| e06 | 草スラ | 草 | e06_d01.png | e06_d02.png | e06_d03.png |

画像パスはすべて `public/enemies/` 配下。詳細は [enemies.md](./enemies.md) 参照。敵の基礎ステータス（HP・攻撃力・防御力・経験値）は[lib/enemy-scaling.ts](../../lib/enemy-scaling.ts)の`ENEMY_BASE_STATS`で定義済み（ステージ係数・個体差の掛け方は[adventure-system.md](./adventure-system.md)参照）。

## 属性（現時点で登場しているもの）

呼び名・種類の正式な一覧は未定だが、現時点で実際に使われているのは以下の5種類。

- 炎（c01）
- 草（c02, c04, e01, e02, e04, e06）
- 氷（c03）
- 岩（e03）
- 水（e05）

## 属性の相性（弱点・耐性）

ユーザー確認済み。5属性を輪状につなぎ、矢印の先が弱点（＝攻撃側が有利）を表す。

**水 → 炎 → 氷 → 草 → 岩 → 水**

- 輪の中で**直接つながっている**（隣り合う）属性を攻撃した場合：ダメージ**×1.25**
- 逆方向（矢印の先の属性が、根元の属性を攻撃した場合）：ダメージ**×0.75**
- それ以外の組み合わせ（輪で2つ離れている・同じ属性同士）：等倍**×1.0**（輪に2段階以上先の間接的な有利・不利は考慮しない、ユーザー確認済み）
- 実装：[lib/combat.ts](../../lib/combat.ts)の`getElementMultiplier()`。通常攻撃は属性を持たない（[skills.md](./skills.md)参照）ため、この倍率は常に1.0固定のまま
- 敵は通常攻撃相当の行動のみでスキル・属性を持たないため、現状この倍率が実際に効くのは「プレイヤーのスキル攻撃 → 敵」の向きのみ（敵の属性は保持している値をそのまま使う）
