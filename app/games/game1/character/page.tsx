"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { stickerButton } from "@/lib/ui";

const CHARACTER_IDS = ["c01", "c02", "c03", "c04"];
const SWIPE_THRESHOLD = 40;

export default function CharacterViewPage() {
  const [index, setIndex] = useState(0);
  const pointerStartX = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartX.current = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerStartX.current === null) return;
    const deltaX = e.clientX - pointerStartX.current;
    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      setIndex((i) => (i + 1) % CHARACTER_IDS.length);
    }
    pointerStartX.current = null;
  };

  const currentId = CHARACTER_IDS[index];

  return (
    <div
      className="relative flex h-screen touch-pan-y flex-col items-center justify-center overflow-hidden bg-background"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
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

      <img
        src={`/characters/${currentId}_t01.png`}
        alt={currentId}
        className="max-h-[85vh] w-auto max-w-full select-none"
        draggable={false}
      />
    </div>
  );
}
