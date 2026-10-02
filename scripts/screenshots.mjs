// Regenerates the README screenshots in docs/screenshots/.
// Usage: npm run build && npm run preview (in another terminal), then npm run screenshots.
import { chromium, devices } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4173';
const SCENES = ['apartment', 'highway', 'arcade', 'train', 'cabin', 'lighthouse'];
const OUT = new URL('../docs/screenshots/', import.meta.url);
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const shoot = async (context, id, file) => {
  const page = await context.newPage();
  await page.goto(`${BASE}/#${id}`);
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: fileURLToPath(new URL(file, OUT)), type: 'jpeg', quality: 86 });
  await page.close();
};

const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
for (const id of SCENES) await shoot(desktop, id, `${id}.jpg`);
const phone = await browser.newContext({ ...devices['Pixel 7'] });
for (const id of ['apartment', 'lighthouse']) await shoot(phone, id, `${id}-phone.jpg`);
await browser.close();
