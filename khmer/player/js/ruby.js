/* 文字の組み立て：学年に合わせた漢字・ふりがな（ルビ）・読み上げの文。
   台本の書き方
     ふつうの文 …… 漢字はそのまま書く。読みは yomi.js の辞書から自動でつく（辞書にない漢字は tools/check.mjs が知らせる）
     {漢字|よみ} … 読みを指定（同じ字で読みが変わるとき）。漢字ごとに分けるときは「.」で区切る {円周|えん.しゅう}
     **ことば** …… 色つきで強調
     [[1/4]] ……… 分数
     \n …………… 改行
   表示の決まり（設定 S）
     S.kg   … 漢字の学年（1〜6）。これより上の学年の漢字（と中学の漢字）は「まだ習っていない漢字」
     S.furi … 'all'＝すべての漢字にふりがな／'new'＝その学年で習う漢字（と習っていない漢字）にだけ／'none'＝つけない
     S.mi   … 習っていない漢字を 'kana'＝ひらがなで書く（教科書と同じ交ぜ書き：面せき）／'ruby'＝漢字のままふりがなをつける */
(function () {
  const root = typeof window !== 'undefined' ? window : globalThis;
  const isKanji = c => /[一-鿿々]/.test(c);
  const grade = c => (root.kanjiGrade ? root.kanjiGrade(c) : 1);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  let DICT = {}, BYFIRST = {};
  function addDict(d) {
    Object.assign(DICT, d); BYFIRST = {};
    for (const k of Object.keys(DICT)) (BYFIRST[k[0]] = BYFIRST[k[0]] || []).push(k);
    for (const a of Object.values(BYFIRST)) a.sort((x, y) => y.length - x.length);
  }
  let WID = 0;
  const missing = new Set();   // 辞書になかった漢字（check.mjs が見る）

  /* 読みつきの語を、漢字ごとの単位に分ける。readings の数が漢字の数と同じなら1字ずつ、ちがえば（今日＝きょう など）まとめて1つ */
  function unitsOf(surface, spec) {
    const chars = [...surface], kc = chars.filter(isKanji), rd = String(spec).split('.');
    const out = [], w = ++WID;   // w＝同じ語の漢字は同じ番号（行のおわりで語の途中で切れないようにまとめる）
    if (rd.length === kc.length) {
      let n = 0, prevG = 1;
      for (const c of chars) {
        if (isKanji(c)) { const g = c === '々' ? prevG : grade(c); out.push({ k: 1, b: c, y: rd[n++], g, w }); prevG = g; }
        else out.push({ k: 0, s: c });
      }
    } else {
      let i = 0; while (i < chars.length && isKanji(chars[i])) i++;
      const base = chars.slice(0, i).join('');
      out.push({ k: 1, b: base, y: rd.join(''), g: Math.max(...[...base].map(c => c === '々' ? 1 : grade(c))) });
      chars.slice(i).forEach(c => out.push(isKanji(c) ? { k: 1, b: c, y: null, g: grade(c) } : { k: 0, s: c }));
    }
    return out;
  }
  /* ふつうの文（記号なし）を単位の列に */
  const SEG = (typeof Intl !== 'undefined' && Intl.Segmenter) ? new Intl.Segmenter('km', { granularity: 'grapheme' }) : null;
  const GR = s => SEG ? Array.from(SEG.segment(s), x => x.segment) : [...s];   // クメール語は、結合する文字を分けない
  function plainUnits(s) {
    const out = [], chars = GR(s);
    for (let i = 0; i < chars.length;) {
      const c = chars[i];
      if (!isKanji(c)) { out.push({ k: 0, s: c }); i++; continue; }
      if (c === '人' && i > 0 && /[0-9０-９]/.test(chars[i - 1])) { out.push({ k: 1, b: c, y: 'にん', g: grade(c) }); i++; continue; }   // 3人＝にん（ひとり・ふたりは、ひらがなで書く）
      if (c === '本' && i > 0 && /[0-9]/.test(chars[i - 1])) { const d = chars[i - 1]; out.push({ k: 1, b: c, y: '1680'.includes(d) ? 'ぽん' : d === '3' ? 'ぼん' : 'ほん', g: grade(c) }); i++; continue; }   // 6本＝ろっぽん
      if (c === '形' && chars[i - 1] === 'し' && chars[i - 2] === 'ひ') { out.push({ k: 1, b: c, y: 'がた', g: grade(c) }); i++; continue; }   // ひし形＝ひしがた
      if (c === '算' && chars[i - 1] === 'っ' && chars[i - 2] === 'ひ') { out.push({ k: 1, b: c, y: 'さん', g: grade(c) }); i++; continue; }   // ひっ算＝ひっさん（たし算・ひき算は ざん）
      const rest = chars.slice(i).join(''), key = (BYFIRST[c] || []).find(k => rest.startsWith(k));
      if (key) { out.push(...unitsOf(key, DICT[key])); i += [...key].length; continue; }
      // 辞書にない：漢字の続く所までを1つに（読みなし）
      let j = i; while (j < chars.length && isKanji(chars[j])) j++;
      const run = chars.slice(i, j).join(''); missing.add(run + chars.slice(j, j + 2).join(''));
      [...run].forEach(ch => out.push({ k: 1, b: ch, y: null, g: grade(ch) }));
      i = j;
    }
    return out;
  }
  /* 文全体を部品の列に：{k:0 文字} {k:1 漢字} {k:'em'} {k:'fr',a,b} {k:'br'} */
  function parse(text) {
    const s = String(text == null ? '' : text), out = [];
    const re = /\{([^|{}]+)\|([^{}]+)\}|\*\*|\[\[([^\]\/]*)\/([^\]]*)\]\]|\n/g;
    let last = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > last) out.push(...plainUnits(s.slice(last, m.index)));
      if (m[1] !== undefined) out.push(...unitsOf(m[1], m[2]).map(u => (u.k === 1 ? Object.assign(u, { ex: 1 }) : u)));
      else if (m[0] === '**') out.push({ k: 'em' });
      else if (m[3] !== undefined) out.push({ k: 'fr', a: m[3], b: m[4] });
      else out.push({ k: 'br' });
      last = re.lastIndex;
    }
    if (last < s.length) out.push(...plainUnits(s.slice(last)));
    return out;
  }

  /* ---------- 表示 ---------- */
  const DEF = { kg: 6, furi: 'new', mi: 'kana' };
  let S = Object.assign({}, DEF);
  function setSettings(o) { S = Object.assign({}, S, o || {}); }
  function kanjiHTML(u, st) {
    const ruby = () => `<ruby>${esc(u.b)}<rt>${esc(u.y)}</rt></ruby>`;
    if (!u.y) return esc(u.b);
    if (u.g > st.kg) return st.mi === 'kana' ? `<span class="kn">${esc(u.y)}</span>` : ruby();
    if (st.furi === 'all' || (st.furi === 'new' && u.g === st.kg)) return ruby();
    return esc(u.b);
  }
  const numStyle = t => esc(t);
  /* html(text) … 文を HTML に。typing:true なら1文字ずつ <span class="c"> で包む（タイプライター用。ルビは語ごと1つ） */
  function html(text, opt) {
    const st = Object.assign({}, S, opt || {}), units = parse(text);
    let out = '', em = false, n = 0;
    const wrap = h => (st.typing ? `<span class="c" data-i="${n++}">${h}</span>` : h);
    const VARS = 'xyzabcnp';   // ひとりで書かれた半角の文字（変数）は斜体に。cm・kg・m・L などの単位は、そのまま
    let curW = 0;
    const grp = w => { if (w !== curW) { if (curW) out += '</span>'; if (w) out += '<span class="wd">'; curW = w; } };   // 語（2字以上の漢字）は行のおわりで切れないように1つにまとめる
    for (let q = 0; q < units.length; q++) {
      const u = units[q];
      grp(u.k === 1 && u.w && units[q + 1] && units[q + 1].w === u.w || u.k === 1 && u.w && units[q - 1] && units[q - 1].w === u.w ? u.w : 0);
      if (u.k === 0 && /^[A-Za-z]$/.test(u.s) && VARS.includes(u.s) && !(units[q - 1] && units[q - 1].k === 0 && /^[A-Za-z]$/.test(units[q - 1].s)) && !(units[q + 1] && units[q + 1].k === 0 && /^[A-Za-z]$/.test(units[q + 1].s))) { out += wrap(`<i class="v">${esc(u.s)}</i>`); continue; }
      if (u.k === 0) out += wrap(numStyle(u.s));
      else if (u.k === 1) out += wrap(kanjiHTML(u, st));
      else if (u.k === 'em') { out += em ? '</b>' : '<b class="em">'; em = !em; }
      else if (u.k === 'fr') out += wrap(`<span class="fr"><span>${esc(u.a)}</span><span>${esc(u.b)}</span></span>`);
      else if (u.k === 'br') out += '<br>';
    }
    grp(0);
    if (em) out += '</b>';
    return st.typing ? { html: out, n } : out;
  }
  /* 見た目の文字数（字幕の長さの検査用。ひらがなにした所はその長さ） */
  function visLen(text) { return parse(text).reduce((a, u) => a + (u.k === 0 ? 1 : u.k === 1 ? (u.b ? [...u.b].length : 0) : u.k === 'fr' ? 2 : 0), 0); }

  /* ---------- 読み上げの文 ---------- */
  const DIGIT = ['れい', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];
  function say(text) {
    let s = String(text == null ? '' : text);
    s = s.replace(/\{([^|{}]+)\|([^{}]+)\}/g, (m, b, y) => y.replace(/\./g, ''));   // 読みを指定した所は、かなで読ませる
    s = s.replace(/ひっ算/g, 'ひっさん');   // ひっ算＝ひっさん（たし算・ひき算は ざん）
    s = s.replace(/(\d+)\s*\[\[(\d+)\/(\d+)\]\]/g, '$1と$3分の$2');   // 帯分数：1[[1/2]]＝1と2分の1
    s = s.replace(/\*\*/g, '').replace(/\[\[([^\]\/]*)\/([^\]]*)\]\]/g, '$2分の$1').replace(/\n/g, '');
    s = s.replace(/(^|[^0-9])1辺/g, '$1いっぺん');
    s = s.replace(/(?<=[0-9０-９]\s*)g(?![A-Za-z])/g, 'グラム').replace(/(?<=[0-9０-９]\s*)t(?![A-Za-z])/g, 'トン').replace(/(?<=[0-9０-９]\s*)L(?![A-Za-z])/g, 'リットル');   // 数のあとの g・t・L（小数の読みより先に。あとだと 0.6L が「れいてんろくエル」になる）
    s = s.replace(/(\d)\s*[−－-]\s*(?=\d)/g, '$1ひく');   // 小数のひき算（0.62－0.27）：小数の読みに直す前に「ひく」にする（あとだと 点のあとのかなで見失う）
    s = s.replace(/(\d+)\.(\d+)/g, (m, a, b) => a + '点' + [...b].map(d => DIGIT[+d]).join(''));
    s = s.replace(/(?<![A-Za-z])dL(?![A-Za-z])/g, 'デシリットル').replace(/(?<![A-Za-z])mL(?![A-Za-z])/g, 'ミリリットル').replace(/(?<![A-Za-z])kL(?![A-Za-z])/g, 'キロリットル').replace(/(?<=[0-9０-９]\s*)L(?![A-Za-z])/g, 'リットル');   // L は数のあとだけ（「L字」はそのまま）
    s = s.replace(/[%％]/g, 'パーセント');   // 割合の単元（5年）
    s = s.replace(/cm\s*³/g, '立方センチメートル').replace(/(?<![A-Za-z])m\s*³/g, '立方メートル').replace(/°/g, '度');
    s = s.replace(/km\s*²/g, '平方キロメートル').replace(/(?<=[0-9０-９]\s*)ha(?![A-Za-z])/g, 'ヘクタール');   // 面積の単位 km²・ha（a は文字式の a と区別できないので 台本の say: で）
    s = s.replace(/cm\s*²/g, '平方センチメートル').replace(/(?<![A-Za-z])m\s*²/g, '平方メートル').replace(/(?<![A-Za-z])cm(?![A-Za-z])/g, 'センチメートル').replace(/(?<![A-Za-z])m(?![A-Za-z])/g, 'メートル');
    s = s.replace(/(?<![A-Za-z])kg(?![A-Za-z])/g, 'キログラム').replace(/(?<![A-Za-z])km(?![A-Za-z])/g, 'キロメートル').replace(/(?<![A-Za-z])mm(?![A-Za-z])/g, 'ミリメートル');
    s = s.replace(/(?<![A-Za-z])([A-Za-z])(?![A-Za-z])/g, (m, c) => ({ x: 'エックス', y: 'ワイ', z: 'ゼット', a: 'エー', b: 'ビー', c: 'シー', n: 'エヌ', p: 'ピー', A: 'エー', B: 'ビー', C: 'シー', D: 'ディー', E: 'イー', P: 'ピー', Q: 'キュー' }[c] || m));
    s = s.replace(/(?<=[0-9０-９A-Za-zァ-ヶ）)])\s+:\s+(?=[0-9０-９A-Za-zァ-ヶ（(□])/g, 'たい');   // 比：2 : 3＝2対3（半角のコロンの前後に空白があるとき）
    s = s.replace(/－/g, '−').replace(/(?<![A-Za-z])HP(?![A-Za-z])/g, 'エイチピー');   // 全角のマイナスも ひく／HP
    s = s.replace(/(?<![0-9])4じ/g, 'よじ').replace(/(?<![0-9])7じ/g, 'しちじ').replace(/(?<![0-9])9じ/g, 'くじ');   // 時刻：4じ・7じ・9じ
    s = s.replace(/(?<![0-9])10(?=[ぽぴ][んき])/g, 'じゅっ').replace(/(?<![0-9])1(?=[ぽぴ][んき])/g, 'いっ').replace(/(?<![0-9])6(?=[ぽぴ][んき])/g, 'ろっ').replace(/(?<![0-9])8(?=[ぽぴ][んき])/g, 'はっ');   // 1ぽん・6ぽん・8ぴき など
    s = s.replace(/×/g, 'かける').replace(/÷/g, 'わる').replace(/[＋+]/g, 'たす').replace(/(?<=[0-9）)度ー□])\s*[−-]\s*(?=[0-9（(ァ-ヶ□])/g, 'ひく').replace(/(?<=[ァ-ヶ])\s*[−-]\s*(?=[0-9（(ァ-ヶ])/g, 'ひく').replace(/＝/g, 'は');
    s = s.replace(/[（(]/g, '、').replace(/[）)]/g, '、').replace(/、+/g, '、').replace(/^、|、(?=[。！？])/g, '');
    s = s.replace(/[□？]{2,}/g, 'なに').replace(/□/g, 'しかく');
    return s;
  }
  /* 読み上げの文を、声の「キー」に（同じ人・同じ文なら同じ声ファイル）。ブラウザと tools/voice.mjs で同じ計算 */
  function voiceKey(who, text) {
    let h = 0x811c9dc5; const t = who + '|' + say(text);
    for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(36);
  }

  root.RUBY = { addDict, parse, html, say, voiceKey, visLen, setSettings, get settings() { return S; }, DEF, missing, isKanji };
})();
