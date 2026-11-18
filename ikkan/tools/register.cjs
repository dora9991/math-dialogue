#!/usr/bin/env node
/* data/ にある授業のファイル（lesson_*.js）のうち、index.html に書いていないものを、index.html に足す。何度実行してもよい。
   全部入りの HTML（bundle.cjs）を作る前に実行する。 */
const fs = require('fs');
const path = require('path');
const { withLessons } = require('./lib-index.cjs');
const root = path.resolve(__dirname, '..');
const { html, added } = withLessons(root);
if (added.length) fs.writeFileSync(path.join(root, 'index.html'), html);
console.log(added.length ? `index.html に ${added.length} 件を足した：${added[0]} …` : 'index.html は、そのまま（足すものはない）');
