// 生徒のログイン：組織コードが URL・前回の ログインから 入るか、ログイン成功で 覚えるか、入力欄の name・autocomplete
process.env.PORT = process.env.PORT || '8865';
const L = require('../time/t_lib.cjs');
let fail = 0; const ok = (n, c, i) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + n + (i !== undefined ? '  ' + JSON.stringify(i) : '')); if (!c) fail++; };
const rpc = (name, body) => {
  if (name === 'login') return { token: 'T'.repeat(40), user: { id: 'u1', role: 'student', login: body.p_login }, org: { code: String(body.p_org).toUpperCase(), name: 'テスト中学', kind: 'school', fb_named: false } };
  if (name === 'state_pull') return { empty: true };
  return { ok: true };
};
const openLogin = async (b, opts) => {
  const p = await L.open(b, { rpc, ...opts, routeState: { name: 'settings' } });
  await L.run(p, 1500);
  await p.evaluate(() => { const bt = [...document.querySelectorAll('button')].find(x => /ログインする/.test(x.innerText)); bt && bt.click(); });
  await L.run(p, 500);
  return p;
};
const fields = (p) => p.evaluate(() => { const f = document.querySelector('form[name="kotsu-student-login"]'); const g = n => f && f.querySelector(`input[name="${n}"]`); return f ? { org: g('organization').value, orgAc: g('organization').autocomplete, user: g('username').autocomplete, pass: g('password').autocomplete, method: f.method, focusName: document.activeElement && document.activeElement.name } : null; });
(async () => {
  const b = await L.launch();
  // 1) URL ?org=
  let p = await openLogin(b, { url: '/solo/?org=k7q3px' });
  let f = await fields(p);
  ok('URL の ?org= の 組織コードが 入る（大文字に そろう）', f && f.org === 'K7Q3PX', f);
  ok('入力欄に name・autocomplete（組織・ID・パスワード）', f && f.orgAc === 'organization' && f.user === 'username' && f.pass === 'current-password' && f.method === 'post', f);
  ok('組織コードが 入っているときは ID の 欄に カーソル', f && f.focusName === 'username', f);
  await p.context().close();
  // 2) はじめて（URL なし・前回なし）は 空
  p = await openLogin(b, {}); f = await fields(p);
  ok('はじめては 組織コードは 空', f && f.org === '', f);
  // 3) ログインすると 覚える
  await p.fill('input[name="organization"]', 'ab12cd'); await p.fill('input[name="username"]', 's26001'); await p.fill('input[name="password"]', 'pass1234');
  await p.evaluate(() => document.querySelector('form[name="kotsu-student-login"] button[type="submit"]').click());
  for (let k = 0; k < 6; k++) { await L.run(p, 500); await p.waitForTimeout(300); }
  const saved = await p.evaluate(() => localStorage.getItem('kotsu-student-org'));
  ok('ログインに 成功すると、組織コードを この 端末に 覚える', saved === 'AB12CD', saved);
  const calls = p.__calls.filter(c => c.name === 'login').map(c => c.body.p_org);
  ok('ログインには 入れた 組織コードが 送られる', calls[0] === 'AB12CD' || calls[0] === 'ab12cd'.toUpperCase(), calls);
  // 4) 前に この 端末で ログインした ことが ある（組織コードを 覚えている）とき、ログイン画面を 開くと 入っている
  const p2 = await openLogin(b, { ls: { 'kotsu-student-org': saved || '' } });
  f = await fields(p2);
  ok('つぎに 開くと、前回の 組織コードが 入っている', f && f.org === 'AB12CD', f);
  ok('コンソールの エラーなし', p.__errs.length === 0 && p2.__errs.length === 0, [...p.__errs, ...p2.__errs].slice(0, 3));
  await b.close(); console.log('FAILS', fail); process.exit(fail ? 1 : 0);
})();
