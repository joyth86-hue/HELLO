// 「hiro games」の文字が斜めに流れ続けるダーク系の共通背景。
// パステルミント背景を廃止した各画面（ホーム/キャラクター/バッグの中身）で使う。
// 詳細はdocs/spec/visual-design.mdを参照。
//
// 描画順に注意：この要素は各画面のルート要素の「最初の子」として置き、
// 実際のコンテンツは relative z-10 でくるむこと。子に負のz-indexを付けると
// 親自身の背景の裏に回り込むことがある（過去に発生した実際の不具合）。
//
// baseGradient：背景のベースになるグラデーションそのもの（今の濃紺〜紫）を
// 丸ごと差し替えるためのオプション。glowColorは中央上部にうっすら足す光の
// 色（アクセント程度）、textColorは「hiro games」が流れる文字の色。
// いずれもキャラクター画面でキャラごとに背景全体の色を変える用途。
// 文字色はSVGパターンをmask-imageとして使い、その形（アルファ）だけを
// 流用して任意の色で塗り直している（SVG自体のfill色には依存しないので、
// 狙った色をそのまま出せる）。
export default function GameBackground({
  baseGradient = "linear-gradient(165deg, #131228 0%, #1c1a3a 55%, #14132a 100%)",
  glowColor = "#2c2557",
  textColor = "#c9c3ff",
}: {
  baseGradient?: string;
  glowColor?: string;
  textColor?: string;
}) {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 transition-[background] duration-500"
        style={{
          background: `radial-gradient(120% 90% at 50% -10%, ${glowColor} 0%, transparent 60%), ${baseGradient}`,
        }}
      />
      <div
        className="absolute inset-0 animate-bg-drift transition-[background-color] duration-500"
        style={{
          backgroundColor: textColor,
          WebkitMaskImage: "url(/backgrounds/pattern-hiro-games.svg)",
          maskImage: "url(/backgrounds/pattern-hiro-games.svg)",
          WebkitMaskSize: "210px 85px",
          maskSize: "210px 85px",
          WebkitMaskRepeat: "repeat",
          maskRepeat: "repeat",
        }}
      />
      <div className="absolute inset-0 shadow-[inset_0_0_90px_20px_rgba(0,0,0,0.55)]" />
    </div>
  );
}
