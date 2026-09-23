#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   tools/og-images.mjs — the 1200 x 630 JPEG link-preview images
   ═══════════════════════════════════════════════════════════════════════════

   One per photograph a page uses as its share image (tools/layout.js turns
   `assets/img/<slug>-1320.webp` into `assets/img/og-<slug>.jpg`). Cut from the
   wide derivative around the photograph's focal point in content/assets.js,
   encoded by Chrome's own JPEG encoder — this machine-independent route needs
   no Python or image library, only a Chrome and playwright-core:

     npm i -g playwright-core      (or any local install)
     node .claude/serve.mjs . 8210 &
     node tools/og-images.mjs [path-to-chrome]

   Run it when a share photograph changes. check-truth.js fails if a page
   names an og image that is not in the repository.
   ═══════════════════════════════════════════════════════════════════════════ */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { ASSETS, src, wideSrc, hasWide } from '../content/assets.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const KEYS = ['portalFrame', 'crane', 'laserCutting', 'roofTrusses', 'weldingBay'];
const chrome = process.argv[2] || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await chromium.launch({ executablePath: chrome });
const page = await browser.newPage();
for (const k of KEYS) {
  const slug = src(k, 1320).match(/img\/(.+)-\d+\.webp$/)[1];
  await page.goto(`http://localhost:8210/${hasWide(k) ? wideSrc(k, 1320) : src(k, 1920)}`);
  const data = await page.evaluate(async ([fx, fy]) => {
    const img = document.querySelector('img'); await img.decode();
    const W = 1200, H = 630, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    const x = Math.min(0, Math.max(W - w, W / 2 - fx * w));
    const y = Math.min(0, Math.max(H - h, H / 2 - fy * h));
    c.getContext('2d').drawImage(img, x, y, w, h);
    return c.toDataURL('image/jpeg', 0.84);
  }, ASSETS[k].focal);
  writeFileSync(`${ROOT}assets/img/og-${slug}.jpg`, Buffer.from(data.split(',')[1], 'base64'));
  console.log(`assets/img/og-${slug}.jpg`);
}
await browser.close();
