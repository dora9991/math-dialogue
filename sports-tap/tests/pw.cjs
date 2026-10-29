// Playwright を読み込む（このフォルダに入れていなければ、パソコン全体に入れたものを使う）
//   入れ方の例：npm i -g playwright（ブラウザは npx playwright install chromium）
const path = require('path');
const { execSync } = require('child_process');
function load() {
  try { return require('playwright'); } catch (e) { /* 次へ */ }
  const g = execSync('npm root -g').toString().trim();
  return require(path.join(g, 'playwright'));
}
module.exports = load();
