// ジャンプの最高点でも、頭が体力ゲージ（上の黒い帯）にかからないことを、実際に描いて確かめる
//   node test/jump-gauge.js          … dist/standalone.html（python3 build.py で作る）を使う
// 8キャラそれぞれ、ふつうのジャンプ／最高点で空中パンチ／最高点で空中キック の3通りを、1フレームごとに描いて、
// いちばん上の不透明ピクセルの行を調べる。ゲージ・タイマー枠は、行 0〜25 にある（scenes.js の drawHUD）。
//   ・かからない … いちばん上の行が 26 以上
//   ・ぎりぎりまで跳んでいる … いちばん上の行が 29 以下（高さを控えめにしすぎていない）
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BAR_BOTTOM_ROW = 25;
const TOP_LIMIT = 29;

(async () => {
  const browser = await chromium.launch({});
  const page = await (await browser.newContext({ viewport: { width: 700, height: 640 } })).newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('file://' + path.join(ROOT, 'dist/standalone.html'));
  await sleep(400);
  let bad = 0;
  const check = (name, cond, extra) => { if (!cond) bad++; console.log((cond ? '  ok   ' : '  FAIL ') + name + (extra ? '   ' + extra : '')); };
  for (let i = 0; i < 8; i++) {
    await page.evaluate((i) => { window.__mecha.Game.go('fight', { chars: [i, (i + 4) % 8], lvl: 0, mode: 'vs', versus: false }); window.__mecha.Game.hold = true; }, i);
    await sleep(120);
    const rows = [];
    for (const variant of ['jump', 'punch', 'kick']) {
      const r = await page.evaluate((variant) => {
        const M = window.__mecha, m = M.Game.scene.m, IN = M.Input && window.IN ? window.IN : { UP: 1, A: 16, B: 32 };
        m.phase = 'fight'; m.timer = 60 * 600; m.f[0].x = 128 * 256; m.f[1].x = 240 * 256;
        const J = CHARS[m.f[0].ch].jump, atkAt = variant === 'jump' ? -1 : Math.round(J.t / 2) - 1;
        const cv = document.createElement('canvas'); cv.width = 256; cv.height = 224;
        const c = cv.getContext('2d');
        const topRow = () => {
          c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 256, 224);
          drawFighter(c, m.f[0], m, 0);
          const d = c.getImageData(0, 0, 256, 224).data;
          for (let y = 0; y < 224; y++) for (let x = 0; x < 256; x++) if (d[(y * 256 + x) * 4 + 3] > 8) return y;
          return 224;
        };
        let min = 224, minAt = -1, peak = 0;
        M.stepMatch(m, IN.UP, 0);
        for (let t = 1; t < 200 && m.f[0].st !== 'idle'; t++) {
          M.stepMatch(m, t === atkAt ? (variant === 'punch' ? IN.A : IN.B) : 0, 0);
          peak = Math.max(peak, m.f[0].y);
          const r = topRow(); if (r < min) { min = r; minAt = t; }
        }
        return { min, minAt, peak: peak / 256, name: CHARS[m.f[0].ch].en, t: J.t };
      }, variant);
      rows.push([variant, r]);
    }
    const worst = Math.min(...rows.map((x) => x[1].min));
    const name = rows[0][1].name;
    const detail = rows.map(([v, r]) => v + ':行' + r.min).join(' ') + '  高さ ' + rows[0][1].peak.toFixed(1) + 'px  滞空 ' + rows[0][1].t + 'f';
    check(name + '：頭がゲージにかからない（いちばん上の行 ≥ ' + (BAR_BOTTOM_ROW + 1) + '）', worst > BAR_BOTTOM_ROW, detail);
    check(name + '：ぎりぎりまで跳んでいる（いちばん上の行 ≤ ' + TOP_LIMIT + '）', rows[0][1].min <= TOP_LIMIT, detail);
  }
  check('エラーなし', errs.length === 0, errs.join('|'));
  console.log(bad ? 'FAILED ' + bad : 'ALL PASSED');
  await browser.close();
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('EXC', e); process.exit(1); });
