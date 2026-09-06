"use client";

import { useState } from "react";

export default function Home() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-50 p-6 text-center dark:bg-black">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        Hello, World!
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        最初のWebアプリを公開できました。
      </p>

      <button
        onClick={() => setCount((c) => c + 1)}
        className="rounded-full bg-zinc-900 px-8 py-4 text-lg font-semibold text-white transition-colors active:bg-zinc-700 dark:bg-zinc-50 dark:text-black dark:active:bg-zinc-300"
      >
        タップしてね ({count})
      </button>
    </div>
  );
}
