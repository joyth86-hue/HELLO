"use client";

// 画面ごとのBGMをループ再生する共通コンポーネント。docs/spec/audio.md参照。
// enabled（呼び出し側がGlobalSaveData.bgmEnabledから渡す）に応じて再生/一時停止
// する。設定シートでON/OFFを切り替えた瞬間にその場で反映させたいため、読み込みは
// 内部で一度だけ行い、ON/OFFはpropの変化に応じてplay()/pause()するだけにしている
// （pause()はcurrentTimeを保持するので、OFF→ONで曲の途中から再開できる）。
// 今のところBGMは画面（ページ）に紐づく想定で、この画面を離れる
// （アンマウントされる）と音も止まる。複数画面をまたいで鳴らし続けたくなったら、
// レイアウト側に引き上げるなど別途検討する。

import { useEffect, useRef } from "react";

// ambient BGMとして主張しすぎない音量。1.0だと効果音と同じ音量感になり
// うるさく感じたため、控えめな値にしている（仮値、後で調整可）。
const BGM_VOLUME = 0.5;

export default function BgmPlayer({ src, enabled }: { src: string; enabled: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = BGM_VOLUME;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (enabled) {
      // ブラウザの自動再生ポリシーにより、直前にユーザー操作が無いとplay()が
      // 拒否されることがある。失敗しても無視する（割り切った仕様）。
      audio.play().catch(() => undefined);
    } else {
      audio.pause();
    }
  }, [enabled]);

  return null;
}
