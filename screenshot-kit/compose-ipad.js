// iPad 13インチ用マーケティングスクリーンショット合成（2048×2732）
// デザイン方針「こたろう主役・覚えやすい」（iPhone版と統一）
const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");

const SHOT = path.join(__dirname, "shots");
const OUT = path.join(SHOT, "final-ipad");
fs.mkdirSync(OUT, { recursive: true });

const CATS = path.join(__dirname, "cats-cut");

const slides = [
  {
    img: "ipad-home.png",
    cat: "cat-skinny.png",
    title: '猫のこたろうと、<br>ゆるく<span class="hl">ダイエット</span>',
    sub: "記録すると、こたろうが応援",
    bubble: "いっしょに<br>がんばるにゃ！",
    accent: "#0f9e8e",
    deco: ["🐾", "✨", "💛", "🐾", "⭐"],
  },
  {
    img: "ipad-meals-categories.png",
    cat: "cat-1.png",
    title: '食事の記録は、<br><span class="hl">タップだけ</span>',
    sub: "1100種以上の食品を収録",
    bubble: "タップだけで<br>いいにゃ♪",
    accent: "#f97316",
    deco: ["🍚", "🍜", "🍰", "🍔", "🍣"],
  },
  {
    img: "ipad-records.png",
    cat: "cat-3.png",
    title: 'がんばりが、<br><span class="hl">ひと目</span>でわかる',
    sub: "グラフでゆるくふりかえり",
    bubble: "がんばり、<br>見えるにゃ！",
    accent: "#6366f1",
    deco: ["📈", "📅", "⭐", "📉", "✨"],
  },
];

const decoPos = [
  "font-size:230px; top:80px; right:70px; transform:rotate(16deg);",
  "font-size:170px; top:1400px; left:60px; transform:rotate(-12deg);",
  "font-size:150px; top:900px; left:1000px; transform:rotate(22deg);",
  "font-size:200px; bottom:200px; right:110px; transform:rotate(-18deg);",
  "font-size:140px; bottom:560px; left:120px; transform:rotate(12deg);",
];

const html = (s) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 2048px; height: 2732px; overflow: hidden; position: relative;
    background: linear-gradient(168deg, #FFFDF9 0%, #FFF4EB 52%, #FFE9D8 100%);
    font-family: -apple-system, "Hiragino Maru Gothic ProN", "Hiragino Sans", sans-serif;
  }
  .glow {
    position: absolute; left: 50%; top: 1000px; width: 1700px; height: 1700px;
    transform: translateX(-50%); border-radius: 50%;
    background: radial-gradient(circle, ${s.accent}33 0%, ${s.accent}00 68%); z-index: 0;
  }
  .deco { position: absolute; opacity: 0.09; z-index: 0; }

  .copy { position: absolute; left: 150px; top: 250px; width: 1150px; z-index: 4; }
  .title { font-size: 104px; font-weight: 800; color: #3a2b23; line-height: 1.24; }
  .title .hl {
    color: ${s.accent};
    background: linear-gradient(transparent 68%, ${s.accent}2e 68%); padding: 0 6px;
  }
  .sub { margin-top: 28px; font-size: 52px; font-weight: 700; color: #9a8578; }
  .badge {
    display: inline-block; margin-top: 38px;
    background: #fff; color: ${s.accent}; border: 4px solid ${s.accent}33;
    font-size: 42px; font-weight: 800; padding: 16px 38px; border-radius: 999px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.06);
  }

  .bubble {
    position: absolute; right: 150px; top: 220px; z-index: 7;
    background: #fff; color: #4a3a30; font-weight: 800; font-size: 48px; line-height: 1.3;
    text-align: center; padding: 32px 42px; border-radius: 44px;
    border: 5px solid ${s.accent}; box-shadow: 0 18px 44px rgba(0,0,0,0.12);
  }
  .bubble::after {
    content: ""; position: absolute; bottom: -34px; left: 88px;
    border: 20px solid transparent; border-top-color: ${s.accent}; border-bottom: 0;
  }

  .cat {
    position: absolute; right: 30px; top: 320px; height: 720px; z-index: 6;
    filter: drop-shadow(0 26px 40px rgba(0,0,0,0.18));
  }

  .tablet {
    position: absolute; left: 50%; top: 830px; transform: translateX(-50%);
    width: 1600px; z-index: 2;
    border: 26px solid #1f2937; border-bottom: none;
    border-radius: 110px 110px 0 0; overflow: hidden; background: #1f2937;
    box-shadow: 0 36px 100px rgba(31,41,55,0.28);
  }
  .tablet img { display: block; width: 100%; border-radius: 86px 86px 0 0; }
</style></head>
<body>
  <div class="glow"></div>
  ${s.deco.map((e, i) => `<span class="deco" style="${decoPos[i] || ""}">${e}</span>`).join("")}

  <div class="copy">
    <div class="title">${s.title}</div>
    <div class="sub">${s.sub}</div>
    <div class="badge">🐾 無料・広告なし・登録不要</div>
  </div>

  <div class="bubble">${s.bubble}</div>
  <img class="cat" src="file://${CATS}/${s.cat}">
  <div class="tablet"><img src="file://${SHOT}/${s.img}"></div>
</body></html>`;

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: "new",
    args: ["--no-first-run", "--disable-extensions", "--hide-scrollbars", "--allow-file-access-from-files"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 2048, height: 2732, deviceScaleFactor: 1 });
  for (let i = 0; i < slides.length; i++) {
    const file = path.join(OUT, `slide-${i + 1}.html`);
    fs.writeFileSync(file, html(slides[i]));
    await page.goto(`file://${file}`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: path.join(OUT, `ipad-screenshot-${i + 1}.png`) });
    console.log(`composed: ipad-screenshot-${i + 1}.png`);
  }
  await browser.close();
})();
