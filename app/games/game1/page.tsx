"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBackgroundImage } from "@/lib/background";

type Stage = "initial" | "bg" | "logo" | "ready" | "loading";

const TEXT_SHADOW = "0 2px 10px rgba(0,0,0,0.55), 0 0 4px rgba(0,0,0,0.8)";
const LOADING_TEXT = "Now Loading...";
const LOADING_DURATION = 1400;

export default function Game1StartPage() {
  const router = useRouter();
  const [background, setBackground] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("initial");

  useEffect(() => {
    setBackground(getBackgroundImage(new Date()));
    router.prefetch("/games/game1/home");

    const t1 = window.setTimeout(() => setStage("bg"), 100);
    const t2 = window.setTimeout(() => setStage("logo"), 1100);
    const t3 = window.setTimeout(() => setStage("ready"), 2000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [router]);

  const handleTap = () => {
    if (stage !== "ready") return;
    setStage("loading");
    window.setTimeout(() => {
      router.push("/games/game1/home");
    }, LOADING_DURATION);
  };

  return (
    <div
      className={`relative h-screen w-full touch-none overflow-hidden bg-white ${stage === "ready" ? "cursor-pointer" : ""}`}
      onClick={handleTap}
    >
      {background && (
        <img
          src={background}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            stage === "initial" ? "opacity-0" : "opacity-100"
          }`}
        />
      )}

      <div
        className={`absolute inset-x-0 top-[18%] flex justify-center transition-opacity duration-700 ${
          stage === "initial" || stage === "bg" ? "opacity-0" : "opacity-100"
        }`}
      >
        <p className="text-4xl font-extrabold text-white" style={{ textShadow: TEXT_SHADOW }}>
          Game 1
        </p>
      </div>

      <div
        className={`absolute inset-x-0 bottom-[16%] flex justify-center transition-opacity duration-700 ${
          stage === "ready" ? "opacity-100" : "opacity-0"
        }`}
      >
        <p
          className={`text-lg font-semibold text-white ${stage === "ready" ? "animate-pulse" : ""}`}
          style={{ textShadow: TEXT_SHADOW }}
        >
          タップして開始する
        </p>
      </div>

      <div
        className={`absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black transition-opacity duration-500 ${
          stage === "loading" ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {stage === "loading" && (
          <>
            <p
              className="flex text-base font-bold tracking-wide text-white"
              style={{ fontFamily: '"M PLUS Rounded 1c", "Zen Kaku Gothic New", sans-serif' }}
            >
              {LOADING_TEXT.split("").map((char, i) => (
                <span
                  key={i}
                  className="inline-block animate-bounce-char"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  {char === " " ? " " : char}
                </span>
              ))}
            </p>
            <div className="h-2 w-2/3 max-w-[220px] rounded-full border-[1.5px] border-white p-[2px]">
              <div className="h-full rounded-full bg-white animate-fill-bar" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
