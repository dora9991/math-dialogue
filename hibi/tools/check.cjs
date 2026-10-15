#!/usr/bin/env node
/* ひびの手帳のテストを全部まとめて動かす（画面を通したテスト e2e.cjs は別。playwright が要るため）。
   使い方：node hibi/tools/check.cjs */
'use strict';
const { spawnSync } = require('child_process');
const path = require('path');
const run = (file, args = []) => spawnSync(process.execPath, [path.join(__dirname, file), ...args], { stdio: 'inherit' }).status;
let bad = 0;
console.log('━━ 計算（js/core.js）'); bad += run('check-core.cjs') ? 1 : 0;
console.log('━━ 裏側（gas/Code.gs）'); bad += run('check-gas.cjs') ? 1 : 0;
console.log('━━ つくり方の md が最新か'); bad += run('make-guide.cjs', ['--check']) ? 1 : 0;
if (!bad) console.log('ok');
console.log(bad ? `\n✗ ${bad} つが失敗` : '\n✓ ぜんぶ OK');
process.exit(bad ? 1 : 0);
