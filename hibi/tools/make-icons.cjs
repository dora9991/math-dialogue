#!/usr/bin/env node
/* icons/icon.svg から PNG のアイコン（192・512・180・maskable）をつくる。playwright（chromium）を使う。
   使い方：NODE_PATH=$(npm root -g) node hibi/tools/make-icons.cjs */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const dir = path.resolve(__dirname, '..', 'icons');
const svg = fs.readFileSync(path.join(dir, 'icon.svg'), 'utf8');
const full = svg.replace(/<rect width="512" height="512" rx="112"/, '<rect width="512" height="512"');   // maskable は角を丸めない（端まで塗る）
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const shot = async (src, size, name) => {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<html><body style="margin:0;background:transparent">${src.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
    await page.screenshot({ path: path.join(dir, name), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
    console.log('つくった：icons/' + name);
  };
  await shot(svg, 192, 'icon-192.png');
  await shot(svg, 512, 'icon-512.png');
  await shot(full, 180, 'apple-touch-icon.png');   // iPhone は自分で角を丸めるので、角なし
  await shot(full, 512, 'icon-maskable-512.png');
  await browser.close();
})();
