"use client";

import { useEffect, useRef, useState } from "react";
import GameBackground from "@/components/GameBackground";
import BgmPlayer from "@/components/BgmPlayer";
import { rollGachaItem } from "@/lib/item-drop";
import { getItemBaseInfo, RARITY_COLOR, type ItemBaseInfo, type ItemRarity } from "@/lib/items-info";
import { addItemsToInventory, loadGame1Data, saveGame1Data, type Game1SaveData } from "@/lib/game1-data";
import { loadGlobalData } from "@/lib/storage";
import { SHOP_BGM } from "@/lib/audio-tracks";

// 武器ガチャ画面。docs/spec/screens/shop.md参照。
// ショップタブ＝ガチャ画面という位置づけ。ガチャチケット（デイリーミッション報酬で
// 入手、lib/daily-missions.ts参照）を1枚消費して宝箱を1回開け、必ず武器かアーティ
// ファクトが1つ手に入る。レア度は「現在クリアしている中で最大のステージ」の
// レア度比率（lib/item-drop.tsのrollGachaItem、戦闘ドロップと共通のテーブル）で決まる。

type Phase = "idle" | "playing" | "result";

const RARITIES: ItemRarity[] = ["C", "B", "A", "S", "SS"];
const FRAME_COUNT = 9;
// 元素材（hirogames_images/assets/gacha/chest_reveal_v1/build_animations.py）の
// 1フレームごとの表示時間（ms）をそのまま踏襲している。
const FRAME_DURATIONS_MS = [180, 80, 80, 90, 100, 120, 140, 180, 420];
// 開封後、結果を少し見せてから次に引けるようにするための余韻。
const RESULT_HOLD_MS = 900;


function framePath(rarity: ItemRarity, frame: number) {
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
  const [saveData, setSaveData] = useState<Game1SaveData | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [rarity, setRarity] = useState<ItemRarity>("C");
  const [frame, setFrame] = useState(0);
  const [obtainedItem, setObtainedItem] = useState<ItemBaseInfo | null>(null);
  const [bagFull, setBagFull] = useState(false);
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const playingRef = useRef(false);
  // レア度ごとの全フレームの先読み結果（一度読み終わっていれば再利用する）。
  const preloadedRef = useRef<Partial<Record<ItemRarity, Promise<void[]>>>>({});

  useEffect(() => {
    setSaveData(loadGame1Data());
    setBgmEnabled(loadGlobalData().bgmEnabled);
  }, []);

  function preloadRarity(r: ItemRarity): Promise<void[]> {
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
    if (!saveData || saveData.gachaTickets <= 0) return;
    playingRef.current = true;

    // 演出を始める前に抽選・消費・所持アイテムへの反映を確定させ保存する
    // （演出は「確定した結果を見せているだけ」にする。演出中に離脱しても結果は残る）。
    const dropped = rollGachaItem(saveData.maxClearedStage);
    const item = getItemBaseInfo(dropped.itemId);
    const withTicketSpent: Game1SaveData = { ...saveData, gachaTickets: saveData.gachaTickets - 1 };
    const addResult = addItemsToInventory(withTicketSpent, [dropped.itemId]);
    const nextSave = addResult.data;
    saveGame1Data(nextSave);
    setSaveData(nextSave);

    setRarity(dropped.rarity);
    setObtainedItem(item ?? null);
    setBagFull(addResult.rejectedCount > 0);
    await preloadRarity(dropped.rarity);
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
  const tickets = saveData?.gachaTickets ?? 0;
  const canOpen = tickets > 0 && phase !== "playing";

  return (
    <div className="relative flex h-[100dvh] flex-col items-center overflow-hidden bg-background">
      <GameBackground />
      <BgmPlayer src={SHOP_BGM} enabled={bgmEnabled} />

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-6 px-6 pb-24">
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-bold tracking-wide text-[#b8b3d9]">武器ガチャ</p>
          <p className="rounded-full border border-[rgba(201,195,255,0.4)] bg-[rgba(255,255,255,0.09)] px-3 py-1 text-xs font-bold text-[#eee9ff]">
            ガチャチケット {tickets.toLocaleString()}枚
          </p>
        </div>

        {phase === "result" && obtainedItem ? (
          <div className="flex h-56 w-56 flex-col items-center justify-center gap-2">
            <img
              src={obtainedItem.asset}
              alt={obtainedItem.name}
              className="h-32 w-32 select-none rounded-xl object-cover"
              draggable={false}
            />
          </div>
        ) : (
          <button
            onClick={openChest}
            disabled={!canOpen}
            className="relative flex h-56 w-56 items-center justify-center disabled:cursor-default"
          >
            <img
              src={framePath(rarity, displayFrame)}
              alt="宝箱"
              className="h-full w-full select-none object-contain"
              draggable={false}
              style={{ opacity: phase === "idle" && tickets <= 0 ? 0.4 : 1 }}
            />
          </button>
        )}

        <div className="flex min-h-14 flex-col items-center justify-center">
          {phase === "idle" && tickets > 0 && (
            <p className="text-xs font-medium text-[#8f89b3]">宝箱をタップして開ける</p>
          )}
          {phase === "idle" && tickets <= 0 && (
            <p className="text-xs font-medium text-[#8f89b3]">
              ガチャチケットがありません（デイリーミッションで入手できます）
            </p>
          )}
          {phase === "playing" && (
            <p className="text-xs font-medium text-[#8f89b3]">開けています…</p>
          )}
          {phase === "result" && obtainedItem && (
            <div className="flex flex-col items-center gap-1">
              <p
                className="text-lg font-extrabold [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]"
                style={{ color: RARITY_COLOR[rarity] }}
              >
                {obtainedItem.name}（{rarity}）を獲得！
              </p>
              {bagFull && (
                <p className="text-[11px] font-bold text-[#ffb4b4]">
                  バッグの所持数が上限のため、受け取れませんでした
                </p>
              )}
            </div>
          )}
        </div>

        {phase === "result" && (
          <button
            onClick={() => {
              setPhase("idle");
              setObtainedItem(null);
            }}
            className="rounded-full border-2 border-black bg-[#c9c3ff] px-6 py-2 text-sm font-bold text-black"
          >
            {tickets > 0 ? "もう一度引く" : "閉じる"}
          </button>
        )}
      </div>
    </div>
  );
}
