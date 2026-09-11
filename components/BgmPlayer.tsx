"use client";

// 画面ごとのBGMをループ再生する共通コンポーネント。docs/spec/audio.md参照。
// enabled（呼び出し側がGlobalSaveData.bgmEnabledから渡す）に応じて再生/一時停止
// する。設定シートでON/OFFを切り替えた瞬間にその場で反映させたいため、読み込みは
// 内部で一度だけ行い、ON/OFFはpropの変化に応じてplay()/pause()するだけにしている
// （pause()はcurrentTimeを保持するので、OFF→ONで曲の途中から再開できる）。
// 今のところBGMは画面（ページ）に紐づく想定で、この画面を離れる
// （アンマウントされる）と音も止まる。複数画面をまたいで鳴らし続けたくなったら、
// レイアウト側に引き上げるなど別途検討する。

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// ambient BGMとして主張しすぎない音量。1.0だと効果音と同じ音量感になり
// うるさく感じたため、控えめな値にしている（仮値、後で調整可）。
const BGM_VOLUME = 0.5;

export interface BgmPlayerHandle {
  // ブラウザの自動再生ポリシーでplay()が拒否されていた場合のリトライ用。
  // 本物のユーザー操作イベントハンドラ（onClick等）の中から同期的に呼ぶことで、
  // 「直前にユーザー操作が無い」判定を回避できる（ゲーム開始画面のように、
  // マウント時点ではまだ一度もタップされていない画面で使う）。
  resume: () => void;
}

const BgmPlayer = forwardRef<BgmPlayerHandle, { src: string; enabled: boolean }>(
  function BgmPlayer({ src, enabled }, ref) {
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
        // 拒否されることがある。失敗しても無視する（resume()でのリトライに任せる）。
        audio.play().catch(() => undefined);
      } else {
        audio.pause();
      }
      // srcもdepsに含める：srcが変わると上のuseEffectで新しいAudioに差し替わるが、
      // このuseEffect自体はenabledの変化にしか反応しないため、srcを外すと
      // 曲の切り替え（戦闘中のボス戦BGM等）が無音のまま再生されない不具合になる。
    }, [enabled, src]);

    useImperativeHandle(ref, () => ({
      resume: () => {
        if (!enabled) return;
        audioRef.current?.play().catch(() => undefined);
      },
    }));

    return null;
  }
);

export default BgmPlayer;
