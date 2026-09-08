"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Game1のメイン画面群（マップ/ショップ/冒険/仲間/バッグ）に共通で表示する
// 下部ナビゲーションバー。選択中のタブだけ丸く縁取られて一回り大きく上に
// せり出し、円の中にアイコン＋ラベルを表示する。隣のタブはスペースを
// 空けるように少し詰まる。非選択のタブはアイコンのみ（ラベルは出さない）。
interface NavTab {
  key: string;
  label: string;
  href: string;
  icon: string;
}

const TABS: NavTab[] = [
  { key: "map", label: "マップ", href: "/games/game1/map", icon: "/icons/nav/icon_map.png" },
  { key: "shop", label: "ショップ", href: "/games/game1/shop", icon: "/icons/nav/icon_shop.png" },
  { key: "adventure", label: "冒険", href: "/games/game1/home", icon: "/icons/nav/icon_battle.png" },
  { key: "party", label: "仲間", href: "/games/game1/character", icon: "/icons/nav/icon_chara.png" },
  { key: "bag", label: "バッグ", href: "/games/game1/bag", icon: "/icons/nav/icon_bag.png" },
];

export default function BottomNavBar() {
  const pathname = usePathname();
  const activeKey = TABS.find((tab) => tab.href === pathname)?.key;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex items-end justify-around border-t border-[rgba(201,195,255,0.25)] bg-black/85 px-1 pb-2 pt-4 backdrop-blur-sm"
      aria-label="メインナビゲーション"
    >
      {TABS.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
            className="flex flex-col items-center justify-end pb-1 outline-none transition-[flex-grow] duration-300 ease-out"
            style={{ flexGrow: isActive ? 1.6 : 1, flexBasis: 0 }}
          >
            <div
              className={`flex items-center justify-center rounded-full border-2 transition-all duration-300 ease-out ${
                isActive
                  ? "h-[72px] w-[72px] -translate-y-5 border-[#c9c3ff] bg-[#2c2557] shadow-[0_6px_18px_rgba(0,0,0,0.45)]"
                  : "h-14 w-14 translate-y-0 border-transparent bg-white/5"
              }`}
            >
              {isActive ? (
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <img src={tab.icon} alt="" className="h-8 w-8 object-contain" />
                  <span className="whitespace-nowrap text-[9px] font-bold leading-none text-white">
                    {tab.label}
                  </span>
                </div>
              ) : (
                <img src={tab.icon} alt="" className="h-9 w-9 object-contain opacity-80" />
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
