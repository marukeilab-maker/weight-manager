import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  turbopack: {},
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // 他サイトのiframeに埋め込まれるのを防止（クリックジャッキング対策）
          { key: "X-Frame-Options", value: "DENY" },
          // MIMEタイプの推測を無効化
          { key: "X-Content-Type-Options", value: "nosniff" },
          // リファラーは同一オリジンのみ送信
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // カメラ・マイク・位置情報は使わないので無効化
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
