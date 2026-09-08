"use client";

import { useRef, useState } from "react";
import { stickerButton } from "@/lib/ui";
import { CHARACTERS, getCharacterByIndex } from "@/lib/characters";
import GameBackground from "@/components/GameBackground";

const SWIPE_THRESHOLD = 60;
const SNAP_DURATION = 250;

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

function CharacterPane({ id }: { id: string }) {
  return (
    <div className="flex h-full w-1/3 flex-shrink-0 items-center justify-center">
      <img
        src={`/characters/${id}_t01.png`}
        alt={id}
        className="max-h-full max-w-full select-none object-contain"
        draggable={false}
      />
    </div>
  );
}

export default function CharacterViewPage() {
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isSettling, setIsSettling] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const pointerStartX = useRef<number | null>(null);

  const stats = getCharacterByIndex(index);
  const prevId = CHARACTERS[mod(index - 1, CHARACTERS.length)].id;
  const currentId = CHARACTERS[index].id;
  const nextId = CHARACTERS[mod(index + 1, CHARACTERS.length)].id;

  const settle = (target: number, direction: 1 | -1 | 0) => {
    setIsSettling(true);
    setDragX(target);
    window.setTimeout(() => {
      setIsSettling(false);
      setDragX(0);
      if (direction !== 0) {
        setIndex((i) => mod(i + direction, CHARACTERS.length));
      }
    }, SNAP_DURATION);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isSettling) return;
    pointerStartX.current = e.clientX;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (pointerStartX.current === null || isSettling) return;
    const width = frameRef.current?.offsetWidth || 1;
    const delta = e.clientX - pointerStartX.current;
    setDragX(Math.max(-width, Math.min(width, delta)));
  };

  const endDrag = () => {
    if (pointerStartX.current === null) return;
    pointerStartX.current = null;
    const width = frameRef.current?.offsetWidth || 1;

    if (dragX <= -SWIPE_THRESHOLD) {
      settle(-width, 1);
    } else if (dragX >= SWIPE_THRESHOLD) {
      settle(width, -1);
    } else {
      settle(0, 0);
    }
  };

  return (
    <div className="relative h-screen touch-none overflow-hidden bg-background">
      <GameBackground />

      <div className="relative z-10 flex h-full touch-none flex-col">
        <div className="px-4 pt-4">
          <p className="mb-1.5 text-[11px] font-medium tracking-wide text-[#b8b3d9]">STATUS</p>
          <div className="rounded-xl border border-[rgba(201,195,255,0.4)] bg-[rgba(255,255,255,0.09)] px-3.5 py-2.5 text-sm text-[#eee9ff] backdrop-blur-sm">
            <div className="flex justify-between">
              <span>HP</span>
              <span className="font-bold tabular-nums">{stats.hp.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>攻撃力</span>
              <span className="font-bold tabular-nums">{stats.atk.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>防御力</span>
              <span className="font-bold tabular-nums">{stats.def.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-hidden px-6 py-3">
          <div
            ref={frameRef}
            className="relative aspect-[2/3] h-auto max-h-full w-full max-w-[340px] touch-none overflow-hidden rounded-xl border-4 border-black bg-[#fffaf0] p-1.5 shadow-[inset_0_0_0_4px_#fffaf0,inset_0_0_0_5px_#171717]"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div
              className="flex h-full"
              style={{
                width: "300%",
                transform: `translateX(calc(-33.3333% + ${dragX}px))`,
                transition: isSettling ? `transform ${SNAP_DURATION}ms ease-out` : "none",
              }}
            >
              <CharacterPane id={prevId} />
              <CharacterPane id={currentId} />
              <CharacterPane id={nextId} />
            </div>
          </div>
        </div>

        <div className="px-4 pb-28">
          <p className="mb-1.5 text-[11px] font-medium tracking-wide text-[#b8b3d9]">育成メニュー</p>
          <div className="flex gap-3">
            <button className={`${stickerButton} flex-1 rounded-full py-2.5`}>装備</button>
            <button className={`${stickerButton} flex-1 rounded-full py-2.5`}>スキル</button>
          </div>
        </div>
      </div>
    </div>
  );
}
