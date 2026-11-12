#!/usr/bin/env node
/* クラブで使う アプリ（js/links.js）の検査：バスケ・グロウを入口にして、タップ記録・保護者会へ行けるか。
   1ファイル版（basket-coach-all-in-one.html）を、手元の小さなサーバーで開いて調べる（本番の Supabase には さわらない。
   クラブの通信 /rest/v1/rpc/… は、この検査の中で にせの返事をする）。
   調べること：
     ・子ども（はじめての人・学年が子ども）のホームには出さない／学年「おとな」・コーチとしてログイン中のホームには出す
     ・「もっと」には、だれにでも出す。「おとなの方へ」に説明
     ・コーチのページ（#club）に「試合と 保護者会」。子どものクラブのページには出さない
     ・行き先：タップ記録は ?from=grow-home・grow-more・grow-club（戻るときの行き先）、保護者会は 部活保護者会アプリ
     ・スマホの幅（390・320px）で横にはみ出さない・ページのエラーなし
   使い方：node basket-coach/tools/links-test.cjs [開くHTML] */
const fs = require('fs');
const path = require('path');
const http = require('http');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require(path.join(__dirname, '..', '..', 'basket-tap', 'tests', 'pw.cjs'))); }

const root = path.join(__dirname, '..');
const file = path.resolve(process.argv[2] || path.join(root, 'basket-coach-all-in-one.html'));
const TAP = 'https://dora9991.github.io/math-dialogue/basket-tap/';
const HOGOSHA = 'https://dora9991.github.io/hogosha-app/';
let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); } };

const ME_KID = { name: 'けんた', grade: 'e56', goals: ['shoot'], place: 'any', n: 1, level: 1, since: 1 };
const ME_ADULT = Object.assign({}, ME_KID, { name: 'たなか', grade: 'a', level: null });
const CLUB = { id: 'c1', code: 'K7X2QP', name: 'さくらミニバス', settings: {} };
const COUNTS = { pending: 0, ready: 0, unrated: 0, logs_today: 0, applies: 0, waiting: 0, kids: 3, quests: 1, events: 2 };
const home = (role) => ({ ok: true, me: role === 'coach' ? { id: 'm0', role: 'coach', nickname: 'たなかコーチ' } : { id: 'm1', role: 'kid', nickname: 'けんた', no: 12, kyu: null },
  club: CLUB, counts: COUNTS, notices: {}, tracks: [], levels: [], subs: [], certs: [], kyus: [], quests: [], events: [] });

function serve() {
  const html = fs.readFileSync(file);
  const srv = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(html); });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r({ url: `http://127.0.0.1:${srv.address().port}/`, close: () => srv.close() })));
}

async function open(browser, srv, vp, store, role) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, hasTouch: true, isMobile: vp.width < 900, locale: 'ja-JP' });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await ctx.route('**/rest/v1/rpc/**', (r) => {
    const fn = r.request().url().split('/rpc/')[1];
    const body = fn === 'bg_home' ? home(role) : fn === 'bg_apply_info' ? { ok: false, error: 'not_found' } : { ok: true };
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await ctx.addInitScript((s) => { for (const k in s) localStorage.setItem(k, JSON.stringify(s[k])); }, store || {});
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|fonts/.test(m.text())) errors.push(m.text()); });
  await page.goto(srv.url + '#home');
  await page.waitForSelector('#main');
  return { ctx, page, errors };
}
const go = async (page, hash, sel) => { await page.evaluate((h) => { location.hash = h; }, hash); if (sel) await page.waitForSelector(sel, { timeout: 8000 }); else await page.waitForTimeout(300); };
const hrefs = (page, sel) => page.$$eval(sel, (els) => els.map((a) => a.getAttribute('href')));
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);

