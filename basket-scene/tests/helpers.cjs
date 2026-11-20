// テストの共通の道具（Playwright の Chromium）。どの e2e も、これを使う。
//   const T = require('./helpers.cjs');
//   const { browser, srv } = await T.launch(mode);          // mode：'dev'（このフォルダ）| 'built'（docs/ の 1 ファイル版。先に node build.mjs）
//   const { ctx, page, errors } = await T.open(browser, srv.url, { width: 390, height: 844 }, { prefs, shots });
//   const VID = await T.video('g120.mp4', 120);              // テスト用の動画（VP9・左上に時刻が出る・ffmpeg で作る）
//   await T.start(page, VID, { nos: '4-15', name: 'ミライ', opp: 'ヒガシ' });   // ホーム → 動画を選ぶ → 記録をはじめる → 動画がつながるまで
//   await T.seek(page, 12.3);  await T.game(page);  T.ok(cond, name, extra);  T.done();
// テスト用の Chromium は H.264 を再生できないので、動画は VP9 で作る（本物の iPhone の動画は H.264。画面の動きは同じ）。
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('./pw.cjs');
const { start } = require('./server.cjs');

const ROOT = path.join(__dirname, '..');
const WORK = process.env.WORK || path.join(os.tmpdir(), 'basket-scene-e2e');
const SHOTS = process.env.SHOTS || '';
let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); } return !!c; };
const eq = (a, b, name) => ok(JSON.stringify(a) === JSON.stringify(b), name, { got: a, want: b });
const section = (t) => console.log('\n■ ' + t);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const done = () => { console.log(`\n${pass} ok / ${fail} fail`); process.exit(fail ? 1 : 0); };
const failed = (e) => { fail++; console.log('  STOPPED', (e && e.stack) || e); };

async function video(name, sec, size) {
  const file = path.join(WORK, name);
  if (!fs.existsSync(file)) {
    fs.mkdirSync(WORK, { recursive: true });
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `testsrc2=size=${size || '640x360'}:rate=30`, '-t', String(sec), '-c:v', 'libvpx-vp9', '-b:v', '300k', '-deadline', 'realtime', '-cpu-used', '8', '-g', '30', '-pix_fmt', 'yuv420p', file]);
  }
  return file;
}
async function launch(mode) {
  const root = mode === 'built' ? path.join(ROOT, 'docs') : ROOT;
  if (mode === 'built' && !fs.existsSync(path.join(root, 'index.html'))) { console.log('docs/index.html がありません。先に node build.mjs'); process.exit(1); }
  const srv = await start(0, root);
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'], env: Object.assign({}, process.env, { LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' }) });
  return { browser, srv, close: async () => { await browser.close(); await srv.close(); } };
}
/* opts：{ prefs（はじめの設定。bscene:prefs に入れる）, scheme：'dark' | 'light', store：{ キー: 値 }（localStorage に入れておくもの） } */
async function open(browser, url, vp, opts) {
  const o = opts || {};
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: SHOTS ? 2 : 1, hasTouch: true, isMobile: vp.width < 900, acceptDownloads: true, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', colorScheme: o.scheme || 'light' });
  await ctx.addInitScript(() => { try { Object.defineProperty(navigator, 'canShare', { value: () => false, configurable: true }); } catch (e) { /* 無視 */ } });
  if (o.prefs) await ctx.addInitScript((p) => { if (!localStorage.getItem('bscene:prefs')) localStorage.setItem('bscene:prefs', JSON.stringify(p)); }, o.prefs);
  if (o.store) await ctx.addInitScript((s) => { for (const k in s) if (!localStorage.getItem(k)) localStorage.setItem(k, typeof s[k] === 'string' ? s[k] : JSON.stringify(s[k])); }, o.store);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url);
  await page.waitForFunction(() => window.SC && SC.app && document.querySelector('#scPick'));
  return { ctx, page, errors };
}
async function pick(page, sel, file) {
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click(sel)]);
  await fc.setFiles(file);
}
const ready = (page) => page.waitForFunction(() => SC.app.hasVideo(), null, { timeout: 20000 });
/* ホームから：動画を選ぶ → 名前・背番号 → 記録をはじめる → 動画がつながるまで */
async function start2(page, file, t) {
  const o = t || {};
  await pick(page, '#scPick', file);
  await page.waitForSelector('#scStart');
  if (o.name != null) await page.fill('#scTeamName', o.name);
  await page.fill('#scTeamNos', o.nos != null ? o.nos : '4-15');
  if (o.opp != null) await page.fill('#scOppName', o.opp);
  await page.click('#scStart');
  await ready(page);
  await sleep(250);
}
async function seek(page, t) { await page.evaluate((x) => SC.app.seek(x), t); await sleep(200); }
const game = (page) => page.evaluate(() => JSON.parse(JSON.stringify(SC.app.S.game)));
const plays = (g) => g.events.filter((e) => e.type !== 'period');
const shot = async (page, name, full) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: !!full, animations: 'disabled' }); } };
/* 横にはみ出していないか・その要素が画面の中にあるか */
const fits = (page, sel) => page.evaluate((s) => {
  const out = { hscroll: document.documentElement.scrollWidth > innerWidth + 1 };
  if (s) { const e = document.querySelector(s); if (!e) out.missing = true; else { const r = e.getBoundingClientRect(); out.inside = r.left >= -0.5 && r.right <= innerWidth + 0.5 && r.top >= -0.5 && r.bottom <= innerHeight + 0.5; out.box = [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; } }
  return out;
}, sel || null);

module.exports = { ROOT, WORK, SHOTS, ok, eq, section, sleep, done, failed, video, launch, open, pick, ready, start: start2, seek, game, plays, shot, fits };
