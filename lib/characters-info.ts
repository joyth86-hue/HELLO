// 仲間キャラクターの基本情報（1キャラに対して一意に定まる情報のみ）。
// ステータスの成長テーブルなどはここに含めず lib/characters.ts 側で別管理する。

export interface AttackAnimation {
  // 6フレーム分のパス（frames/xxx_attack_00.png〜05.png）。
  frames: string[];
  // 各フレームの表示時間（ms）。tempoWait()でテンポ倍率をかけて使う。
  durationsMs: number[];
  // 攻撃フレーム（512×512の正方形キャンバス）と通常ポーズ（971×1619、縦長）は
  // キャラ本体がキャンバスに占める割合も、足元がキャンバスのどこにあるかも
  // 全く異なる。そのため単純に同じ表示幅で重ねると、①足元の位置が通常ポーズより
  // かなり上にズレ、②見た目の大きさも変わってしまう（ユーザー指摘・実測で確認済み。
  // 「小さく見える」だけでなく「立ち位置がズレる」が本質的な原因だった）。
  // 両ポーズの画像を解析し、①②とも通常ポーズに揃うように算出した値：
  // - footShiftPercent：攻撃画像を下にずらす量（画像自身の高さに対する%）。
  //   これで足元の位置を通常ポーズに合わせる
  // - bodyScale：足元を基準に拡大する倍率。これで見た目の大きさを揃える
  // - transformOriginY：スケールの基準点（画像自身の中の足元位置、%）。
  //   ここを基準に拡大することで、拡大しても足元の位置がズレない
  // 適用順は `transform: translateY(footShiftPercent%) scale(bodyScale)`、
  // `transformOrigin: 50% transformOriginY%`。
  footShiftPercent: number;
  bodyScale: number;
  transformOriginY: number;
}

export interface CharacterBaseInfo {
  id: string;
  name: string;
  element: string;
  weaponType: string;
  assets: {
    idleSheet: string;
    battleIdle: string;
    // 攻撃アニメーション本実装前の静止画（現在は未使用。フォールバック用に残す）。
    battleAttack: string;
    battleDamage: string;
    // 戦闘画面下部の行動ボタン用アイコン（通常攻撃）。
    // 素材出所はdocs/spec/ui-buttons.md参照。
    normalAttackIcon: string;
    // 攻撃時（通常攻撃・スキル共通）に再生する6フレームのアニメーション。
    // 元データ：hirogames_images/docs/CLAUDE_HANDOFF_BATTLE_ATTACK_ANIMATIONS.md
    attackAnimation: AttackAnimation;
  };
}

export const CHARACTER_BASE_INFO: CharacterBaseInfo[] = [
  {
    id: "c01",
    name: "アカネ",
    element: "炎",
    weaponType: "片手剣",
    assets: {
      idleSheet: "/characters/idle/c01_idle_sheet.png",
      battleIdle: "/characters/c01_d01.png",
      battleAttack: "/characters/c01_d02.png",
      battleDamage: "/characters/c01_d03.png",
      normalAttackIcon: "/icons/buttons/attack_akane_normal.png",
      attackAnimation: {
        frames: [
          "/characters/attack/c01_attack_00.png",
          "/characters/attack/c01_attack_01.png",
          "/characters/attack/c01_attack_02.png",
          "/characters/attack/c01_attack_03.png",
          "/characters/attack/c01_attack_04.png",
          "/characters/attack/c01_attack_05.png",
        ],
        durationsMs: [500, 110, 110, 130, 75, 380],
        footShiftPercent: 49.58,
        bodyScale: 1.331,
        transformOriginY: 95.12,
      },
    },
  },
  {
    id: "c02",
    name: "カエデ",
    element: "草",
    weaponType: "法器",
    assets: {
      idleSheet: "/characters/idle/c02_idle_sheet.png",
      battleIdle: "/characters/c02_d01.png",
      battleAttack: "/characters/c02_d02.png",
      battleDamage: "/characters/c02_d03.png",
      normalAttackIcon: "/icons/buttons/attack_kaede_normal.png",
      attackAnimation: {
        frames: [
          "/characters/attack/c02_attack_00.png",
          "/characters/attack/c02_attack_01.png",
          "/characters/attack/c02_attack_02.png",
          "/characters/attack/c02_attack_03.png",
          "/characters/attack/c02_attack_04.png",
          "/characters/attack/c02_attack_05.png",
        ],
        durationsMs: [450, 140, 160, 220, 100, 360],
        footShiftPercent: 61.31,
        bodyScale: 1.701,
        transformOriginY: 96.88,
      },
    },
  },
  {
    id: "c03",
    name: "コユキ",
    element: "氷",
    weaponType: "法器",
    assets: {
      idleSheet: "/characters/idle/c03_idle_sheet.png",
      battleIdle: "/characters/c03_d01.png",
      battleAttack: "/characters/c03_d02.png",
      battleDamage: "/characters/c03_d03.png",
      normalAttackIcon: "/icons/buttons/attack_koyuki_normal.png",
      attackAnimation: {
        frames: [
          "/characters/attack/c03_attack_00.png",
          "/characters/attack/c03_attack_01.png",
          "/characters/attack/c03_attack_02.png",
          "/characters/attack/c03_attack_03.png",
          "/characters/attack/c03_attack_04.png",
          "/characters/attack/c03_attack_05.png",
        ],
        durationsMs: [450, 140, 140, 220, 90, 360],
        footShiftPercent: 60.23,
        bodyScale: 1.465,
        transformOriginY: 95.9,
      },
    },
  },
  {
    id: "c04",
    name: "サユミ",
    element: "草",
    weaponType: "弓",
    assets: {
      idleSheet: "/characters/idle/c04_idle_sheet.png",
      battleIdle: "/characters/c04_d01.png",
      battleAttack: "/characters/c04_d02.png",
      battleDamage: "/characters/c04_d03.png",
      normalAttackIcon: "/icons/buttons/attack_sayumi_normal.png",
      attackAnimation: {
        frames: [
          "/characters/attack/c04_attack_00.png",
          "/characters/attack/c04_attack_01.png",
          "/characters/attack/c04_attack_02.png",
          "/characters/attack/c04_attack_03.png",
          "/characters/attack/c04_attack_04.png",
          "/characters/attack/c04_attack_05.png",
        ],
        durationsMs: [420, 140, 140, 240, 70, 330],
        footShiftPercent: 53.28,
        bodyScale: 1.409,
        transformOriginY: 94.92,
      },
    },
  },
];

export function getCharacterBaseInfo(id: string): CharacterBaseInfo | undefined {
  return CHARACTER_BASE_INFO.find((c) => c.id === id);
}
