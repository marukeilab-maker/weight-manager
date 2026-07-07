// App Store用マーケティングスクリーンショット合成（1284×2778）
const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");

const SHOT = path.join(__dirname, "shots");
const OUT = path.join(SHOT, "final");
fs.mkdirSync(OUT, { recursive: true });

const slides = [
  {
    img: "home-kotaro.png",
    title: "猫のこたろうと、<br>ゆるくダイエット",
    sub: "記録するたび、こたろうが応援してくれる",
    grad: ["#2dd4bf", "#0f766e"],
  },
  {
    img: "meals.png",
    title: "食事記録は、<br>タップするだけ",
    sub: "880種の食品データベース搭載",
    grad: ["#fb923c", "#ec4899"],
  },
  {
    img: "home-balance.png",
    title: "『本当の消費カロリー』を<br>実測ベースで計算",
    sub: "体重の動きから、あなた専用の数字を自動算出",
    grad: ["#34d399", "#047857"],
  },
  {
    img: "records.png",
    title: "がんばりが、<br>ひと目でわかる",
    sub: "グラフと週次レポートでゆるくふりかえり",
    grad: ["#818cf8", "#9333ea"],
  },
  {
    img: "exercise.png",
    title: "運動もワンタップで記録",
    sub: "登録不要・広告なし・データはすべて端末の中だけ",
    grad: ["#4ade80", "#15803d"],
  },
];

const html = (s) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1284px; height: 2778px; overflow: hidden;
    background: linear-gradient(160deg, ${s.grad[0]} 0%, ${s.grad[1]} 100%);
    font-family: -apple-system, "Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif;
    display: flex; flex-direction: column; align-items: center;
  }
  /* ふわっとした光の玉（お洒落ポイント） */
  .orb { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.10); }
  .orb1 { width: 700px; height: 700px; top: -220px; left: -200px; }
  .orb2 { width: 500px; height: 500px; top: 400px; right: -180px; background: rgba(255,255,255,0.07); }
  .title {
    margin-top: 150px; text-align: center;
    font-size: 104px; font-weight: 800; color: #fff; line-height: 1.3;
    letter-spacing: 0.01em; text-shadow: 0 4px 24px rgba(0,0,0,0.18);
    position: relative; z-index: 2;
  }
  .sub {
    margin-top: 36px; text-align: center;
    font-size: 46px; font-weight: 600; color: rgba(255,255,255,0.94);
    text-shadow: 0 2px 12px rgba(0,0,0,0.15);
    position: relative; z-index: 2;
  }
  .phone {
    margin-top: 84px; width: 1120px; flex-shrink: 0;
    border: 22px solid #111827; border-bottom: none;
    border-radius: 120px 120px 0 0;
    overflow: hidden;
    box-shadow: 0 -30px 90px rgba(0,0,0,0.30), 0 40px 120px rgba(0,0,0,0.35);
    position: relative; z-index: 2;
    background: #111827;
  }
  .phone img { display: block; width: 100%; border-radius: 98px 98px 0 0; }
</style></head>
<body>
  <div class="orb orb1"></div>
  <div class="orb orb2"></div>
  <div class="title">${s.title}</div>
  <div class="sub">${s.sub}</div>
  <div class="phone"><img src="file://${SHOT}/${s.img}"></div>
</body></html>`;

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: "new",
    args: ["--no-first-run", "--disable-extensions", "--hide-scrollbars", "--allow-file-access-from-files"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1284, height: 2778, deviceScaleFactor: 1 });
  for (let i = 0; i < slides.length; i++) {
    const file = path.join(OUT, `slide-${i + 1}.html`);
    fs.writeFileSync(file, html(slides[i]));
    await page.goto(`file://${file}`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: path.join(OUT, `screenshot-${i + 1}.png`) });
    console.log(`composed: screenshot-${i + 1}.png`);
  }
  await browser.close();
})();
