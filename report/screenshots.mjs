// Capture report screenshots from the running dev server using the system
// Chrome (headless). Also sanity-checks the scenario panel end-to-end:
// clicks a scenario button, lets it play, and verifies the recorder captured rows.
//
//   npm run dev          (in another terminal)
//   node report/screenshots.mjs
//
// PNGs land in report/figures/.

import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const FIG_DIR = join(dirname(fileURLToPath(import.meta.url)), 'figures');
mkdirSync(FIG_DIR, { recursive: true });

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = 'http://localhost:5173/';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--window-size=1600,900', '--use-angle=metal'],
  defaultViewport: { width: 1600, height: 900 },
});

const page = await browser.newPage();
page.on('pageerror', (err) => console.error('PAGE ERROR:', err.message));
await page.goto(URL, { waitUntil: 'networkidle2' });

// Let the intro camera animation finish.
await new Promise((r) => setTimeout(r, 3800));
await page.screenshot({ path: join(FIG_DIR, 'overview.png') });
console.log('captured overview.png');

// Click a scenario button by its Arabic label and capture mid-flight.
async function runScenario(label, shotDelayMs, filename) {
  const clicked = await page.evaluate((wanted) => {
    const btn = [...document.querySelectorAll('#scenario-list button')]
      .find((b) => b.textContent.includes(wanted));
    if (!btn) return false;
    btn.click();
    return true;
  }, label);
  if (!clicked) throw new Error(`scenario button not found: ${label}`);
  await new Promise((r) => setTimeout(r, shotDelayMs));
  await page.screenshot({ path: join(FIG_DIR, filename) });
  console.log(`captured ${filename}`);
}

await runScenario('Top-spin', 1200, 'scenario_topspin.png');
await runScenario('صندوق — إصابة حافة', 900, 'scenario_box.png');
await runScenario('سقوط حر', 2500, 'scenario_freefall.png');

// End-to-end check: did the recorder actually capture the free-fall run?
await new Promise((r) => setTimeout(r, 8000));
const rec = await page.evaluate(() => ({
  rows: window.sim.recorder.rows.length,
  recording: window.sim.recorder.recording,
  scenarioId: window.sim.recorder.scenarioId,
  ballY: window.sim.ball.r.y,
}));
console.log('recorder check:', JSON.stringify(rec));

await browser.close();
