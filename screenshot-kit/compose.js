// App Store用マーケティングスクリーンショット合成（1284×2778）
// デザイン方針「こたろう主役・覚えやすい」：
//   温かいクリーム背景／テーマ絵文字／こたろうが端末フレームから飛び出す／吹き出しでキャラ付け／USPに注釈
const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");

const SHOT = path.join(__dirname, "shots");
const OUT = path.join(SHOT, "final");
fs.mkdirSync(OUT, { recursive: true });

const CATS = path.join(__dirname, "cats-cut"); // 白背景を透過処理した版（cutout.jsで生成）

const slides = [
  {
    img: "home-kotaro.png",
    cat: "cat-skinny.png", // 目が合う＝引きが強い（ヒーロー）
    title: '猫のこたろうと、<br>ゆるく<span class="hl">ダイエット</span>',
    sub: "記録すると、こたろうが応援",
    bubble: "いっしょに<br>がんばるにゃ！",
    accent: "#0f9e8e",
    deco: ["🐾", "✨", "💛", "🐾", "⭐"],
  },
  {
    img: "meals-categories.png", // 食品DBの豊富さ（カテゴリ一覧）
    cat: "cat-1.png",
    title: '食事の記録は、<br><span class="hl">タップだけ</span>',
    sub: "1100種以上の食品を収録",
    bubble: "タップだけで<br>いいにゃ♪",
    accent: "#f97316",
    deco: ["🍚", "🍜", "🍰", "🍔", "🍣"],
  },
  {
    img: "home-balance.png",
    cat: "cat-4.png",
    title: '本当の<br><span class="hl">消費カロリー</span>を<br>実測ベースで',
    sub: "体重の動きから自動で算出",
    bubble: "キミ専用の<br>数字にゃ✨",
    accent: "#059669",
    deco: ["🔥", "⚖️", "📊", "✨", "🔥"],
    annot: "あなただけの<br>ホントの数字！",
  },
  {
    img: "records.png",
    cat: "cat-3.png",
    title: 'がんばりが、<br><span class="hl">ひと目</span>でわかる',
    sub: "グラフでゆるくふりかえり",
    bubble: "がんばり、<br>見えるにゃ！",
    accent: "#6366f1",
    deco: ["📈", "📅", "⭐", "📉", "✨"],
  },
  {
    img: "exercise.png",
    cat: "cat-win.png", // スリム＝アフター（元気）
    title: '運動の記録も、<br><span class="hl">ワンタップ</span>',
    sub: "登録不要・広告なし・端末内に保存",
    bubble: "むりせず<br>続けるにゃ〜",
    accent: "#16a34a",
    deco: ["🏃", "🚴", "💪", "🏋️", "✨"],
  },
  {
    img: "meals-cafe.png", // カフェメニューの充実（検索結果）
    cat: "cat-2.png",
    title: 'スタバもコメダも<br><span class="hl">すぐ記録</span>',
    sub: "カフェメニューもたっぷり収録",
    bubble: "ごほうびも<br>記録するにゃ☕",
    accent: "#db2777",
    deco: ["☕", "🍰", "🥐", "🧋", "🍩"],
  },
];

// 背景のテーマ絵文字の配置（うっすら散らす）
const decoPos = [
  "font-size:150px; top:56px; right:44px; transform:rotate(16deg);",
  "font-size:104px; top:900px; left:30px; transform:rotate(-12deg);",
  "font-size:92px; top:560px; left:610px; transform:rotate(22deg);",
  "font-size:130px; bottom:120px; right:70px; transform:rotate(-18deg);",
  "font-size:88px; bottom:360px; left:70px; transform:rotate(12deg);",
];

const html = (s) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1284px; height: 2778px; overflow: hidden; position: relative;
    background: linear-gradient(168deg, #FFFDF9 0%, #FFF4EB 52%, #FFE9D8 100%);
    font-family: -apple-system, "Hiragino Maru Gothic ProN", "Hiragino Sans", sans-serif;
  }
  .glow {
    position: absolute; left: 50%; top: 800px; width: 1180px; height: 1180px;
    transform: translateX(-50%); border-radius: 50%;
    background: radial-gradient(circle, ${s.accent}33 0%, ${s.accent}00 68%);
    z-index: 0;
  }
  .deco { position: absolute; opacity: 0.09; z-index: 0; filter: grayscale(0.1); }

  .copy { position: absolute; left: 92px; top: 178px; width: 680px; z-index: 4; }
  .title {
    font-size: 76px; font-weight: 800; color: #3a2b23; line-height: 1.24; letter-spacing: 0.005em;
  }
  .title .hl {
    color: ${s.accent};
    background: linear-gradient(transparent 68%, ${s.accent}2e 68%);
    padding: 0 4px;
  }
  .sub { margin-top: 20px; font-size: 38px; font-weight: 700; color: #9a8578; line-height: 1.45; }
  .badge {
    display: inline-block; margin-top: 26px;
    background: #ffffff; color: ${s.accent}; border: 3px solid ${s.accent}33;
    font-size: 30px; font-weight: 800; padding: 12px 28px; border-radius: 999px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  }

  .bubble {
    position: absolute; right: 96px; top: 150px; z-index: 7;
    background: #fff; color: #4a3a30; font-weight: 800; font-size: 34px; line-height: 1.32;
    text-align: center; padding: 24px 30px; border-radius: 32px;
    border: 4px solid ${s.accent}; box-shadow: 0 14px 34px rgba(0,0,0,0.12);
  }
  .bubble::after {
    content: ""; position: absolute; bottom: -26px; left: 64px;
    border: 15px solid transparent; border-top-color: ${s.accent}; border-bottom: 0;
  }

  .cat {
    position: absolute; right: 8px; top: 190px; height: 620px; z-index: 6;
    filter: drop-shadow(0 20px 30px rgba(0,0,0,0.18));
  }

  .phone {
    position: absolute; left: 50%; top: 650px; transform: translateX(-50%);
    width: 990px; z-index: 2;
    border: 20px solid #1f2937; border-bottom: none;
    border-radius: 100px 100px 0 0; overflow: hidden; background: #1f2937;
    box-shadow: 0 30px 90px rgba(31,41,55,0.28);
  }
  .phone img { display: block; width: 100%; border-radius: 78px 78px 0 0; }

  /* USP注釈（マーケ用の付箋＋矢印） */
  .annot {
    position: absolute; left: 96px; top: 955px; z-index: 8;
    background: ${s.accent}; color: #fff; font-weight: 800; font-size: 36px; line-height: 1.3;
    text-align: center; padding: 22px 30px; border-radius: 28px;
    box-shadow: 0 16px 40px ${s.accent}55; transform: rotate(-3deg);
  }
  .annot::after {
    content: ""; position: absolute; right: -22px; top: 54px;
    border: 16px solid transparent; border-left-color: ${s.accent}; border-right: 0;
  }
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
  <div class="phone"><img src="file://${SHOT}/${s.img}"></div>
  ${s.annot ? `<div class="annot">${s.annot}</div>` : ""}
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
