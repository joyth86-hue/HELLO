// 「やさしいパステル」方向のボタン共通スタイル。
// 白地×黒縁×黒いオフセット影のステッカー風で、押すと影が沈み込む。

// rounded-full や rounded-2xl などの角丸は呼び出し側で指定する（後勝ちの上書きに頼らないため）。
export const stickerButton =
  "inline-flex items-center justify-center border-2 border-black bg-white font-semibold text-black shadow-[4px_4px_0_0_#171717] transition-all active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0_0_#171717]";

export const stickerButtonDisabled =
  "inline-flex items-center justify-center border-2 border-zinc-300 bg-zinc-100 font-semibold text-zinc-400";
