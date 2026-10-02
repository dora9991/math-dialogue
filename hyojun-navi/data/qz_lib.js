/* 小テスト（5分・100点）＋チャレンジ1問。A4 1枚。data/qz_<単元>.js で使う道具。
   ねらい：その時間のノート型ワークシートと問題演習プリントをやっていれば100点がとれる内容にする（同じ型の問題を、数だけ変えて出す）。
   チャレンジは点数に入れない1問（その時間の内容を少しだけ先へ進めたもの）。問題はすべて自作。
     QZL.quiz(時間のID, ねらい, [ … ])   … 登録。根号の多い単元は QZL.quizq（√2・√(4×5) を根号に直す）
     G(問いの文, 1問の点, [[問題文, 解答例, 検算, {rows, p, mid, fig}], …], {cols, rows, fig, figRows, side})
                                              … 同じ型の小問をならべる（番号は自動。fig があれば、小問を左・図を右に置く）
     Q(問題文, 行数, 解答例, 点, {v, vp, fig, figRows, side, mid})
                                              … 小問1つ（fig＝図。side で図を右に。mid＝問題文と記入欄のあいだに入れる表など）
     X(点, ブロック…)                         … 自由な形の小問（表・グラフ・穴うめなど）。番号は {n}、点は {pt} と書く
     C2(左, 右, 列の幅)                        … 左右にならべる（中に Q・X やふつうのブロックを入れる。G は1列になる）
     CH(問題文, 行数, 解答例, {v, vp, fig, figRows, side, mid})   … チャレンジ（最後に1つ）
     そのほかのブロック（T・F・TB など）は、そのまま入る（点はつかない。問題の前おきの文や図に使う）
   検算のしるし：演習プリントと同じ calc／fact／eq／sys／quad／val／pts／roc に加えて
     num … vp に書いた計算（Python の式）の値が、解答例の最後の答えと等しい
     py  … vp に書いた確かめの式（Python）が成り立つ
   点の合計は100点（verify.py が確かめる）。 */
