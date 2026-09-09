// 仲間キャラクターの基本情報（1キャラに対して一意に定まる情報のみ）。
// ステータスの成長テーブルなどはここに含めず lib/characters.ts 側で別管理する。

export interface CharacterBaseInfo {
  id: string;
  name: string;
  element: string;
  weaponType: string;
  assets: {
    idleSheet: string;
    battleIdle: string;
    battleAttack: string;
    battleDamage: string;
    // 戦闘画面下部の行動ボタン用アイコン（通常攻撃）。
    // 素材出所はdocs/spec/ui-buttons.md参照。
    normalAttackIcon: string;
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
    },
  },
];

export function getCharacterBaseInfo(id: string): CharacterBaseInfo | undefined {
  return CHARACTER_BASE_INFO.find((c) => c.id === id);
}
