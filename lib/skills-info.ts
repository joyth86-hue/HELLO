// スキルの基本情報。docs/spec/skills.md参照。
// 名称・種別・対象・属性・CT・倍率など、ユーザー確認済みの内容で確定させたもの。
// 数値（baseValue・支援効果の量など）は仮値で、後から調整できる。

export type SkillKind = "攻撃" | "支援" | "回復";
export type SkillTarget = "敵単体" | "敵全体" | "味方1体" | "味方全体";
export type SkillElement = "炎" | "草" | "氷" | "水" | "岩" | null;

// 支援スキルが上げるステータス。
export type BuffStat = "atk" | "def" | "critRate" | "elementResist";

export interface SkillEffect {
  // 支援（バフ）：対象のステータスを一定ターン上昇させる。
  buff?: { stat: BuffStat; percentOrPoints: number; turns: number };
  // 回復：対象の最大HPに対する割合で回復。
  healPercent?: number;
  // 攻撃に追加する妨害効果：次の行動を1回スキップさせる。
  skipNextTurn?: boolean;
}

export interface SkillBaseInfo {
  id: string;
  characterId: string;
  name: string;
  description: string;
  icon: string;
  kind: SkillKind;
  target: SkillTarget;
  element: SkillElement;
  ct: number; // クールタイム（0=通常攻撃相当、使用後この回数だけ自分の手番を空けないと再使用できない）
  hits: number; // 同じ対象に何回攻撃が発生するか（クロスファイア=2など）
  // 攻撃スキルの基礎値：キャラの攻撃力に加算する固定値（装備の武器と同じ考え方）。
  // 合成・強化の「＋値」で元の基礎値の5%ずつ伸びる（lib/item-synthesis.tsと同じ式）。
  baseValue?: number;
  effect?: SkillEffect;
}

// 各キャラの1枠目（starter skill）は初期から解放済み。他は解放にスキルポイントが必要。
export const STARTER_SKILLS = ["sk001", "sk005", "sk010", "sk014"];

