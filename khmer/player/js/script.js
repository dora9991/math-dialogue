/* 台本の部品（授業ファイルの書き方）。ブラウザと tools/（声づくり・検査）の両方で読む。
   const { T, P, Q, N, TAP, ST, BREAK, END } = HS;
   T('文', opt) ………… ホー先生のセリフ　　P('文', opt) … ピヨのセリフ
     opt: face（表情）, act（動き）, mark（頭のマーク）, o:{ face, act, mark }（話していない方の反応）,
          fig / do / note / unnote / clear / clearNotes（ノートへの操作）, say（読み上げを変えるとき）
   Q({ who, text, opts:['A', 'B', …], ok:番号, exp:[説明], ng:{ 番号:[ヒント] } or [ヒント], tip:'ヒントの文', praise:[ほめる], opinion:true（予想：正解なし）, pick:{ 番号:[反応] } })
   N({ who, text, ans:数, unit:'cm²', exp, ng, tip, keys:'dec' })   … 数を入れる（テンキー。1〜3年で答えが整数なら「.」のキーは出さない。keys:'int'|'dec' で決めることもできる）
   TAP({ who, text, btn:'きってみる！', run:{ do:… } })    … ボタンを押すと図が動く
   ACT({ who, text, run:{ do:… }, hint:'ブロックを うごかしてね' }) … 図を子どもがさわる（動かす・タップして数える）。図のメソッドが F.interact で終わりを待つ
   ST(番号) … ステージのはじまり　　BREAK() … ひと休み　　END() … おわり（成績とシール）
   表情 ho: normal happy surprised sigh think proud sorry cheer ／ piyo: normal happy surprised confused sad think proud cheer
   動き act: hop jump shake nod spin sink lean wiggle ／ マーク mark: sparkle sweat q ex heart note idea spiral */
