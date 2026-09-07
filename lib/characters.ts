// キャラクターの基本データ（ID・仮ステータス）。
// 名前や設定は未定のため、現時点ではIDとステータスのみ持たせている。

export interface CharacterStats {
  id: string;
  hp: number;
  atk: number;
  def: number;
}

export const CHARACTERS: CharacterStats[] = [
  { id: "c01", hp: 12400, atk: 860, def: 640 },
  { id: "c02", hp: 10800, atk: 780, def: 700 },
  { id: "c03", hp: 9600, atk: 910, def: 560 },
  { id: "c04", hp: 11200, atk: 830, def: 610 },
];

export function getCharacterByIndex(index: number): CharacterStats {
  return CHARACTERS[index % CHARACTERS.length];
}