export const SKILL_BASE_INFO: SkillBaseInfo[] = [
  {
    id: "sk001",
    characterId: "c01",
    name: "炎の一撃",
    description: "剣に炎をまとわせて斬りつける",
    icon: "/icons/buttons/skill_akane_flame_slash.png",
    kind: "攻撃",
    target: "敵単体",
    element: "炎",
    ct: 1,
    hits: 1,
    baseValue: 15,
  },
  {
    id: "sk002",
    characterId: "c01",
    name: "炎舞",
    description: "剣から炎を巻き上げながら斬り上げる",
    icon: "/icons/buttons/skill_akane_rising_fire.png",
    kind: "攻撃",
    target: "敵全体",
    element: "炎",
    ct: 2,
    hits: 1,
    baseValue: 25,
  },
  {
    id: "sk003",
    characterId: "c01",
    name: "クロスファイア",
    description: "十字に斬り裂き爆炎を巻き起こす（同じ敵に2回攻撃）",
    icon: "/icons/buttons/skill_akane_inferno_burst.png",
    kind: "攻撃",
    target: "敵単体",
    element: "炎",
    ct: 2,
    hits: 2,
    baseValue: 20,
  },
  {
    id: "sk004",
    characterId: "c01",
    name: "リーダーシップ",
    description: "咆哮を上げ味方の攻撃力を高める（支援）",
    icon: "/icons/buttons/support_akane_attack_up.png",
    kind: "支援",
    target: "味方全体",
    element: null,
    ct: 2,
    hits: 0,
    effect: { buff: { stat: "atk", percentOrPoints: 10, turns: 3 } },
  },
  {
    id: "sk005",
    characterId: "c02",
    name: "緑光弾",
    description: "緑の光弾を撃ち出す",
    icon: "/icons/buttons/skill_kaede_green_bolt.png",
    kind: "攻撃",
    target: "敵単体",
    element: "草",
    ct: 1,
    hits: 1,
    baseValue: 15,
  },
  {
    id: "sk006",
    characterId: "c02",
    name: "茨の炸裂",
    description: "蔦と葉の刃を四方に放つ",
    icon: "/icons/buttons/skill_kaede_thorn_burst.png",
    kind: "攻撃",
    target: "敵全体",
    element: "草",
    ct: 2,
    hits: 1,
    baseValue: 25,
  },
  {
    id: "sk007",
    characterId: "c02",
    name: "魔力波",
    description: "緑の魔力を波状に広げて敵を打つ",
    icon: "/icons/buttons/skill_kaede_arcane_pulse.png",
    kind: "攻撃",
    target: "敵全体",
    element: "草",
    ct: 2,
    hits: 1,
    baseValue: 25,
  },
  {
    id: "sk008",
    characterId: "c02",
    name: "癒しの枝",
    description: "味方1体のHPを回復する（支援）",
    icon: "/icons/buttons/support_kaede_heal.png",
    kind: "回復",
    target: "味方1体",
    element: null,
    ct: 2,
    hits: 0,
    effect: { healPercent: 20 },
  },
  {
    id: "sk009",
    characterId: "c02",
    name: "みんなを守るの",
    description: "加護を与え味方の防御力を高める（支援）",
    icon: "/icons/buttons/support_kaede_defense_up.png",
    kind: "支援",
    target: "味方全体",
    element: null,
    ct: 2,
    hits: 0,
    effect: { buff: { stat: "def", percentOrPoints: 10, turns: 3 } },
  },
  {
    id: "sk010",
    characterId: "c03",
    name: "砕けなさい",
    description: "鋭い氷の欠片を撃ち出す",
    icon: "/icons/buttons/skill_koyuki_ice_shards.png",
    kind: "攻撃",
    target: "敵単体",
    element: "氷",
    ct: 1,
    hits: 1,
    baseValue: 15,
  },
  {
    id: "sk011",
    characterId: "c03",
    name: "凍えるがいいわ",
    description: "冷気の吹雪で周囲を凍てつかせる",
    icon: "/icons/buttons/skill_koyuki_blizzard.png",
    kind: "攻撃",
    target: "敵全体",
    element: "氷",
    ct: 2,
    hits: 1,
    baseValue: 25,
  },
  {
    id: "sk012",
    characterId: "c03",
    name: "お静かに",
    description: "氷の紋章で敵の動きを封じる（次の行動を1回封じる）",
    icon: "/icons/buttons/skill_koyuki_frozen_seal.png",
    kind: "攻撃",
    target: "敵単体",
    element: "氷",
    ct: 2,
    hits: 1,
    baseValue: 20,
    effect: { skipNextTurn: true },
  },
  {
    id: "sk013",
    characterId: "c03",
    name: "舐められたものね",
    description: "加護の盾で味方の属性耐性を高める（支援）",
    icon: "/icons/buttons/support_koyuki_element_resistance_up.png",
    kind: "支援",
    target: "味方全体",
    element: null,
    ct: 2,
    hits: 0,
    effect: { buff: { stat: "elementResist", percentOrPoints: 10, turns: 3 } },
  },
  {
    id: "sk014",
    characterId: "c04",
    name: "カントゥーヤ",
    description: "的を貫く一射で敵を射抜く",
    icon: "/icons/buttons/skill_sayumi_piercing_arrow.png",
    kind: "攻撃",
    target: "敵単体",
    element: "草",
    ct: 1,
    hits: 1,
    baseValue: 15,
  },
  {
    id: "sk015",
    characterId: "c04",
    name: "レン・シャ",
    description: "複数の矢を一斉に放つ",
    icon: "/icons/buttons/skill_sayumi_multishot.png",
    kind: "攻撃",
    target: "敵全体",
    element: "草",
    ct: 2,
    hits: 1,
    baseValue: 25,
  },
  {
    id: "sk016",
    characterId: "c04",
    name: "蔦縛りの矢",
    description: "蔦を纏わせた矢で敵の動きを縛る（次の行動を1回封じる）",
    icon: "/icons/buttons/skill_sayumi_vine_binding.png",
    kind: "攻撃",
    target: "敵単体",
    element: "草",
    ct: 2,
    hits: 1,
    baseValue: 20,
    effect: { skipNextTurn: true },
  },
  {
    id: "sk017",
    characterId: "c04",
    name: "会心率アップ",
    description: "会心の一射で味方の会心率を高める（支援）",
    icon: "/icons/buttons/support_sayumi_critical_rate_up.png",
    kind: "支援",
    target: "味方全体",
    element: null,
    ct: 2,
    hits: 0,
    effect: { buff: { stat: "critRate", percentOrPoints: 10, turns: 3 } },
  },
];

// キャラごとの「現在の4枠キット」（戦闘画面のスキル4枠に並べる順番）。
// sk007（カエデ・魔力波）は他キャラと4枠に揃えるため不採用（ユーザー確認済み）。
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

export function isStarterSkill(skillId: string): boolean {
  return STARTER_SKILLS.includes(skillId);
}
