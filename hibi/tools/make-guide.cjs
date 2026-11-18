#!/usr/bin/env node
/* js/guide.js（ショートカットのつくり方）から docs/shortcuts.md をつくる。
   使い方：node hibi/tools/make-guide.cjs        … 書き出す
          node hibi/tools/make-guide.cjs --check … 最新か確かめるだけ（古ければ終了コード 1） */
'use strict';
const fs = require('fs');
const path = require('path');
const guide = require('../js/guide.js');
const out = path.join(__dirname, '..', 'docs', 'shortcuts.md');
const md = guide.markdown() + '\n';
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
  if (cur !== md) { console.log('docs/shortcuts.md が古い：node hibi/tools/make-guide.cjs で作り直す'); process.exit(1); }
  process.exit(0);
}
fs.writeFileSync(out, md);
console.log('書き出した：hibi/docs/shortcuts.md');
