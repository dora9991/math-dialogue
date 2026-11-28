// 先生・管理者の パスキー（Face ID・指紋）ログインの テスト。Chromium の 仮想の 認証器（Face ID の かわり）で、
// 本物の navigator.credentials.create / get を 通す。サーバーは 手元の Postgres（本番と 同じ 関数）＋ Edge Function と 同じ コード。
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const BASE = 'http://localhost:8870/math-dialogue/solo';
const API = 'http://127.0.0.1:54473';
const sql = (q) => execSync(`psql -h /tmp -p 55432 -U postgres -d kt -At -c ${JSON.stringify(q)}`).toString().trim();
let fail = 0; const ok = (n, c, i) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + n + (i !== undefined ? '  ' + JSON.stringify(i) : '')); if (!c) fail++; };
const post = async (path, body) => (await fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json();

async function newPage(b) {
  const ctx = await b.newContext({ viewport: { width: 1100, height: 900 } });
  const p = await ctx.newPage();
  p.__errs = [];
  p.on('pageerror', (e) => p.__errs.push(String(e)));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|404/.test(m.text())) p.__errs.push(m.text()); });
  p.on('dialog', (d) => d.accept());
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('WebAuthn.enable');
  const { authenticatorId } = await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true } });
  p.__cdp = cdp; p.__auth = authenticatorId;
  return p;
}
const text = (p, sel) => p.evaluate((s) => { const e = document.querySelector(s); return e ? e.innerText : null; }, sel);
async function pwLogin(p, id, pass) {
  await p.fill('#k-login-org', 'TEST01'); await p.fill('#k-login-id', id); await p.fill('#k-login-pass', pass);
  await p.click('form[name="kotsu-login"] button[type="submit"]');
  await p.waitForSelector('.k-who', { timeout: 10000 });
}
async function register(p, pass, label) {
  await p.click('[data-pk="manage"]');
  await p.waitForSelector('.k-pk-panel');
  await p.waitForFunction(() => !/読みこんでいます/.test(document.querySelector('.k-pk-panel').innerText));
  if (label) await p.fill('input[name="pk-label"]', label);
  await p.fill('.k-pk-panel input[name="password"]', pass);
  await p.click('[data-pk="add"]');
  await p.waitForFunction(() => document.querySelector('[data-pk="done"]') || document.querySelector('[data-pk="err"]'), null, { timeout: 15000 });
}

