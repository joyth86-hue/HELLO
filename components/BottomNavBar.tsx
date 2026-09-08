"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Game1のメイン画面群（マップ/ショップ/冒険/仲間/バッグ）に共通で表示する
// 下部ナビゲーションバー。選択中のタブだけ丸く縁取られて上にせり出し、
// 隣のタブがスペースを空けるように少し詰まる。
//
// アイコンはまだ透過画像が用意できていないため、`icon`未設定の間はラベルの
// 先頭1文字を仮表示している。用意ができたら各タブに `icon: "/games/..."`
// のように画像パスを追加するだけで切り替わる（他のコードは変更不要）。
interface NavTab {
  key: string;
  label: string;
  href: string;
  icon?: string;
}

const TABS: NavTab[] = [
  { key: "map", label: "マップ", href: "/games/game1/map" },
  { key: "shop", label: "ショップ", href: "/games/game1/shop" },
  { key: "adventure", label: "冒険", href: "/games/game1/home" },
  { key: "party", label: "仲間", href: "/games/game1/character" },
  { key: "bag", label: "バッグ", href: "/games/game1/bag" },
];

export default function BottomNavBar() {
  const pathname = usePathname();
  const activeKey = TABS.find((tab) => tab.href === pathname)?.key;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex items-end justify-around border-t border-[rgba(201,195,255,0.25)] bg-black/85 px-1 pb-2 pt-3 backdrop-blur-sm"
      aria-label="メインナビゲーション"
    >
      {TABS.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className="flex flex-col items-center justify-end pb-1 outline-none transition-[flex-grow] duration-300 ease-out"
            style={{ flexGrow: isActive ? 1.5 : 1, flexBasis: 0 }}
          >
            <div
              className={`flex items-center justify-center rounded-full border-2 transition-all duration-300 ease-out ${
                isActive
                  ? "h-14 w-14 -translate-y-4 border-[#c9c3ff] bg-[#2c2557] shadow-[0_6px_18px_rgba(0,0,0,0.45)]"
                  : "h-11 w-11 translate-y-0 border-transparent bg-white/5"
              }`}
            >
              {tab.icon ? (
                <img src={tab.icon} alt="" className="h-full w-full object-contain p-2" />
              ) : (
                <span
                  className={`font-bold ${isActive ? "text-lg text-white" : "text-sm text-white/60"}`}
                >
                  {tab.label.slice(0, 1)}
                </span>
              )}
            </div>
            <span
              className={`mt-1 whitespace-nowrap text-[10px] font-medium transition-colors ${
                isActive ? "text-white" : "text-white/50"
              }`}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
