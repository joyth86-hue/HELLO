import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "hiro games",
  description: "hiro games",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

// viewportFit: "cover" で、ノッチ・ステータスバー分の領域までページの背景を
// 描画対象に含める（iPhoneでホーム画面に追加した際などに、時計・電波・充電
// 残量のあるエリアが背景の塗られていない帯になってしまう問題への対応）。
// themeColorは通常のSafariタブ表示時のブラウザUI（アドレスバー等）の色を
// アプリの背景色に合わせるためのもの。
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#14132a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Hachi+Maru+Pop&family=M+PLUS+Rounded+1c:wght@500;700&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
