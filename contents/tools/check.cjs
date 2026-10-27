#!/usr/bin/env node
/* データの検査：data/items.js を読みこんで、書き方・リンク先・載せ忘れを調べる（ブラウザは使わない）。
   使い方：  node contents/tools/check.cjs
   調べること：①必須の項目・分類／状態／配りかたの書きまちがい・id の重複・説明の長さ（120字まで）
              ②limited（限定配布）・personal（自分用）に live／file が書かれていないか（生徒に配るURLを一覧に出さないため）
              ③dir・file がリポジトリの中にあるか／live の先（フォルダ）がリポジトリか public/ にあるか
              ④リポジトリの直下に、index.html か README.md のあるフォルダで、一覧にも skip にも入っていないもの（載せ忘れ）
   まちがい（✗）が1つでもあれば、終了コード 1 で終わる。注意（△）だけなら 0。 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const repo = path.resolve(root, '..');
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
try {
  vm.runInContext(fs.readFileSync(path.join(root, 'data', 'items.js'), 'utf8'), ctx, { filename: 'data/items.js' });
} catch (e) {
  console.log(`✗ data/items.js を読みこめない：${e.message}`);
  process.exit(1);
}
const CB = ctx.CB;
const errors = [];
const warns = [];
const keys = (list) => list.map((x) => x.key);
const exists = (p) => fs.existsSync(path.join(repo, p));

const ids = new Set();
for (const it of CB.items) {
  const at = `${it.id || '(idなし)'}`;
  for (const k of ['id', 'title', 'summary', 'cat', 'who', 'status', 'access', 'how']) {
    if (!it[k] || (Array.isArray(it[k]) && !it[k].length)) errors.push(`${at}：${k} が空です`);
  }
  if (typeof it.dir !== 'string') errors.push(`${at}：dir がありません（リポジトリの直下なら ''）`);
  if (it.id) {
    if (!/^[a-z0-9-]+$/.test(it.id)) errors.push(`${at}：id は半角の英小文字・数字・ハイフンだけにしてください`);
    if (ids.has(it.id)) errors.push(`${at}：id が重複しています`);
    ids.add(it.id);
  }
  if (it.cat && !keys(CB.cats).includes(it.cat)) errors.push(`${at}：cat「${it.cat}」は cats にありません`);
  if (it.status && !keys(CB.status).includes(it.status)) errors.push(`${at}：status「${it.status}」は status にありません`);
  if (it.access && !keys(CB.access).includes(it.access)) errors.push(`${at}：access「${it.access}」は access にありません`);
  for (const w of it.who || []) if (!keys(CB.who).includes(w)) errors.push(`${at}：who「${w}」は who にありません`);
  if (it.summary && [...it.summary].length > 120) warns.push(`${at}：summary が ${[...it.summary].length} 字あります（120字まで）`);

  if (it.access !== 'open' && (it.live != null || it.file != null)) {
    errors.push(`${at}：${it.access} には live／file を書かないでください（配るURLを一覧に出さないため）`);
  }
  if (typeof it.dir === 'string' && it.dir && !exists(it.dir)) errors.push(`${at}：dir「${it.dir}」がリポジトリにありません`);
  if (it.file && !exists(it.file)) errors.push(`${at}：file「${it.file}」がリポジトリにありません`);
  if (typeof it.live === 'string' && it.live !== '/') {
    const top = it.live.split('/')[0];
    if (!exists(top) && !exists(path.join('public', top))) warns.push(`${at}：live「${it.live}」の先が、リポジトリにも public/ にもありません（READMEなどに公開先の記載があるか確かめてください）`);
  }
}

// 載せ忘れ：直下のフォルダで、アプリらしいもの（index.html か README.md がある）が一覧にない
const listed = CB.items.map((it) => it.dir).filter(Boolean);
for (const d of fs.readdirSync(repo, { withFileTypes: true })) {
  if (!d.isDirectory() || d.name.startsWith('.') || CB.skip.includes(d.name)) continue;
  if (!exists(path.join(d.name, 'index.html')) && !exists(path.join(d.name, 'README.md')) && !fs.readdirSync(path.join(repo, d.name)).some((s) => exists(path.join(d.name, s, 'README.md')))) continue;
  if (!listed.some((p) => p === d.name || p.startsWith(d.name + '/'))) warns.push(`載せ忘れかも：${d.name}/ が一覧にありません（載せないなら data/items.js の skip に足す）`);
}

for (const e of errors) console.log('✗ ' + e);
for (const w of warns) console.log('△ ' + w);
const by = {};
for (const it of CB.items) by[it.cat] = (by[it.cat] || 0) + 1;
console.log(`${CB.items.length} 件（${CB.cats.map((c) => `${c.label} ${by[c.key] || 0}`).join('・')}）／ まちがい ${errors.length}・注意 ${warns.length}`);
if (errors.length) process.exitCode = 1;