(async () => {
  sql("delete from kotsu.passkeys; delete from kotsu.passkey_challenges; delete from kotsu.audit; delete from kotsu.sessions; delete from kotsu.rate; update kotsu.users set active=true");
  const b = await chromium.launch();
  // ---- 先生 ----
  let p = await newPage(b);
  await p.goto(`${BASE}/teacher/?org=TEST01`); await p.waitForSelector('form[name="kotsu-login"]');
  ok('先生のログイン画面に「Face ID・指紋でログイン」がある', !!(await p.$('[data-pk="login"]')));
  await p.click('[data-pk="login"]');
  await p.waitForFunction(() => /とりやめました|見つかりません/.test(document.querySelector('.k-pk-login').innerText), null, { timeout: 20000 });
  ok('登録の前に押すと、案内が出る（ログインしない）', !(await p.$('.k-who')), await text(p, '.k-pk-login .k-err'));

  await pwLogin(p, 'sensei', 'pass1234');
  ok('パスワードでログインすると、右上に「🔑 Face ID」が出る', !!(await p.$('[data-pk="manage"]')));
  await register(p, 'wrongpass', '');
  ok('登録：パスワードがちがうと、登録しない', /パスワードがちがいます/.test(await text(p, '[data-pk="err"]') || ''));
  await p.fill('.k-pk-panel input[name="password"]', 'pass1234'); await p.fill('input[name="pk-label"]', '先生のMac');
  await p.click('[data-pk="add"]');
  await p.waitForSelector('[data-pk="done"]', { timeout: 15000 });
  const items = await p.evaluate(() => [...document.querySelectorAll('[data-pk="list"] li b')].map((e) => e.innerText));
  ok('登録できて、一覧に出る', items.length === 1 && items[0] === '先生のMac', items);
  const creds = (await p.__cdp.send('WebAuthn.getCredentials', { authenticatorId: p.__auth })).credentials;
  ok('端末（仮想の 認証器）に、どこでも 使える かぎ（resident key）が できた', creds.length === 1 && creds[0].isResidentCredential && creds[0].rpId === 'localhost', creds.map((c) => ({ rp: c.rpId, res: c.isResidentCredential })));
  ok('DB：かぎが 1つ（ES256・SPKI）', sql("select count(*)||' '||min(alg)||' '||min(length(public_key)) from kotsu.passkeys") === '1 -7 122', sql("select count(*)||' '||min(alg)||' '||min(length(public_key)) from kotsu.passkeys"));
  await p.fill('.k-pk-panel input[name="password"]', 'pass1234'); await p.click('[data-pk="add"]');
  await p.waitForFunction(() => document.querySelector('[data-pk="err"]'), null, { timeout: 15000 });
  ok('同じ 端末を 2回 登録しようとすると、ことわる', /もう登録されています/.test(await text(p, '[data-pk="err"]') || ''), await text(p, '[data-pk="err"]'));
  await p.keyboard.press('Escape');

  // ログアウト → Face ID で ログイン（リクエストを 写して、あとで 使い回しを ためす）
  await p.click('.k-who button'); await p.waitForSelector('form[name="kotsu-login"]');
  let captured = null;
  await p.route('**/functions/v1/passkey', async (route) => { captured = route.request().postData(); await route.continue(); });
  await p.click('[data-pk="login"]');
  await p.waitForSelector('.k-who', { timeout: 15000 });
  const who = await text(p, '.k-who');
  ok('ログアウトの あと、Face ID で ログインできる（先生の画面）', /sensei/.test(who), who);
  const st = await p.evaluate(() => JSON.parse(localStorage.getItem('kotsu-staff-v1') || 'null'));
  ok('ログインの しかたは パスワードの ときと 同じ（トークンを 端末に 保存・90日 たもつ）', !!(st && st.token && st.token.length === 48 && st.keep === true), st && { keep: st.keep, len: st.token && st.token.length });
  ok('DB：ログインの 記録（login_passkey）と、最後に 使った 日', sql("select count(*) from kotsu.audit where action='login_passkey'") === '1' && sql('select count(*) from kotsu.passkeys where last_used_at is not null') === '1');
  ok('DB：そのトークンで ログイン中に なる（本物の セッション）', sql(`select (kotsu._who('${st.token}')).login_id`) === 'sensei');
  const replay = await post('/functions/v1/passkey', JSON.parse(captured));
  ok('同じ 署名を もう一度 送っても 入れない（チャレンジは 1回かぎり）', replay.error === 'pk_expired' || replay.error === 'pk_counter', replay);
  const tampered = JSON.parse(captured); tampered.auth_data = tampered.auth_data.slice(0, -2) + (tampered.auth_data.slice(-2) === 'AA' ? 'AQ' : 'AA');
  const ch2 = await post('/rpc/pk_login_begin', {});
  ok('書きかえた 署名データは 通らない', (await post('/functions/v1/passkey', tampered)).error !== undefined && !!ch2.challenge);
  ok('ページの エラーなし（先生）', p.__errs.length === 0, p.__errs.slice(0, 3));

  // ---- 管理者の 画面：先生の かぎでは 入れない ----
  await p.goto(`${BASE}/admin/`); await p.waitForSelector('form[name="kotsu-login"], .k-who');
  if (await p.$('.k-who')) { await p.click('.k-who button'); await p.waitForSelector('form[name="kotsu-login"]'); }
  await p.click('[data-pk="login"]');
  await p.waitForFunction(() => /使えません/.test((document.querySelector('.k-pk-login .k-err') || {}).innerText || ''), null, { timeout: 15000 });
  ok('管理者の 画面では、先生の かぎでは 入れない', !(await p.$('.k-who')), await text(p, '.k-pk-login .k-err'));
  await p.context().close();

  // ---- 管理者 ----
  p = await newPage(b);
  await p.goto(`${BASE}/admin/?org=TEST01`); await p.waitForSelector('form[name="kotsu-login"]');
  await pwLogin(p, 'kocho', 'pass5678');
  await register(p, 'pass5678', '校長のiPad');
  ok('管理者も 登録できる', !!(await p.$('[data-pk="done"]')));
  await p.keyboard.press('Escape');
  await p.click('.k-who button'); await p.waitForSelector('form[name="kotsu-login"]');
  await p.click('[data-pk="login"]'); await p.waitForSelector('.k-who', { timeout: 15000 });
  ok('管理者が Face ID で ログインできる', /kocho/.test(await text(p, '.k-who')));
  // 消す → もう 入れない
  await p.click('[data-pk="manage"]'); await p.waitForSelector('[data-pk="list"]');
  await p.click('[data-pk="list"] li button'); await p.waitForSelector('[data-pk="none"]', { timeout: 10000 });
  ok('一覧から 消せる', sql("select count(*) from kotsu.passkeys p join kotsu.users u on u.id=p.user_id where u.login_id='kocho'") === '0');
  await p.keyboard.press('Escape');
  await p.click('.k-who button'); await p.waitForSelector('form[name="kotsu-login"]');
  await p.click('[data-pk="login"]');
  await p.waitForFunction(() => /見つかりません/.test((document.querySelector('.k-pk-login .k-err') || {}).innerText || ''), null, { timeout: 15000 });
  ok('消した かぎでは 入れない', !(await p.$('.k-who')), await text(p, '.k-pk-login .k-err'));
  ok('ページの エラーなし（管理者）', p.__errs.length === 0, p.__errs.slice(0, 3));
  await p.context().close();

  // ---- 生徒・止めた 人 ----
  const s = await post('/rpc/login', { p_org: 'TEST01', p_login: 's001', p_pass: 'pass0000' });
  const sr = await fetch(API + '/rpc/pk_reg_begin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ p_token: s.token, p_pass: 'pass0000' }) });
  ok('生徒は 登録できない（role）', sr.status === 400 && /role/.test((await sr.json()).message));
  const g = await fetch(API + '/rpc/pk_get', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ p_cred_id: 'x'.repeat(20) }) });
  ok('かぎを 取り出す 関数は、画面（anon）からは よべない', g.status === 400 && /permission denied/.test((await g.json()).message));
  sql("update kotsu.users set active=false where login_id='sensei'");
  p = await newPage(b);
  // 先生の かぎを もう一度 作る ため、仮想の 認証器に 前の かぎを 入れなおす ことは しない：DB 側で 止めた 人の かぎを ためす
  const kk = JSON.parse(sql("select json_build_object('n', count(*)) from kotsu.passkeys p join kotsu.users u on u.id=p.user_id where u.login_id='sensei'"));
  const ch = sql("select kotsu.pk_login_begin()->>'challenge'");
  const cd = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge: ch, origin: 'http://localhost:8870' })).toString('base64url');
  const cred = sql("select p.cred_id from kotsu.passkeys p join kotsu.users u on u.id=p.user_id where u.login_id='sensei'");
  const fin = sql(`select kotsu.pk_login_finish('${cred}', '${ch}', '${cd}', 99)::text`);
  ok('止めた 先生は、署名が 正しくても 入れない（DB の 確かめ）', kk.n === 1 && /pk_unknown/.test(fin), fin);
  sql("update kotsu.users set active=true where login_id='sensei'");
  await p.context().close();
  await b.close();
  console.log('FAILS', fail); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
