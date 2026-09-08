import BottomNavBar from "@/components/BottomNavBar";

// マップ/ショップ/冒険（ホーム）/仲間/バッグの5画面で共通の下部ナビゲーションバーを
// 表示するための共有レイアウト。ルートグループ（main）はURLには表れない
// （/games/game1/home 等のパスはこれまで通り）。
export default function Game1MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BottomNavBar />
    </>
  );
}
