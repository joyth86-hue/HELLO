// 仲間キャラクターの基本情報（1キャラに対して一意に定まる情報のみ）。
// ステータスの成長テーブルなどはここに含めず lib/characters.ts 側で別管理する。
//
// name / element / weaponType は未確定の項目。null のものは今後埋める。
// （コメントの見た目メモはあくまで参考で、実データではない）

export interface CharacterBaseInfo {
  id: string;
  name: string | null;
  element: string | null;
  weaponType: string | null;
  assets: {
    standing: string;
    battleIdle: string;
    battleAttack: string;
    battleDamage: string;
  };
}

export const CHARACTER_BASE_INFO: CharacterBaseInfo[] = [
  {
    // 赤髪ツインテール・両手剣・炎エフェクト
    id: "c01",
    name: null,
    element: null,
    weaponType: null,
    assets: {
      standing: "/characters/c01_t01.png",
      battleIdle: "/characters/c01_d01.png",
      battleAttack: "/characters/c01_d02.png",
      battleDamage: "/characters/c01_d03.png",
    },
  },
  {
    // 白緑髪・魔導書・自然/精霊風エフェクト
    id: "c02",
    name: null,
    element: null,
    weaponType: null,
    assets: {
      standing: "/characters/c02_t01.png",
      battleIdle: "/characters/c02_d01.png",
      battleAttack: "/characters/c02_d02.png",
      battleDamage: "/characters/c02_d03.png",
    },
  },
  {
    // 銀髪・魔導書・氷/結晶エフェクト
    id: "c03",
    name: null,
    element: null,
    weaponType: null,
    assets: {
      standing: "/characters/c03_t01.png",
      battleIdle: "/characters/c03_d01.png",
      battleAttack: "/characters/c03_d02.png",
      battleDamage: "/characters/c03_d03.png",
    },
  },
  {
    // 茶髪・弓
    id: "c04",
    name: null,
    element: null,
    weaponType: null,
    assets: {
      standing: "/characters/c04_t01.png",
      battleIdle: "/characters/c04_d01.png",
      battleAttack: "/characters/c04_d02.png",
      battleDamage: "/characters/c04_d03.png",
    },
  },
];

export function getCharacterBaseInfo(id: string): CharacterBaseInfo | undefined {
  return CHARACTER_BASE_INFO.find((c) => c.id === id);
}
