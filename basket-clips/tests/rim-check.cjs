// リングに当たってから入る／外れるシュートを、どれだけ正しく見分けられるかを確かめる（検証・調整用）
//   node basket-clips/tests/rim-check.cjs <動画.mp4> [dev|built] [ログの保存先.json]
//   動画は tests/tools/make-video.cjs で rim を付けて作ったもの（正解は 動画.mp4.json）。
//   画面を通して（ファイル選択 → ゴールをドラッグで指定 → 探す）解析し、シュートの形（きれいに入った・リングで弾んで入った・弾んで外れた…）ごとに、
//   「得点と判定」「外れと判定」「見つからない」を数える。ログの保存先を渡すと、コマごとのボール候補の記録も保存する（tests/rim-replay.cjs で使う）。
const fs = require('fs');
const path = require('path');
const { chromium } = require('./pw.cjs');
const { start } = require('./server.cjs');

const ARGS = ['--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--mute-audio'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* 正解のシュートごとに、見つけたシュートを割り当てる（放ってから −0.3〜+3.0 秒。リングで弾むと入るまでが長いので、ふつうより 0.6 秒長く見る） */
function judge(shots, truth) {
  const used = new Set();
  const rows = truth.shots.map((s) => {
    const cands = shots.map((d, i) => ({ d, i })).filter((x) => !used.has(x.i) && x.d.t >= s.t - 0.3 && x.d.t <= s.t + 3.0);
    // 得点の正解には、得点の検出を優先して割り当てる（弾んでいる間の「外れ」の検出があっても）
    cands.sort((a, b) => (s.made ? (b.d.made - a.d.made) : (a.d.made - b.d.made)) || a.d.t - b.d.t);
    const hit = cands[0];
    if (hit) used.add(hit.i);
    return { s, d: hit ? hit.d : null };
  });
  const extra = shots.filter((d, i) => !used.has(i));
  return { rows, extra };
}
function summary(res) {
  const kinds = {};
  res.rows.forEach((r) => {
    const key = (r.s.made ? '入る：' : '外れ：') + (r.s.rim || (r.s.type === 'ft' ? 'FT' : 'きれい'));
    const k = kinds[key] = kinds[key] || { n: 0, made: 0, miss: 0, none: 0 };
    k.n++;
    if (!r.d) k.none++; else if (r.d.made) k.made++; else k.miss++;
  });
  return kinds;
}
function print(res, label) {
  console.log(`\n■ ${label}`);
  const kinds = summary(res);
  Object.keys(kinds).sort().forEach((key) => { const k = kinds[key]; console.log(`  ${key.padEnd(14)} ${k.n}本 → 得点 ${k.made}・外れ ${k.miss}・見つからない ${k.none}`); });
  const made = res.rows.filter((r) => r.s.made), miss = res.rows.filter((r) => !r.s.made);
  const tp = made.filter((r) => r.d && r.d.made).length, fp = miss.filter((r) => r.d && r.d.made).length + res.extra.filter((d) => d.made).length;
  console.log(`  得点 ${made.length} 本のうち ${tp} 本を得点と判定（見落とし ${made.length - tp}）・外れを得点と判定 ${fp}・正解にない検出 ${res.extra.length}（うち得点 ${res.extra.filter((d) => d.made).length}）`);
  return { tp, fp, made: made.length };
}

async function analyse(file, mode, logOut) {
  const truth = JSON.parse(fs.readFileSync(file + '.json', 'utf8'));
  const srv = await start(0, mode === 'built' ? path.join(__dirname, '..', '..', 'public', 'basket-clips') : path.join(__dirname, '..'));
  const browser = await chromium.launch({ args: ARGS });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(srv.url);
    await page.waitForFunction(() => window.BS && BS.app && document.querySelector('#stepVideo'));
    // OCCL=0 で、リングが隠れたコマを使わない（もとの動き）。比べるとき用
    await page.evaluate((occl) => { localStorage.clear(); BS.app.S.debug = true; if (occl === '0') BS.app.S.rimOcclusion = false; }, process.env.OCCL || '');
    await page.setInputFiles('#fileVideo', file);
    await page.waitForFunction(() => BS.app.S.media && BS.app.S.media.ready && BS.app.duration() > 5, null, { timeout: 30000 });
    const scr = (x, y) => page.evaluate(([x, y]) => BS.app.toScreen(x, y), [x, y]);
    const drag = async (a, b) => { await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(b.x, b.y, { steps: 8 }); await page.mouse.up(); await sleep(150); };
    for (const i of [0, 1]) {
      const m = truth.marks[i];
      await page.evaluate((t) => BS.app.seek(t), m.t);
      await sleep(400);
      await page.click('#btnMark' + i);
      await drag(await scr(m.box.x, m.box.y), await scr(m.box.x + m.box.w, m.box.y + m.box.h));
      await drag(await scr(m.rim.cx - m.rim.w / 2, m.rim.cy), await scr(m.rim.cx + m.rim.w / 2, m.rim.cy));
    }
    await page.click('.teambtn[data-hoop="0"][data-team="1"]');
    await page.click('#btnRun');
    await page.waitForFunction(() => BS.app.S.running, null, { timeout: 10000 });
    await page.waitForFunction(() => !BS.app.S.running, null, { timeout: 1800000, polling: 1000 });
    const out = await page.evaluate(() => ({ result: BS.app.S.st.result, lastLog: BS.app.S.lastLog }));
    if (logOut) fs.writeFileSync(logOut, JSON.stringify({ file: path.basename(file), idx: out.lastLog && out.lastLog.idx, log: out.lastLog && out.lastLog.log, shots: out.result.shots }));
    if (errors.length) console.log('ページのエラー:', errors.slice(0, 3));
    return { truth, shots: out.result.shots, wall: out.result.wall };
  } finally { await browser.close(); await srv.close(); }
}

module.exports = { judge, summary, print };
if (require.main === module) {
  const file = path.resolve(process.argv[2]);
  analyse(file, process.argv[3] || 'dev', process.argv[4] ? path.resolve(process.argv[4]) : null).then(({ truth, shots, wall }) => {
    const res = judge(shots, truth);
    res.rows.filter((r) => r.s.rim || !r.d || r.d.made !== r.s.made).forEach((r) => console.log(`  ${r.s.t.toFixed(1).padStart(6)} ${r.s.made ? '入る' : '外れ'} ${(r.s.rim || (r.s.type === 'ft' ? 'FT' : 'きれい')).padEnd(9)} → ${r.d ? `${r.d.t.toFixed(1)} ${r.d.made ? '得点' : '外れ'}${r.d.sure === false ? '（要確認）' : ''}` : '★見つからない'}`));
    print(res, `${path.basename(file)}（解析 ${wall} 秒）`);
  }).catch((e) => { console.error(e); process.exit(1); });
}
