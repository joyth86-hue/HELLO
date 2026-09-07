"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { stickerButton } from "@/lib/ui";

const CHARACTER_IDS = ["c01", "c02", "c03", "c04"];
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
        className="max-h-[85vh] w-auto max-w-full select-none"
        draggable={false}
      />
    </div>
  );
}

export default function CharacterViewPage() {
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isSettling, setIsSettling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerStartX = useRef<number | null>(null);

  const prevId = CHARACTER_IDS[mod(index - 1, CHARACTER_IDS.length)];
  const currentId = CHARACTER_IDS[index];
  const nextId = CHARACTER_IDS[mod(index + 1, CHARACTER_IDS.length)];

  const settle = (target: number, direction: 1 | -1 | 0) => {
    setIsSettling(true);
    setDragX(target);
    window.setTimeout(() => {
      setIsSettling(false);
      setDragX(0);
      if (direction !== 0) {
        setIndex((i) => mod(i + direction, CHARACTER_IDS.length));
      }
    }, SNAP_DURATION);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isSettling) return;
    pointerStartX.current = e.clientX;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (pointerStartX.current === null || isSettling) return;
    const width = containerRef.current?.offsetWidth || 1;
    const delta = e.clientX - pointerStartX.current;
    setDragX(Math.max(-width, Math.min(width, delta)));
  };

  const endDrag = () => {
    if (pointerStartX.current === null) return;
    pointerStartX.current = null;
    const width = containerRef.current?.offsetWidth || 1;

    if (dragX <= -SWIPE_THRESHOLD) {
      settle(-width, 1);
    } else if (dragX >= SWIPE_THRESHOLD) {
      settle(width, -1);
    } else {
      settle(0, 0);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-full touch-pan-y overflow-hidden bg-background"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <Link
        href="/games/game1"
        aria-label="Game1のメイン画面に戻る"
        className={`${stickerButton} absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full`}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <line x1="2" y1="2" x2="16" y2="16" stroke="#171717" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="16" y1="2" x2="2" y2="16" stroke="#171717" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </Link>

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
  );
}
