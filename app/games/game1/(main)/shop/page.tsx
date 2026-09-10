"use client";

import { useEffect, useRef, useState } from "react";
import GameBackground from "@/components/GameBackground";

// 武器ガチャ画面（演出確認版）。docs/spec/screens/shop.md参照。
// ショップタブ＝ガチャ画面という位置づけ。宝箱をタップすると開封演出が再生され、
// 最後にレア度だけを表示する（実際のアイテム付与・ポイント消費はまだ未実装で、
// 今は無制限に引ける「演出確認用」の状態）。

type Rarity = "C" | "B" | "A" | "S" | "SS";
type Phase = "idle" | "playing" | "result";

const RARITIES: Rarity[] = ["C", "B", "A", "S", "SS"];
const FRAME_COUNT = 9;
// 元素材（hirogames_images/assets/gacha/chest_reveal_v1/build_animations.py）の
// 1フレームごとの表示時間（ms）をそのまま踏襲している。
const FRAME_DURATIONS_MS = [180, 80, 80, 90, 100, 120, 140, 180, 420];
// 開封後、結果を少し見せてから次に引けるようにするための余韻。
const RESULT_HOLD_MS = 900;

const RARITY_LABEL_COLOR: Record<Rarity, string> = {
  C: "#dce2e8",
  B: "#5be08a",
  A: "#5fb1ff",
  S: "#c983ff",
  SS: "#ffc25c",
};

function framePath(rarity: Rarity, frame: number) {
  return `/gacha/chest/${rarity}/frame_${String(frame).padStart(2, "0")}.png`;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// 画像を取得＆デコードまで済ませてから解決するPromise。<img src>を切り替える
// 直前にフレームごとの取得・デコード待ちが挟まると、そこだけコマが飛んで見える
// （実際に発生した不具合）ため、再生を始める前にまとめて済ませておく。
function preloadImage(src: string): Promise<void> {
  const img = new window.Image();
  img.src = src;
  if (typeof img.decode === "function") {
    return img.decode().catch(() => undefined);
  }
  if (img.complete) return Promise.resolve();
  return new Promise((resolve) => {
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });
}

export default function ShopPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [rarity, setRarity] = useState<Rarity>("C");
  const [frame, setFrame] = useState(0);
  const playingRef = useRef(false);
  // レア度ごとの全フレームの先読み結果（一度読み終わっていれば再利用する）。
  const preloadedRef = useRef<Partial<Record<Rarity, Promise<void[]>>>>({});

  function preloadRarity(r: Rarity): Promise<void[]> {
    let promise = preloadedRef.current[r];
    if (!promise) {
      promise = Promise.all(
        Array.from({ length: FRAME_COUNT }, (_, i) => preloadImage(framePath(r, i)))
      );
      preloadedRef.current[r] = promise;
    }
    return promise;
  }

  useEffect(() => {
    // 初回表示時に全レア度分を先読みしておき、実際にタップした時点で
    // ほぼ確実にキャッシュ済みの状態にする。
    for (const r of RARITIES) preloadRarity(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openChest() {
    if (playingRef.current) return;
    playingRef.current = true;

    const picked = RARITIES[Math.floor(Math.random() * RARITIES.length)];
    setRarity(picked);
    await preloadRarity(picked);
    setPhase("playing");

    for (let i = 0; i < FRAME_COUNT; i++) {
      setFrame(i);
      // eslint-disable-next-line no-await-in-loop
      await wait(FRAME_DURATIONS_MS[i]);
    }

    setPhase("result");
    await wait(RESULT_HOLD_MS);
    playingRef.current = false;
  }

  const displayFrame = phase === "idle" ? 0 : frame;

  return (
    <div className="relative flex h-[100dvh] flex-col items-center overflow-hidden bg-background">
      <GameBackground />

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-6 px-6 pb-24">
        <p className="text-sm font-bold tracking-wide text-[#b8b3d9]">武器ガチャ</p>

        <button
          onClick={openChest}
          disabled={phase === "playing"}
          className="relative flex h-56 w-56 items-center justify-center disabled:cursor-default"
        >
          <img
            src={framePath(rarity, displayFrame)}
            alt="宝箱"
            className="h-full w-full select-none object-contain"
            draggable={false}
          />
        </button>

        <div className="flex h-14 flex-col items-center justify-center">
          {phase === "idle" && (
            <p className="text-xs font-medium text-[#8f89b3]">宝箱をタップして開ける</p>
          )}
          {phase === "playing" && (
            <p className="text-xs font-medium text-[#8f89b3]">開けています…</p>
          )}
          {phase === "result" && (
            <p
              className="text-lg font-extrabold [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]"
              style={{ color: RARITY_LABEL_COLOR[rarity] }}
            >
              {rarity}ランクのアイテムを獲得！
            </p>
          )}
        </div>

        <p className="text-center text-[10px] leading-relaxed text-[#736d99]">
          演出確認用のため、現在は消費ポイント無しで何度でも引けます。
          <br />
          実際のアイテム付与・消費ポイントは今後実装予定です。
        </p>
      </div>
    </div>
  );
}
