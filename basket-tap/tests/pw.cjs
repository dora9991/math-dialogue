// Playwright を読み込む（このフォルダに入れていなければ、パソコン全体に入れたものを使う）
//   入れ方の例：npm i -g playwright（ブラウザは npx playwright install chromium）
//   Playwright の Chromium がないときは、playwright-core とパソコンの Chrome でも動く：
//     PW=…/node_modules/playwright-core CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node basket-tap/tests/e2e.cjs dev
const path = require('path');
const { execSync } = require('child_process');
function wrap(pw) {
  // CHROME があれば、そのブラウザで（音は出さない）
  if (process.env.CHROME && pw.chromium && !pw.chromium.__wrapped) {
    const orig = pw.chromium.launch.bind(pw.chromium);
    pw.chromium.launch = (o) => orig(Object.assign({ executablePath: process.env.CHROME }, o || {}, { args: [...((o && o.args) || []), '--mute-audio'] }));
    pw.chromium.__wrapped = true;
  }
  return pw;
}
function load() {
  if (process.env.PW) return wrap(require(process.env.PW));
  try { return wrap(require('playwright')); } catch (e) { /* 次へ */ }
  const g = execSync('npm root -g').toString().trim();
  return wrap(require(path.join(g, 'playwright')));
}
module.exports = load();
