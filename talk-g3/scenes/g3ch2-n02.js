/* 中3 2章 平方根　入試レベル2「式の値（x＝√3＋√2 など）」。自作問題。
   x＝√5＋√2、y＝√5−√2。x＋y＝2√5、x−y＝2√2、xy＝（√5）²−（√2）²＝3。x²＋y²＝（x＋y）²−2xy＝20−6＝14。x²−y²＝（x＋y）（x−y）＝2√5×2√2＝4√10（≒12.65）。
   確かめ：x²＝7＋2√10、y²＝7−2√10（直接代入すると遠回り）。
   誤答：2√7（ルートの中を足す）、√5、2√2（x−yの方）／xy＝7、√10、√3／x²＋y²＝20（2xyを引かない）、26、17／x²−y²＝8（（x−y）²と混同）、4√7、2√10。
   ポンタは、xとyにルートが入っているのを見て目が回る。 */
(function () {
  const { T: T0, B: B0, Q, tbl } = KL;
    // ---- 読み上げ用の変換（√・累乗・文字・記号を、ことばにする。say に使う） ----
  const rd = src => {
    let s = String(src).replace(/\{\{|\}\}|\*\*/g, '');
    s = s.replace(/−/g, (m, i, all) => (i > 0 && (/[0-9０-９A-Za-z）²³\]]/.test(all[i - 1]) || (/[\u4e00-\u9fff]/.test(all[i - 1]) && /[\u4e00-\u9fff]/.test(all[i + 1] || ''))) ? ' ひく ' : 'マイナス'));
    s = s.replace(/\[\[([^\/\]]*)\/([^\]]*)\]\]/g, (_, a, b) => b + '分の' + a);
    s = s.replace(/cm²/g, '平方センチメートル').replace(/(\d)\s*m²/g, '$1平方メートル').replace(/cm/g, 'センチメートル').replace(/km/g, 'キロメートル').replace(/kg/g, 'キログラム').replace(/([\d³²])\s*m(?![A-Za-z])/g, '$1メートル').replace(/(\d)\s*g(?![A-Za-z])/g, '$1グラム');
    s = s.replace(/\^(\d+)/g, 'の$1乗').replace(/²/g, 'の2乗').replace(/³/g, 'の3乗');
    for (let guard = 0; guard < 8; guard++) {                       // √（…）は、かっこを読まずに「ルート、…、」
      const i = s.indexOf('√（'); if (i < 0) break;
      let depth = 0, j = i + 1;
      for (; j < s.length; j++) { if (s[j] === '（') depth++; else if (s[j] === '）') { depth--; if (depth === 0) break; } }
      s = s.slice(0, i) + 'ルート、' + s.slice(i + 2, j) + '、' + s.slice(j + 1);
    }
    s = s.replace(/√/g, 'ルート').replace(/（/g, 'かっこ、').replace(/）/g, '、かっことじ、');
    const L = { a: 'エー', b: 'ビー', c: 'シー', d: 'ディー', e: 'イー', k: 'ケー', m: 'エム', n: 'エヌ', p: 'ピー', q: 'キュー', r: 'アール', s: 'エス', t: 'ティー', x: 'エックス', y: 'ワイ', z: 'ゼット' };
    s = s.replace(/[A-Za-z]/g, c => L[c.toLowerCase()] || c);
    const Y = { '＝': ' イコール ', '＋': ' たす ', '×': ' かける ', '÷': ' わる ', '＜': ' 小なり ', '＞': ' 大なり ', '≦': ' 小なりイコール ', '≧': ' 大なりイコール ', '≒': '、およそ、', '±': 'プラスマイナス', 'π': 'パイ', '°': '度', '〜': 'から', '…': '' };
    s = s.replace(/[＝＋×÷＜＞≦≧≒±π°〜…]/g, c => Y[c]);
    return s.replace(/\s+/g, ' ').replace(/ ?([、。！？]) ?/g, '$1').replace(/、{2,}/g, '、').replace(/、([。！？])/g, '$1').replace(/かっことじ、の/g, 'かっことじの').replace(/^ | $/g, '');
  };
  const NEED = /[√²³^A-Za-zπ°≒±〜…＜＞≦≧]/;                           // これらを含む行にだけ say をつける（単位だけの行は、ふつうの読みでよい）
  const needSay = s => NEED.test(String(s).replace(/\{\{|\}\}|\*\*/g, '').replace(/cm[²³]?|km|kg|(?<=\d)[mg][²³]?(?![A-Za-z])/g, ''));
  const T = (s, o) => T0(s, Object.assign(needSay(s) ? { say: rd(s) } : {}, o || {}));
  const B = (s, o) => B0(s, Object.assign(needSay(s) ? { say: rd(s) } : {}, o || {}));
  const t0 = [['問題', 'x＝√5＋√2、y＝√5−√2のとき、次の値を求めよう'], ['(1)', 'x＋y　と　xy'], ['(2)', 'x²＋y²'], ['(3)', 'x²−y²']];

  KL.lesson({ id: 'g3ch2-n02', unit: '中3　平方根', kick: '3年2章　入試レベル2', title: '【入試】式の値（x＝√3＋√2 など）', card: '【入試】式の値（x＝√3＋√2 など）', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、入試レベルの問題です。ルートをふくむ文字の、式の値を求めます。', { title: true, point: false, ft: 'happy' }),
    B('xとyに、ルートが入ってる！ そのまま代入したら、目が回りそうだよ！', { title: true, fb: 'spiral', up: true }),
    T('そのまま代入すると、たいへんです。先に、和や積を求めると、楽になります。', { title: true, point: false, ft: 'think' }),

    T('問題です。x＝√5＋√2、y＝√5−√2のとき、x＋yとxy、x²＋y²、x²−y²の値を、求めましょう。', { part: '問題を読もう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '和と積を先に\n求めて使おう', t: 4.0 }, { col: 0, type: 'text', size: 'xs', label: '条件', text: 'x＝√5＋√2\ny＝√5−√2', t: 4.0 }, tbl(t0, { style: 'font-size:34px; align-self:center; margin-top:14px', t: 1.0 })] }),
    T('まず、x＋yを求めます。xとyを、そのまま足してみましょう。', { ft: 'normal', point: false }),

    /* ---------- 問1 ---------- */
    Q('q1', T('問題です。x＋yの値は、どれでしょう。', { ft: 'normal' }),
      [{ t: '√5' }, { t: '2√2' }, { t: '2√5', ok: true }, { t: '2√7' }],
      { 3: [B('ルートの中も足して、5と2で、7だよ！ 2√7！', { fb: 'happy', up: true }), T('ルートの中は、足せません。√2と−√2は、打ち消しあいます。残るのは、√5が2個で、2√5です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        0: [T('√5は、1個ではありません。xにも、yにも、√5があるので、2個で、2√5です。', { ft: 'normal' })],
        1: [T('2√2は、x−yの値です。足すと、√2が消えて、√5が残ります。', { ft: 'normal' })],
        ok: [T('正解！ √2と−√2が消えて、x＋y＝2√5です。', { ft: 'happy' }), B('ルートの一部が、消えちゃった！', { fb: 'star', up: true })],
        wrong: [T('√2と−√2が消えて、x＋y＝2√5です。', { ft: 'normal' })] }),

    T('次は、積のxyです。（√5＋√2）（√5−√2）は、和と差の積の形をしています。', { ft: 'normal', point: false }),

    /* ---------- 問2 ---------- */
    Q('q2', T('問題です。xyの値は、どれでしょう。', { ft: 'normal' }),
      [{ t: '√3' }, { t: '3', ok: true }, { t: '√10' }, { t: '7' }],
      { 3: [B('xとyの積は、5と2を足して、7だよ！', { fb: 'happy', up: true }), T('積なので、足し算ではありません。和と差の積で、5−2＝3です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('√5×√2は、展開した項の1つです。もう1つの−√10と、打ち消しあって、残りません。', { ft: 'normal' })],
        0: [T('5−2＝3は、ルートの外の計算です。（√5）²は5、（√2）²は2で、ルートは消えます。', { ft: 'normal' })],
        ok: [T('正解！ xy＝（√5）²−（√2）²＝5−2＝3です。', { ft: 'happy' }), B('xyは、整数になったよ！', { fb: 'star', up: true })],
        wrong: [T('和と差の積で、xy＝5−2＝3です。', { ft: 'normal' })] }),

    T('x＋y＝2√5と、xy＝3がわかりました。これを使って、x²＋y²を、求めます。', { clear: true, cols: [0.34, 0.66], part: 'x²＋y²を求める', ft: 'normal',
      add: [{ col: 0, type: 'text', size: 'xs', label: 'わかったこと', text: 'x＋y＝2√5\nxy＝3', t: 3.5 }] }),
    T('x²＋y²は、（x＋y）²を展開した式の、一部です。（x＋y）²＝x²＋2xy＋y²です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '公式', text: '（x＋y）²\n＝x²＋2xy＋y²', t: 4.5 }] }),

    /* ---------- 問3 ---------- */
    Q('q3', T('問題です。x²＋y²の値は、どれでしょう。', { ft: 'normal' }),
      [{ t: '14', ok: true }, { t: '17' }, { t: '20' }, { t: '26' }],
      { 2: [B('x＋yを2乗すれば、いいんでしょ？ （2√5）²で、20だよ！', { fb: 'happy', up: true }), T('（x＋y）²＝x²＋2xy＋y²なので、2xyが余分です。x²＋y²は、20−2xyで、20−6＝14です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        3: [T('2xyは、足すのではなく、引きます。（x＋y）²から、2xyを引くと、x²＋y²です。', { ft: 'normal' })],
        1: [T('17は、20−3です。引くのは、xyではなく、2xyです。2×3＝6を引いて、14です。', { ft: 'normal' })],
        ok: [T('正解！ （x＋y）²は20、2xyは6です。x²＋y²は、20から6を引いて、14です。', { ft: 'happy' }), B('x²とy²を、別々に計算しなくていいんだね！', { fb: 'star', up: true })],
        wrong: [T('x²＋y²は、（x＋y）²から2xyを引いて、20−6＝14です。', { ft: 'normal' })] }),

    T('確かめに、そのまま計算すると、x²は7＋2√10、y²は7−2√10です。足して14で、同じです。でも、手間がかかります。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '遠回りの確かめ', text: 'x²＝7＋2√10\ny²＝7−2√10', t: 4.5 }] }),

    T('最後は、x²−y²です。x−yも、必要です。x−yは、√5が消えて、2√2になります。', { clear: true, cols: [0.34, 0.66], part: 'x²−y²を求める', ft: 'normal',
      add: [{ col: 0, type: 'text', size: 'xs', label: 'わかったこと', text: 'x＋y＝2√5\nx−y＝2√2', t: 3.5 }, { col: 0, type: 'box', color: 'p', size: 'xs', label: '因数分解', text: 'x²−y²\n＝（x＋y）（x−y）', t: 4.5 }] }),

    /* ---------- 問4 ---------- */
    Q('q4', T('最後の問題です。x²−y²の値は、どれでしょう。', { ft: 'happy' }),
      [{ t: '2√10' }, { t: '8' }, { t: '4√7' }, { t: '4√10', ok: true }],
      { 1: [B('x²−y²は、（x−y）²のことでしょ？ 2√2を2乗して、8だよ！', { fb: 'happy', up: true }), T('（x−y）²と、x²−y²は、ちがいます。x²−y²は、（x＋y）（x−y）です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('√5×√2は、√10です。ルートの中は、かけます。5＋2で、7にはなりません。', { ft: 'normal' })],
        0: [T('外の数も、かけます。2√5×2√2の、外の数は、2×2＝4です。2√10ではありません。', { ft: 'normal' })],
        ok: [T('正解！ x²−y²＝（x＋y）（x−y）＝2√5×2√2＝4√10です。', { ft: 'happy' }), B('因数分解の公式が、ここで役に立つんだね！', { fb: 'star', up: true })],
        wrong: [T('x²−y²は、2√5×2√2＝4√10です。', { ft: 'normal' })] }),
    T('まとめです。文字の式の値は、代入する前に、x＋y、x−y、xyを求めます。それから、式を、変形して使います。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: 'x＋y、x−y、xyを先に\nx²＋y²＝（x＋y）²−2xy\nx²−y²＝（x＋y）（x−y）', t: 7.0 }] }),
    B('代入する前に、和と積を求めると、ごちゃごちゃしないんだね！ 目が回らなくなったよ！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
