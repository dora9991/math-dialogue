// 台本の検査（音なし・ヘッドレス Chrome）：node hs-board/tools/check.mjs [ID…] [--shots DIR]
//   1) 全ステップを組み立てて：数式の書きまちがい（KaTeX のエラー）・黒板からのはみ出し・字幕にかくれる所・字幕が高すぎる所 を調べる
//   2) 通しテスト：Enter だけで最後（成績カード）まで行けるか（発問は 正解／まちがい の2通り）・← でもどれるか・ブラウザのエラー
//   --shots DIR を付けると、各ステップの写真（答えたあとの形）を DIR/<ID>/NNN.jpg に保存し、DIR/<ID>.sheet.jpg に1枚にまとめる（python3 + PIL）
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { spawn, execFileSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.dirname(HERE);
const args = process.argv.slice(2), si = args.indexOf('--shots'), SHOTS = si >= 0 ? path.resolve(args[si + 1]) : null;
let ids = args.filter((a, i) => !a.startsWith('--') && (si < 0 || i !== si + 1));
if (!ids.length) { const src = fs.readFileSync(path.join(ROOT, 'js/lessons.js'), 'utf8'); ids = [...src.matchAll(/id: '([^']+)'/g)].map(m => m[1]); }
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const prof = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'hbc-')), port = 9300 + Math.floor(Math.random() * 400);
const proc = spawn(CHROME, ['--headless=new', '--mute-audio', '--hide-scrollbars', '--no-first-run', '--allow-file-access-from-files', `--user-data-dir=${prof}`, `--remote-debugging-port=${port}`, '--window-size=1600,900', 'about:blank'], { stdio: 'ignore', detached: true });
let list = null; for (let i = 0; i < 80 && !list; i++) { await new Promise(r => setTimeout(r, 250)); try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch (e) { /* 起動待ち */ } }
const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let seq = 0; const wait = new Map(), logs = [];
ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m.result || m.error); wait.delete(m.id); } else if (m.method === 'Runtime.exceptionThrown') logs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); else if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) logs.push(m.params.args.map(a => a.value || a.description).join(' ')); };
const send = (method, params = {}) => new Promise(res => { const id = ++seq; wait.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
const ev = async e => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 500)); return r.result.value; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
await send('Page.enable'); await send('Runtime.enable'); await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });

