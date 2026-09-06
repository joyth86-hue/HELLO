"use client";

import { useRouter } from "next/navigation";

export default function StartPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-16 bg-black p-6 text-center">
      <h1 className="text-4xl font-bold tracking-wide text-white sm:text-5xl">
        Kanata Games
      </h1>

      <button
        onClick={() => router.push("/menu")}
        className="rounded-full bg-white px-12 py-4 text-lg font-semibold text-black transition-colors active:bg-zinc-300"
      >
        Start
      </button>
    </div>
  );
}
