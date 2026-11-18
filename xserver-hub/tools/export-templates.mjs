// line-hub の「ひな形」（src/templates.js）を、ハブが読む app/data/templates.json に書き出す。
// line-hub 側のひな形を変えたら、これで書き出し直す（ハブの Templates.php は、この JSON を読むだけ）。
//
//   node tools/export-templates.mjs <line-hub の src フォルダ> > app/data/templates.json
//
// templates.js の中の DEFS（ひな形の中身を作る関数）は外に出ていないので、写しを作って出口を1行足してから読む（元のファイルは変えない）。

import { mkdtempSync, readFileSync, writeFileSync, rmSync, readdirSync, copyFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

const src = resolve(process.argv[2] ?? '');
if (!process.argv[2]) {
  console.error('使い方：node tools/export-templates.mjs <line-hub の src フォルダ> > app/data/templates.json');
  process.exit(1);
}
const dir = mkdtempSync(join(tmpdir(), 'lh-templates-'));
try {
  for (const f of readdirSync(src)) if (f.endsWith('.js')) copyFileSync(join(src, f), join(dir, f));
  writeFileSync(join(dir, 'templates.js'), readFileSync(join(src, 'templates.js'), 'utf8') + '\nexport const __DEFS = Object.fromEntries(Object.entries(DEFS).map(([k, f]) => [k, f()]));\n');
  const m = await import(pathToFileURL(join(dir, 'templates.js')).href);
  let rev = '';
  try {
    rev = execSync('git log -1 --format=%h', { cwd: src, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {}
  const out = { source: `line-hub src/templates.js（${rev || '版不明'}）から書き出し`, templates: m.TEMPLATES, genie_attributes: m.GENIE_ATTRIBUTES, defs: m.__DEFS };
  process.stdout.write(JSON.stringify(out, null, 1));
} finally {
  rmSync(dir, { recursive: true, force: true });
}
