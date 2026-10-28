#!/usr/bin/env node
/* 『数学の単語帳』を本（B5・縦・左とじ）のPDFにする。
   使い方：  node book/build.cjs          … book/dist/book.html をつくる（ブラウザで開いて見られる）
            node book/build.cjs --pdf    … 検査（はみ出し）のあと、pdf/数学の単語帳_小3-中3.pdf を書き出す（Playwright が要る）
   中身：表紙・見返し・扉・はじめに・使い方・目次 → 序章（ハンドブックの考え方）→ 第1〜3章（学年順：読む→覚える→計算する）→ 合格チェック表・奥付・裏表紙
   問題は js/ の「単元・STEP・セット番号」から作る（同じ番号なら同じ問題）。1STEPにつき、セット1〜sets を載せる。答えは赤字で同じページに印刷（赤シートでかくせる）。
   書体：book/fonts/ に Noto Sans JP・Noto Serif JP（静的な 400/500/700/900）を置く。なければ、手元のフォントで代用する（book/get-fonts.sh）。
   設定：book/config.json（author・publisher・date・edition・sets）。空の項目は、奥付に出さない。 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const here = __dirname;
const root = path.resolve(here, '..');
const args = process.argv.slice(2);

/* ---------------- 設定 ---------------- */
const cfgFile = path.join(here, 'config.json');
const cfg = Object.assign({ author: '', publisher: '', date: '2026年10月28日', edition: '初版', sets: 2 }, fs.existsSync(cfgFile) ? JSON.parse(fs.readFileSync(cfgFile, 'utf8')) : {});
const SETS = Math.max(1, cfg.sets | 0);

/* ---------------- 問題づくりの部品を読む ---------------- */
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['core', 'units-basic', 'units-frac', 'units-misc', 'figs', 'units-geo', 'units-vocab', 'handbook']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8'), ctx, { filename: f + '.js' });
}
const TG = ctx.TG;
const esc = TG.esc;
const H = TG.html;

/* ---------------- 章のつくり（学年順。ハンドブックの §1〜§3 に合わせる） ---------------- */
const CH = [
  { n: 1, grade: '小3〜小4', title: '整数の語彙と計算', hb: 's1', vocab: ['vkuku'], drills: ['add1', 'sub1', 'mul1', 'div1', 'add2', 'sub2', 'mul2', 'div2', 'time'], hbGroups: [[0, 1, 2]], drillName: '計算する', drillSub: '1分トレーニング' },
  { n: 2, grade: '小5〜小6', title: '小数・分数・割合', hb: 's2', vocab: ['vfrac', 'v360', 'vtime', 'vpi'], drills: ['fmul', 'fdiv', 'dadd', 'dsub', 'ratio', 'unit', 'area', 'volume'], hbGroups: [[0, 1], [2, 3, 4]], drillName: '計算する', drillSub: '1分トレーニング' },
  { n: 3, grade: '中1〜中3', title: '代数と根号', hb: 's3', vocab: ['vsq', 'vpow', 'vroot', 'vcomp', 'vtri'], drills: ['vrule'], hbGroups: [[0, 1, 2], [3, 4, 5]], drillName: '使う', drillSub: '作法ドリル' },
];
const chOfUnit = {};
CH.forEach((c) => [...c.vocab, ...c.drills].forEach((u) => { chOfUnit[u] = c; }));

/* ---------------- ページをためる ---------------- */
const pages = [];            // { n, html }
const toc = [];              // { l, title, n, ch, g }
const refs = {};             // ページ番号の参照（{{p:キー}} を、あとで数字にする）
const numWord = (n) => '①②③④⑤⑥⑦⑧⑨'[n - 1];

function runHead(o) {
  if (o.norun) return '';
  return '<div class="run">' + (o.run || '数学の単語帳') + '</div>';
}
function add(o) {
  const n = pages.length + 1;
  const par = n % 2 ? 'odd' : 'even';
  const run = par === 'odd' ? (o.run || '数学の単語帳') : '数学の単語帳　小3〜中3編';
  const html = `<section class="pg ${par}${o.ch ? ' c' + o.ch : ''} ${o.cls || ''}" id="p${n}" data-n="${n}"${o.style ? ` style="${o.style}"` : ''}>${o.tab ? '<div class="tab"></div>' : ''}${o.norun ? '' : `<div class="run">${run}</div>`}${o.raw || ''}${o.body ? `<div class="in">${o.body}</div>` : ''}${o.nofolio ? '' : `<div class="folio"><i></i>${n}</div>`}</section>`;
  pages.push({ n, html });
  if (o.ref) refs[o.ref] = n;
  return n;
}
const nextIsRecto = () => (pages.length + 1) % 2 === 1;
function memoPage(ch) {
  let lines = '';
  for (let y = 22; y < 224; y += 9) lines += `<div class="ln" style="top:${y}mm"></div>`;
  return add({ cls: 'memo-pg', ch, tab: !!ch, body: `<div class="mt">MEMO</div>${lines}` });
}
function needRecto(ch) { if (!nextIsRecto()) memoPage(ch); }

