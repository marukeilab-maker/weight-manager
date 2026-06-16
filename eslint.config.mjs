import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Capacitor の iOS ビルド成果物（生成された minify 済みファイル群）
    "ios/**",
  ]),
  {
    rules: {
      // 本アプリは localStorage ベースのクライアントアプリで、データは
      // マウント時・日付変更時・wm_settings_changed イベント時に useEffect 内で
      // state へ読み込む設計（SSR では localStorage が無いため初期化時には読めない）。
      // これらは意図的なパターンで誤検知となるため、このルールは無効化する。
      "react-hooks/set-state-in-effect": "off",
      // 本アプリは Capacitor の静的書き出し（output: export）＋PWA で、next/image の
      // 最適化サーバーを使わず /public の画像をそのまま配信する。<img> が適切なため無効化。
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
