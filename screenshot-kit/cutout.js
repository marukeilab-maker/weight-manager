// こたろう画像の白背景を透過にする（縁からのフラッドフィルで背景のみ除去。内側の白は残す）
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const SRC = path.join(__dirname, "..", "public", "cats");
const OUT = path.join(__dirname, "cats-cut");
fs.mkdirSync(OUT, { recursive: true });

const FILES = ["cat-win.png", "cat-1.png", "cat-2.png", "cat-4.png", "cat-3.png", "cat-skinny.png"];
const TH = 240; // これ以上明るい（=白背景）を透過対象に

(async () => {
  for (const f of FILES) {
    const img = sharp(path.join(SRC, f)).ensureAlpha();
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
    const { width: W, height: H, channels: C } = info;
    const isWhite = (i) => data[i] > TH && data[i + 1] > TH && data[i + 2] > TH;

    const visited = new Uint8Array(W * H);
    const stack = [];
    // 4辺の白い画素を起点に
    for (let x = 0; x < W; x++) {
      for (const y of [0, H - 1]) stack.push([x, y]);
    }
    for (let y = 0; y < H; y++) {
      for (const x of [0, W - 1]) stack.push([x, y]);
    }
    while (stack.length) {
      const [x, y] = stack.pop();
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const p = y * W + x;
      if (visited[p]) continue;
      const i = p * C;
      if (!isWhite(i)) continue;
      visited[p] = 1;
      data[i + 3] = 0; // 透過
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    await sharp(data, { raw: { width: W, height: H, channels: C } })
      .png()
      .toFile(path.join(OUT, f));
    console.log(`cutout: ${f}`);
  }
})();
