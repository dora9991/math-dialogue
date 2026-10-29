/* index.html に書いていない data/lesson_*.js を、授業のスクリプトのあとに足した HTML を返す（check.cjs・register.cjs が使う）。
   新しい授業のファイルを data/ に置くだけで、見た目の検査（check.cjs）にかけられる。index.html を書き換えるのは、register.cjs だけ。 */
const fs = require('fs');
const path = require('path');
exports.withLessons = root => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const have = new Set([...html.matchAll(/<script src="(data\/lesson_[^"]+\.js)"><\/script>/g)].map(m => m[1]));
  const added = fs.readdirSync(path.join(root, 'data')).filter(f => /^lesson_.*\.js$/.test(f)).map(f => 'data/' + f).filter(f => !have.has(f)).sort();
  if (!added.length) return { html, added };
  const tags = added.map(f => `<script src="${f}"></script>`).join('\n');
  const all = [...html.matchAll(/<script src="data\/lesson_[^"]+\.js"><\/script>\n?/g)];
  const last = all[all.length - 1], at = last.index + last[0].length;   // 授業のスクリプトの、いちばん最後のあと
  return { html: html.slice(0, at) + tags + '\n' + html.slice(at), added };
};
