// テストモード中であることを示す小さなバッジ。配置は呼び出し側のclassNameで
// 画面ごとに調整する（各画面の既存レイアウトと重ならない位置に置くため）。
export default function TestModeBadge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`z-20 rounded-full bg-[#e0a233] px-2.5 py-1 text-[10px] font-bold text-[#171717] ${className}`}
    >
      テストモード中
    </div>
  );
}