/* ---------------- 問題の行 ---------------- */
const plain = (s) => String(s).replace(/\{\d+\/\d+\}/g, 'xx').replace(/\^\{\d+\}/g, 'x');
function qLine(it) {
  const pre = it.pre ? `<span class="pre">${H(it.pre)}</span>` : '';
  const eq = it.eq ? '<span class="eq">＝</span>' : '';
  const frac = /^\{\d+\/\d+\}$/.test(it.ans);
  const slot = `<span class="slot${frac ? ' sf' : ''}"><span class="a">${H(it.ans)}</span></span>`;
  const post = it.post ? `<span class="po">${H(it.post)}</span>` : '';
  return pre + eq + slot + post;
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function fontSize(items) {
  const m = Math.max(...items.map((it) => plain(it.pre + it.post + it.ans).length + (it.eq ? 2 : 0)));
  const s = m <= 20 ? 5.3 : m <= 26 ? 4.9 : m <= 32 ? 4.5 : 4.1;
  return items.some((it) => /\{\d+\/\d+\}/.test(it.pre + it.ans + it.post)) ? Math.min(s, 4.6) : s;   // 立てて書く分数は、行の高さをとる
}
function ansWidth(items) {
  const m = Math.max(...items.map((it) => plain(it.ans).length));
  return clamp(m * 0.62 + 0.9, 2.4, 9).toFixed(1);
}
const rowsHTML = (items, from, hard) => `<ol class="rows${hard ? ' hard' : ''}" start="${from + 1}">${items.map((it, i) => `<li class="rw"><span class="no">${from + i + 1}</span>${it.fig ? `<span class="fg">${it.fig}</span>` : ''}<span class="qt">${qLine(it)}</span></li>`).join('')}</ol>`;

/* ---------------- 1分トレーニングの1ページ ---------------- */
// part：'all'＝20問（前半10＋後半10）／0＝前半だけ／1＝後半だけ（図つきの単元は、前半と後半を別のページにする）
function drillBody(set, part, setNo, mini) {
  const u = set.unit, st = set.stepInfo, items = set.items, h2 = set.half;
  const lo = part === 1 ? h2 : 0, hi = part === 0 ? h2 : items.length;
  const sub = items.slice(lo, hi);
  const hd = (tag, cls, inner) => (mini ? `<div class="${cls}">${inner}</div>` : `<${tag} class="${cls}">${inner}</${tag}>`);
  const partLabel = part === 0 ? '　前半' : part === 1 ? '　後半' : '';
  const front = part === 'all' || part === 0, back = part === 'all' || part === 1;
  const fig = u.layout === 'fig';
  return `<div class="dh"><div class="l"><div class="un">${esc(u.name)}</div><div class="st"><span class="stb">STEP ${set.step}</span>${hd('h3', 'stn', esc(st.name))}</div></div>
      <div class="r"><div class="set">セット ${setNo}${partLabel}</div><div class="gl">1分で<b>${set.goal}</b>問</div></div></div>
    <div class="rec"><span>日付<u></u></span><span>○の数<u class="s"></u>／${sub.length}</span></div>
    ${front ? `<div class="bar"><span>前半</span><small>ふつうの問題（1〜${h2}）</small></div>${rowsHTML(items.slice(0, h2), 0, false)}` : ''}
    ${back ? `<div class="bar hard"><span>後半</span><small>少しむずかしい：${esc(st.name2)}（${h2 + 1}〜${items.length}）</small></div>${rowsHTML(items.slice(h2), h2, true)}` : ''}
    <div class="dfoot"><span><span class="rd">赤字</span>は答え。赤シートでかくせます。</span><span>${esc(u.name)} ／ STEP ${set.step} ／ セット ${setNo}${partLabel}</span></div>`;
}
function drillStyle(set) { return `--fs:${fontSize(set.items)}mm;--aw:${ansWidth(set.items)}`; }

/* ---------------- ハンドブック・文章 ---------------- */
const hbBlock = (b) => {
  const unit = b.deck ? TG.unit(b.deck) : null;
  const go = unit ? `<p class="go">▶ ${b.kind === 'vocab' ? '覚える' : 'くり返す'}：<a href="#p{{p:${b.deck}}}">${esc(unit.name)}（p.{{p:${b.deck}}}）</a></p>` : '';
  return `<article class="hb ${b.kind}"><h3><span class="tg">${b.kind === 'vocab' ? '語彙' : '作法'}</span>${esc(b.title)}</h3>${b.html}${b.memo ? `<p class="memo"><b>先生メモ</b>${esc(b.memo)}</p>` : ''}${go}</article>`;
};

/* ---------------- 表紙のストップウォッチ ---------------- */
function dialSVG(opts) {
  const o = Object.assign({ sweep: 40, stroke: '#9fb4d6', accent: '#f2b134', text: '#ffffff', numerals: true }, opts || {});
  const cx = 80, cy = 80, R = 70;
  let t = '';
  for (let i = 0; i < 60; i++) {
    const major = i % 5 === 0, a = (i / 60) * 2 * Math.PI - Math.PI / 2, r1 = R, r2 = R - (major ? 8 : 4);
    t += `<line x1="${cx + r1 * Math.cos(a)}" y1="${cy + r1 * Math.sin(a)}" x2="${cx + r2 * Math.cos(a)}" y2="${cy + r2 * Math.sin(a)}" stroke="${o.stroke}" stroke-width="${major ? 1.6 : 0.7}"/>`;
  }
  const a1 = (o.sweep / 60) * 2 * Math.PI - Math.PI / 2, rr = R - 12;
  const large = o.sweep > 30 ? 1 : 0;
  const arc = `<path d="M${cx},${cy - rr} A${rr},${rr} 0 ${large} 1 ${cx + rr * Math.cos(a1)},${cy + rr * Math.sin(a1)}" fill="none" stroke="${o.accent}" stroke-width="3" stroke-linecap="round"/>`;
  const hand = `<line x1="${cx}" y1="${cy}" x2="${cx + (R - 6) * Math.cos(a1)}" y2="${cy + (R - 6) * Math.sin(a1)}" stroke="${o.accent}" stroke-width="2" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="3.2" fill="${o.accent}"/>`;
  const num = o.numerals ? [['60', 0], ['15', 15], ['30', 30], ['45', 45]].map(([s, v]) => { const a = (v / 60) * 2 * Math.PI - Math.PI / 2; return `<text x="${cx + (R - 19) * Math.cos(a)}" y="${cy + (R - 19) * Math.sin(a) + 3.4}" text-anchor="middle" font-size="9.5" font-weight="700" fill="${o.text}" font-family="BkSans,sans-serif">${s}</text>`; }).join('') : '';
  return `<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="${cx}" cy="${cy}" r="${R + 5}" fill="none" stroke="${o.stroke}" stroke-width="1.2"/>${arc}${t}${num}${hand}</svg>`;
}

/* ---------------- 前付け ---------------- */
function frontMatter() {
  // 1 表紙
  add({ cls: 'cover', norun: true, nofolio: true, raw: `<div class="tabs"><i></i><i></i><i></i></div><div class="dial">${dialSVG()}</div>
    <div class="t1">数学の<br>単語帳</div><div class="t2"><b>計算効率ハンドブック</b><br>＋ 1分トレーニング</div><div class="grade">小3〜中3編</div><div class="tag">頭の中で、<br>1分ずつ。</div>` });
  // 2 ページの見かた（見返し）
  const demo = TG.makeSet('add1', 2, 1);
  const mini = `<div class="mini"><div class="scale"><div class="pg odd c1 drill" style="${drillStyle(demo)};margin:0"><div class="in">${drillBody(demo, 'all', 1, true)}</div></div></div>
    ${[[5, 5], [87, 5], [87, 18], [5, 22.6], [35.6, 26.7], [5, 74], [3, 36]].map((p, i) => `<div class="co" style="left:${p[0]}mm;top:${p[1]}mm">${i + 1}</div>`).join('')}</div>`;
  const legend = ['単元の名前と STEP。STEP が上がるほど、むずかしくなります。', 'セット番号と、1分の目標（合格ライン）。目標以上に ○ がついたら合格です。', '記録欄。日付と、○ の数を書きます。', '<b>前半（10問）</b>。そのSTEPの、ふつうの問題です。', '<b>赤字は答え</b>。赤シートでかくせます。ペアの出題者は、これを見て ○ をつけます。', '<b>後半（10問）</b>。同じSTEPの中で、少しだけむずかしい問題。早く終わった人は、ここへ。', '問題の番号。1分で、どこまで進めたかを数えます。'];
  add({ cls: 'howpg txt', ch: 0, body: `<h1><small>HOW TO READ</small>ページの見かた</h1><div>${mini}<ul class="legend">${legend.map((t, i) => `<li><i>${i + 1}</i><span>${t}</span></li>`).join('')}</ul>
    <div class="note"><p style="font-size:3.4mm">たし算（1けた）STEP 2 セット1 の実際のページを、縮めたものです。<br>1ページ＝1セット＝20問。1分はかって、解けた数を数えます。</p></div></div>` });
  // 3 扉
  needRecto();
  add({ cls: 'title-pg', norun: true, nofolio: true, raw: `<div class="tp1">数学の単語帳</div><div class="bar"></div><div class="tp2">計算効率ハンドブック ＋ 1分トレーニング</div><div class="tp3">小3〜中3編</div><div class="tp4">頭の中で計算する力を、1分ずつ。</div>` });
  // 4 はじめに
  toc.push({ l: 0, title: 'はじめに', n: pages.length + 1 });
  add({ cls: 'txt pref', body: `<h1><small>PREFACE</small>はじめに</h1>
    <p class="lead">数学が得意な人と苦手な人のちがいは、計算の「速さ」よりも前に、<b>手を動かす前に、どれだけ見ているか</b>にあります。速い人ほど、じつは書き始める前に、長く眺めています。</p>
    <p>英単語と同じように、数学にも、考えずに反射で出てきてほしい言葉があります。2の10乗は1024。1/8は0.125。91は7×13。こうした「語彙」が反射になるほど、頭の中の作業台（ワーキングメモリ）が空いて、本当に考えたい問題に使えるようになります。</p>
    <p>この本は、暗記を押しつけるための本ではありません。<b>考える体力を、これから出会う手ごたえのある問題のために温存する技術</b>を、1分ずつ、小さな単位で身につけるための本です。</p>
    <p>ひとりでも、ペアでも使えます。ペアなら、ひとりが本を持って問題を読み上げ、もうひとりが耳で聞いて、頭の中で答える。1分たったら交代です。数えるのは、○ の数だけ。</p>
    <p>完璧をめざさなくて大丈夫です。昨日より1問多く答えられたら、それがこの本の、いちばんの成果です。</p>` });
  // 5 この本のつくり
  toc.push({ l: 0, title: 'この本のつくりと使い方', n: pages.length + 1 });
  add({ cls: 'txt', body: `<h1><small>STRUCTURE</small>この本のつくり</h1>
    <h2>3つの部分</h2>
    <ul><li><b>読む（ハンドブック）</b>　暗記して反射にする「語彙」と、毎回同じ型で処理する「作法」を、短くまとめました。</li>
    <li><b>覚える（語彙カード）</b>　表や数を、前向きにも逆向きにも、1分で引き出す練習です。</li>
    <li><b>計算する（1分トレーニング）</b>　途中の式を書かずに、頭の中でできる計算を、単元ごとにまとめました。</li></ul>
    <h2>章の流れ</h2>
    <p>学年の順に、3つの章です。どの章も「読む → 覚える → 計算する」の順に進みます。</p>
    <ul>${CH.map((c) => `<li><b>第${c.n}章　${c.grade}</b>　${c.title}</li>`).join('')}</ul>
    <h2>1セットは20問、時間は1分</h2>
    <p>1ページが1セットです。<b>前半の10問</b>は、そのSTEPのふつうの問題。<b>後半の10問</b>は、同じSTEPの中で少しだけむずかしい問題です（語彙カードは、後半が逆向きになります）。1分はかって、どこまで解けたか、○ の数を数えます。</p>
    <p>STEPごとに「目標（合格ライン）」があります。目標以上に ○ がついたら合格。次のSTEPへ進みましょう。前半を早く終えた人は、そのまま後半へ。後半は、1分で終わらなくてもかまいません。</p>` });
  // 6 ひとりで・ペアで
  add({ cls: 'txt', body: `<h1><small>HOW TO USE</small>ひとりで、ペアで</h1>
    <h2>赤シート</h2>
    <p>答えは赤い字で印刷してあります。市販の赤シートをのせると、答えがかくれます（なければ、手や紙でかくしてください）。</p>
    <h2>ひとりで</h2>
    <ol><li>赤シートをのせて、1分をはかります（スマートフォンやキッチンタイマーで）。</li>
    <li>書かずに、頭の中で計算して、声に出して答えます。</li>
    <li>1分たったら、赤シートをはずして答え合わせ。合っていた数を数えます。</li>
    <li>単元の最初のページの記録欄に、日付と ○ の数を書きます。</li></ol>
    <h2>ペアで</h2>
    <ol><li><b>出題者</b>が本を持ちます（答えが見えます）。<b>回答者</b>は、本を見ません。</li>
    <li>出題者が問題を読み上げます。回答者は、耳で聞いて、頭の中で計算し、声で答えます。</li>
    <li>合っていたら ○。次の問題へ。1分でストップ。</li>
    <li>役割を交代して、同じセットをもう一度。昨日より1問でも増えたら、記録をつけましょう。</li></ol>
    <h2>語彙カードは「往復」で</h2>
    <p>0.375→3/8 だけでなく、3/8→0.375 も。前半は表のとおりの向き、後半は逆向きです。往復できてはじめて、反射になります。</p>
    <h2>記録</h2>
    <p>各単元の最初のページに、STEPごとの目標と記録欄があります。巻末の「合格チェック表」に、合格したSTEPを印（✓）で残せます。</p>` });
  // 7 先生・保護者の方へ
  const usage = TG.book.usage;
  add({ cls: 'txt', body: `<h1><small>FOR TEACHERS &amp; PARENTS</small>先生・保護者の方へ</h1>
    ${usage}
    <h2>目標は目安です</h2>
    <p>「1分で何問できるか」は、生徒によって大きくちがいます。目標（合格ライン）は目安として、様子を見ながら読みかえてください。前半を終える前に1分がきても、それで十分です。</p>
    <h2>問題について</h2>
    <p>この本の問題は、プログラムで「単元・STEP・セット番号」から作っています。答えと、STEPの条件（くり上がり・約分の有無・答えの大きさなど）は、作るときとは別の方法でもう一度計算して、確かめています。各STEPに、セット1〜${SETS}を載せました。</p>
    <p>ハンドブックのうち、高校基礎・大学入試の部分は、この本には入れていません。</p>` });
  // 8〜9 目次（あとで入れる）
  add({ cls: 'toc txt', body: '{{TOC0}}' });
  add({ cls: 'toc txt', body: '{{TOC1}}' });
}

/* ---------------- 本文：序章・章・単元 ---------------- */
function prologue() {
  toc.push({ l: 0, title: '序章　ハンドブックの考え方', n: pages.length + 1 });
  const s0 = TG.book.sections.find((s) => s.id === 's0');
  add({ cls: 'txt', body: `<h1><small>PROLOGUE</small>序章　ハンドブックの考え方</h1>${TG.book.intro}<h2>${esc(s0.title.replace(/^\d+\.\s*/, ''))}</h2>${s0.blocks.map(hbBlock).join('')}` });
}

function chapterOpener(c) {
  needRecto();
  const n = pages.length + 1;
  toc.push({ l: 1, title: `${c.grade}　${c.title}`, n, ch: c.n, no: `第${c.n}章` });
  const nm = (id) => TG.unit(id).name;
  add({ cls: 'chap', ch: c.n, tab: true, norun: true, nofolio: true, raw: `<div class="dial2">${dialSVG({ sweep: 15 * c.n, stroke: 'currentColor', accent: 'currentColor', text: 'transparent', numerals: false })}</div>
    <div class="big">${c.n}</div><div class="g">第${c.n}章　${c.grade}</div><h1>${c.title}</h1>
    <div class="flow3"><div><b>読む</b>ハンドブック<br>p.{{p:ch${c.n}:read}}〜</div><div><b>覚える</b>語彙カード<br>p.{{p:ch${c.n}:vocab}}〜</div><div><b>${c.drillName}</b>${c.drillSub}<br>p.{{p:ch${c.n}:drill}}〜</div></div>
    <div class="units"><b>覚える</b>${c.vocab.map(nm).join('／')}<br><b>${c.drillName}</b>${c.drills.map(nm).join('／')}</div>` });
}

function readSection(c) {
  const sec = TG.book.sections.find((s) => s.id === c.hb);
  const first = pages.length + 1;
  refs[`ch${c.n}:read`] = first;
  toc.push({ l: 2, title: '読む（ハンドブック）', n: first, ch: c.n });
  c.hbGroups.forEach((g, gi) => {
    add({ cls: 'txt', ch: c.n, tab: true, run: `<b>第${c.n}章</b>　読む（ハンドブック）`, body: `${gi === 0 ? `<h1><small>第${c.n}章　読む</small>${esc(sec.title.replace(/^\d+\.\s*/, ''))}</h1>` : ''}${g.map((i) => hbBlock(sec.blocks[i])).join('')}` });
  });
}

function unitPages(id, c, secLabel) {
  const u = TG.unit(id);
  const n0 = pages.length + 1;
  refs[id] = n0;
  toc.push({ l: 3, title: u.name, n: n0, ch: c.n, g: u.steps.length > 1 ? `STEP 1〜${u.steps.length}` : '' });
  const run = `<b>第${c.n}章</b>　${secLabel}　／　${esc(u.name)}`;
  const vocab = u.cat === 'vocab';
  const fig = u.layout === 'fig';
  const rows = u.steps.map((st, i) => {
    const step = i + 1, goal = TG.goalOf(u, step), cells = [];
    for (let s = 1; s <= SETS; s++) cells.push(`<td class="r"><div>セット${s}　<span style="margin-left:auto">p.{{p:${id}:${step}:${s}}}</span></div><div>日付</div><div>○の数　　／${st.n || u.n}</div></td>`);
    return `<tr><td class="s">STEP ${step}<small>${st.n ? st.n + '問' : ''}</small></td><td><span class="nm">${esc(st.name)}</span><span class="hd"><i>後半</i>　${esc(st.name2)}</span></td><td class="g"><b>${goal}</b><small>問 / 1分</small></td>${cells.join('')}</tr>`;
  }).join('');
  const hbRef = Object.values(TG.book.sections).flatMap((s) => s.blocks).find((b) => b.deck === id);
  const tip = vocab
    ? `<b>語彙カード</b>は、前半が表のとおりの向き、後半が<b>逆向き</b>（往復）です。<span class="rd">赤字</span>の答えを、赤シートでかくして使います。${hbRef ? `<br>ハンドブックの説明は p.{{p:hb:${id}}} にあります。` : ''}`
    : fig ? `図のある問題は、前半と後半を<b>べつのページ</b>にしました（1セット＝2ページ）。<span class="rd">赤字</span>は答えです。` : `<span class="rd">赤字</span>は答えです。赤シートでかくして、頭の中で計算しましょう。ペアなら、出題者が本を持って問題を読み上げます。`;
  add({ cls: 'opener', ch: c.n, tab: true, run, body: `<div class="sec">第${c.n}章　${secLabel}</div><h1>${esc(u.name)}</h1><p class="note">${esc(u.note)}　／　1セット${u.n}問（前半${u.n / 2}＋後半${u.n / 2}）・1分</p>
    <table><thead><tr><th>STEP</th><th>内容</th><th style="text-align:center">目標</th>${Array.from({ length: SETS }, (_, i) => `<th>セット${i + 1}の記録</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
    <div class="tip">${tip}</div>` });
  u.steps.forEach((st, i) => {
    const step = i + 1;
    for (let s = 1; s <= SETS; s++) {
      const set = TG.makeSet(id, step, s);
      if (fig) {
        refs[`${id}:${step}:${s}`] = add({ cls: 'drill', ch: c.n, tab: true, run, style: drillStyle(set), body: drillBody(set, 0, s, false) });
        add({ cls: 'drill', ch: c.n, tab: true, run, style: drillStyle(set), body: drillBody(set, 1, s, false) });
      } else {
        refs[`${id}:${step}:${s}`] = add({ cls: 'drill', ch: c.n, tab: true, run, style: drillStyle(set), body: drillBody(set, 'all', s, false) });
      }
    }
  });
}

/* ---------------- 巻末 ---------------- */
function backMatter() {
  needRecto();
  toc.push({ l: 0, title: '合格チェック表', n: pages.length + 1 });
  const rows = CH.map((c) => `<tr class="ch c${c.n}"><td colspan="4">第${c.n}章　${c.grade}　${c.title}</td></tr>` + [...c.vocab, ...c.drills].map((id) => {
    const u = TG.unit(id);
    return `<tr><td>${esc(u.name)}</td>${[1, 2, 3].map((s) => (u.steps[s - 1] ? `<td class="sc"><b>目標 ${TG.goalOf(u, s)}</b><i></i></td>` : '<td class="sc">―</td>')).join('')}</tr>`;
  }).join('')).join('');
  add({ cls: 'txt check', body: `<h1 style="margin-bottom:3mm"><small>CHECK LIST</small>合格チェック表</h1><p style="font-size:3.2mm;margin-bottom:2mm;line-height:1.6">目標以上に ○ がついたSTEPの □ に、✓ を入れましょう。</p><table><thead><tr><th>単元</th><th>STEP 1</th><th>STEP 2</th><th>STEP 3</th></tr></thead><tbody>${rows}</tbody></table>` });
  // 奥付（左ページ）
  toc.push({ l: 0, title: '奥付', n: pages.length + 1 });
  const dl = [['書名', '数学の単語帳　計算効率ハンドブック ＋ 1分トレーニング　小3〜中3編'], ['発行', `${cfg.date}　${cfg.edition}`], cfg.author && ['著者', cfg.author], cfg.publisher && ['発行者', cfg.publisher]].filter(Boolean);
  add({ cls: 'txt colo', body: `<h2>奥付</h2><dl>${dl.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
    <div class="box"><dl><dt>この本の問題と答えについて</dt><dd>問題は、プログラムで「単元・STEP・セット番号」から作りました。同じ番号なら、いつでも同じ問題になります。答えと、STEPの条件（くり上がり・約分・答えの大きさなど）は、作るときとは別の方法でもう一度計算して確かめています。</dd>
    <dt>ハンドブックについて</dt><dd>「数学の単語帳 — 計算効率ハンドブック v2」のうち、小3〜中3の部分を収めています。高校基礎・大学入試の部分は含みません。</dd>
    <dt>書体</dt><dd>本文は Noto Serif JP、数字・問題・表は Noto Sans JP（ともに SIL Open Font License 1.1）。</dd></dl></div>` });
  // 裏表紙（総ページ数を偶数にする）
  while ((pages.length + 1) % 4 !== 0) memoPage(0);   // 裏表紙で、総ページ数が4の倍数になる
  add({ cls: 'cover back', norun: true, nofolio: true, raw: `<div class="cp">頭の中で計算する力を、<br>1分ずつ。</div>
    <div class="cb"><ul><li>1ページ＝1セット＝20問。前半10問は、そのSTEPのふつうの問題。後半10問は、少しむずかしい問題。</li><li>答えは赤字。赤シートをのせれば、ひとりでも、ペアでも。</li><li>読む → 覚える → 計算する。小3〜小4、小5〜小6、中1〜中3の3章。</li></ul></div>
    <div class="dot3"><i style="background:#4a90d9"></i><i style="background:#3fae7a"></i><i style="background:#9b7be0"></i></div><div class="tag">数学の単語帳　小3〜中3編</div>` });
}

/* ---------------- 目次 ---------------- */
function tocHTML() {
  const li = (e) => {
    const cls = `l${e.l}${e.ch ? ' c' + e.ch : ''}`;
    const lead = e.no ? `<span class="n">${e.no}</span>` : '';
    return `<li class="${cls}"><a href="#p${e.n}">${lead}<span class="t">${esc(e.title)}</span>${e.g ? `<span class="g">${e.g}</span>` : ''}<span class="d"></span><span class="p">${e.n}</span></a></li>`;
  };
  const items = toc.slice().sort((a, b) => a.n - b.n || a.l - b.l);
  // 2ページに分ける（1ページめは、第2章のはじめまで）
  const cut = items.findIndex((e) => e.l === 1 && e.ch === 2);
  const mk = (arr, head) => `${head ? '<h1><small>CONTENTS</small>もくじ</h1>' : ''}<ol>${arr.map(li).join('')}</ol>`;
  return [mk(items.slice(0, cut), true), mk(items.slice(cut), false)];
}

/* ---------------- 組み立て ---------------- */
frontMatter();
prologue();
CH.forEach((c) => {
  chapterOpener(c);
  readSection(c);
  refs[`ch${c.n}:vocab`] = pages.length + 1;
  toc.push({ l: 2, title: '覚える（語彙カード）', n: pages.length + 1, ch: c.n });
  c.vocab.forEach((id) => unitPages(id, c, '覚える'));
  refs[`ch${c.n}:drill`] = pages.length + 1;
  toc.push({ l: 2, title: `${c.drillName}（${c.drillSub}）`, n: pages.length + 1, ch: c.n });
  c.drills.forEach((id) => unitPages(id, c, c.drillName));
});
backMatter();

// ハンドブックの各ブロック → 語彙カードのページ（opener のメモ用）
TG.book.sections.forEach((s) => s.blocks.forEach((b) => {
  if (!b.deck) return;
  const sec = CH.find((c) => c.hb === s.id);
  const pg = pages.find((p) => p.html.includes('class="hb ') && p.html.includes(`#p{{p:${b.deck}}}`));
  if (pg && !refs[`hb:${b.deck}`]) refs[`hb:${b.deck}`] = pg.n;
}));

// 目次をはめて、{{p:…}} を数字にする
const [t0, t1] = tocHTML();
let body = pages.map((p) => p.html).join('\n');
body = body.replace('{{TOC0}}', t0).replace('{{TOC1}}', t1);
const missing = new Set();
body = body.replace(/\{\{p:([^}]+)\}\}/g, (m, k) => { if (refs[k] == null) { missing.add(k); return '?'; } return refs[k]; });
if (missing.size) console.log('△ 参照先が見つからない：' + [...missing].join('、'));

const css = fs.readFileSync(path.join(here, 'book.css'), 'utf8');
const title = '数学の単語帳　計算効率ハンドブック＋1分トレーニング　小3〜中3編';
const doc = `<!doctype html>\n<html lang="ja">\n<head>\n<meta charset="utf-8">\n<title>${title}</title>\n<style>\n${css}\n</style>\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
const out = path.join(here, 'dist', 'book.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, doc);
console.log(`書き出した：${path.relative(process.cwd(), out)}（${pages.length} ページ・${Math.round(Buffer.byteLength(doc) / 1024)} KB）`);
fs.writeFileSync(path.join(here, 'dist', 'pages.json'), JSON.stringify({ count: pages.length, toc, refs }, null, 1));

/* ---------------- 検査とPDF ---------------- */
if (args.includes('--pdf')) {
  const { execSync } = require('child_process');
  let pw;
  try { pw = require('playwright'); } catch (e) { pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
  (async () => {
    const b = await pw.chromium.launch();
    const p = await b.newPage();
    await p.goto('file://' + out);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(500);
    const bad = await p.evaluate(() => {
      const r = [];
      document.querySelectorAll('.pg').forEach((pg) => {
        const n = pg.dataset.n, inn = pg.querySelector('.in');
        if (inn && inn.scrollHeight > inn.clientHeight + 1) r.push(`p.${n}：本文が下にはみ出す（${inn.scrollHeight}px > ${inn.clientHeight}px）`);
        if (inn && inn.scrollWidth > inn.clientWidth + 1) r.push(`p.${n}：本文が横にはみ出す`);
        pg.querySelectorAll('.rw').forEach((rw, i) => {
          const q = rw.querySelector('.qt');
          if (!q) return;
          if (rw.scrollWidth > rw.clientWidth + 1) r.push(`p.${n}：${i + 1}行目が横にはみ出す`);
          if (q.getBoundingClientRect().height > rw.getBoundingClientRect().height + 0.5) r.push(`p.${n}：${i + 1}行目が行の高さに入らない`);
          const fg = rw.querySelector('.fg');
          if (fg && fg.getBoundingClientRect().height > rw.getBoundingClientRect().height + 0.5) r.push(`p.${n}：${i + 1}行目の図が行の高さに入らない`);
        });
      });
      return r;
    });
    if (bad.length) {
      const by = {};
      bad.forEach((x) => { const m = x.match(/^p\.(\d+)：(.*)$/); const k = m[1] + '|' + m[2].replace(/^\d+行目/, 'N行目'); by[k] = (by[k] || 0) + 1; });
      console.log('✗ 組版の検査（ページ｜内容｜行数）：\n  ' + Object.entries(by).slice(0, 80).map(([k, v]) => `p.${k.replace('|', '：')}  ×${v}`).join('\n  '));
    } else console.log('✓ 組版の検査：はみ出しなし');
    const pdf = path.join(root, 'pdf', '数学の単語帳_小3-中3.pdf');
    fs.mkdirSync(path.dirname(pdf), { recursive: true });
    await p.pdf({ path: pdf, preferCSSPageSize: true, printBackground: true, outline: true, tagged: true });
    console.log('書き出した：' + path.relative(process.cwd(), pdf));
    await b.close();
    process.exit(bad.length ? 1 : 0);
  })();
}
