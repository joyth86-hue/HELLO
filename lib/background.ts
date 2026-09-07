// Game1トップ画面の背景を、開いた時刻に応じて切り替えるためのヘルパー。

export type TimeOfDay = "day" | "evening" | "night";

export function getTimeOfDay(date: Date): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 16) return "day";
  if (hour >= 16 && hour < 19) return "evening";
  return "night";
}

const BACKGROUND_BY_TIME: Record<TimeOfDay, string> = {
  day: "/backgrounds/top01.png",
  evening: "/backgrounds/top02.png",
  night: "/backgrounds/top03.png",
};

export function getBackgroundImage(date: Date): string {
  return BACKGROUND_BY_TIME[getTimeOfDay(date)];
}
