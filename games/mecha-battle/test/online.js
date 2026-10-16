// オンライン通しテスト：ローカルのPeerServer + ブラウザ2つ（別々のコンテキスト）で、
// 部屋を作る → コードで入る → キャラ選択 → 対戦 → 結果 → 再戦 まで行い、状態が一致しているか確かめる
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const { PeerServer } = require('./node/node_modules/peer');
const ROOT = path.resolve(__dirname, '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9101;

(async () => {
  const server = PeerServer({ port: PORT, path: '/', host: '127.0.0.1' });
  const browser = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns', '--allow-loopback-in-peer-connection'] });
  const errs = [];
  const mk = async (name) => {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 820 } });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errs.push(name + ' pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(name + ' console: ' + m.text()); });
    await page.goto('file://' + ROOT + '/dist/standalone.html?peerhost=127.0.0.1&peerport=' + PORT + '&peersecure=0&ice=none');
    await sleep(400);
    return page;
  };
  const A = await mk('A'), B = await mk('B');
  const ev = (p, f, ...a) => p.evaluate(f, ...a);
  const scene = (p) => ev(p, () => window.__mecha.Game.sceneName);
  const tap = async (p, k) => { await p.keyboard.down(k); await sleep(70); await p.keyboard.up(k); await sleep(120); };
  const clip = async (p) => { const b = await p.locator('#screen').boundingBox(); return { x: b.x, y: b.y, width: b.width, height: b.height }; };
  const fail = (m) => { console.log('FAIL', m); console.log(errs.join('\n')); process.exit(1); };

  // --- ホスト(A)：部屋を作る
  await ev(A, () => { window.__mecha.Game.go('online'); });
  await sleep(200);
  await tap(A, 'Enter');                                           // へやを つくる
  await A.waitForFunction(() => window.__mecha.SceneOnline.state === 'hosting', null, { timeout: 15000 }).catch(() => fail('ホストの部屋が作れない: ' + errs.join('|')));
  const code = await ev(A, () => window.__mecha.SceneOnline.code);
  console.log('部屋コード:', code);
  await A.screenshot({ path: ROOT + '/shots/o01_host.png', clip: await clip(A) });

  // --- ゲスト(B)：コードで入る
  await ev(B, () => { window.__mecha.Game.go('online'); });
  await sleep(200);
  await tap(B, 'ArrowDown'); await tap(B, 'Enter');                // コードで はいる
  await B.waitForSelector('#roomCode', { state: 'visible', timeout: 3000 });
  await B.screenshot({ path: ROOT + '/shots/o02_join.png', fullPage: false });
  await B.fill('#roomCode', code);
  await B.click('#roomGo');
  for (const [n, p] of [['A', A], ['B', B]]) await p.waitForFunction(() => window.__mecha.Game.sceneName === 'select', null, { timeout: 15000 }).catch(() => fail(n + ' がキャラ選択に進めない: ' + errs.join('|')));
  console.log('つながった：両者キャラ選択へ');

  // --- キャラ選択（Aはカーソル移動して決定、Bはそのまま決定）
  await tap(A, 'ArrowRight'); await tap(A, 'Enter');
  await sleep(300);
  await A.screenshot({ path: ROOT + '/shots/o03_select_A.png', clip: await clip(A) });
  await B.screenshot({ path: ROOT + '/shots/o04_select_B.png', clip: await clip(B) });
  await tap(B, 'Enter');
  for (const [n, p] of [['A', A], ['B', B]]) await p.waitForFunction(() => window.__mecha.Game.sceneName === 'fight', null, { timeout: 8000 }).catch(() => fail(n + ' が対戦に進めない'));
  const chars = await Promise.all([A, B].map((p) => ev(p, () => window.__mecha.Net.session.m.cfg.ch)));
  console.log('対戦開始 キャラ:', JSON.stringify(chars));
  if (JSON.stringify(chars[0]) !== JSON.stringify(chars[1])) fail('キャラ構成が一致しない');

  const LAG = +(process.env.LAG || 0), JIT = +(process.env.JITTER || 0), LOSSY = process.env.LOSSY === '1';
  if (LAG) {
    const patch = (p) => ev(p, ([lag, jit]) => {
      const N = window.__mecha.Net, orig = N.send.bind(N);
      let lastAt = 0;
      N.send = (o) => { const now = performance.now(); const at = Math.max(lastAt, now + lag + Math.random() * jit); lastAt = at; setTimeout(() => orig(o), at - now); };
    }, [LAG, JIT]);
    await patch(A); await patch(B);
    console.log('人工遅延を入れた: 片道' + LAG + 'ms ±' + JIT + 'ms');
  }
  // --- 両者とも「ランダムに動いて殴る」ボットで、倍速で対戦
  const bot = (p, seed) => ev(p, (seed) => {
    window.__mecha.Game.speed = +(window.__speed || 3);
    let s = seed;
    const r = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
    let cur = 0;
    window.__bot = setInterval(() => {
      const x = r();
      let m = 0;
      m |= x < 0.45 ? 8 : x < 0.8 ? 4 : 0;           // 右 / 左 / なし
      if (r() < 0.08) m |= 1;                          // ジャンプ
      if (r() < 0.12) m |= 2;                          // しゃがみ
      if (r() < 0.45) m |= r() < 0.5 ? 16 : 32;         // パンチ / キック
      window.__mecha.Input.override = [m, 0];
    }, 110);
  }, seed);
  if (LAG) { await ev(A, () => { window.__speed = 1; }); await ev(B, () => { window.__speed = 1; }); }
  await bot(A, 12345); await bot(B, 777);
  const hashes = [new Map(), new Map()], last = [null, null], maxStat = [{ rb: 0, stalls: 0 }, { rb: 0, stalls: 0 }];
  const t0 = Date.now(); let lastShot = 0, shots = 0;
  let sawResult = false;
  while (Date.now() - t0 < (LAG ? 170000 : 100000)) {
    const st = await Promise.all([A, B].map((p) => ev(p, () => { const g = window.__mecha.Game, n = window.__mecha.Net; const s = n.session; return { scene: g.sceneName, frame: s ? s.frame : -1, verified: s ? s.verified : -1, rb: s ? s.stats.rollbacks : -1, stalls: s ? s.stats.stalls : -1, desync: s ? s.desync : -9, rtt: Math.round(n.rtt), phase: s ? s.m.phase : '', wins: s ? s.m.wins : null }; })));
    if (st.some((x) => x.desync >= 0)) fail('desync検出: ' + JSON.stringify(st));
    for (let i = 0; i < 2; i++) { last[i] = st[i]; maxStat[i].rb = Math.max(maxStat[i].rb, st[i].rb); maxStat[i].stalls = Math.max(maxStat[i].stalls, st[i].stalls); maxStat[i].rtt = Math.max(maxStat[i].rtt || 0, st[i].rtt); const hs = await ev([A, B][i], () => { const s = window.__mecha.Net.session; return s ? [...s.myHash.entries()] : []; }); hs.forEach(([f, h]) => hashes[i].set(f, h)); }
    if (Date.now() - lastShot > 12000 && shots < 3) { lastShot = Date.now(); await A.screenshot({ path: ROOT + '/shots/o05_fightA_' + shots + '.png', clip: await clip(A) }); await B.screenshot({ path: ROOT + '/shots/o06_fightB_' + shots + '.png', clip: await clip(B) }); shots++; }
    if (st.every((x) => x.scene === 'result')) { sawResult = true; break; }
    await sleep(500);
  }
  const fin = await Promise.all([A, B].map((p) => ev(p, () => { const s = window.__mecha.Net.session; return s ? { frame: s.frame, rb: s.stats.rollbacks, stalls: s.stats.stalls, maxDepth: s.stats.maxDepth, hashes: [...s.myHash.entries()].slice(-4) } : null; })));
  let common = 0, bad = 0;
  for (const [f, h] of hashes[0]) if (hashes[1].has(f)) { common++; if (hashes[1].get(f) !== h) bad++; }
  console.log('ブラウザ間のハッシュ突き合わせ: 共通' + common + '件 / 不一致' + bad + '件');
  console.log('ロールバック回数/待ち回数/最大ping  A:', JSON.stringify(maxStat[0]), ' B:', JSON.stringify(maxStat[1]));
  if (bad || common < 10) fail('ハッシュが一致しない/少ない');
  console.log('結果画面に到達:', sawResult);
  await ev(A, () => clearInterval(window.__bot)); await ev(B, () => clearInterval(window.__bot));
  if (!sawResult) fail('試合が終わらなかった');
  await sleep(600);
  await A.screenshot({ path: ROOT + '/shots/o07_resultA.png', clip: await clip(A) });
  await B.screenshot({ path: ROOT + '/shots/o08_resultB.png', clip: await clip(B) });

  // --- 再戦：両者が「もういちど」
  await ev(A, () => { window.__mecha.Input.override = null; window.__mecha.Game.speed = 1; }); await ev(B, () => { window.__mecha.Input.override = null; window.__mecha.Game.speed = 1; });
  await sleep(800);
  await tap(A, 'Enter');           // もういちど(A)
  await sleep(500);
  await B.screenshot({ path: ROOT + '/shots/o09_resultB_wait.png', clip: await clip(B) });
  await tap(B, 'Enter');           // もういちど(B)
  for (const [n, p] of [['A', A], ['B', B]]) await p.waitForFunction(() => window.__mecha.Game.sceneName === 'fight', null, { timeout: 8000 }).catch(() => fail(n + ' が再戦に進めない'));
  await sleep(2500);
  const re = await Promise.all([A, B].map((p) => ev(p, () => { const s = window.__mecha.Net.session; return { seed: s.seed, frame: s.frame, desync: s.desync, round: s.m.round }; })));
  console.log('再戦開始:', JSON.stringify(re));
  if (re[0].seed !== re[1].seed) fail('再戦の試合IDが一致しない');
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  console.log('ONLINE TEST PASSED');
  await browser.close(); server.close && server.close();
  process.exit(0);
})().catch((e) => { console.log('EXC', e); process.exit(1); });
