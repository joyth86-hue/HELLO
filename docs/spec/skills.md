# スキルデータ（仮）

[共通UIボタン素材](./ui-buttons.md)の攻撃スキル・支援スキル画像（17枚）に、仮のスキルID・表示名・説明を付けたもの。**すべて仮データ**で、今後ユーザーからの修正指示で確定させていく前提。倍率は未定（後回し）。

実装：[lib/skills-info.ts](../../lib/skills-info.ts)（`SKILL_BASE_INFO`＝全17件の一覧、`CHARACTER_SKILL_KIT`＝キャラごとに現在採用している4枠分のスキルID）。戦闘画面（[battle-test.md](./screens/battle-test.md)）の行動ボタンから参照している。

## スキル一覧（全17件）

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

## キャラごとの現在のキット（4枠）

1キャラあたりのボタンは5枠（通常攻撃1＋スキル4）。キャラごとに使用スキルをちょうど4つに揃え、5枠すべてを埋めている。

| キャラ | 枠1（固定） | 枠2 | 枠3 | 枠4 | 枠5 |
| --- | --- | --- | --- | --- | --- |
| アカネ | 通常攻撃 | sk001 炎の斬撃 | sk002 昇炎 | sk003 爆炎連斬 | sk004 攻撃力アップ |
| カエデ | 通常攻撃 | sk005 緑光弾 | sk006 茨の炸裂 | sk008 回復 | sk009 防御力アップ |
| コユキ | 通常攻撃 | sk010 氷晶弾 | sk011 吹雪 | sk012 氷封印 | sk013 属性耐性アップ |
| サユミ | 通常攻撃 | sk014 貫通矢 | sk015 連射 | sk016 蔦縛りの矢 | sk017 会心率アップ |

**カエデのみ攻撃スキルを1つ除外**：もともと攻撃スキル3種＋支援2種の計5種類を持っていたが、他キャラ（攻撃3＋支援1の計4種類）に揃えるため、`sk007`「魔力波」を一旦除外した。`SKILL_BASE_INFO`にはデータとして残っているので、キットに戻したくなれば`CHARACTER_SKILL_KIT`に追加するだけでよい。

## スキル解放について（今後実装予定・現状は全解放扱い）

想定している育成スタイル：

- **初期状態は「通常攻撃＋スキル1つ」のみ使用可能**。残りのスキルは未解放
- 戦闘などで得た**スキルポイント**を使って、キャラごとに順次スキルを解放していく
- 解放したスキルは、その後さらに育成（強化）できる

このスキルポイント・解放状況を持つセーブデータや解放UIはまだ存在しない。現状の戦闘画面（動作確認版）では、上記「キャラごとの現在のキット（4枠）」を**常に全解放済みとして4枠とも表示**している（`app/games/game1/battle/page.tsx`にその旨コメントあり）。解放システムを実装する際は、この「常に全表示」の部分を「解放済みの分だけ表示・未解放は鍵アイコンなど」に差し替える必要がある。

## 今後

- 表示名・説明・スキル倍率・4枠の組み合わせは、いずれもユーザーからの修正指示で確定させる
- スキルポイントによる解放・育成の仕組み（セーブデータ・UI）を別途設計・実装する
- 現状の動作確認版バトルには「スキルを選んで発動する」処理自体がまだ無い（通常攻撃のみ実装済み）。スキルボタンは画像を並べているだけで、タップしても何も起こらない（`opacity-40`で非活性であることを表現）。スキルボタンを実際に機能させるには、そちらの実装も別途必要
