// 使い方: node anscheck.cjs <out の json...>  解説 e の さいごの「こたえ …」と、正解の 選択肢の 文が 合わない 問題を 出す（目で 確かめる 候補）
const fs = require('fs');
const norm = s => String(s).replace(/[\s　]/g, '').replace(/[。、．，]/g, '').replace(/[（）()]/g, '');
let n = 0, bad = 0;
for (const f of process.argv.slice(2)) for (const it of JSON.parse(fs.readFileSync(f, 'utf8'))) {
  n++;
  const last = String(it.e).trim().split('\n').pop(); const m = last.match(/こたえ\s*(.*)$/); if (!m) { console.log('こたえ行なし', it.id); bad++; continue; }
  const a = norm(m[1]); const k = it.c.find(c => c.k); const t = norm(k.t);
  if (a === t || a.includes(t) || t.includes(a)) continue;
  // ほかの 選択肢の 方が 合う ときは 強い 警告
  const other = it.c.find(c => !c.k && (norm(c.t) === a || a.includes(norm(c.t)) && norm(c.t).length > 1));
  console.log((other ? '★ほかの選択肢と一致 ' : '  ') + it.id + '  こたえ「' + m[1] + '」 正解の選択肢「' + k.t + '」' + (other ? ' ← 「' + other.t + '」' : '')); bad++;
}
console.log('問題', n, '要確認', bad);
