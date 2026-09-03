// こたろうダイエットのApp Store用スクリーンショット素材キャプチャ
const puppeteer = require("puppeteer-core");
const path = require("path");

const SHOT = path.join(__dirname, "shots");
const BASE = "http://localhost:3001";

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: "new",
    args: ["--no-first-run", "--disable-extensions", "--hide-scrollbars"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });

  // デモデータ投入
  await page.goto(`${BASE}/demo-seed.html`, { waitUntil: "load", timeout: 30000 });
  await page.waitForFunction(() => document.body.textContent.trim() === "seeded", { timeout: 10000 });

  const targets = [
    { name: "home", path: "/", scrollY: 0 },
    { name: "home-kotaro", path: "/", scrollY: 640 },   // 目標カード＋こたろう立ち絵
    { name: "home-balance", path: "/", scrollY: 1220 }, // カロリー収支カードの頭から
    { name: "meals", path: "/meals", scrollY: 0 },
    { name: "records", path: "/records", scrollY: 0 },
    { name: "exercise", path: "/exercise", scrollY: 0 },
  ];

  for (const t of targets) {
    await page.goto(`${BASE}${t.path}`, { waitUntil: "networkidle0", timeout: 30000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2500)); // アニメーション・グラフ描画待ち
    if (t.scrollY) {
      await page.evaluate((y) => window.scrollTo(0, y), t.scrollY);
      await new Promise((r) => setTimeout(r, 800));
    }
    await page.screenshot({ path: path.join(SHOT, `${t.name}.png`) });
    console.log(`captured: ${t.name}`);
  }

  // 最小の<p>を見出しテキストで探して画面上部へスクロール
  const scrollToHeading = (text) =>
    page.evaluate((t) => {
      const el = [...document.querySelectorAll("p")]
        .filter((e) => e.textContent.trim().includes(t))
        .sort((a, b) => a.textContent.length - b.textContent.length)[0];
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 24);
      return !!el;
    }, text);

  // 追加①: カテゴリ一覧（食品DBの豊富さ）
  await page.goto(`${BASE}/meals`, { waitUntil: "networkidle0", timeout: 30000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 2000));
  console.log("  categories heading found:", await scrollToHeading("カテゴリから選ぶ"));
  await new Promise((r) => setTimeout(r, 700));
  await page.screenshot({ path: path.join(SHOT, "meals-categories.png") });
  console.log("captured: meals-categories");

  // 追加②: 検索結果（カフェメニューの充実）— 検索欄に「カフェ」を入力
  await page.goto(`${BASE}/meals`, { waitUntil: "networkidle0", timeout: 30000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 2000));
  const input = await page.$('input[placeholder^="例："]');
  console.log("  search input found:", !!input);
  if (input) {
    await input.click();
    await input.type("カフェ", { delay: 40 });
    await new Promise((r) => setTimeout(r, 900));
    console.log("  search heading found:", await scrollToHeading("食品を検索して追加"));
    await new Promise((r) => setTimeout(r, 600));
  }
  await page.screenshot({ path: path.join(SHOT, "meals-cafe.png") });
  console.log("captured: meals-cafe");

  await browser.close();
})();
