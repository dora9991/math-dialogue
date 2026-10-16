// スマホで「勝手に拡大」「ページがスライド」が起きないかを確かめる（Chromiumのスマホ相当で実測）
//   node test/phone-lock.js                          … dist/site/index.html（公開用）を調べる
//   FILE=dist/standalone.html node test/phone-lock.js … 別のファイルを調べる
// ※ iPhoneのSafariそのものは、ここでは動かせません。ここで確かめるのは
//    ・拡大を禁止する指定（viewport）が効いていること ・2本指／ダブルタップ／ドラッグ／はみ出しでページが動かないこと
//    ・それでも、十字キー・A/Bボタン・ルームコード入力・ボタンの連打が今までどおり使えること
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const FILE = process.env.FILE || 'dist/site/index.html';
const URL = 'file://' + path.join(ROOT, FILE);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let fails = 0;
const check = (ok, label, detail) => { if (!ok) fails++; console.log((ok ? '  ok   ' : '  FAIL ') + label + (detail ? '   ' + detail : '')); };

// 画面の大きさ。高さは、ブラウザの上下のバーを引いたあとの「見えている部分」
const VIEWPORTS = [
  ['iPhone縦', 390, 664], ['iPhone横', 844, 340], ['SE縦', 375, 553], ['SE横', 667, 315],
  ['Android縦', 360, 560], ['Android横', 640, 296], ['大型縦', 430, 760], ['大型横', 932, 350],
  ['タブレット縦', 768, 1024], ['タブレット横', 1024, 768],
];
const SCENES = {
  title: "G.go('title')",
  select: "G.go('select', { mode: 'vs' })",
  fight: "G.go('fight', { chars: [0, 2], lvl: 1, mode: 'vs', versus: false })",
  join: "G.go('online'); const S = window.__mecha.SceneOnline; S.state = 'joinInput'; S.showLobby(true, false)",
  host: "G.go('online'); const S = window.__mecha.SceneOnline; S.state = 'hosting'; S.code = 'ABCD'; S.showLobby(false, true)",
};

async function open(browser, w, h, touch) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(URL);
  await sleep(400);
  return { ctx, page, errs };
}
const goScene = async (page, name) => { await page.evaluate("(() => { const G = window.__mecha.Game; " + SCENES[name] + " })()"); await sleep(name === 'fight' ? 500 : 250); };
const vv = (page) => page.evaluate(() => ({ scale: +visualViewport.scale.toFixed(2), x: Math.round(scrollX), y: Math.round(scrollY), pageLeft: Math.round(visualViewport.pageLeft), pageTop: Math.round(visualViewport.pageTop) }));
const rectOf = (page, id) => page.evaluate((i) => { const e = document.getElementById(i); if (!e || e.hidden) return null; const r = e.getBoundingClientRect(); return r.width ? { x: r.left, y: r.top, w: r.width, h: r.height } : null; }, id);