let bad = 0;
for (const ID of ids) {
  logs.length = 0;
  await send('Page.navigate', { url: 'file://' + path.join(ROOT, 'play.html') + '?s=' + ID + '&step=0&auto=0' }); await sleep(1800);
  await ev('document.fonts.ready.then(() => true)');
  const n = await ev('HB_T.steps().length');
  const warns = [];
  if (SHOTS) fs.mkdirSync(path.join(SHOTS, ID), { recursive: true });
  for (let k = 0; k < n; k++) {
    // 発問は「いちばん長いまちがいの説明」を選んだ形で測る（字幕がいちばん高くなる）。考えてみようは答えを見た形
    const r = JSON.parse(await ev(`(async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      HB_T.go(${k}, true); const st = HB_T.steps()[${k}], a = st.ask;
      if (a && a.type === 'think') HB_T.reveal();
      else if (a) { const w = a.opts.map((o, i) => i).filter(i => i !== a.ok).sort((x, y) => String((a.why || {})[y] || '').length - String((a.why || {})[x] || '').length); HB_T.choose(w.length ? w[0] : a.ok); }
      HB_T.finish(); await sleep(60);
      const out = { err: [], over: [], hid: [], cap: 0 };
      document.querySelectorAll('.katex-error').forEach(e => out.err.push((e.getAttribute('title') || '') + ' :: ' + e.textContent.slice(0, 60)));
      const capTop = document.querySelector('#cap').getBoundingClientRect().top; out.cap = Math.round(900 - capTop);
      document.querySelectorAll('#cols .col').forEach((c, ci) => {
        const cr = c.getBoundingClientRect();
        c.querySelectorAll(':scope > .el').forEach(e => {
          const r = e.getBoundingClientRect(), name = (e.dataset.id || e.className.replace('el ', '')) + ' 「' + e.textContent.slice(0, 18) + '」';
          let right = r.right; e.querySelectorAll('.katex, svg, table').forEach(x => { right = Math.max(right, x.getBoundingClientRect().right); });
          if (right > cr.right + 2) out.over.push('列' + ci + ' 右へ ' + Math.round(right - cr.right) + 'px ' + name);
          if (r.bottom > 730 + 2) out.over.push('列' + ci + ' 下へ ' + Math.round(r.bottom - 730) + 'px ' + name);
          else if (r.bottom > capTop - 16) out.hid.push('列' + ci + ' 字幕に ' + Math.round(r.bottom - capTop + 16) + 'px ' + name);   // 字幕の上の見出し（発問など）の分も見る
        });
      });
      return JSON.stringify(out); })()`));
    const tag = `  #${String(k).padStart(2, '0')}`;
    r.err.forEach(x => warns.push(`${tag} ✗ 数式エラー ${x}`));
    r.over.forEach(x => warns.push(`${tag} ✗ はみ出し ${x}`));
    r.hid.forEach(x => warns.push(`${tag} ⚠ 字幕にかくれる ${x}`));
    if (r.cap > 330) warns.push(`${tag} ⚠ 字幕が高い（${r.cap}px）`);
    if (SHOTS) { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 }); fs.writeFileSync(path.join(SHOTS, ID, String(k).padStart(3, '0') + '.jpg'), Buffer.from(s.data, 'base64')); }
  }
  // 通しテスト
  const run = JSON.parse(await ev(`(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms)), key = k => window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
    const res = {};
    for (const mode of ['ok', 'ng']) {
      HB_T.go(0); let guard = 0;
      while (guard++ < 2000) {
        const st = HB_T.state(), k = HB_T.si(), s = HB_T.steps()[k];
        if (st === 'ask') { if (s.ask.type === 'think') { key('Enter'); await sleep(20); key('1'); } else { const w = s.ask.opts.findIndex((o, i) => i !== s.ask.ok); key(String((mode === 'ok' || w < 0 ? s.ask.ok : w) + 1)); } await sleep(20); continue; }
        if (st === 'ready' && k === HB_T.steps().length - 1) break;
        key('Enter'); await sleep(15);
      }
      res[mode] = { last: HB_T.si(), result: !document.querySelector('#result').classList.contains('hidden'), score: document.querySelector('#score').textContent };
    }
    HB_T.go(5); await sleep(50); key('ArrowLeft'); await sleep(30); key('ArrowLeft'); await sleep(30); res.back = HB_T.si();
    return JSON.stringify(res); })()`));
  if (!run.ok.result || run.ok.last !== n - 1) warns.push(`  ✗ 通しテスト（正解）で最後まで行けない：${JSON.stringify(run.ok)}`);
  if (!run.ng.result) warns.push(`  ✗ 通しテスト（まちがい）で最後まで行けない：${JSON.stringify(run.ng)}`);
  if (run.back !== 3) warns.push(`  ✗ もどるが動かない（${run.back}）`);
  logs.filter(x => !/favicon|fonts\.g/.test(x)).forEach(x => warns.push('  ✗ ブラウザ: ' + String(x).slice(0, 200)));
  const errs = warns.filter(w => w.includes('✗')).length;
  console.log(`${ID}  ${n}ステップ  発問の正解だけ: ${run.ok.score}  ${errs ? '✗' : warns.length ? '⚠' : '✓'}`);
  warns.forEach(w => console.log(w)); if (errs) bad++;
  if (SHOTS) { try { execFileSync('python3', [path.join(HERE, 'sheet.py'), path.join(SHOTS, ID)], { stdio: 'inherit' }); } catch (e) { console.log('  （写真のまとめは作れなかった）'); } }
}
try { process.kill(-proc.pid, 'SIGKILL'); } catch (e) { /* もう終わった */ }
process.exit(bad ? 1 : 0);
