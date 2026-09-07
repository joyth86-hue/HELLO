// 敵キャラクターの基本情報（1体に対して一意に定まる情報のみ）。
// ステータス（HP・攻撃力など）はまだどこにも定義していない。必要になったら
// lib/characters.ts と同様に別ファイルで管理する。
//
// name / element / weaponType は未確定の項目。null のものは今後埋める。
// （コメントの見た目メモはあくまで参考で、実データではない）

export interface EnemyBaseInfo {
  id: string;
  name: string | null;
  element: string | null;
  weaponType: string | null;
  assets: {
    battleIdle: string;
    battleAttack: string;
    battleDamage: string;
  };
}

export const ENEMY_BASE_INFO: EnemyBaseInfo[] = [
  {
    // ゴブリン（棍棒を持った緑色の小鬼）
    id: "e01",
    name: null,
    element: null,
    weaponType: null,
    assets: {
      battleIdle: "/enemies/e01_d01.png",
      battleAttack: "/enemies/e01_d02.png",
      battleDamage: "/enemies/e01_d03.png",
    },
  },
  {
    // オーク（ゴブリンより大柄・防具付き）
    id: "e02",
    name: null,
    element: null,
    weaponType: null,
    assets: {
      battleIdle: "/enemies/e02_d01.png",
      battleAttack: "/enemies/e02_d02.png",
      battleDamage: "/enemies/e02_d03.png",
    },
  },
  {
    // 呪われたテディベア
    id: "e03",
    name: null,
    element: null,
    weaponType: null,
    assets: {
      battleIdle: "/enemies/e03_d01.png",
      battleAttack: "/enemies/e03_d02.png",
      battleDamage: "/enemies/e03_d03.png",
    },
  },
  {
    // きのこの魔物
    id: "e04",
    name: null,
    element: null,
    weaponType: null,
    assets: {
      battleIdle: "/enemies/e04_d01.png",
      battleAttack: "/enemies/e04_d02.png",
      battleDamage: "/enemies/e04_d03.png",
    },
  },
  {
    // 氷のスライム
    id: "e05",
    name: null,
    element: null,
    weaponType: null,
    assets: {
      battleIdle: "/enemies/e05_d01.png",
      battleAttack: "/enemies/e05_d02.png",
      battleDamage: "/enemies/e05_d03.png",
    },
  },
  {
    // 緑のスライム
    id: "e06",
    name: null,
    element: null,
    weaponType: null,
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
