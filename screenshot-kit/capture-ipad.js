// iPad 13インチ用の素材キャプチャ（1024×1366 @2x = 2048×2732）
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
  await page.setViewport({ width: 1024, height: 1366, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  await page.goto(`${BASE}/demo-seed.html`, { waitUntil: "load", timeout: 30000 });
  await page.waitForFunction(() => document.body.textContent.trim() === "seeded", { timeout: 10000 });

  const targets = [
    { name: "ipad-home", path: "/", scrollY: 0 },
    { name: "ipad-meals", path: "/meals", scrollY: 0 },
    { name: "ipad-records", path: "/records", scrollY: 0 },
  ];
  for (const t of targets) {
    await page.goto(`${BASE}${t.path}`, { waitUntil: "networkidle0", timeout: 30000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2500));
    if (t.scrollY) { await page.evaluate((y) => window.scrollTo(0, y), t.scrollY); await new Promise((r) => setTimeout(r, 800)); }
    await page.screenshot({ path: path.join(SHOT, `${t.name}.png`) });
    console.log(`captured: ${t.name}`);
  }
  await browser.close();
})();