(function () {
  const root = typeof window !== 'undefined' ? window : globalThis;
  const OPKEYS = ['clear', 'clearNotes', 'fig', 'do', 'unnote', 'note'];
  function opsOf(o) { const op = {}; let has = false; for (const k of OPKEYS) if (o && o[k] !== undefined) { op[k] = o[k]; has = true; } return has ? [op] : []; }
  function say(who) {
    return (text, opt) => { const o = opt || {}; return { k: 'say', who, text, say: o.say, face: o.face, act: o.act, mark: o.mark, o: o.o, sfx: o.sfx, ops: opsOf(o) }; };
  }
  const T = say('ho'), P = say('piyo');
  function Q(o) {
    const opts = o.opts.map((t, i) => (typeof t === 'string' ? { t } : t)).map((x, i) => Object.assign(x, { ok: !o.opinion && (Array.isArray(o.ok) ? o.ok.includes(i) : o.ok === i) }));
    return { k: 'q', who: o.who || 'ho', text: o.text, say: o.say, face: o.face, act: o.act, mark: o.mark, o: o.o, opts, exp: o.exp || [], ng: o.ng || [], praise: o.praise, tip: o.tip, tipSay: o.tipSay, opinion: !!o.opinion, pick: o.pick || {}, after: o.after || [], ops: opsOf(o), id: o.id };
  }
  function N(o) { return { k: 'num', who: o.who || 'ho', text: o.text, say: o.say, face: o.face, act: o.act, mark: o.mark, o: o.o, ans: [].concat(o.ans).map(Number), unit: o.unit || '', label: o.label, keys: o.keys, exp: o.exp || [], ng: o.ng || [], praise: o.praise, tip: o.tip, tipSay: o.tipSay, ops: opsOf(o), id: o.id }; }
  function TAP(o) { return { k: 'tap', who: o.who || 'ho', text: o.text, say: o.say, face: o.face, act: o.act, mark: o.mark, o: o.o, btn: o.btn, ops: opsOf(o), run: opsOf(o.run || {}), hand: o.hand !== false }; }
  function ACT(o) { return { k: 'act', who: o.who || 'ho', text: o.text, say: o.say, face: o.face, act: o.act, mark: o.mark, o: o.o, ops: opsOf(o), run: opsOf(o.run || {}), hint: o.hint }; }
  const ST = n => ({ k: 'stage', n });
  const BREAK = () => ({ k: 'break' });
  const END = o => ({ k: 'end', o: o || {} });
  /* 決まったセリフ（どの授業でも使う。声は audio/common/） */
  const COMMON_HI = {
    praiseHo: ['正解！ すばらしい！', 'そのとおり！ よくできました。', '大正解！ さすがだね。', 'お見事！ 正解です。'],
    praisePiyo: ['やったー！ 正解だ！', 'すごい！ ぴったりだね！', 'わーい！ あたりー！'],
    praise2: ['正解！ あきらめなかったのが、えらい！', 'できたね！ 2回目で正解！'],
    ng1: ['おしい！ もういちど、考えてみよう。', 'ざんねん。でも、だいじょうぶ。もう1回！'],
    reask: ['もういちど、えらんでみよう！', 'もういちど、数を入れてみよう！'],
    nudge: ['こまったら、ヒントを見てもいいよ！'],
    breakA: ['ここで、ひと休み！ うでを上にのばして、のびーっ！'],
    breakB: ['ふーっ、すっきり！ つづきもがんばろう！'],
    actHint: ['さわって、うごかしてみよう！']
  };
  /* 1・2年は、ひらがなと分かち書き（教科書と同じ） */
  const COMMON_LO = {
    praiseHo: ['ត្រូវហើយ! អស្ចារ្យណាស់!', 'ត្រូវណាស់! ធ្វើបានល្អ។', 'ត្រូវទាំងស្រុង! ត្រា «ល្អណាស់» ជូនអ្នក!'],
    praisePiyo: ['ហ៊ូរ៉ា! ត្រូវហើយ!', 'អស្ចារ្យ អស្ចារ្យ!', 'ហ៊ូរ៉ា! ត្រូវមែន!'],
    praise2: ['ត្រូវហើយ! មិនបោះបង់ គួរឱ្យសរសើរ!'],
    ng1: ['ជិតត្រូវហើយ! សូមគិតម្តងទៀត។', 'កុំបារម្ភ។ សាកល្បងម្តងទៀត!'],
    reask: ['សូមជ្រើសរើសម្តងទៀត!', 'សូមបញ្ចូលលេខម្តងទៀត!'],
    nudge: ['បើពិបាក អាចមើលតម្រុយបាន!'],
    breakA: ['សម្រាកបន្តិច! លើកដៃឡើងលើ ហើយលាតខ្លួន!'],
    breakB: ['ហ្វូហ៍ ស្រាលខ្លួនហើយ! ចូរបន្តទៀត!'],
    actHint: ['ចូរប៉ះ ហើយរំកិលមើល!']
  };
  /* 3・4年：「解」は5年の漢字なので「せいかい」と書く（「正かい」の交ぜ書きにしない） */
  const COMMON_MID = JSON.parse(JSON.stringify(COMMON_HI).split('大正解').join('だいせいかい').split('正解').join('せいかい'));
  const commonFor = g => (g && g <= 2 ? COMMON_LO : g && g <= 4 ? COMMON_MID : COMMON_HI);
  const COMMON = COMMON_HI;

  const reveal = q => q.k === 'num' ? `ចម្លើយគឺ ${String(q.ans[0])}${q.unit ? ' ' + q.unit : ''}` : `ចម្លើយគឺ «${q.opts.find(x => x.ok).t}»`;   // 1〜6年 同じ
  const DATA = root.HS_DATA = root.HS_DATA || {};
  function lesson(L) {
    let n = 0; const walk = list => (list || []).forEach(s => { if (s.k === 'q' || s.k === 'num') { if (!s.id) s.id = L.id + '#' + (++n); walk(s.exp); walk(s.after); (Array.isArray(s.ng) ? [s.ng] : Object.values(s.ng || {})).forEach(walk); Object.values(s.pick || {}).forEach(walk); } });
    walk(L.steps); DATA[L.id] = L; return L;
  }
  /* 台本のセリフをぜんぶ集める（声づくり・検査用）。[{ who, text, say }] */
  function lines(L) {
    const out = [], add = (who, text, sayTxt, face) => { if (text) out.push({ who, text, say: sayTxt, face }); };
    const walk = list => (list || []).forEach(s => {
      if (s.k === 'say') add(s.who, s.text, s.say, s.face);
      if (s.k === 'q' || s.k === 'num' || s.k === 'tap' || s.k === 'act') add(s.who, s.text, s.say, s.face);
      if (s.k === 'q' || s.k === 'num') {
        if (s.tip) add('ho', s.tip, s.tipSay);
        walk(s.exp); walk(s.praise); walk(s.after);
        if (Array.isArray(s.ng)) walk(s.ng); else Object.values(s.ng).forEach(walk);
        if (s.pick) Object.values(s.pick).forEach(walk);
        if (!s.opinion) add('ho', reveal(s));
      }
      if (s.k === 'end' && s.o && s.o.text) add('ho', s.o.text);
    });
    walk(L.steps); return out;
  }
  root.HS = { T, P, Q, N, TAP, ACT, ST, BREAK, END, lesson, lines, COMMON, commonFor, reveal, DATA };
})();
