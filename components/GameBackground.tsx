// 「hiro games」の文字が斜めに流れ続けるダーク系の共通背景。
// パステルミント背景を廃止した各画面（ホーム/キャラクター/バッグの中身）で使う。
// 詳細はdocs/spec/visual-design.mdを参照。
//
// 描画順に注意：この要素は各画面のルート要素の「最初の子」として置き、
// 実際のコンテンツは relative z-10 でくるむこと。子に負のz-indexを付けると
// 親自身の背景の裏に回り込むことがある（過去に発生した実際の不具合）。
//
// accentColor：中央上部のラジアルグラデーションの色だけを差し替えるための
// オプション（例：キャラクター画面でキャラごとに色味を変える用途）。
// 省略時は既存のダークパープル。流れる文字パターン自体は常に共通のまま。
export default function GameBackground({ accentColor = "#2c2557" }: { accentColor?: string }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 transition-[background] duration-500"
        style={{
          background: `radial-gradient(120% 90% at 50% -10%, ${accentColor} 0%, transparent 60%), linear-gradient(165deg, #131228 0%, #1c1a3a 55%, #14132a 100%)`,
        }}
      />
      <div
        className="absolute inset-0 animate-bg-drift bg-repeat"
        style={{
          backgroundImage: "url(/backgrounds/pattern-hiro-games.svg)",
          backgroundSize: "210px 85px",
        }}
      />
      <div className="absolute inset-0 shadow-[inset_0_0_90px_20px_rgba(0,0,0,0.55)]" />
    </div>
  );
}
