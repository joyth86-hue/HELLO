const LOGO_TEXT = "あきくんゲームズ";

// 文字ごとに角度と高さを少しずつずらして、手書きの「がたがた」感を出す。
// 乱数ではなく決まった計算式なので、サーバー側とクライアント側で常に同じ見た目になる。
function wobbleTransform(index: number, rotRange = 3, yRange = 2) {
  const rotate = Math.sin(index * 1.7 + rotRange) * rotRange;
  const translateY = Math.cos(index * 2.1 + yRange) * yRange;
  return `rotate(${rotate.toFixed(1)}deg) translateY(${translateY.toFixed(1)}px)`;
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <h1
      className={`text-4xl text-black sm:text-5xl ${className}`}
      style={{ fontFamily: '"Hachi Maru Pop", sans-serif' }}
      aria-label={LOGO_TEXT}
    >
      {LOGO_TEXT.split("").map((char, i) => (
        <span
          key={i}
          className="inline-block"
          style={{ transform: wobbleTransform(i) }}
          aria-hidden="true"
        >
          {char}
        </span>
      ))}
    </h1>
  );
}
