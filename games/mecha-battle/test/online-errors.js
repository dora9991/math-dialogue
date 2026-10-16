// オンラインの失敗パターン：サーバー不通 / コード違い / 途中切断
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const { PeerServer } = require('./node/node_modules/peer');
const ROOT = path.resolve(__dirname, '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9102;
(async () => {
  const server = PeerServer({ port: PORT, path: '/', host: '127.0.0.1' });
  const browser = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns', '--allow-loopback-in-peer-connection'] });
  const errs = [];
  const mk = async (name, port) => {
    const page = await (await browser.newContext({ viewport: { width: 1000, height: 820 } })).newPage();
    page.on('pageerror', (e) => errs.push(name + ' pageerror: ' + e.message));
    await page.goto('file://' + ROOT + '/dist/standalone.html?peerhost=127.0.0.1&peerport=' + port + '&peersecure=0&ice=none');
    await sleep(300);
    return page;
  };
  const ev = (p, f, ...a) => p.evaluate(f, ...a);
  const tap = async (p, k) => { await p.keyboard.down(k); await sleep(70); await p.keyboard.up(k); await sleep(120); };
  const st = (p) => ev(p, () => ({ scene: window.__mecha.Game.sceneName, state: window.__mecha.SceneOnline.state, msg: window.__mecha.SceneOnline.msg }));
  let bad = 0;
  const check = (name, cond, extra) => { if (cond) console.log('  ok   ' + name); else { bad++; console.log('  FAIL ' + name + ' ' + JSON.stringify(extra)); } };

  console.log('● サーバーに つながらない（ホスト）');
  {
    const p = await mk('X', 9);
    await ev(p, () => window.__mecha.Game.go('online')); await sleep(200); await tap(p, 'Enter');
    await p.waitForFunction(() => window.__mecha.SceneOnline.state === 'error', null, { timeout: 20000 }).catch(() => {});
    const s = await st(p);
    check('エラー表示になる', s.state === 'error', s);
    check('メッセージがある', !!s.msg, s);
    console.log('       →', s.msg);
    await p.screenshot({ path: ROOT + '/shots/oe1_error.png', clip: await p.locator('#screen').boundingBox() });
    await tap(p, 'Enter'); await sleep(200);
    check('キーでメニューに戻れる', (await st(p)).state === 'menu', await st(p));
  }
  console.log('● 存在しないコードで入る');
  {
    const p = await mk('Y', PORT);
    await ev(p, () => window.__mecha.Game.go('online')); await sleep(200);
    await tap(p, 'ArrowDown'); await tap(p, 'Enter');
    await p.fill('#roomCode', 'ABCD'); await p.click('#roomGo');
    await p.waitForFunction(() => window.__mecha.SceneOnline.state === 'error', null, { timeout: 20000 }).catch(() => {});
    const s = await st(p);
    check('「みつかりません」になる', s.state === 'error' && /みつかりません/.test(s.msg), s);
    await p.fill('#roomCode', 'ab').catch(() => {});
  }
  console.log('● コードの形がおかしい');
  {
    const p = await mk('Z', PORT);
    await ev(p, () => window.__mecha.Game.go('online')); await sleep(200);
    await tap(p, 'ArrowDown'); await tap(p, 'Enter');
    await p.fill('#roomCode', 'A1'); await p.click('#roomGo'); await sleep(200);
    const s = await st(p);
    check('4もじでないと進まない', s.state === 'joinInput' && !!s.msg, s);
  }
  console.log('● バージョンがちがう相手とは、つないだあとにはじく（物理を変えたのに古いページのまま、を防ぐ）');
  {
    const A = await mk('A', PORT), B = await mk('B', PORT);
    await ev(A, () => window.__mecha.Game.go('online')); await sleep(200); await tap(A, 'Enter');
    await A.waitForFunction(() => window.__mecha.SceneOnline.state === 'hosting', null, { timeout: 15000 });
    const code = await ev(A, () => window.__mecha.SceneOnline.code);
    // ゲストを「ひとつ古いバージョン」のふりにする（hello のバージョン番号だけ書き換える）
    await ev(B, () => { const N = window.__mecha.Net, send = N.send; N.send = function (m) { if (m && m.t === 'hello') m = Object.assign({}, m, { v: m.v - 1 }); return send.call(this, m); }; });
    await ev(B, () => window.__mecha.Game.go('online')); await sleep(200); await tap(B, 'ArrowDown'); await tap(B, 'Enter');
    await B.fill('#roomCode', code); await B.click('#roomGo');
    await A.waitForFunction(() => window.__mecha.SceneOnline.state === 'error', null, { timeout: 15000 }).catch(() => {});
    const s = await st(A);
    check('ホストが「バージョンが ちがいます」で止まる', s.state === 'error' && /バージョン/.test(s.msg) && /さいよみこみ/.test(s.msg), s);
    check('キャラ選択には進まない', (await ev(A, () => window.__mecha.Game.sceneName)) === 'online');
    await A.screenshot({ path: ROOT + '/shots/oe3_version.png', clip: await A.locator('#screen').boundingBox() });
  }
  console.log('● 途中で相手が切れる（キャラ選択中・対戦中）');
  for (const phase of ['select', 'fight']) {
    const A = await mk('A', PORT), B = await mk('B', PORT);
    await ev(A, () => window.__mecha.Game.go('online')); await sleep(200); await tap(A, 'Enter');
    await A.waitForFunction(() => window.__mecha.SceneOnline.state === 'hosting', null, { timeout: 15000 });
    const code = await ev(A, () => window.__mecha.SceneOnline.code);
    await ev(B, () => window.__mecha.Game.go('online')); await sleep(200); await tap(B, 'ArrowDown'); await tap(B, 'Enter');
    await B.fill('#roomCode', code); await B.click('#roomGo');
    await A.waitForFunction(() => window.__mecha.Game.sceneName === 'select', null, { timeout: 15000 });
    await B.waitForFunction(() => window.__mecha.Game.sceneName === 'select', null, { timeout: 15000 });
    if (phase === 'fight') {
      await tap(A, 'Enter'); await tap(B, 'Enter');
      await A.waitForFunction(() => window.__mecha.Game.sceneName === 'fight', null, { timeout: 8000 });
      await sleep(1500);
    }
    await ev(B, () => window.__mecha.Net.close());          // ゲストが突然いなくなる（ネット切断のつもり）
    await sleep(1500);
    const lost = await ev(A, () => { const sc = window.__mecha.Game.scene; return { scene: window.__mecha.Game.sceneName, lost: sc.lost }; });
    check(phase + '中の切断をホストが検知', !!lost.lost, lost);
    await A.screenshot({ path: ROOT + '/shots/oe2_lost_' + phase + '.png', clip: await A.locator('#screen').boundingBox() });
    await tap(A, 'Enter'); await sleep(300);
    check(phase + '：キーでタイトルに戻れる', (await ev(A, () => window.__mecha.Game.sceneName)) === 'title', await ev(A, () => window.__mecha.Game.sceneName));
  }
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  console.log(bad ? 'FAILED ' + bad : 'ALL PASSED');
  await browser.close(); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('EXC', e); process.exit(1); });
