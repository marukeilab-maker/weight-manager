import type { Metadata, Viewport } from "next";
import { Geist, Bebas_Neue } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import SwipeNavigator from "@/components/SwipeNavigator";
import NativeStorageSync from "@/components/NativeStorageSync";

const geist = Geist({ subsets: ["latin"] });
const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });

export const metadata: Metadata = {
  title: "こたろうダイエット | MARUKEI LAB.",
  description: "猫と一緒に続ける体重管理アプリ — by MARUKEI LAB.",
  authors: [{ name: "MARUKEI LAB." }],
  creator: "MARUKEI LAB.",
  publisher: "MARUKEI LAB.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "こたろうダイエット",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${geist.className} ${bebasNeue.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-gray-50 max-w-md mx-auto min-h-screen">
        {children}
        <NativeStorageSync />
        <SwipeNavigator />
        <BottomNav />
      </body>
    </html>
  );
}