(function () {
  LDB.quizzes = LDB.quizzes || {};
  const { M, K, T, W, F, SEC } = WSL;
  const O = (o, extra) => Object.assign(o, extra || {});
  const vOf = (v, p, text) => v ? { v, vp: p || text } : {};
  const figOf = o => o && o.fig ? [F(o.figRows || 6, ...(Array.isArray(o.fig) ? o.fig : [o.fig]))] : [];
  const cols = (ratio, ...cs) => ({ type: 'cols', ratio, cols: cs.map(blocks => ({ blocks })) });
  const QZL = window.QZL = {
    G: (lead, pt, items, o) => ({ qz: 'g', lead, pt, items, o: o || {} }),
    Q: (text, rows, ans, pt, o) => ({ qz: 'q', text, rows, ans, pt, o: o || {} }),
    X: (pt, ...blocks) => ({ qz: 'x', pt, blocks: blocks.flat() }),
    C2: (left, right, ratio) => ({ qz: 'c2', left, right, ratio: ratio || '1:1' }),
    CH: (text, rows, ans, o) => ({ qz: 'ch', text, rows, ans, o: o || {} })
  };
  // 小問1つ：問題文＋（図）＋（表など mid）＋記入欄。side があれば、問題文と記入欄を左、図を右にならべる
  const one = (label, text, rows, ans, pt, o) => {
    const w = W('', rows, ans, '', O(vOf(o.v, o.vp, text), pt ? { pt } : {}));
    const t = T(label, text, o.t);
    if (o.fig && o.side) return [cols(o.side === true ? '3:2' : o.side, [t, ...(o.mid || []), w], figOf(o))];
    return [t, ...figOf(o), ...(o.mid || []), w];
  };
  function build(aim, parts) {
    const out = [M(aim + '\n（時間 5分）', { label: '小テスト', rows: 2, score: 100 })];
    let n = 0, total = 0;
    const expand = (p, nested) => {   // 小問のしるし（G・Q・X・C2）を、ブロックのならびに直す
      if (!p) return [];
      if (p.qz === 'g') {
        const nc = nested ? 1 : (p.o.cols || 1), rows = p.o.rows || 3, gb = [];
        gb.push(T('', `${p.lead}（各${p.pt}点）`, p.o.t));
        for (let k = 0; k < p.items.length; k += nc) {
          const grp = p.items.slice(k, k + nc), r = Math.max(...grp.map(it => (it[3] && it[3].rows) || rows));
          const cells = grp.map(it => { n++; total += p.pt; return one(`（${n}）`, it[0], r, it[1], p.pt, O({ v: it[2] }, it[3] && { vp: it[3].p, t: it[3].t, fig: it[3].fig, figRows: it[3].figRows, mid: it[3].mid })); });
          if (nc === 1) gb.push(...cells[0]);
          else { while (cells.length < nc) cells.push([]); gb.push(cols(nc === 3 ? '1:1:1' : '1:1', ...cells)); }
          if (k === 0) gb[1].nogap = true;   // 問いの文と、最初の小問のあいだは、あけない
        }
        return p.o.fig && nc === 1 && !nested ? [cols(p.o.side || '3:2', gb, figOf(p.o))] : gb;
      }
      if (p.qz === 'q') {
        n++; total += p.pt;
        return one(`（${n}）`, `${p.text}（${p.pt}点）`, p.rows, p.ans, p.pt, nested ? O(O({}, p.o), { side: null }) : p.o);
      }
      if (p.qz === 'x') {
        n++; total += p.pt;
        const sub = s => typeof s === 'string' ? s.replace(/\{n\}/g, `（${n}）`).replace(/\{pt\}/g, `（${p.pt}点）`) : s;
        const walk = b => { if (b.type === 'cols') b.cols.forEach(c => c.blocks.forEach(walk)); else { if (b.label != null) b.label = sub(b.label); if (b.text != null) b.text = sub(b.text); if (b.prompt != null) b.prompt = sub(b.prompt); } };
        p.blocks.forEach(walk);
        (p.blocks.find(b => b.type !== 'cols') || p.blocks[0].cols[0].blocks[0]).pt = p.pt;
        return p.blocks;
      }
      if (p.qz === 'c2') return [cols(p.ratio, [p.left].flat().flatMap(x => expand(x, true)), [p.right].flat().flatMap(x => expand(x, true)))];
      return [p];   // そのままのブロック（説明の文・図など。点はつかない）
    };
    parts.flat().forEach(p => {
      if (p && p.qz === 'ch') {
        out.push(SEC('チャレンジ', '時間があまったら挑戦しよう。'), K('問題', p.text, p.o.t));   // 点数のあつかいは紙に書かない（授業での決まりは先生が伝える）
        const w = W('', p.rows, p.ans, '', vOf(p.o.v, p.o.vp, p.text));
        if (p.o.fig && p.o.side) out.push(cols(p.o.side === true ? '3:2' : p.o.side, [...(p.o.mid || []), w], figOf(p.o)));
        else out.push(...figOf(p.o), ...(p.o.mid || []), w);
      } else out.push(...expand(p));
    });
    return { blocks: out, total };
  }
  QZL.quiz = (id, aim, parts, o) => {
    const r = build(aim, parts);
    LDB.quizzes[id] = O({ paper: 'A4', pitch: 7, dots: true, head: null, kind: 'quiz', total: r.total, blocks: r.blocks }, o);
  };
  // 根号をふくむ単元用（WSL.addq と同じ直し方）
  const q = s => s.replace(/√\(((?:[^()]|\([^()]*\))*)\)/g, '√{$1}').replace(/√(\d+(?:\.\d+)?|[a-z])/g, '√{$1}').replace(/\}\}\}/g, '} }}');
  const SKIP = { src: 1, lines: 1, glines: 1, points: 1, points2: 1, path: 1, apath: 1, steps: 1, steps2: 1, kind: 1, type: 1, id: 1, v: 1, vp: 1 };
  const fix = o => typeof o === 'string' ? q(o) : Array.isArray(o) ? o.map(fix)
    : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, SKIP[k] ? v : fix(v)])) : o;
  QZL.quizq = (id, aim, parts, o) => { QZL.quiz(id, aim, parts, o); LDB.quizzes[id].blocks = fix(LDB.quizzes[id].blocks); };
})();
