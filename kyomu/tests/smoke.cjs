#!/usr/bin/env node
/* 動作確認（架空のデータだけを使う。学校の実データは使わない）。
   使い方：node kyomu/tests/smoke.cjs      （Playwright が必要：npm i -D playwright など）
   確かめること：祝日・入れ替えと記録・元に戻す・行事で埋まる・短縮日課・時数・先生の重なり・まとめて入力・印刷が A4 1 枚に収まる */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});

let failed = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? '✓' : '✗'} ${msg}`);
  if (!cond) failed++;
};

(async () => {
  await new Promise((r) => server.listen(0, r));
  const port = server.address().port;
  // 日本語のファイル名を正しく扱えるように、ブラウザは UTF-8 の設定で起動する（Linux で LANG が無いとき用）
  const browser = await chromium.launch({ env: Object.assign({}, process.env, { LANG: process.env.LANG || 'C.UTF-8' }) });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.goto(`http://localhost:${port}/index.html`);
  await page.waitForSelector('.modal');
  await page.click('[data-w="blank"]');

  // 祝日
  const hol = await page.evaluate(() => [K.u.holiday('2026-09-21'), K.u.holiday('2026-09-22'), K.u.holiday('2026-09-23'), K.u.holiday('2027-03-22'), K.u.holiday('2026-05-06')]);
  ok(hol.join(',') === '敬老の日,国民の休日,秋分の日,振替休日,振替休日', `祝日の計算：${hol.join(',')}`);

  // 架空の基本時間割（全期間おなじ）
  await page.evaluate(() => {
    const st = K.m.blank(2026);
    const subj = ['国', '数', '英', '理', '社', '体', '音'];
    st.terms.forEach((t) => {
      const b = (st.bases[t.id] = { cells: {}, staff: { '2|5': '④運営委員会' } });
      for (let wd = 1; wd <= 5; wd++)
        st.daySlots[wd].forEach((s, i) =>
          st.classes.forEach((c, j) => {
            if (s === 'am') b.cells[`${wd}|${s}|${c.id}`] = { t: '読書', m: 'g' + c.g };
            else if (s === 'pm') b.cells[`${wd}|${s}|${c.id}`] = { t: 'C' };
            else b.cells[`${wd}|${s}|${c.id}`] = { t: subj[(i + j + wd) % subj.length] };
          })
        );
    });
    st.school.name = 'テスト中学校';
    K.store.replace(st, 'テスト');
    K.views.week.go('2026-09-28');
  });
  await page.waitForTimeout(300);
  ok((await page.locator('.xs td.c[data-d="2026-09-28"]').count()) > 40, '週行事のシートが出る');
  ok((await page.textContent('.wkno')).includes('第'), '週の番号が出る');

  // 入れ替え（ドラッグ）と記録
  const a = 'td.c[data-d="2026-09-29"][data-s="1"][data-c="1-1"]';
  const b = 'td.c[data-d="2026-09-30"][data-s="3"][data-c="1-1"]';
  const before = [await page.textContent(a), await page.textContent(b)];
  await page.dragAndDrop(a, b);
  await page.waitForTimeout(200);
  const after = [await page.textContent(a), await page.textContent(b)];
  ok(after[0] === before[1] && after[1] === before[0], `ドラッグで入れ替え：${before} → ${after}`);
  ok((await page.locator('.logs li').count()) === 1, '右に記録が1件');
  const st = await page.$$eval('td.st', (t) => t.map((x) => x.textContent).join('|'));
  ok(st.includes(`1-1${before[1]}は30日分`) && st.includes(`1-1${before[0]}は29日分`), '出張等の欄に「○日分」の記録');
  ok(st.includes('④運営委員会'), '定例の会議が出張等の欄に出る');
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(200);
  ok((await page.textContent(a)) === before[0], '元に戻す（Ctrl+Z）');

  // 行事で時間割が埋まる・時数が減る
  const r = await page.evaluate(() => {
    const before = K.m.countRange('2026-10-01', '2026-10-01')['1-1'];
    const sumB = Object.values(before || {}).reduce((x, y) => x + y, 0);
    K.store.commit('t', (st) => st.events.push({ id: 'e1', kind: 'event', date: '2026-10-01', title: '学年集会', targets: ['g1'], from: '5', to: '6', countAs: '行事' }));
    const c = K.m.cell('2026-10-01', '5', '1-2');
    const c2 = K.m.cell('2026-10-01', '5', '2-1');
    const aft = K.m.countRange('2026-10-01', '2026-10-01')['1-1'];
    return { t: c.t, m: c.m, other: c2.src, sumB, sumA: Object.values(aft).reduce((x, y) => x + y, 0), ev: aft['行事'] };
  });
  ok(r.t === '学年集会' && r.m && r.other === 'base', '1年の5〜6校時だけ行事で埋まる（1くくり）');
  ok(r.sumA === r.sumB && r.ev === 2, `時数：教科が2コマ減り、行事が2コマ（${r.sumB}→${r.sumA}）`);

  // 短縮日課
  const sh = await page.evaluate(() => {
    K.store.commit('t', (st) => st.events.push({ id: 'e2', kind: 'short', date: '2026-10-02', title: '三者面談', upTo: '4' }));
    const c = K.m.countRange('2026-10-02', '2026-10-02')['1-1'];
    return { n: Object.values(c).reduce((x, y) => x + y, 0), s5: K.m.cell('2026-10-02', '5', '1-1').src };
  });
  ok(sh.n === 4 && sh.s5 === 'off', `短縮日課（4校時まで）：${sh.n}コマ`);

  // 先生の重なり
  const iss = await page.evaluate(() => {
    const t = K.m.cell('2026-10-05', '1', '1-1').t;
    K.store.commit('t', (st) => {
      st.teach[`1-1|${t}`] = '山田';
      st.ovr['2026-10-05|1|1-2'] = { t };
      st.teach[`1-2|${t}`] = '山田';
    });
    return K.m.issues('2026-10-05', '1');
  });
  ok(iss['1-1'] && iss['1-1'][0].includes('山田'), '同じ先生が同じ時間に2クラス → 注意');

  // 入れ替えの候補：先生があいているコマが緑に
  await page.evaluate(() => {
    K.store.commit('t', (st) => {
      ['国', '数', '英', '理', '社', '体', '音'].forEach((sj, i) => st.classes.forEach((c) => (st.teach[`${c.id}|${sj}`] = '先生' + i + c.id)));
    });
    K.views.week.go('2026-10-05');
  });
  await page.waitForTimeout(200);
  await page.click('td.c[data-d="2026-10-06"][data-s="2"][data-c="2-1"]');
  await page.waitForTimeout(200);
  const cand = [await page.locator('td.cand-ok').count(), await page.locator('td.cand-ng').count()];
  ok(cand[0] > 0, `入れ替えられるコマが光る（緑 ${cand[0]}・だめ ${cand[1]}）`);

  // まとめて入力
  const pr = await page.evaluate(() => [
    K.ev.parseLine('10/14〜10/16 2年 5-6校時 職場体験 #総', 2026),
    K.ev.parseLine('1/14 火曜校時', 2026),
    K.ev.parseLine('職員: 10/15 ④ 教務会議 山田、鈴木', 2026),
    K.ev.parseLine('7/13〜7/16 短縮4 三者面談', 2026),
  ]);
  ok(pr[0].date === '2026-10-14' && pr[0].end === '2026-10-16' && pr[0].targets[0] === 'g2' && pr[0].from === '5' && pr[0].to === '6' && pr[0].countAs === '総', 'まとめて入力：学年・校時・時数');
  ok(pr[1].kind === 'swap' && pr[1].swapWd === 2 && pr[1].date === '2027-01-14', 'まとめて入力：火曜校時（1月は次の年）');
  ok(pr[2].kind === 'staff' && pr[2].from === '4' && pr[2].who === '山田、鈴木', 'まとめて入力：職員の予定と先生の名前');
  ok(pr[3].kind === 'short' && pr[3].upTo === '4', 'まとめて入力：短縮日課');

  // 印刷：週が A4 1 枚に収まる
  await page.evaluate(() => K.views.week.go('2026-09-28'));
  await page.waitForTimeout(200);
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  const z = await page.evaluate(() => Number(document.querySelector('#print-area .fitbox').style.zoom));
  ok(z > 0.8 && z <= 1, `印刷の縮小率 ${z}`);
  await page.emulateMedia({ media: 'print' });
  const pdf = await page.pdf({ printBackground: true, preferCSSPageSize: true });
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  ok(pages === 1, `週行事の印刷は 1 ページ（${pages}）`);

  // バックアップ：保存先フォルダにボタン一つで上書き保存（ブラウザのフォルダ機能はまねで代用）
  await page.emulateMedia({ media: 'screen' });
  await page.evaluate(() => {
    window.__files = {};
    let asked = 0;
    const dir = {
      name: 'テスト用フォルダ',
      queryPermission: async () => (asked ? 'granted' : 'prompt'),
      requestPermission: async () => ((asked = 1), 'granted'),
      getFileHandle: async (name, o) => {
        if (!(name in window.__files) && !(o && o.create)) throw Object.assign(new Error('なし'), { name: 'NotFoundError' });
        return {
          createWritable: async () => {
            let buf = '';
            return { write: async (b) => (buf += await b.text()), close: async () => (window.__files[name] = buf) };
          },
          getFile: async () => new File([window.__files[name]], name, { lastModified: Date.now() }),
        };
      },
    };
    window.showDirectoryPicker = async () => dir;
  });
  await page.click('[data-top="backup"]');
  await page.click('.modal [data-pick]');
  await page.waitForTimeout(300);
  let files = await page.evaluate(() => Object.keys(window.__files));
  ok(files.length === 1 && /_バックアップ\.json$/.test(files[0]), `はじめて：フォルダを選んで保存（${files.join(',')}）`);
  await page.evaluate(() => K.store.commit('t', (st) => (st.school.name = 'テスト中学校（変更）')));
  await page.click('[data-top="backup"]');
  await page.waitForTimeout(300);
  files = await page.evaluate(() => Object.keys(window.__files));
  const saved = await page.evaluate((n) => JSON.parse(window.__files[n]).school.name, files[0]);
  ok(files.length === 1 && saved === 'テスト中学校（変更）' && !(await page.locator('.modal').count()), '2回目から：ボタン一つで同じファイルに上書き');
  await page.evaluate(() => K.store.commit('t', (st) => (st.opt.backupDated = true)));
  await page.click('[data-top="backup"]');
  await page.waitForTimeout(300);
  files = await page.evaluate(() => Object.keys(window.__files));
  ok(files.length === 2, `日付つきのファイルも残す（${files.join(',')}）`);
  await page.evaluate(() => K.store.commit('t', (st) => (st.school.name = 'こわれた')));
  await page.evaluate(() => K.app.go('settings'));
  await page.waitForTimeout(300);
  await page.click('[data-act="bk-restore"]');
  await page.click('.modal [data-ok]');
  await page.waitForTimeout(400);
  ok((await page.evaluate(() => K.m.st.school.name)) === 'テスト中学校（変更）', '保存先フォルダのバックアップから戻す');
  await page.evaluate(() => {
    delete window.showDirectoryPicker;
    K.store.commit('t', (st) => (st.opt.backupDated = false));
  });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-top="backup"]')]);
  ok(/\.json$/.test(dl.suggestedFilename()), `フォルダ機能がないブラウザでは、ダウンロードで保存（${dl.suggestedFilename()}）`);

  // 操作デモ：全部のデモが最後まで流れ、終わったら元のデータに戻る
  await page.emulateMedia({ media: 'screen' });
  const stBefore = await page.evaluate(() => JSON.stringify(K.m.st));
  const ids = await page.evaluate(() => K.demo.list().map((x) => x.id));
  const bad = [];
  for (const id of ids) {
    await page.evaluate((x) => {
      K.demo.speed = 0.08;
      K.demo.play(x);
    }, id);
    let txt = '';
    for (let i = 0; i < 300; i++) {
      await page.waitForTimeout(100);
      txt = await page.evaluate(() => (document.querySelector('#demo-layer .dm-text') || {}).textContent || '');
      if (/ここまで|うまく進められ/.test(txt)) break;
    }
    if (!/ここまで/.test(txt)) bad.push(id);
    await page.evaluate(() => K.demo.stop());
    await page.waitForTimeout(150);
  }
  ok(!bad.length, `操作デモ ${ids.length}本が最後まで流れる${bad.length ? '（だめ：' + bad.join('・') + '）' : ''}`);
  ok((await page.evaluate(() => JSON.stringify(K.m.st))) === stBefore, 'デモのあと、データは元のまま');

  for (const tab of ['month', 'year', 'hours', 'base', 'teachers', 'settings']) {
    await page.emulateMedia({ media: 'screen' });
    await page.click(`[data-tab="${tab}"]`);
    await page.waitForTimeout(150);
  }
  ok(!errs.length, `エラーなし${errs.length ? '：' + errs.join(' / ') : ''}`);
  await browser.close();
  server.close();
  console.log(failed ? `\n${failed}件 失敗` : '\nすべてOK');
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