// 本物の指の動きを送る（Chromiumに「タッチ」として届く）
const touch = (cdp, type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
async function spread(cdp, x, y, w) {                // 指2本で、まん中から外へ広げる（ピンチ拡大）
  const cl = (v) => Math.max(1, Math.min(w - 1, Math.round(v)));
  await touch(cdp, 'touchStart', [{ x: cl(x - 25), y, id: 1 }, { x: cl(x + 25), y, id: 2 }]);
  for (let i = 1; i <= 12; i++) { await touch(cdp, 'touchMove', [{ x: cl(x - 25 - i * 6), y, id: 1 }, { x: cl(x + 25 + i * 6), y, id: 2 }]); await sleep(16); }
  await touch(cdp, 'touchEnd', []);
  await sleep(450);
}
async function drag(cdp, x, y, dx, dy) {             // 指1本で、すーっとドラッグ
  await touch(cdp, 'touchStart', [{ x, y, id: 1 }]);
  for (let i = 1; i <= 15; i++) { await touch(cdp, 'touchMove', [{ x: Math.round(x + dx * i / 15), y: Math.round(y + dy * i / 15), id: 1 }]); await sleep(16); }
  await touch(cdp, 'touchEnd', []);
  await sleep(450);
}

(async () => {
  const browser = await chromium.launch({});

  /* ---- 1. 表示：どの大きさ・どの画面でも、はみ出さず、切れない ---- */
  console.log('\n[1] 画面の収まり（はみ出し・切れ）');
  for (const [name, w, h] of VIEWPORTS) {
    const { ctx, page, errs } = await open(browser, w, h, true);
    for (const sc of Object.keys(SCENES)) {
      await goScene(page, sc);
      const L = await page.evaluate(() => {
        const d = document.documentElement, a = document.getElementById('app').getBoundingClientRect();
        const vis = (id) => { const e = document.getElementById(id); if (!e || e.hidden || getComputedStyle(e).display === 'none') return null; return e.getBoundingClientRect(); };
        const clip = ['screen', 'hint', 'lobby', 'touch'].map((id) => [id, vis(id)]).filter((x) => x[1])
          .filter(([, r]) => r.bottom > innerHeight + 0.5 || r.right > innerWidth + 0.5 || r.left < -0.5 || r.top < -0.5).map(([id]) => id);
        const c = vis('screen');
        return { ih: innerHeight, docH: d.scrollHeight, docW: d.scrollWidth, iw: innerWidth, appBottom: Math.round(a.bottom), clip, canvas: Math.round(c.width) + 'x' + Math.round(c.height) };
      });
      const ok = L.clip.length === 0 && L.docH <= L.ih + 0.5 && L.docW <= L.iw + 0.5 && L.appBottom <= L.ih + 0.5;
      check(ok, name + ' ' + w + 'x' + h + ' / ' + sc, ok ? 'canvas ' + L.canvas : JSON.stringify(L));
    }
    check(errs.length === 0, name + ' エラーなし', errs.join('|'));
    await ctx.close();
  }

  /* ---- 2. 拡大：viewport の指定と、2本指で広げる操作 ---- */
  console.log('\n[2] 拡大の禁止');
  {
    const { ctx, page } = await open(browser, 390, 664, true);
    const meta = await page.evaluate(() => (document.querySelector('meta[name=viewport]') || {}).content || '');
    check(/user-scalable=no/.test(meta) && /maximum-scale=1(\D|$)/.test(meta), 'viewport に maximum-scale=1 と user-scalable=no', meta);
    const fs = await page.evaluate(() => parseFloat(getComputedStyle(document.getElementById('roomCode')).fontSize));
    check(fs >= 16, 'ルームコード欄の文字は16px以上（iPhoneは小さいと入力時に勝手に拡大）', fs + 'px');
    await ctx.close();
  }
  for (const [name, w, h] of [VIEWPORTS[0], VIEWPORTS[1], VIEWPORTS[2], VIEWPORTS[5], VIEWPORTS[9]]) {
    for (const spot of ['corner', 'screen', 'dpad', 'btnA', 'hint', 'bottom']) {
      const { ctx, page } = await open(browser, w, h, true);
      await goScene(page, 'fight');
      const at = await page.evaluate((s) => {
        const mid = (id) => { const e = document.getElementById(id); if (!e || e.hidden || getComputedStyle(e).display === 'none') return null; const r = e.getBoundingClientRect(); return r.width ? [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)] : null; };
        if (s === 'corner') return [40, 8];
        if (s === 'bottom') return [Math.round(innerWidth / 2), innerHeight - 6];
        return mid(s);
      }, spot);
      if (!at) { await ctx.close(); continue; }
      const cdp = await ctx.newCDPSession(page);
      await spread(cdp, at[0], at[1], w);
      const v = await vv(page);
      check(v.scale === 1, name + ' 2本指で広げても拡大しない（' + spot + '）', 'scale=' + v.scale);
      await ctx.close();
    }
  }

  /* ---- 3. スライド：ドラッグしてもページが動かない（わざと中身をはみ出させても） ---- */
  console.log('\n[3] ページのスライド');
  for (const [name, w, h] of [VIEWPORTS[0], VIEWPORTS[1], VIEWPORTS[9]]) {
    for (const [fx, fy, label] of [[6 / w, 0.5, '左はし'], [0.5, (h - 5) / h, '下はし'], [0.5, 0.35, '画面のまんなか']]) {
      const { ctx, page } = await open(browser, w, h, true);
      await goScene(page, 'fight');
      await page.evaluate(() => { const t = document.createElement('div'); t.style.cssText = 'height:1500px;width:10px'; document.getElementById('app').appendChild(t); });  // わざと中身をはみ出させる
      const cdp = await ctx.newCDPSession(page);
      const x = Math.round(w * fx), y = Math.round(h * fy);
      await drag(cdp, x, y, 0, -Math.min(200, y - 4));           // 上へ
      await drag(cdp, x, Math.min(h - 4, y), 0, 120);            // 下へ
      await drag(cdp, Math.min(w - 4, x + 60), y, -Math.min(150, x + 56), 0);   // 横へ
      const v = await vv(page);
      check(v.x === 0 && v.y === 0 && v.pageLeft === 0 && v.pageTop === 0 && v.scale === 1, name + ' ドラッグしてもページが動かない（' + label + '）', JSON.stringify(v));
      await ctx.close();
    }
  }

  /* ---- 3b. ノッチ付きiPhone（上47px・下34pxの安全領域）：ページが画面より長くならない ---- */
  console.log('\n[3b] ノッチ・ホームバーの余白（安全領域）');
  for (const sc of ['title', 'fight', 'join']) {
    const { ctx, page } = await open(browser, 390, 664, true);
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 47, bottom: 34, left: 0, right: 0 } });
    await sleep(100);
    await goScene(page, sc);
    await page.evaluate(() => window.__mecha.fit());
    const before = await page.evaluate(() => { const d = document.documentElement, b = document.body.getBoundingClientRect(), a = document.getElementById('app').getBoundingClientRect(), t = document.getElementById('touch').getBoundingClientRect();
      return { ih: innerHeight, docH: d.scrollHeight, appTop: Math.round(a.top), appBottom: Math.round(a.bottom), touchBottom: Math.round(t.bottom), inset: getComputedStyle(document.body).top }; });
    await drag(cdp, 6, 400, 0, -200);
    const v = await vv(page);
    const ok = before.inset === '47px' && before.docH <= before.ih + 0.5 && before.appTop >= 47 && before.appBottom <= before.ih - 34 + 0.5 && before.touchBottom <= before.ih - 34 + 0.5 && v.y === 0 && v.pageTop === 0;
    check(ok, 'iPhone縦（ノッチあり） / ' + sc + '：余白の内側に収まり、ページが動かない', JSON.stringify(before) + ' → ' + JSON.stringify(v));
    await ctx.close();
  }

  /* ---- 4. ブラウザの拡大・スクロールを止める仕掛け（イベントを直接送って確かめる） ---- */
  console.log('\n[4] 仕掛け（ジェスチャー・ダブルタップ・touchmove）');
  {
    const { ctx, page } = await open(browser, 390, 664, true);
    await goScene(page, 'join');
    await sleep(600);
    const R = await page.evaluate(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const send = (type, target) => { const e = type.startsWith('touch') ? new TouchEvent(type, { cancelable: true, bubbles: true }) : new Event(type, { cancelable: true, bubbles: true }); target.dispatchEvent(e); return e.defaultPrevented; };
      const out = {};
      out.gesture = ['gesturestart', 'gesturechange', 'gestureend'].map((t) => send(t, document.body)).every(Boolean);
      out.moveBody = send('touchmove', document.body);
      out.moveCanvas = send('touchmove', document.getElementById('screen'));
      out.moveInput = send('touchmove', document.getElementById('roomCode'));        // 文字入力欄だけは、指でカーソルを動かせるように止めない
      await wait(500);
      out.tap1 = send('touchend', document.getElementById('screen'));
      out.tap2 = send('touchend', document.getElementById('screen'));                  // 続けて2回目＝ダブルタップ
      await wait(500);
      out.btn1 = send('touchend', document.getElementById('roomGo'));
      out.btn2 = send('touchend', document.getElementById('roomGo'));                  // ボタンは、連続タップでもクリックを消さない
      return out;
    });
    check(R.gesture, 'iOS のピンチ（gesture*）を止める');
    check(R.moveBody && R.moveCanvas, 'ページ上のドラッグ（touchmove）を止める', JSON.stringify({ body: R.moveBody, canvas: R.moveCanvas }));
    check(!R.moveInput, '文字入力欄のドラッグは止めない');
    check(!R.tap1 && R.tap2, 'ダブルタップの2回目だけ止める（拡大させない）', JSON.stringify({ tap1: R.tap1, tap2: R.tap2 }));
    check(!R.btn1 && !R.btn2, 'ボタンのタップはクリックを消さない', JSON.stringify({ btn1: R.btn1, btn2: R.btn2 }));
    await ctx.close();
  }

  /* ---- 5. 操作：十字キー・A/B・同時押し・ルームコード入力・ボタン連打が使える ---- */
  console.log('\n[5] 操作できること');
  for (const [name, w, h] of [VIEWPORTS[0], VIEWPORTS[1]]) {
    const { ctx, page, errs } = await open(browser, w, h, true);
    await goScene(page, 'fight');
    const cdp = await ctx.newCDPSession(page);
    const T = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
    const bits = () => page.evaluate(() => window.__mecha.Input.touch);
    const d = await rectOf(page, 'dpad'), a = await rectOf(page, 'btnA'), b = await rectOf(page, 'btnB');
    const cy = d.y + d.h / 2;
    await T('touchStart', [{ x: d.x + d.w * 0.9, y: cy, id: 1 }]); await sleep(80);
    const r1 = await bits();
    await T('touchMove', [{ x: d.x + d.w * 0.1, y: cy, id: 1 }]); await sleep(80);
    const r2 = await bits();
    await T('touchEnd', []); await sleep(80);
    const r3 = await bits();
    check((r1 & 8) && !(r1 & 4) && (r2 & 4) && !(r2 & 8) && r3 === 0, name + ' 十字キー：右→ドラッグで左→離す', 'bits=' + [r1, r2, r3]);
    await T('touchStart', [{ x: d.x + d.w * 0.9, y: cy, id: 1 }, { x: a.x + a.w / 2, y: a.y + a.h / 2, id: 2 }]); await sleep(80);
    const r4 = await bits();
    await T('touchEnd', []); await sleep(80);
    check((r4 & 8) && (r4 & 16), name + ' 十字キー右 + Aボタンの同時押し', 'bits=' + r4);
    for (let i = 0; i < 4; i++) {            // Aボタンの連打（ダブルタップ扱いにならないこと）
      await T('touchStart', [{ x: a.x + a.w / 2, y: a.y + a.h / 2, id: 1 }]); await sleep(35);
      await T('touchEnd', []); await sleep(35);
    }
    await T('touchStart', [{ x: b.x + b.w / 2, y: b.y + b.h / 2, id: 1 }]); await sleep(60);
    const r5 = await bits();
    await T('touchEnd', []); await sleep(60);
    check((r5 & 32) !== 0, name + ' Aボタン連打のあとも、Bボタンが効く', 'bits=' + r5);
    const v = await vv(page);
    check(v.scale === 1 && v.x === 0 && v.y === 0, name + ' 操作のあとも、拡大・スクロールなし', JSON.stringify(v));
    check(errs.length === 0, name + ' エラーなし', errs.join('|'));
    await ctx.close();
  }
  {
    const { ctx, page, errs } = await open(browser, 390, 664, true);
    await goScene(page, 'join');
    await page.evaluate(() => { window.__mecha.Net.join = (c) => { window.__joined = c; }; });   // 本物の通信はしない
    const rc = await rectOf(page, 'roomCode');
    await page.touchscreen.tap(rc.x + rc.w / 2, rc.y + rc.h / 2); await sleep(150);
    await page.keyboard.type('ab23', { delay: 30 }); await sleep(100);
    const val = await page.evaluate(() => document.getElementById('roomCode').value);
    check(val === 'AB23', 'ルームコード欄をタップして入力できる（小文字→大文字）', 'value=' + val);
    const go = await rectOf(page, 'roomGo');
    await page.touchscreen.tap(go.x + go.w / 2, go.y + go.h / 2); await sleep(200);
    const joined = await page.evaluate(() => window.__joined);
    check(joined === 'AB23', '「つなぐ」をタップするとコードで接続しにいく', 'joined=' + joined);
    await goScene(page, 'title');
    const sb = await rectOf(page, 'btnSound');
    const before = await page.evaluate(() => window.__mecha.Game && document.getElementById('btnSound').textContent);
    await page.touchscreen.tap(sb.x + sb.w / 2, sb.y + sb.h / 2);
    await page.touchscreen.tap(sb.x + sb.w / 2, sb.y + sb.h / 2);                                  // すばやく2回
    await sleep(150);
    const after = await page.evaluate(() => document.getElementById('btnSound').textContent);
    check(before === after, '「おと」ボタンをすばやく2回タップ → 2回とも効く（元に戻る）', before + ' → ' + after);
    const v = await vv(page);
    check(v.scale === 1 && v.x === 0 && v.y === 0, 'ロビー操作のあとも、拡大・スクロールなし', JSON.stringify(v));
    check(errs.length === 0, 'エラーなし', errs.join('|'));
    await ctx.close();
  }

  /* ---- 6. パソコンは今までどおり ---- */
  console.log('\n[6] パソコン（タッチなし）');
  {
    const { ctx, page, errs } = await open(browser, 1100, 900, false);
    const s = await page.evaluate(() => ({ touchClass: document.body.classList.contains('has-touch'), pos: getComputedStyle(document.body).position, ov: getComputedStyle(document.body).overflow }));
    check(!s.touchClass && s.pos === 'static' && s.ov === 'visible', 'パソコンでは、ページ固定の指定がかからない', JSON.stringify(s));
    await page.keyboard.press('Enter'); await sleep(300);
    check(errs.length === 0, 'エラーなし', errs.join('|'));
    await ctx.close();
  }

  await browser.close();
  console.log('\n' + (fails ? 'FAILED: ' + fails : 'ALL PASSED'));
  process.exit(fails ? 1 : 0);
})();
