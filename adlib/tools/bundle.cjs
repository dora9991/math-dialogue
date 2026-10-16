#!/usr/bin/env node
/* 全部を 1 つの HTML ファイルにまとめる（index.html の CSS・スクリプトを、順番どおりに埋めこむ）。
   できたファイルは、ダブルクリックでそのままブラウザで開ける（フォルダごと持ち歩かなくてよい）。
   使い方：  node tools/bundle.cjs [出力先]      … 既定：adlib-all-in-one.html
   js/ や css/ を直したら、もう一度実行して作り直す（できたファイルは、手で直さない）。 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = path.resolve(process.argv[2] || path.join(root, 'adlib-all-in-one.html'));
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
let html = read('index.html');

// 1) CSS を <style> に
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, f) => `<style>\n${read(f)}\n</style>`);   // 関数で返す（文字列で返すと $& などが特別あつかいされる）

// 2) スクリプトを順番どおり 1 つにして、body の最後へ
const files = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
const js = files.map(f => `/* ---- ${f} ---- */\n${read(f)}`).join('\n').replace(/<\/script/gi, '<\\/script');
html = html.replace(/<script src="[^"]+"><\/script>\n?/g, '');
html = html.replace('</body>', () => `<script>\n${js}\n</script>\n</body>`);

// 3) 楽譜のグリフ（Bravura）のライセンスを、ファイルの先頭に残す
let lic = '';
// HTML のコメントの中には「--」を書けないので、ハイフンの連続は「=」にかえる
try { lic = read('LICENSES.txt').replace(/-{2,}/g, m => '='.repeat(m.length)); } catch (e) { /* なくてもよい */ }
html = html.replace('<!doctype html>', () => `<!doctype html>\n<!--\n${lic}\n-->`);

fs.writeFileSync(out, html);
console.log(`書き出した：${out}（${Math.round(Buffer.byteLength(html) / 1024)} KB、スクリプト ${files.length} 本）`);
