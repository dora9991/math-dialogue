#!/usr/bin/env node
/* 成長のしくみ（js/grow.js）の検査：経験値とレベル・つづけた日数・バッジ・きょうのメニュー。ブラウザは使わない。
   使い方：node tools/grow-test.cjs */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const files = ['js/core.js', 'js/motion.js', 'js/aid.js', ...[...html.matchAll(/<script src="(data\/[^"]+)"><\/script>/g)].map((m) => m[1]), 'js/grow.js'];
for (const f of files) if (fs.existsSync(path.join(root, f))) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const BC = ctx.BC;
const G = BC.grow;
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) passes++; else { fails++; console.log('✗ ' + m); } };

// 経験値とレベル
ok([0, 49, 50, 149, 150, 299, 300, 500, 750].map(G.level).join() === '1,1,2,2,3,3,4,5,6', 'レベルの区切り');
const pr = G.progress(120);
ok(pr.level === 2 && pr.cur === 70 && pr.span === 100 && pr.toNext === 30, 'レベルの進み ' + JSON.stringify(pr));
ok(G.rank(1) === 'ルーキー' && G.rank(5) === 'レギュラー' && G.rank(10) === 'エース', 'レベルの呼び名');
ok([0, 29, 30, 80, 499, 500].map(G.stars).join() === '0,0,1,2,4,5', '技能の星');
ok(G.drillXP(5, 3) > G.drillXP(5, 1) && G.drillXP(5, 1) > G.drillXP(5, 2) && G.drillXP(60, 3) <= 34, '練習の経験値（できた ＞ むずかしかった ＞ まあまあ。上限あり）');

// つづけた日数（いまを 2026-10-25 12:00 として）
const now = new Date(2026, 9, 25, 12).getTime();
const day = (d, h = 17) => new Date(2026, 9, d, h).getTime();
const drill = (at, id = 'd-pound', skill = 'dribble', min = 5, rate = 2) => ({ at, type: 'drill', id, skill, min, rate, xp: G.drillXP(min, rate) });
let s = G.summary([drill(day(20)), drill(day(21)), drill(day(22)), drill(day(24)), drill(day(25))], now);
ok(s.streak === 2 && s.best === 3, `つづけた日数：今日まで2日・いちばん長い3日（${s.streak}・${s.best}）`);
s = G.summary([drill(day(22)), drill(day(23)), drill(day(24))], now);
ok(s.streak === 3, '今日まだでも、昨日までつづいていれば数える（' + s.streak + '）');
s = G.summary([drill(day(20)), drill(day(21))], now);
ok(s.streak === 0, '2日あくと 0');
// 月・年をまたぐ
s = G.summary([drill(new Date(2026, 8, 30, 9).getTime()), drill(new Date(2026, 9, 1, 9).getTime())], new Date(2026, 9, 1, 20).getTime());
ok(s.streak === 2 && s.best === 2, '月をまたいでつづく');
s = G.summary([drill(new Date(2025, 11, 31, 9).getTime()), drill(new Date(2026, 0, 1, 9).getTime())], new Date(2026, 0, 1, 20).getTime());
ok(s.streak === 2, '年をまたいでつづく');

// バッジ
const before = G.summary([], now);
const after = G.summary([drill(day(25, 7))], now);
const nb = G.newBadges(before, after).map((b) => b.id);
ok(nb.includes('first') && nb.includes('early'), 'はじめの一歩・朝れん ' + nb.join());
const many = [];
for (let i = 0; i < 12; i++) many.push(drill(day(1 + i), BC.lists.drill[i].id, 'shoot', 10, 3));
s = G.summary(many, now);
const got = G.badges(s).filter((b) => b.got).map((b) => b.id);
ok(got.includes('drill10') && got.includes('uniq10') && got.includes('streak7') && got.includes('shooter'), 'たくさん練習したときのバッジ ' + got.join());
ok(G.badges(s).length === G.BADGES.length && G.BADGES.every((b) => b.id && b.name && b.text && b.icon), 'バッジの形');
const goods = G.summary([], now, [{ metrics: [{ status: 'good' }, { status: 'good' }, { status: 'ok' }] }, { metrics: [{ status: 'good' }, { status: 'good' }, { status: 'good' }] }]);
ok(goods.goods === 5 && G.badges(goods).find((b) => b.id === 'good5').got, '動画チェックの ◎ を数える');

// きょうのメニュー
const profiles = [
  { level: 1, goals: ['dribble', 'shoot'], place: 'any', n: 1 },
  { level: 1, goals: ['shoot'], place: 'hoop', n: 1 },
  { level: 2, goals: ['pass'], place: '', n: 1 },
  { level: 2, goals: ['defball', 'finish'], place: 'hoop', n: 1 },
  { level: 2, goals: ['rebound'], place: '', n: 8 },
  { level: null, goals: [], place: 'any', n: 1 },
];
for (const me of profiles) {
  for (const min of [10, 15, 20, 30]) {
    for (const seed of [0, 1, 2]) {
      const t = G.today(me, min, seed, now);
      const label = `${JSON.stringify(me)} ${min}分 seed${seed}`;
      ok(t.items.length >= 2, `${label}：メニューが少ない（${t.items.length}）`);
      ok(Math.abs(t.min - min) <= 2, `${label}：時間 ${t.min}`);
      ok(new Set(t.items.map((x) => x.id)).size === t.items.length, `${label}：同じメニューが2回`);
      for (const x of t.items) {
        const d = BC.get(x.id);
        ok(d && BC.fits(d, { n: me.n, level: me.level, place: me.place || null, strict: true }), `${label}：条件に合わない ${x.id}`);
      }
      ok(t.items[0].role === 'warm', `${label}：はじめは じゅんび`);
    }
  }
}
// 同じ日・同じ seed なら同じメニュー、ちがう seed ならちがうメニュー
const a = G.today(profiles[0], 15, 0, now), b = G.today(profiles[0], 15, 0, now + 3600e3), c = G.today(profiles[0], 15, 1, now);
ok(JSON.stringify(a) === JSON.stringify(b), '同じ日は同じメニュー');
ok(JSON.stringify(a.items) !== JSON.stringify(c.items), '「ほかのメニュー」で変わる');
const p = G.today({ level: 2, goals: ['transition'], place: '', n: 1 }, 15, 0, now);
ok(p.note && p.skill !== 'transition', 'ひとりでできないわざは、ほかのわざにして わけを書く');
const q = G.today({ level: 1, goals: ['pass'], place: 'any', n: 1 }, 15, 0, now);
ok(q.skill === 'pass' && q.items.some((x) => x.id === 'd-wallpass'), 'パスが目標なら、ひとりでも かべパス');

console.log(`\n${fails ? '✗' : '✓'} ${passes} 合格・${fails} 不合格`);
process.exit(fails ? 1 : 0);
