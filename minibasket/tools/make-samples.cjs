#!/usr/bin/env node
/* samples/*.json（背番号だけに匿名化した3試合）を、画面から使える js/samples.js にする。
   使い方：  node minibasket/tools/make-samples.cjs   （samples/ を変えたら、もう一度実行）
   ※ check.cjs が、js/samples.js が samples/ と合っているかを確かめる */
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'samples');
const files = fs.readdirSync(dir).filter(f => /^game\d+\.json$/.test(f)).sort();
const games = files.map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
const body = `/* 自動生成：node minibasket/tools/make-samples.cjs（手で直さない）。samples/ の ${files.join('・')} を並べたもの。選手の氏名は入っていない。 */
window.MB = window.MB || {};
window.MB.SAMPLES = ${JSON.stringify(games)};
`;
const out = process.argv[2] || path.join(__dirname, '..', 'js', 'samples.js');
fs.writeFileSync(out, body);
console.log(`書き出した：${path.relative(process.cwd(), out)}（${games.length}試合、${Math.round(Buffer.byteLength(body) / 1024)} KB）`);
