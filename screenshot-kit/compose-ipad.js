// iPad 13インチ用マーケティングスクリーンショット合成（2048×2732）
const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");

const SHOT = path.join(__dirname, "shots");
const OUT = path.join(SHOT, "final-ipad");
fs.mkdirSync(OUT, { recursive: true });

const slides = [
  {
    img: "ipad-home.png",
    title: "猫のこたろうと、ゆるくダイエット",
    sub: "記録するたび、こたろうが応援してくれる",
    grad: ["#2dd4bf", "#0f766e"],
  },
  {
    img: "ipad-meals.png",
    title: "食事記録は、タップするだけ",
    sub: "880種の食品データベース搭載",
    grad: ["#fb923c", "#ec4899"],
  },
  {
    img: "ipad-records.png",
    title: "がんばりが、ひと目でわかる",
    sub: "グラフと週次レポートでゆるくふりかえり",
    grad: ["#818cf8", "#9333ea"],
  },
];

const html = (s) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 2048px; height: 2732px; overflow: hidden;
    background: linear-gradient(160deg, ${s.grad[0]} 0%, ${s.grad[1]} 100%);
    font-family: -apple-system, "Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif;
    display: flex; flex-direction: column; align-items: center;
  }
  .orb { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.10); }
  .orb1 { width: 900px; height: 900px; top: -300px; left: -260px; }
  .orb2 { width: 640px; height: 640px; top: 500px; right: -220px; background: rgba(255,255,255,0.07); }
  .title {
    margin-top: 170px; text-align: center;
    font-size: 110px; font-weight: 800; color: #fff; line-height: 1.3;
    text-shadow: 0 4px 24px rgba(0,0,0,0.18); position: relative; z-index: 2;
  }
  .sub {
    margin-top: 36px; text-align: center;
    font-size: 52px; font-weight: 600; color: rgba(255,255,255,0.94);
    text-shadow: 0 2px 12px rgba(0,0,0,0.15); position: relative; z-index: 2;
  }
  .tablet {
    margin-top: 90px; width: 1560px; flex-shrink: 0;
    border: 26px solid #111827; border-bottom: none;
    border-radius: 90px 90px 0 0; overflow: hidden;
    box-shadow: 0 -30px 90px rgba(0,0,0,0.30), 0 40px 120px rgba(0,0,0,0.35);
    position: relative; z-index: 2; background: #111827;
  }
  .tablet img { display: block; width: 100%; border-radius: 66px 66px 0 0; }
</style></head>
<body>
  <div class="orb orb1"></div>
  <div class="orb orb2"></div>
  <div class="title">${s.title}</div>
  <div class="sub">${s.sub}</div>
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
