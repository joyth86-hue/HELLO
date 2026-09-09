# スキルデータ（仮）

[共通UIボタン素材](./ui-buttons.md)の攻撃スキル・支援スキル画像（17枚）に、仮のスキルID・表示名・説明を付けたもの。**すべて仮データ**で、今後ユーザーからの修正指示で確定させていく前提。倍率は未定（後回し）。

実装（コード）へはまだ反映しておらず、この表がドラフト。確定後に`lib/skills-info.ts`のような形で実装する想定。

## スキル一覧

| スキルID | 使用キャラ | スキル表示名 | スキル説明 | スキル倍率 | 対応画像 |
| --- | --- | --- | --- | --- | --- |
| sk001 | アカネ | 炎の斬撃 | 剣に炎をまとわせて斬りつける | 未定 | `/icons/buttons/skill_akane_flame_slash.png` |
| sk002 | アカネ | 昇炎 | 剣から炎を巻き上げながら斬り上げる | 未定 | `/icons/buttons/skill_akane_rising_fire.png` |
| sk003 | アカネ | 爆炎連斬 | 十字に斬り裂き爆炎を巻き起こす | 未定 | `/icons/buttons/skill_akane_inferno_burst.png` |
| sk004 | アカネ | 攻撃力アップ | 咆哮を上げ味方の攻撃力を高める（支援） | 未定 | `/icons/buttons/support_akane_attack_up.png` |
| sk005 | カエデ | 緑光弾 | 緑の光弾を撃ち出す | 未定 | `/icons/buttons/skill_kaede_green_bolt.png` |
| sk006 | カエデ | 茨の炸裂 | 蔦と葉の刃を四方に放つ | 未定 | `/icons/buttons/skill_kaede_thorn_burst.png` |
| sk007 | カエデ | 魔力波 | 緑の魔力を波状に広げて敵を打つ | 未定 | `/icons/buttons/skill_kaede_arcane_pulse.png` |
| sk008 | カエデ | 回復 | 味方1体のHPを回復する（支援） | 未定 | `/icons/buttons/support_kaede_heal.png` |
| sk009 | カエデ | 防御力アップ | 加護を与え味方の防御力を高める（支援） | 未定 | `/icons/buttons/support_kaede_defense_up.png` |
| sk010 | コユキ | 氷晶弾 | 鋭い氷の欠片を撃ち出す | 未定 | `/icons/buttons/skill_koyuki_ice_shards.png` |
| sk011 | コユキ | 吹雪 | 冷気の吹雪で周囲を凍てつかせる | 未定 | `/icons/buttons/skill_koyuki_blizzard.png` |
| sk012 | コユキ | 氷封印 | 氷の紋章で敵の動きを封じる | 未定 | `/icons/buttons/skill_koyuki_frozen_seal.png` |
| sk013 | コユキ | 属性耐性アップ | 加護の盾で味方の属性耐性を高める（支援） | 未定 | `/icons/buttons/support_koyuki_element_resistance_up.png` |
| sk014 | サユミ | 貫通矢 | 的を貫く一射で敵を射抜く | 未定 | `/icons/buttons/skill_sayumi_piercing_arrow.png` |
| sk015 | サユミ | 連射 | 複数の矢を一斉に放つ | 未定 | `/icons/buttons/skill_sayumi_multishot.png` |
| sk016 | サユミ | 蔦縛りの矢 | 蔦を纏わせた矢で敵の動きを縛る | 未定 | `/icons/buttons/skill_sayumi_vine_binding.png` |
| sk017 | サユミ | 会心率アップ | 会心の一射で味方の会心率を高める（支援） | 未定 | `/icons/buttons/support_sayumi_critical_rate_up.png` |

IDはこのアプリのキャラクター表示順（[roster.md](./roster.md)：アカネ→カエデ→コユキ→サユミ）に合わせて振っている。素材の元データ（[ui-buttons.md](./ui-buttons.md)のmanifest.csv）はアカネ→コユキ→サユミ→カエデの順なので、並び順が異なる点に注意。

## 戦闘画面での5枠割り当て（仮）

[以前の設計](./screens/battle-test.md)通り、1キャラあたりのボタンは5枠（通常攻撃1＋スキル4）。**このうちスキル4枠は「3つを確定＋最後の1枠は空き」とする指示**のため、以下のように割り当てた。

| キャラ | 枠1（固定） | 枠2 | 枠3 | 枠4 | 枠5 |
| --- | --- | --- | --- | --- | --- |
| アカネ | 通常攻撃 | sk001 炎の斬撃 | sk002 昇炎 | sk003 爆炎連斬 | 空き |
| カエデ | 通常攻撃 | sk005 緑光弾 | sk006 茨の炸裂 | sk007 魔力波 | 空き |
| コユキ | 通常攻撃 | sk010 氷晶弾 | sk011 吹雪 | sk012 氷封印 | 空き |
| サユミ | 通常攻撃 | sk014 貫通矢 | sk015 連射 | sk016 蔦縛りの矢 | 空き |

**仮の割り当てルール**：各キャラの攻撃スキル3種類をそのまま3枠に採用し、支援スキル（sk004, sk008, sk009, sk013, sk017）は今回は見送って未採用のまま保留にした（カエデだけ支援スキルが2種類あるが、`support_kaede_defense_up`も含めて両方とも今回は保留）。攻撃スキルで統一した方が「3つ決めて」の初期案としてシンプルだと考えたための仮判断で、支援スキルを混ぜたい場合や別の組み合わせにしたい場合は差し替え可能。

## 今後

- 表示名・説明・スキル倍率・5枠の組み合わせは、いずれもユーザーからの修正指示で確定させる
- 確定後、`lib/skills-info.ts`（仮称）のようなデータファイルを作り、戦闘画面（[battle-test.md](./screens/battle-test.md)）の5ボタンに実際に組み込む
- 現状の動作確認版バトルには「スキルを選んで発動する」処理自体がまだ無い（通常攻撃のみ実装済み）。スキルボタンを実際に機能させるには、そちらの実装も別途必要
