// 使い方: node blind_e1.cjs <担当名...>   out/<担当名>.json から、答えを伏せた問題ファイル blind/<担当名>.txt と、図の画像 blind/figs/<id>.png、答え合わせ用 keys/<担当名>.key.json を作る
const fs = require('fs'); const path = require('path'); const { chromium } = require('playwright');
const L = 'ABCD';
const CSS = '.fg-l{stroke:currentColor;fill:none}.fg-bg{fill:#fff}.fg-dot{fill:currentColor}.fg-t{fill:currentColor;font-family:sans-serif}.fg-soft{fill:#e3eafb}.fg-acc{fill:#d9461f} .fg-acc-l{stroke:#d9461f}.fg-acc-fill{fill:#d9461f;opacity:.85}.fg-hand{stroke-linecap:round}body{margin:0;color:#1b2447;background:#fff}';
(async () => {
  fs.mkdirSync('blind/figs', { recursive: true }); fs.mkdirSync('keys', { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ deviceScaleFactor: 2 });
  for (const tag of process.argv.slice(2)) {
    const items = JSON.parse(fs.readFileSync(`out/${tag}.json`, 'utf8'));
    const key = {}; let txt = `# 問題 ${items.length} 問（4択）。各問題の「### id」の下に、問題文と選択肢 A〜D。図がある問題は、図の画像ファイル（このフォルダからの相対パス）を書いてある。\n\n`;
    let nf = 0;
    for (const it of items) {
      key[it.id] = L[it.c.findIndex(x => x.k === 1)];
      let fig = '';
      if (it.f) {
        const png = `figs/${it.id}.png`;
        await p.setContent(`<html><head><style>${CSS}</style></head><body><div id="f" style="display:inline-block;padding:8px">${it.f}</div></body></html>`);
        await (await p.$('#f')).screenshot({ path: path.join('blind', png) }); nf++;
        fig = `（図：blind/${png}）\n`;
      }
      txt += `### ${it.id}\n${fig}${it.q}\n` + it.c.map((x, i) => `${L[i]}. ${x.t}`).join('\n') + '\n\n';
    }
    fs.writeFileSync(`blind/${tag}.txt`, txt); fs.writeFileSync(`keys/${tag}.key.json`, JSON.stringify(key));
    console.log(tag, items.length, '問・図', nf);
  }
  await b.close();
})();
