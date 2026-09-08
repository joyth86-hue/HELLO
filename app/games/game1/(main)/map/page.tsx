import GameBackground from "@/components/GameBackground";

// マップ画面（未実装）。下部ナビゲーションバーの動作確認用のプレースホルダー。
export default function MapPage() {
  return (
    <div className="relative flex h-[100dvh] items-center justify-center overflow-hidden bg-background">
      <GameBackground />
      <p className="relative z-10 pb-28 text-center text-sm font-medium text-[#b8b3d9]">
        マップ画面は準備中です
      </p>
    </div>
  );
}
