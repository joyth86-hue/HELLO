"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadGame1Data, type Game1SaveData } from "@/lib/game1-data";
import { getEffectiveGame1Data } from "@/lib/test-mode";
import GameBackground from "@/components/GameBackground";
import TestModeBadge from "@/components/TestModeBadge";

// 選べるステージ：クリア済みの全ステージ＋未クリアの最新1ステージのみ。
// 詳細はdocs/spec/screens/adventure.md参照。まだシンプルな一覧のみで、
// 実際の10バトル連戦（S-1〜S-10）へはこの先つなぎ込む（現状は動作確認用の
// 戦闘テスト画面に遷移するだけの仮実装）。
export default function StageSelectPage() {
  const [saveData, setSaveData] = useState<Game1SaveData | null>(null);

  useEffect(() => {
    setSaveData(loadGame1Data());
  }, []);

  const effectiveData = saveData ? getEffectiveGame1Data(saveData) : null;
  const maxClearedStage = effectiveData?.maxClearedStage ?? 0;
  const selectableUpTo = maxClearedStage + 1;
  const stages = Array.from({ length: selectableUpTo }, (_, i) => i + 1);

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-background">
      <GameBackground />

      {saveData?.testMode && (
        <TestModeBadge className="absolute right-4 top-[calc(1rem_+_env(safe-area-inset-top))]" />
      )}

      <div className="relative z-10 flex h-full flex-col">
        <div className="px-4 pb-2 pt-[calc(1rem_+_env(safe-area-inset-top))]">
          <h1 className="text-lg font-bold tracking-wide text-[#f4f1ff]">ステージ選択</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-28">
          <div className="flex flex-col gap-2.5">
            {stages
              .slice()
              .reverse()
              .map((stage) => {
                const cleared = stage <= maxClearedStage;
                return (
                  <Link
                    key={stage}
                    href={`/games/game1/battle?stage=${stage}`}
                    className="flex items-center justify-between rounded-xl border-2 border-[rgba(201,195,255,0.4)] bg-[rgba(255,255,255,0.08)] px-4 py-3 text-[#eee9ff] backdrop-blur-sm"
                  >
                    <p className="font-bold">ステージ {stage}</p>
                    {cleared ? (
                      <span className="w-16 rounded-full bg-[rgba(201,195,255,0.25)] py-1 text-center text-[10px] font-bold text-[#eee9ff]">
                        CLEAR
                      </span>
                    ) : (
                      <span className="w-16 rounded-full bg-[#e0a233] py-1 text-center text-[10px] font-bold text-[#171717]">
                        TRY
                      </span>
                    )}
                  </Link>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
