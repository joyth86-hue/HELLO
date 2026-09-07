// 敵キャラクターの基本情報（1体に対して一意に定まる情報のみ）。
// ステータス（HP・攻撃力など）はまだどこにも定義していない。必要になったら
// lib/characters.ts と同様に別ファイルで管理する。
//
// 敵キャラクターには武器種の概念が無いため weaponType は持たせていない
// （仲間キャラクターの lib/characters-info.ts とはこの点でフィールドが異なる）。

export interface EnemyBaseInfo {
  id: string;
  name: string;
  element: string;
  assets: {
    battleIdle: string;
    battleAttack: string;
    battleDamage: string;
  };
}

export const ENEMY_BASE_INFO: EnemyBaseInfo[] = [
  {
    id: "e01",
    name: "こどもゴブリン",
    element: "草",
    assets: {
      battleIdle: "/enemies/e01_d01.png",
      battleAttack: "/enemies/e01_d02.png",
      battleDamage: "/enemies/e01_d03.png",
    },
  },
  {
    id: "e02",
    name: "ゴブリン兄貴",
    element: "草",
    assets: {
      battleIdle: "/enemies/e02_d01.png",
      battleAttack: "/enemies/e02_d02.png",
      battleDamage: "/enemies/e02_d03.png",
    },
  },
  {
    id: "e03",
    name: "古びたクマさん",
    element: "岩",
    assets: {
      battleIdle: "/enemies/e03_d01.png",
      battleAttack: "/enemies/e03_d02.png",
      battleDamage: "/enemies/e03_d03.png",
    },
  },
  {
    id: "e04",
    name: "歩くキノコ",
    element: "草",
    assets: {
      battleIdle: "/enemies/e04_d01.png",
      battleAttack: "/enemies/e04_d02.png",
      battleDamage: "/enemies/e04_d03.png",
    },
  },
  {
    id: "e05",
    name: "水スラ",
    element: "水",
    assets: {
      battleIdle: "/enemies/e05_d01.png",
      battleAttack: "/enemies/e05_d02.png",
      battleDamage: "/enemies/e05_d03.png",
    },
  },
  {
    id: "e06",
    name: "草スラ",
    element: "草",
    assets: {
      battleIdle: "/enemies/e06_d01.png",
      battleAttack: "/enemies/e06_d02.png",
      battleDamage: "/enemies/e06_d03.png",
    },
  },
];

export function getEnemyBaseInfo(id: string): EnemyBaseInfo | undefined {
  return ENEMY_BASE_INFO.find((e) => e.id === id);
}
