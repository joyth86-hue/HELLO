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
};

// themeColorは通常のSafariタブ表示時のブラウザUI（アドレスバー等）の色を
// アプリの背景色に合わせるためのもの。
//
// 以前ここに viewportFit: "cover" ＋ apple-mobile-web-app のstatusBarStyle
// （black-translucent）を設定し、ノッチ・ステータスバー分の背景の塗り漏れ
// に対応していたが、実機（iPhone）で「画面全体が上にずれ、下部に余白が
// できる」という副作用が発生したため撤去した。ノッチ周りの帯（背景が塗られ
// ていない）は、ユーザー側の判断で今は許容している（詳細はdocs/spec/
// visual-design.mdのセーフエリア節を参照）。
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