(async () => {
  if (!fs.existsSync(file)) { console.log(file + ' がありません。先に node basket-coach/tools/bundle.cjs'); process.exit(1); }
  const srv = await serve();
  const browser = await chromium.launch();
  try {
    console.log('\n■ 子ども（学年 小5・6）');
    {
      const { ctx, page, errors } = await open(browser, srv, { width: 390, height: 844 }, { 'bc.me': ME_KID });
      await page.waitForSelector('.page-home');
      ok(!(await page.$('.links-sec')), 'ホームに「クラブで使う」は出ない（子どもには まぎらわしいので）');
      await go(page, 'more', '.page-more');
      const h = await hrefs(page, '.page-more .rows a.more-row');
      ok(h.includes(TAP + '?from=grow-more') && h.includes(HOGOSHA), '「もっと」には、だれにでも出す（タップ記録 ?from=grow-more・保護者会）', h);
      ok((await page.textContent('.page-more')).includes('クラブで使う アプリ'), '「もっと」の見出し「クラブで使う アプリ」');
      ok(await overflow(page) <= 0, '「もっと」：スマホの幅で横にはみ出さない', await overflow(page));
      await go(page, 'about', '.prose');
      ok((await page.textContent('.prose')).includes('クラブで使う アプリ'), '「おとなの方へ」に、つながるアプリの説明');
      ok(errors.length === 0, 'ページのエラーなし', errors);
      await ctx.close();
    }

    console.log('\n■ おとな（学年「おとな」・クラブには入っていない）');
    {
      const { ctx, page, errors } = await open(browser, srv, { width: 390, height: 844 }, { 'bc.me': ME_ADULT });
      await page.waitForSelector('.links-sec');
      const h = await hrefs(page, '.links-sec a');
      ok(h.length === 2 && h[0] === TAP + '?from=grow-home' && h[1] === HOGOSHA, 'ホームに「クラブで使う」：試合の記録（?from=grow-home）・保護者会', h);
      const t = await page.textContent('.links-sec');
      ok(t.includes('試合の記録・場面の切り出し') && t.includes('保護者会') && t.includes('↗'), '名前と「べつのページ」の印', t);
      ok(await overflow(page) <= 0, 'ホーム：スマホの幅で横にはみ出さない', await overflow(page));
      await page.screenshot({ path: path.join(root, 'tools', '_out', 'links-home-adult.png'), fullPage: false }).catch(() => {});
      ok(errors.length === 0, 'ページのエラーなし', errors);
      await ctx.close();
    }

    console.log('\n■ コーチ（クラブにログイン中）');
    for (const vp of [{ width: 390, height: 844 }, { width: 320, height: 640 }]) {
      const sess = { token: 't'.repeat(40), me: { id: 'm0', role: 'coach', nickname: 'たなかコーチ' }, club: { id: 'c1', code: CLUB.code, name: CLUB.name } };
      const { ctx, page, errors } = await open(browser, srv, vp, { 'bc.me': ME_KID, 'bc.club': sess, 'bc.club.cache': { me: sess.me, club: sess.club, next: null, q: 0, at: 1 } }, 'coach');
      await page.waitForSelector('.page-home');
      ok(!!(await page.$('.links-sec')), `${vp.width}px：コーチとしてログイン中なら、学年が子どもでもホームに出す`);
      await go(page, 'club', '.cl-links');
      const h = await hrefs(page, '.cl-links a');
      ok(h.length === 2 && h[0] === TAP + '?from=grow-club' && h[1] === HOGOSHA, `${vp.width}px：コーチのページに「試合と 保護者会」（タップ記録 ?from=grow-club）`, h);
      ok(!(await page.$$eval('.cl-links .cl-tdot', (e) => e.length)), `${vp.width}px：数の赤い点は付かない`);
      ok((await page.textContent('#main')).includes('確認・評価・級の認定'), `${vp.width}px：いままでの行は そのまま`);
      ok(await overflow(page) <= 0, `${vp.width}px：コーチのページが横にはみ出さない`, await overflow(page));
      if (vp.width === 390) await page.screenshot({ path: path.join(root, 'tools', '_out', 'links-coach.png'), fullPage: true }).catch(() => {});
      ok(errors.length === 0, `${vp.width}px：ページのエラーなし`, errors);
      await ctx.close();
    }

    console.log('\n■ 子ども（クラブにログイン中）');
    {
      const sess = { token: 'k'.repeat(40), me: { id: 'm1', role: 'kid', nickname: 'けんた', no: 12 }, club: { id: 'c1', code: CLUB.code, name: CLUB.name } };
      const { ctx, page, errors } = await open(browser, srv, { width: 390, height: 844 }, { 'bc.me': ME_KID, 'bc.club': sess, 'bc.club.cache': { me: sess.me, club: sess.club, next: null, q: 0, at: 1 } }, 'kid');
      await page.waitForSelector('.page-home');
      ok(!(await page.$('.links-sec')), 'ホームに出さない');
      await go(page, 'club', '.cl-me');
      ok(!(await page.$('.cl-links')), '子どものクラブのページには出さない');
      ok(errors.length === 0, 'ページのエラーなし', errors);
      await ctx.close();
    }
  } catch (e) { fail++; console.log('  STOPPED', e && e.stack || e); } finally { await browser.close(); srv.close(); }
  console.log(`\n${pass} ok / ${fail} fail`);
  process.exit(fail ? 1 : 0);
})();
