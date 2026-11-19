// Renders promo.html into promo.mp4, frame by frame.
// Run from the project folder:  node promo/render.cjs
const { chromium } = require("playwright");
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const FPS = 30;
const dir = path.join(__dirname);
const frames = path.join(require("os").tmpdir(), "promo-frames");

(async () => {
  fs.rmSync(frames, { recursive: true, force: true });
  fs.mkdirSync(frames, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 });
  await page.goto("file://" + path.join(dir, "promo.html"));
  const duration = await page.evaluate(() => window.DURATION);
  const total = Math.round(duration * FPS);
  for (let i = 0; i < total; i++) {
    await page.evaluate((t) => window.render(t), i / FPS);
    await page.screenshot({ path: path.join(frames, `f${String(i).padStart(5, "0")}.png`) });
    if (i % 150 === 0) console.log(`frame ${i}/${total}`);
  }
  await browser.close();
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", path.join(frames, "f%05d.png"),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "slow", "-movflags", "+faststart",
    path.join(dir, "promo.mp4")]);
  fs.rmSync(frames, { recursive: true, force: true });
  console.log("done:", path.join(dir, "promo.mp4"));
})();
