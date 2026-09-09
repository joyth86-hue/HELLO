"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// 「タップして開始する」画面（/games/game1）とホーム画面（/games/game1/home）
// への直接アクセス（ブックマーク等）を、入口（/）へ差し戻すための仕組み。
//
// アプリ内の通常の画面遷移（開始画面→ホーム、下部ナビでのタブ切り替え等）
// までブロックしてしまうと使い勝手が悪くなるため、「このタブでまだ / を
// 経由していない場合だけ」差し戻す。sessionStorageはタブを閉じるまで保持
// されるため、一度 / を通ればそのタブ内での以降の遷移は素通りになる。
const ENTRY_FLAG_KEY = "hiro-games:entered-via-splash";

export function markEnteredViaSplash() {
  try {
    sessionStorage.setItem(ENTRY_FLAG_KEY, "1");
  } catch {
    // プライベートモード等でsessionStorageが使えなくても致命的ではないので無視する。
  }
}

// trueを返すまでは呼び出し元でコンテンツを表示しないこと（直接アクセスの
// 場合は表示せずに / へ差し戻す）。
export function useRequireSplashEntry(): boolean {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let entered = true;
    try {
      entered = sessionStorage.getItem(ENTRY_FLAG_KEY) === "1";
    } catch {
      entered = true; // 判定できない場合はブロックせず素通りさせる
    }
    if (entered) {
      setReady(true);
    } else {
      router.replace("/");
    }
  }, [router]);

  return ready;
}
