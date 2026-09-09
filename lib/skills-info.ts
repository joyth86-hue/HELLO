// スキルの基本情報（仮データ）。詳細・経緯はdocs/spec/skills.md参照。
// 表示名・説明・倍率はすべて仮で、今後の指示で確定させていく前提。

export interface SkillBaseInfo {
  id: string;
  characterId: string;
  name: string;
  description: string;
  // ダメージ・回復などの倍率。未定のためnull。
  multiplier: number | null;
  icon: string;
}

export const SKILL_BASE_INFO: SkillBaseInfo[] = [
  {
    id: "sk001",
    characterId: "c01",
    name: "炎の斬撃",
    description: "剣に炎をまとわせて斬りつける",
    multiplier: null,
    icon: "/icons/buttons/skill_akane_flame_slash.png",
  },
  {
    id: "sk002",
    characterId: "c01",
    name: "昇炎",
    description: "剣から炎を巻き上げながら斬り上げる",
    multiplier: null,
    icon: "/icons/buttons/skill_akane_rising_fire.png",
  },
  {
    id: "sk003",
    characterId: "c01",
    name: "爆炎連斬",
    description: "十字に斬り裂き爆炎を巻き起こす",
    multiplier: null,
    icon: "/icons/buttons/skill_akane_inferno_burst.png",
  },
  {
    id: "sk004",
    characterId: "c01",
    name: "攻撃力アップ",
    description: "咆哮を上げ味方の攻撃力を高める（支援）",
    multiplier: null,
    icon: "/icons/buttons/support_akane_attack_up.png",
  },
  {
    id: "sk005",
    characterId: "c02",
    name: "緑光弾",
    description: "緑の光弾を撃ち出す",
    multiplier: null,
    icon: "/icons/buttons/skill_kaede_green_bolt.png",
  },
  {
    id: "sk006",
    characterId: "c02",
    name: "茨の炸裂",
    description: "蔦と葉の刃を四方に放つ",
    multiplier: null,
    icon: "/icons/buttons/skill_kaede_thorn_burst.png",
  },
  {
    id: "sk007",
    characterId: "c02",
    name: "魔力波",
    description: "緑の魔力を波状に広げて敵を打つ",
    multiplier: null,
    icon: "/icons/buttons/skill_kaede_arcane_pulse.png",
  },
  {
    id: "sk008",
    characterId: "c02",
    name: "回復",
    description: "味方1体のHPを回復する（支援）",
    multiplier: null,
    icon: "/icons/buttons/support_kaede_heal.png",
  },
  {
    id: "sk009",
    characterId: "c02",
    name: "防御力アップ",
    description: "加護を与え味方の防御力を高める（支援）",
    multiplier: null,
    icon: "/icons/buttons/support_kaede_defense_up.png",
  },
  {
    id: "sk010",
    characterId: "c03",
    name: "氷晶弾",
    description: "鋭い氷の欠片を撃ち出す",
    multiplier: null,
    icon: "/icons/buttons/skill_koyuki_ice_shards.png",
  },
  {
    id: "sk011",
    characterId: "c03",
    name: "吹雪",
    description: "冷気の吹雪で周囲を凍てつかせる",
    multiplier: null,
    icon: "/icons/buttons/skill_koyuki_blizzard.png",
  },
  {
    id: "sk012",
    characterId: "c03",
    name: "氷封印",
    description: "氷の紋章で敵の動きを封じる",
    multiplier: null,
    icon: "/icons/buttons/skill_koyuki_frozen_seal.png",
  },
  {
    id: "sk013",
    characterId: "c03",
    name: "属性耐性アップ",
    description: "加護の盾で味方の属性耐性を高める（支援）",
    multiplier: null,
    icon: "/icons/buttons/support_koyuki_element_resistance_up.png",
  },
  {
    id: "sk014",
    characterId: "c04",
    name: "貫通矢",
    description: "的を貫く一射で敵を射抜く",
    multiplier: null,
    icon: "/icons/buttons/skill_sayumi_piercing_arrow.png",
  },
  {
    id: "sk015",
    characterId: "c04",
    name: "連射",
    description: "複数の矢を一斉に放つ",
    multiplier: null,
    icon: "/icons/buttons/skill_sayumi_multishot.png",
  },
  {
    id: "sk016",
    characterId: "c04",
    name: "蔦縛りの矢",
    description: "蔦を纏わせた矢で敵の動きを縛る",
    multiplier: null,
    icon: "/icons/buttons/skill_sayumi_vine_binding.png",
  },
  {
    id: "sk017",
    characterId: "c04",
    name: "会心率アップ",
    description: "会心の一射で味方の会心率を高める（支援）",
    multiplier: null,
    icon: "/icons/buttons/support_sayumi_critical_rate_up.png",
  },
];

// キャラごとの「現在の4枠キット」（戦闘画面のスキル4枠に並べる順番）。
// sk007（カエデ・魔力波）は一旦除外し、キャラ間で4枠ずつに揃えている。
// SKILL_BASE_INFO自体には引き続き残してあるので、キットに戻したくなれば
// この配列に追加するだけでよい。
export const CHARACTER_SKILL_KIT: Record<string, string[]> = {
  c01: ["sk001", "sk002", "sk003", "sk004"],
  c02: ["sk005", "sk006", "sk008", "sk009"],
  c03: ["sk010", "sk011", "sk012", "sk013"],
  c04: ["sk014", "sk015", "sk016", "sk017"],
};

export function getSkillById(id: string): SkillBaseInfo | undefined {
  return SKILL_BASE_INFO.find((s) => s.id === id);
}

export function getCharacterSkillKit(characterId: string): SkillBaseInfo[] {
  const ids = CHARACTER_SKILL_KIT[characterId] ?? [];
  return ids.map((id) => getSkillById(id)).filter((s): s is SkillBaseInfo => s !== undefined);
}
