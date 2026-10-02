// データ（年間計画・授業構想・ワークシート・演習プリント・小テスト）を JSON で書き出す（検算・一覧づくり用）。
// 使い方: node tools/dump.cjs > all.json
const fs = require('fs'), path = require('path'), vm = require('vm');
const dir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="(data\/[^"]+)"/g)].map(m => m[1]);
const ctx = { console }; ctx.window = ctx; vm.createContext(ctx);
for (const f of files) vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f });
const D = ctx.window.LDB;
process.stdout.write(JSON.stringify({ units: D.units, lessons: D.lessons, worksheets: D.worksheets || {}, drills: D.drills || {}, quizzes: D.quizzes || {}, about: D.about || null }));
