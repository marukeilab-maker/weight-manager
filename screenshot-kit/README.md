# スクリーンショット作成キット

App Store用のマーケティングスクリーンショットを再生成するためのツール一式。

## 使い方

1. `demo-seed.html` を `public/` にコピー（撮影後は必ず public/ から削除する。ビルドに含めないこと）
2. 本番サーバーを起動: `npm run build && PORT=3001 npx next start`
3. `npm i puppeteer-core` した作業ディレクトリでスクリプトを実行:
   - `node capture.js` → iPhone素材 (1170x2532)
   - `node compose.js` → iPhone完成品 (1284x2778)
   - `node capture-ipad.js` → iPad素材
   - `node compose-ipad.js` → iPad完成品 (2048x2732)
4. 完成品は docs/screenshots/ に保存する

コピー文言・背景色はcompose*.js内のslides配列で編集。
