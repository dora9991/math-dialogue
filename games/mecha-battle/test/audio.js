// 音のテスト：OfflineAudioContextで効果音とBGMを実際に描画し、無音・割れ・NaNがないか調べる
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({});
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '..', 'dist/standalone.html'));
  await page.waitForTimeout(300);
  const res = await page.evaluate(async () => {
    const out = { sfx: {}, bgm: {} };
    const stats = (buf) => {
      const d = buf.getChannelData(0); let peak = 0, sum = 0, nan = 0;
      for (let i = 0; i < d.length; i++) { const v = d[i]; if (v !== v) { nan++; continue; } const a = Math.abs(v); if (a > peak) peak = a; sum += v * v; }
      return { peak: +peak.toFixed(3), rms: +Math.sqrt(sum / d.length).toFixed(4), nan };
    };
    const mkctx = (secs) => { const oc = new OfflineAudioContext(1, 22050 * secs, 22050); Sound.on = true; Sound.setup(oc); return oc; };
    for (const name of Object.keys(SFX)) {
      const oc = mkctx(2);
      SFX[name](Sound);
      out.sfx[name] = stats(await oc.startRendering());
    }
    for (const name of Object.keys(BGM_DATA)) {
      const secs = 24, oc = mkctx(secs);
      let fake = 0;
      Object.defineProperty(oc, 'currentTime', { get: () => fake, configurable: true });
      Sound.track = BGM_DATA[name]; Sound.step = 0; Sound.nextT = 0;
      for (fake = 0; fake < secs - 1; fake += 0.05) Sound.pump();
      const buf = await oc.startRendering();
      const d = buf.getChannelData(0);
      const per = [];
      for (let s = 0; s < secs; s += 3) { let sum = 0; for (let i = s * 22050; i < Math.min(d.length, (s + 3) * 22050); i++) sum += d[i] * d[i]; per.push(+Math.sqrt(sum / (3 * 22050)).toFixed(3)); }
      out.bgm[name] = Object.assign(stats(buf), { rmsPer3s: per });
    }
    return out;
  });
  let bad = 0;
  for (const [k, v] of Object.entries(res.sfx)) { const flag = v.peak < 0.02 ? 'SILENT' : v.peak > 1 ? 'CLIP' : v.nan ? 'NAN' : ''; if (flag) { bad++; console.log('SFX', k, flag, JSON.stringify(v)); } }
  console.log('SFX count', Object.keys(res.sfx).length, 'problems', bad);
  console.log('peaks:', Object.entries(res.sfx).map(([k, v]) => k + ':' + v.peak).join('  '));
  for (const [k, v] of Object.entries(res.bgm)) console.log('BGM', k, JSON.stringify(v));
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no errors');
  await browser.close();
})();
