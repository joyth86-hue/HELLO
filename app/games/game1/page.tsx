"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBackgroundImage } from "@/lib/background";

type Stage = "initial" | "bg" | "logo" | "ready";

const TEXT_SHADOW = "0 2px 10px rgba(0,0,0,0.55), 0 0 4px rgba(0,0,0,0.8)";

export default function Game1StartPage() {
  const router = useRouter();
  const [background, setBackground] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("initial");

  useEffect(() => {
    setBackground(getBackgroundImage(new Date()));

    const t1 = window.setTimeout(() => setStage("bg"), 100);
    const t2 = window.setTimeout(() => setStage("logo"), 1100);
    const t3 = window.setTimeout(() => setStage("ready"), 2000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

  const handleTap = () => {
    if (stage !== "ready") return;
    router.push("/games/game1/home");
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
    </div>
  );
}
