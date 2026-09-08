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
    },
  },
];

export function getCharacterBaseInfo(id: string): CharacterBaseInfo | undefined {
  return CHARACTER_BASE_INFO.find((c) => c.id === id);
}
