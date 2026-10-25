/* バスケ育成チャット：データの入れ物と、ことばから探すしくみ（BC）。画面（js/app.js）からも検査（tools/check.cjs）からも使う。DOM は使わない。
   データのファイル（data/*.js）は、BC.tactic / BC.drill / BC.view / BC.issue に渡して自分を登録する（1つずつでも、配列でまとめてでもよい）。

   ■ 共通
     id      種類ごとの頭文字＋半角の英小文字・数字・-（戦術 t- ／練習メニュー d- ／改善の視点 v- ／困りごと i-）
     alias   別名・英語名・表記ゆれ（名前で探す・動画のファイル名と照らす。そのものを指す言葉だけ。例：'マイカン'、'Mikan Drill'）
     words   チャットの文に出てきそうな言葉（探すときだけ使う。動画とは照らさない。例：'ゴール下'、'連続'）
     level   1＝はじめて・ミニバス／2＝中学・高校の部活／3＝上級（高校の上位・大学・社会人）
     skills  関係する技能の id（data/skills.js）。1つ目が主
     文の書き方：summary・empathy・tip は です・ます。how・steps・points・checks などの箇条は、常体の短い文か体言止め。
     **太字** が使える。

   ■ 戦術  BC.tactic({ id:'t-…', name, alias, words, cat, kind, level, skills, summary, how, points, good, weak, counter, note, drills, views, related, diagram })
     cat      'offense'（攻め）| 'defense'（守り）| 'transition'（攻守の切りかえ）| 'situation'（場面：スローイン・終盤など）
     kind     種類（短く。例：'2人の動き'、'システム'、'セットプレー'、'ゾーン'、'プレス'）
     how      動き方（順番に）　points 成功のポイント　good 強み・向いているチーム　weak 弱み・気をつけること
     counter  相手にされたら（攻略・対策）　note 補足（ルールの注意など）
     drills 練習メニュー id　views 改善の視点 id　related 関連する戦術 id
     diagram  作戦図（下の「作戦図」）

   ■ 練習メニュー  BC.drill({ id:'d-…', name, alias, words, skills, level, n, minutes, phase, intensity, equip, place, aim, setup, steps, points, ng, easier, harder, views, tactics, diagram })
     n         最少の人数（1＝ひとりでできる）
     minutes   1回の目安（分）
     phase     'warmup'（準備）| 'skill'（技術の反復）| 'game'（対人・試合に近い形）| 'cooldown'（整理・しめくくり）
     intensity きつさ 1〜3
     equip     用具（例：['ボール 1人1個', 'コーン 4つ']）
     place     'any'（どこでも・家でも）| 'hoop'（ゴールが1つあればよい）| 'half'（ハーフコート）| 'full'（オールコート）
     aim ねらい（1文）　setup 準備・並び方　steps 進め方（順番に）　points コーチングポイント・声かけ
     ng        よくある失敗と直し方 [['失敗', '直し方'], …]
     easier やさしくするには　harder むずかしくするには
     views 改善の視点 id　tactics 関連する戦術 id

   ■ 改善の視点  BC.view({ id:'v-…', skill, name, alias, words, summary, checks, good, ng, cue, drills, level })
     skill    技能の id（1つ）　level（なくてもよい）
     summary  なぜ大事か　checks 見るポイント（チェックリスト）　good うまくいっている状態（1文）
     ng       よくある崩れと直し方 [['崩れ', '直し方'], …]　cue 合言葉（短い声かけ。例：'肘はリングへ'）
     drills   練習メニュー id

   ■ 困りごと  BC.issue({ id:'i-…', skill, title, alias, words, who, empathy, summary, ask, causes, views, drills, tactics, tip, next })
     title    困りごと（話す人のことばで。例：'シュートが入らない'）
     alias    言いかえ（文のまま。例：'シュート率が低い'）
     words    文に出てきそうな言葉（例：'シュート'、'入らない'、'はいらない'、'外れる'）
     who      'player'（選手の悩み）| 'coach'（指導者・保護者の悩み）| 'both'（初期値）
     empathy  はじめのひとこと（受け止める1文）　summary 考え方（1〜2文）
     ask      絞りこむ問い（なくてもよい）{ q: '問い', options: [{ label: '答え', to: '困りごとの id' }] }（to は戦術・練習・視点の id でもよい）
     causes   考えられる原因 [{ text: '原因', check: '確かめ方', views: ['v-…'] }]
     views 改善の視点 id（大事な順）　drills 練習メニュー id（おすすめ順に3〜6）　tactics 関連する戦術 id
     tip ひとこと（覚えておきたいこと）　next 次に見るとよい困りごと id

   ■ 作戦図（diagram）　1場面なら { o, x, ball, moves, note }、何場面かなら { court, frames: [ { o, x, ball, moves, note }, … ] }
     court    'half'（初期値。ハーフコート、ゴールが上）| 'full'（オールコート。上のゴールを攻める）
     o        攻めの位置（1番から順に）。場所の名前（下の BC.spots）か [x, y]（m。x は −7.5〜7.5、左がマイナス。y はエンドラインから。ハーフラインが 14、full の反対のエンドラインが 28）
     x        守りの位置（なくてもよい）
     ball     ボールを持つ攻めの番号（1から）。だれも持っていないときは、場所の名前か [x, y]（床のボール）
     moves    動き [{ t, from, to, via }]
                t：'pass'（パス・点線）| 'cut'（走る・実線）| 'dribble'（ドリブル・波線）| 'screen'（スクリーン・先に横棒）| 'handoff'（手渡し）| 'move'（そのほかの移動）
                from・to：'o1'〜'o5'（その場面の攻めの人）・'x1'〜'x5'（守り）・場所の名前・[x, y]。via は曲がる点（なくてもよい）
                守りの動き（赤い線）は from が 'x1'〜'x5' のとき。座標から始まる守りの動きは def: true
     cones    コーンなどの目印の位置（なくてもよい。場所の名前か [x, y]）
     note     その場面の説明（1文）
     場面（frames）で o・x・ball・cones を書かなければ、前の場面と同じ。 */
(function (root) {
  const BC = (root.BC = root.BC || {});
  BC.skills = BC.skills || [];
  BC.skillMap = BC.skillMap || {};
  BC.items = {};
  BC.lists = { tactic: [], drill: [], view: [], issue: [] };
  BC.KINDS = {
    issue: { name: '困りごと', prefix: 'i-' },
    view: { name: '改善の視点', prefix: 'v-' },
    drill: { name: '練習メニュー', prefix: 'd-' },
    tactic: { name: '戦術', prefix: 't-' },
  };
  BC.LEVELS = { 1: 'はじめて・ミニバス', 2: '中学・高校', 3: '上級' };
  BC.PHASES = { warmup: '準備', skill: '技術', game: '対人・ゲーム', cooldown: 'しめくくり' };
  BC.PLACES = { any: 'どこでも（家でも）', hoop: 'ゴール1つ', half: 'ハーフコート', full: 'オールコート' };
  BC.TCATS = { offense: '攻め', defense: '守り', transition: '切りかえ', situation: '場面' };
  BC.FIELDS = {
    tactic: ['id', 'name', 'alias', 'words', 'cat', 'kind', 'level', 'skills', 'summary', 'how', 'points', 'good', 'weak', 'counter', 'note', 'drills', 'views', 'related', 'diagram'],
    drill: ['id', 'name', 'alias', 'words', 'skills', 'level', 'n', 'minutes', 'phase', 'intensity', 'equip', 'place', 'aim', 'setup', 'steps', 'points', 'ng', 'easier', 'harder', 'views', 'tactics', 'diagram'],
    view: ['id', 'skill', 'name', 'alias', 'words', 'summary', 'checks', 'good', 'ng', 'cue', 'drills', 'level'],
    issue: ['id', 'skill', 'title', 'alias', 'words', 'who', 'empathy', 'summary', 'ask', 'causes', 'views', 'drills', 'tactics', 'tip', 'next'],
  };
  BC.loadErrors = [];
  BC.currentFile = '';

  function add(kind, def) {
    if (Array.isArray(def)) { def.forEach((d) => add(kind, d)); return; }
    if (!def || !def.id) { BC.loadErrors.push(`${BC.KINDS[kind].name}：id のないものがある（${BC.currentFile}）`); return; }
    if (BC.items[def.id]) { BC.loadErrors.push(`id が重複している：${def.id}（${BC.currentFile}）`); return; }
    def.kind_ = kind;
    def.file_ = BC.currentFile;
    if (kind === 'issue') def.name = def.title;
    if (kind === 'view' && !def.skills) def.skills = def.skill ? [def.skill] : [];
    if (kind === 'issue' && !def.skills) def.skills = def.skill ? [def.skill] : [];
    BC.items[def.id] = def;
    BC.lists[kind].push(def);
    BC._index = null;
  }
  BC.tactic = (d) => add('tactic', d);
  BC.drill = (d) => add('drill', d);
  BC.view = (d) => add('view', d);
  BC.issue = (d) => add('issue', d);
  BC.setSkills = function (list) {
    BC.skills = list;
    BC.skillMap = {};
    for (const s of list) BC.skillMap[s.id] = s;
  };
  BC.get = (id) => BC.items[id] || null;
  BC.kindOf = (id) => {
    for (const k of Object.keys(BC.KINDS)) if (String(id).startsWith(BC.KINDS[k].prefix)) return k;
    return null;
  };
  BC.all = () => Object.values(BC.items);

  /* ---------- 場所（作戦図の位置。m。x は左が −、y はエンドラインから） ---------- */
  BC.spots = {
    rim: [0, 1.575],
    lb: [-2.75, 2.0], rb: [2.75, 2.0],            // ブロック（ローポスト）
    lm: [-2.75, 3.6], rm: [2.75, 3.6],            // ミドルポスト
    le: [-2.45, 5.8], re: [2.45, 5.8],            // エルボー
    hp: [0, 5.8],                                 // ハイポスト（フリースローラインの真ん中）
    mp: [0, 3.4],                                 // ペイントの真ん中
    lsc: [-4.6, 1.6], rsc: [4.6, 1.6],            // ショートコーナー
    lc: [-6.75, 0.9], rc: [6.75, 0.9],            // コーナー（3P）
    lw: [-5.9, 5.6], rw: [5.9, 5.6],              // ウイング（3P）
    ls: [-2.8, 8.0], rs: [2.8, 8.0],              // スロット（ガードの位置）
    top: [0, 8.5],                                // トップ
    lhw: [-5.5, 11.0], rhw: [5.5, 11.0],          // ハーフライン近くのウイング
    half: [0, 12.5],                              // ハーフライン近くの真ん中
    'oob-lb': [-2.5, -0.7], 'oob-rb': [2.5, -0.7],// エンドラインの外（スローイン）
    'oob-l': [-8.1, 8.5], 'oob-r': [8.1, 8.5],    // サイドラインの外（スローイン）
    // オールコート（自陣：y 14〜28。自陣のゴールは下）
    mid: [0, 14], lmid: [-5.5, 14], rmid: [5.5, 14],
    'b-lhw': [-5.5, 17], 'b-rhw': [5.5, 17],
    'b-top': [0, 19.5], 'b-ls': [-2.8, 20], 'b-rs': [2.8, 20],
    'b-hp': [0, 22.2], 'b-le': [-2.45, 22.2], 'b-re': [2.45, 22.2],
    'b-lw': [-5.9, 22.4], 'b-rw': [5.9, 22.4],
    'b-lb': [-2.75, 26], 'b-rb': [2.75, 26],
    'b-lc': [-6.75, 27.1], 'b-rc': [6.75, 27.1],
    'b-rim': [0, 26.425], 'b-oob': [1.8, 28.7],
  };
  BC.spotNames = {
    rim: 'ゴール下', lb: '左ブロック', rb: '右ブロック', lm: '左ミドルポスト', rm: '右ミドルポスト', le: '左エルボー', re: '右エルボー',
    hp: 'ハイポスト', mp: 'ペイント中央', lsc: '左ショートコーナー', rsc: '右ショートコーナー', lc: '左コーナー', rc: '右コーナー',
    lw: '左ウイング', rw: '右ウイング', ls: '左スロット', rs: '右スロット', top: 'トップ',
  };

  // 作戦図を場面の並びにそろえる（o・x・ball を前の場面から引きつぐ）。位置は [x, y] に
  BC.frames = function (dg) {
    if (!dg) return [];
    const raw = dg.frames && dg.frames.length ? dg.frames : [dg];
    let o = [], x = [], ball = 0, cones = [];
    return raw.map((f) => {
      if (f.o) o = f.o.map(BC.pos);
      if (f.x) x = f.x.map(BC.pos);
      if (f.cones) cones = f.cones.map(BC.pos).filter(Boolean);
      if (f.ball != null) ball = f.ball;
      const at = (p) => {
        if (typeof p === 'string') {
          const m = p.match(/^([ox])([1-5])$/);
          if (m) return (m[1] === 'o' ? o : x)[+m[2] - 1] || null;
        }
        return BC.pos(p);
      };
      const moves = (f.moves || []).map((mv) => ({
        t: mv.t, from: at(mv.from), to: at(mv.to), via: mv.via ? at(mv.via) : null,
        def: mv.def === true || (typeof mv.from === 'string' && /^x/.test(mv.from)),
      }));
      const ballAt = typeof ball === 'number' ? (ball ? o[ball - 1] || null : null) : BC.pos(ball);
      return { court: dg.court || 'half', o: o.slice(), x: x.slice(), ball, ballAt, moves, cones: cones.slice(), note: f.note || '' };
    });
  };
  BC.pos = function (p) {
    if (Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === 'number')) return p;
    if (typeof p === 'string' && BC.spots[p]) return BC.spots[p];
    return null;
  };

  /* ---------- ことばをそろえる ---------- */
  // 全角・半角、カタカナ・ひらがな、記号・空白のちがいをなくす。「3on3」「3vs3」「3対3」は同じに
  BC.norm = function (s) {
    s = String(s == null ? '' : s).normalize('NFKC').toLowerCase();
    s = s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
    s = s.replace(/[\s&＆・･\-‐－―−_、。,.!！?？「」『』（）()\[\]【】〔〕〈〉《》:：;；'"“”‘’/／\\~〜…#＃+＋*＊%％|｜=＝<>→←↑↓]/g, '');
    s = s.replace(/(\d)(?:on|vs|v|対)(\d)/g, '$1対$2');
    return s;
  };
  // 文字の並び（2字ずつ）。ひらがなだけの並び（「して」「まう」など、どの文にもある語尾）は数えない
  const bigrams = (s) => {
    const out = new Set();
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2);
      if (!/^[\u3041-\u309f]{2}$/.test(g)) out.add(g);
    }
    return out;
  };
  const stripParen = (s) => String(s).replace(/[（(][^）)]*[）)]/g, '');
  const isAscii = (s) => /^[a-z0-9]+$/.test(s);

  // 探すための言葉の一覧をつくる（データが変わったら作り直す）
  function index() {
    if (BC._index) return BC._index;
    const items = [];
    for (const it of BC.all()) {
      const strong = new Set();
      const label = it.kind_ === 'issue' ? it.title : it.name;
      [label, stripParen(label), ...(it.alias || [])].forEach((w) => {
        const n = BC.norm(w);
        if (n.length >= 2) strong.add(n);
      });
      const weak = new Set();
      (it.words || []).forEach((w) => {
        const n = BC.norm(w);
        // 1字は、漢字（肘・膝・奥など）だけ使う
        if ((n.length >= 2 || /^[\u4e00-\u9fff]$/.test(n)) && !strong.has(n)) weak.add(n);
      });
      const byLen = (a, b) => b.length - a.length;
      items.push({ it, strong: [...strong].sort(byLen), weak: [...weak].sort(byLen), grams: bigrams([...strong].join('|')) });
    }
    const skills = BC.skills.map((s) => ({ s, words: [s.name, ...(s.words || [])].map(BC.norm).filter((w) => w.length >= 2) }));
    BC._index = { items, skills };
    return BC._index;
  }
  BC.reindex = () => { BC._index = null; return index(); };

  // ascii の短い言葉（pnr など）は、前後が英数字でないときだけ当てる
  function hasTerm(text, raw, t) {
    if (isAscii(t) && t.length <= 4) {
      // 前後が英数字でないこと。記号を消す前（raw）と後（text。「2-3」→「23」）の両方で見る
      const re = new RegExp('(^|[^a-z0-9])' + t + '([^a-z0-9]|$)');
      return re.test(raw) || re.test(text);
    }
    return text.includes(t);
  }

  const stem = (w) => (w.length >= 4 && !isAscii(w) && /[るいたてだうくすつぬむぶぐしれ]$/.test(w) ? w.slice(0, -1) : null);
  // 1つの項目が、文にどれだけ当てはまるか
  function scoreItem(text, raw, grams, e) {
    let s = 0;
    const hits = [];
    // すでに当たった長い言葉の中にある短い言葉（「ピックアンドロール」の中の「ロール」）は、重ねて数えない
    const named = [];
    const inside = (t) => named.some((h) => h.length > t.length && h.includes(t));
    for (const t of e.strong) {
      if (inside(t)) continue;
      if (hasTerm(text, raw, t)) { s += 4 + t.length * 1.3; hits.push(t); named.push(t); }
      else {
        const st = stem(t);
        if (st && st.length >= 4 && text.includes(st)) { s += 3 + st.length * 1.1; hits.push(st); }
      }
    }
    for (const w of e.weak) {
      if (inside(w)) continue;
      if (hasTerm(text, raw, w)) { s += Math.min(w.length, 6) * 1.0 + 0.5; hits.push(w); }
      else {
        // 語尾のちがい（「下を見る」と「下を見て」など）は、最後の1字を外して見る
        const st = stem(w);
        if (st && text.includes(st)) { s += Math.min(st.length, 6) * 0.7; hits.push(st); }
      }
    }
    if (!hits.length && e.grams.size) {
      // 言葉はぴったりでないが、文字の並びが近い（「シュートがはいんない」など）
      let common = 0;
      for (const g of grams) if (e.grams.has(g)) common++;
      const r = common / Math.max(4, Math.min(grams.size, e.grams.size));
      if (r >= 0.34) s += r * 6;
    }
    return { s, hits };
  }

  /* ---------- 文から、話している人の条件を読む ---------- */
  BC.context = function (input) {
    // BC.norm はカタカナをひらがなにするので、ここで使う正規表現の言葉もひらがなにそろえる
    const t = BC.norm(input);
    const kana = (re) => new RegExp(re.source.replace(/[\u30a1-\u30f6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60)), re.flags);
    const has = (re) => kana(re).test(t);
    const c = {};
    const min = t.match(/(\d{1,3})分/);
    const hr = t.match(/(\d(?:\.\d)?)時間/);
    const half = t.match(/(\d)時間半/);
    if (min) c.minutes = Math.min(240, +min[1]);
    else if (half) c.minutes = +half[1] * 60 + 30;
    else if (hr) c.minutes = Math.round(+hr[1] * 60);
    // 人数は、練習の話のときだけ読む（「1人で攻めてしまう」「2人に囲まれる」は人数ではない）
    const practice = has(/(練習|れんしゅう|メニュー|ドリル|トレーニング|できる|やれる|自主|プラン)/);
    if (has(/(自主練|じしゅれん|家で|いえで|自宅|ひとり練|個人練)/)) c.n = 1;
    else if (practice && has(/(ひとりで|一人で|1人で|ひとりでも|一人でも)/)) c.n = 1;
    else if (practice && has(/(2人で|ふたりで|二人で|親子|おやこ)/)) c.n = 2;
    else if (practice) {
      const p = t.match(/(\d{1,2})人(で|しか|だけ|います|いる|の|くらい|ぐらい|程度)/) || t.match(/(?:部員|選手|人数)[がはも]?(\d{1,2})人/);
      if (p) c.n = +p[1];
      else if (has(/(チームで|チーム練習|部員|全員|みんなで)/)) c.n = 8;
    }
    if (has(/(家で|いえで|自宅|部屋|室内で|ゴールがない|ゴールなし)/)) c.place = 'any';
    if (has(/(ミニバス|小学|低学年|高学年|初心者|はじめて|初めて|始めたばかり|はじめたばかり|未経験|幼稚園|キッズ|u12|u10)/)) c.level = 1;
    else if (has(/(中学|高校|部活|u15|u18)/)) c.level = 2;
    else if (has(/(上級|大学|社会人|プロ|強豪|全国)/)) c.level = 3;
    if (has(/(コーチ|指導|教え|保護者|監督|顧問|子ども|子供|こども|息子|娘|うちの子|選手たち)/)) c.who = 'coach';
    // 「組み方がわからない」「立て方」のような、やり方を聞く文はプランにしない（困りごと「練習メニューの組み方」へ）
    c.wantsPlan = has(/(メニュー|プラン|計画|練習内容).{0,6}((作|組|考|立|決)(?![みりえてめ]?方)|ください|ほしい|欲しい|教えて)|(組んで|くんで|作って|つくって|考えて|立てて).{0,4}$/);
    c.wantsVideo = has(/(動画|映像|ビデオ|見たい|みたい)/);
    return c;
  };

  /* ---------- 探す ---------- */
  // 文に近い項目を、点の高い順に。kinds で種類をしぼれる
  BC.search = function (input, opts = {}) {
    const ix = index();
    const text = BC.norm(input);
    const raw = String(input || '').normalize('NFKC').toLowerCase();
    if (!text) return [];
    const grams = bigrams(text);
    const kinds = opts.kinds || null;
    // 技能の言葉が文にあれば、その技能の項目に少し点を足す
    const skillHit = {};
    for (const { s, words } of ix.skills) for (const w of words) if (text.includes(w)) skillHit[s.id] = Math.max(skillHit[s.id] || 0, w.length);
    const out = [];
    for (const e of ix.items) {
      if (kinds && !kinds.includes(e.it.kind_)) continue;
      const r = scoreItem(text, raw, grams, e);
      if (r.s <= 0) continue;
      let s = r.s;
      const sk = (e.it.skills || [])[0];
      if (sk && skillHit[sk]) s += 1.5;
      if (e.it.kind_ === 'issue') s *= 1.08;
      out.push({ item: e.it, score: Math.round(s * 10) / 10, hits: r.hits });
    }
    // 同じ点なら、困りごと → 戦術 → 練習 → 視点 の順
    const rank = { issue: 0, tactic: 1, drill: 2, view: 3 };
    out.sort((a, b) => b.score - a.score || rank[a.item.kind_] - rank[b.item.kind_]);
    return out;
  };
  BC.skillsIn = function (input) {
    const text = BC.norm(input);
    const ix = index();
    const hit = [];
    for (const { s, words } of ix.skills) {
      let best = 0;
      for (const w of words) if (text.includes(w)) best = Math.max(best, w.length);
      if (best) hit.push({ skill: s, score: best });
    }
    return hit.sort((a, b) => b.score - a.score).map((h) => h.skill);
  };

  /* ---------- チャットの答えを決める（画面は、この形を見て描く） ----------
     返すもの：{ type: 'issue' | 'item' | 'skill' | 'plan' | 'none', ... }  */
  BC.answer = function (input, state = {}) {
    const ctx = Object.assign({}, state.profile || {}, stripUndef(BC.context(input)));
    const hits = BC.search(input);
    const issues = hits.filter((h) => h.item.kind_ === 'issue');
    const others = hits.filter((h) => h.item.kind_ !== 'issue');
    const topIssue = issues[0];
    const topOther = others[0];
    const skills = BC.skillsIn(input);
    const minIssue = 5.5;

    if (ctx.wantsPlan) {
      let focus = [];
      if (topIssue && topIssue.score >= minIssue) focus = [topIssue.item.id];
      else if (state.lastIssue) focus = [state.lastIssue];
      const plan = BC.plan({ minutes: ctx.minutes || 60, n: ctx.n, level: ctx.level, place: ctx.place, focus, skills: skills.map((s) => s.id) });
      return { type: 'plan', plan, ctx };
    }
    // 名前そのもの（「マイカンドリル」「2-3ゾーン」）を言ったときは、その項目
    const strongOther = topOther && topOther.hits.some((h) => topOther.item.kind_ !== 'issue' && isStrong(topOther.item, h));
    // 困っている言い方（「やられた」「できない」「苦手」）なら、名前が同じ戦術より困りごとを先に
    const complain = /(ない|なかった|られ|苦手|困|悩|負け|弱い|下手|へた)/.test(BC.norm(input));
    // 改善の視点は、最初の答えとしては狭いので、困りごとより はっきり上のときだけ
    let lean = complain && topIssue && topIssue.score >= 5 ? 2 : 1.05;
    if (topOther && topOther.item.kind_ === 'view') lean = Math.max(lean, 1.3);
    if (topOther && strongOther && (!topIssue || topOther.score > topIssue.score * lean)) {
      const rel = BC.issuesFor(topOther.item.id).slice(0, 4);
      return { type: 'item', item: topOther.item, alts: others.slice(1, 4).filter((h) => h.score >= topOther.score * 0.6).map((h) => h.item), related: rel, ctx };
    }
    if (topIssue && topIssue.score >= minIssue) {
      const alts = issues.slice(1, 4).filter((h) => h.score >= topIssue.score * 0.6).map((h) => h.item);
      return { type: 'issue', issue: topIssue.item, alts, ctx };
    }
    if (skills.length) {
      const sk = skills[0];
      return { type: 'skill', skill: sk, issues: BC.lists.issue.filter((i) => i.skill === sk.id), ctx, guess: topIssue ? topIssue.item : null };
    }
    if (topIssue && topIssue.score >= 2.5) return { type: 'issue', issue: topIssue.item, alts: issues.slice(1, 3).map((h) => h.item), weak: true, ctx };
    if (topOther && topOther.score >= 4) return { type: 'item', item: topOther.item, alts: others.slice(1, 4).map((h) => h.item), related: BC.issuesFor(topOther.item.id).slice(0, 4), ctx };
    return { type: 'none', ctx };
  };
  function isStrong(it, normTerm) {
    const label = it.kind_ === 'issue' ? it.title : it.name;
    return [label, stripParen(label), ...(it.alias || [])].some((w) => BC.norm(w) === normTerm);
  }
  function stripUndef(o) {
    const r = {};
    for (const k of Object.keys(o)) if (o[k] !== undefined && o[k] !== false) r[k] = o[k];
    return r;
  }

  // ある項目を挙げている困りごと
  BC.issuesFor = function (id) {
    return BC.lists.issue.filter((i) => [...(i.drills || []), ...(i.views || []), ...(i.tactics || [])].includes(id));
  };
  // ある項目を挙げているもの（逆引き。練習メニュー → それを使う視点・戦術 など）
  BC.backlinks = function (id) {
    const out = [];
    for (const it of BC.all()) {
      if (it.id === id) continue;
      const refs = [...(it.drills || []), ...(it.views || []), ...(it.tactics || []), ...(it.related || []), ...(it.next || [])];
      for (const c of it.causes || []) refs.push(...(c.views || []));
      if (refs.includes(id)) out.push(it);
    }
    return out;
  };

  // 条件にあう練習メニュー（人数・レベル・場所）。n が未定・level が未定なら、しぼらない
  BC.fits = function (d, opt = {}) {
    if (!d || d.kind_ !== 'drill') return false;
    if (opt.n && d.n > opt.n) return false;
    if (opt.level && d.level > opt.level + (opt.strict ? 0 : 1)) return false;
    if (opt.place === 'any' && d.place !== 'any') return false;
    return true;
  };
  // 困りごとのおすすめ練習を、条件に合うものから順に
  BC.drillsFor = function (issue, opt = {}) {
    const ids = (issue.drills || []).slice();
    // 視点に書かれた練習も、うしろに足す
    for (const vid of issue.views || []) for (const d of (BC.get(vid) || {}).drills || []) if (!ids.includes(d)) ids.push(d);
    const list = ids.map(BC.get).filter(Boolean);
    const ok = list.filter((d) => BC.fits(d, opt));
    const rest = list.filter((d) => !ok.includes(d));
    return { ok, rest };
  };

  /* ---------- 練習プラン ----------
     opt: { minutes, n, level, focus: [困りごと id], skills: [技能 id] }
     返す：{ minutes, blocks: [{ key, name, items: [{ drill, min }] }], focus, skills, note }  */
  BC.plan = function (opt = {}) {
    const minutes = Math.max(15, Math.min(240, opt.minutes || 60));
    const n = opt.n || null, level = opt.level || null, place = opt.place || null;
    // 指導・練習の組み方の困りごと（「練習メニューの組み方がわからない」など）は、テーマにしない（基本をひととおり）
    const focusIssues = (opt.focus || []).map(BC.get).filter((i) => i && i.skill !== 'coach');
    let skills = opt.skills && opt.skills.length ? opt.skills.slice() : [];
    for (const i of focusIssues) if (i.skill && !skills.includes(i.skill)) skills.unshift(i.skill);
    const general = !skills.length;
    // テーマがないときは、基本をひととおり（ドリブル・フィニッシュ・シュート・パス・守り）
    if (general) skills = ['dribble', 'finish', 'shoot', 'pass', 'defball'];
    const fit = (d) => BC.fits(d, { n, level, place, strict: true });
    const used = new Set();
    let hard = 0;
    const hardMax = level === 1 ? 1 : 2; // きつさ3の練習は、1回の練習に1〜2つまで
    const pick = (cands, budget, phaseOk) => {
      const items = [];
      let left = budget;
      for (const d of cands) {
        if (left < 3) break;
        if (!d || used.has(d.id) || !fit(d) || (phaseOk && !phaseOk(d.phase))) continue;
        if (d.intensity === 3 && hard >= hardMax) continue;
        const want = d.minutes || 10;
        const min = Math.max(3, Math.min(want, left));
        items.push({ drill: d, min });
        used.add(d.id);
        if (d.intensity === 3) hard++;
        left -= min;
      }
      return { items, left };
    };
    // 中心にする練習：困りごとのおすすめ → その技能の練習
    const focusDrills = [];
    for (const i of focusIssues) for (const d of BC.drillsFor(i).ok.concat(BC.drillsFor(i).rest)) if (!focusDrills.includes(d)) focusDrills.push(d);
    // その技能の練習を、技能ごとに順番に（1つの技能にかたよらないように）
    const bySkill = skills.map((s) => BC.lists.drill.filter((d) => (d.skills || [])[0] === s).concat(BC.lists.drill.filter((d) => (d.skills || [])[0] !== s && (d.skills || []).includes(s))).filter(fit));
    const skillDrills = [];
    for (let i = 0; bySkill.some((l) => l[i]); i++) for (const l of bySkill) if (l[i] && !skillDrills.includes(l[i])) skillDrills.push(l[i]);
    const solo = n === 1;
    const budget = {
      warmup: Math.max(5, Math.round(minutes * 0.15)),
      cooldown: Math.max(5, Math.round(minutes * 0.1)),
    };
    // ひとりのときも、ひとりでできるゲーム（シュートゲームなど）を少し
    budget.game = Math.round(minutes * (solo ? 0.12 : 0.27));
    budget.skill = minutes - budget.warmup - budget.cooldown - budget.game;

    const blocks = [];
    const warmCands = [BC.get('d-dynamic'), ...BC.lists.drill.filter((d) => d.phase === 'warmup' && (d.skills || []).some((s) => skills.includes(s))), ...BC.lists.drill.filter((d) => d.phase === 'warmup')];
    const w = pick(warmCands, budget.warmup, (p) => p === 'warmup');
    blocks.push({ key: 'warmup', name: 'ウォームアップ', items: w.items });
    const sk = pick([...focusDrills, ...skillDrills], budget.skill + w.left, (p) => p === 'skill' || p === 'warmup');
    blocks.push({ key: 'skill', name: '技術練習', items: sk.items });
    let left = sk.left;
    if (budget.game >= 5) {
      const gameCands = [...focusDrills.filter((d) => d.phase === 'game'), ...skillDrills.filter((d) => d.phase === 'game'), ...BC.lists.drill.filter((d) => d.phase === 'game' && d.level <= (level || 2))];
      const g = pick(gameCands, budget.game + left, (p) => p === 'game');
      blocks.push({ key: 'game', name: '対人・ゲーム', items: g.items });
      left = g.left;
    }
    // テーマの練習が足りないときは、条件に合うほかの技術練習で埋める
    if (left >= 8) {
      const more = pick([...focusDrills, ...skillDrills, ...BC.lists.drill.filter((d) => d.phase === 'skill')], left, (p) => p === 'skill');
      blocks[1].items.push(...more.items);
      left = more.left;
    }
    // しめくくり：時間があればフリースロー（疲れたときのシュート）、最後にストレッチ
    // 困りごとのしめくくり練習（振り返りノートなど）を先に。動画の振り返り（d-film）は、テーマのときだけ（コートの練習の最後には入れない）
    const coolCands = [minutes >= 60 && budget.cooldown + left >= 10 ? BC.get('d-ft') : null, BC.get('d-cooldown'),
      ...focusDrills.filter((d) => d.phase === 'cooldown'),
      ...BC.lists.drill.filter((d) => d.phase === 'cooldown' && d.id !== 'd-film' && d.place !== 'any' || d.id === 'd-huddle')];
    const c = pick(coolCands, budget.cooldown + left, (p) => p === 'cooldown' || p === 'skill');
    // ストレッチは最後に
    c.items.sort((a, b) => (a.drill.phase === 'cooldown') - (b.drill.phase === 'cooldown'));
    blocks.push({ key: 'cooldown', name: 'しめくくり', items: c.items });
    // あまった時間は、技術練習と対人の練習に少しずつ足す（1つのメニューは、目安の2倍まで）
    const total = blocks.reduce((t, b) => t + b.items.reduce((u, x) => u + x.min, 0), 0);
    let rest = minutes - total;
    const grow = blocks.filter((b) => b.key === 'skill' || b.key === 'game').flatMap((b) => b.items);
    for (let round = 0; rest > 0 && round < 40; round++) {
      let moved = false;
      for (const x of grow) {
        if (rest <= 0) break;
        if (x.min < (x.drill.minutes || 10) * 2) { x.min += 1; rest -= 1; moved = true; }
      }
      if (!moved) break;
    }
    const main = blocks.find((b) => b.key === 'skill' && b.items.length) || blocks.find((b) => b.items.length);
    if (rest > 0 && main) main.items[0].min += rest;
    return { minutes, n, level, blocks: blocks.filter((b) => b.items.length), focus: focusIssues.map((i) => i.id), skills: general ? [] : skills };
  };
  BC.planText = function (plan) {
    const lines = [];
    const head = (plan.focus || []).map((id) => (BC.get(id) || {}).title).filter(Boolean);
    lines.push(`【練習プラン ${plan.minutes}分】${head.length ? '　テーマ：' + head.join('・') : ''}`);
    let t = 0;
    for (const b of plan.blocks) {
      lines.push('');
      lines.push(`■ ${b.name}`);
      for (const x of b.items) {
        const mm = String(Math.floor(t / 60)).padStart(1, '0') + ':' + String(t % 60).padStart(2, '0');
        lines.push(`${mm}〜（${x.min}分）${x.drill.name}`);
        const p = (x.drill.points || [])[0];
        if (p) lines.push(`　　ポイント：${p.replace(/\*\*/g, '')}`);
        t += x.min;
      }
    }
    return lines.join('\n');
  };

  /* ---------- 動画のファイル名と、項目を照らす ----------
     path：フォルダからの道すじ（例：'シュート/フォームの基本.mp4'）
     返す：{ items: [{ id, score, term }], skills: [技能 id] }  */
  BC.videoIndex = function () {
    if (BC._vindex) return BC._vindex;
    const terms = [];
    for (const it of BC.all()) {
      const label = it.kind_ === 'issue' ? it.title : it.name;
      const set = new Set([label, stripParen(label), ...(it.alias || [])].map(BC.norm).filter((t) => t.length >= (isAscii(t) ? 3 : 3)));
      for (const t of set) terms.push({ t, id: it.id });
    }
    const skills = BC.skills.map((s) => ({ id: s.id, words: [s.name, ...(s.words || [])].map(BC.norm).filter((w) => w.length >= 2) }));
    BC._vindex = { terms, skills };
    return BC._vindex;
  };
  BC.tagVideo = function (path) {
    const vi = BC.videoIndex();
    const base = String(path || '').replace(/\.[a-z0-9]{2,5}$/i, '');
    const raw = base.normalize('NFKC').toLowerCase();
    const text = BC.norm(base);
    const found = [];
    for (const { t, id } of vi.terms) if (hasTerm(text, raw, t)) found.push({ id, term: t, score: t.length });
    // 長い言葉に含まれる短い言葉（「ピックアンドロール」の中の「ロール」など）は外す
    const keep = found.filter((f) => !found.some((g) => g !== f && g.term.length > f.term.length && g.term.includes(f.term)));
    const best = {};
    for (const f of keep) if (!best[f.id] || best[f.id].score < f.score) best[f.id] = f;
    const items = Object.values(best).sort((a, b) => b.score - a.score);
    const skills = [];
    for (const s of vi.skills) if (s.words.some((w) => text.includes(w))) skills.push(s.id);
    for (const f of items) for (const s of (BC.get(f.id) || {}).skills || []) if (!skills.includes(s)) skills.push(s);
    return { items, skills };
  };

  /* ---------- 検査（tools/check.cjs から使う） ----------
     registry：{ tactic: {id: 名前}, drill: {...}, view: {...}, issue: {...} }（ある場合だけ。まだ書かれていない id を「注意」にする） */
  BC.validate = function (registry) {
    const errors = BC.loadErrors.slice();
    const warns = [];
    const known = (id) => !!BC.items[id] || (registry && Object.values(registry).some((r) => r[id]));
    const refCheck = (it, field, kind, list) => {
      for (const id of list || []) {
        if (typeof id !== 'string') { errors.push(`${it.id}.${field}：id でないものがある（${JSON.stringify(id)}）`); continue; }
        if (BC.kindOf(id) !== kind) errors.push(`${it.id}.${field}：${BC.KINDS[kind].name}の id でない（${id}）`);
        else if (!BC.items[id]) (known(id) ? warns : errors).push(`${it.id}.${field}：${known(id) ? 'まだ書かれていない' : 'ない'} id（${id}）`);
      }
    };
    const strs = (it, field, v) => {
      if (v == null) return;
      if (!Array.isArray(v)) { errors.push(`${it.id}.${field}：配列にする`); return; }
      v.forEach((s, i) => {
        if (typeof s !== 'string' || !s.trim()) errors.push(`${it.id}.${field}[${i}]：文字でない・空`);
        else {
          bold(it, field, s);
          if ((field === 'words' || field === 'alias') && BC.norm(s).length < 2 && !(field === 'words' && /^[\u4e00-\u9fff]$/.test(BC.norm(s)))) warns.push(`${it.id}.${field}：「${s}」は短すぎて探すときに使われない（2字以上に）`);
        }
      });
    };
    const bold = (it, field, s) => { if (((s.match(/\*\*/g) || []).length) % 2) errors.push(`${it.id}.${field}：** の閉じ忘れ`); };
    const str = (it, field, v, need) => {
      if (v == null || v === '') { if (need) errors.push(`${it.id}：${field} がない`); return; }
      if (typeof v !== 'string') errors.push(`${it.id}.${field}：文字にする`); else bold(it, field, v);
    };
    const pairs = (it, field, v) => {
      if (v == null) return;
      if (!Array.isArray(v)) { errors.push(`${it.id}.${field}：配列にする`); return; }
      v.forEach((p, i) => { if (!Array.isArray(p) || p.length !== 2 || p.some((s) => typeof s !== 'string')) errors.push(`${it.id}.${field}[${i}]：['〜', '〜'] の形にする`); });
    };
    const skillOk = (it, list) => { for (const s of list || []) if (!BC.skillMap[s]) errors.push(`${it.id}：技能の id がない（${s}）`); };
    const idRe = /^[tdvi]-[a-z0-9]+(?:-[a-z0-9]+)*$/;

    for (const it of BC.all()) {
      const k = it.kind_;
      if (!idRe.test(it.id) || BC.kindOf(it.id) !== k) errors.push(`${it.id}：id の形（${BC.KINDS[k].prefix}… の英小文字・数字・-）`);
      for (const f of Object.keys(it)) if (!f.endsWith('_') && !BC.FIELDS[k].includes(f) && !(f === 'name' && k === 'issue') && !(f === 'skills' && (k === 'view' || k === 'issue'))) errors.push(`${it.id}：知らない項目名（${f}）`);
      if (registry && registry[k] && !registry[k][it.id]) warns.push(`${it.id}：一覧（tools/registry.cjs）にない id`);
      strs(it, 'alias', it.alias); strs(it, 'words', it.words);
      if (it.level != null && ![1, 2, 3].includes(it.level)) errors.push(`${it.id}.level：1〜3`);
      if (k === 'tactic') {
        str(it, 'name', it.name, true); str(it, 'summary', it.summary, true); str(it, 'kind', it.kind, true); str(it, 'note', it.note);
        if (!BC.TCATS[it.cat]) errors.push(`${it.id}.cat：${Object.keys(BC.TCATS).join('・')} のどれか`);
        if (!it.level) errors.push(`${it.id}：level がない`);
        skillOk(it, it.skills);
        for (const f of ['how', 'points', 'good', 'weak', 'counter']) strs(it, f, it[f]);
        if (!(it.how || []).length) errors.push(`${it.id}：how がない`);
        refCheck(it, 'drills', 'drill', it.drills); refCheck(it, 'views', 'view', it.views); refCheck(it, 'related', 'tactic', it.related);
        diagramCheck(it, errors);
      } else if (k === 'drill') {
        str(it, 'name', it.name, true); str(it, 'aim', it.aim, true); str(it, 'setup', it.setup);
        skillOk(it, it.skills);
        if (!(it.skills || []).length) errors.push(`${it.id}：skills がない`);
        if (!it.level) errors.push(`${it.id}：level がない`);
        if (!(it.n >= 1)) errors.push(`${it.id}.n：1 以上の数`);
        if (!(it.minutes > 0)) errors.push(`${it.id}.minutes：分の数`);
        if (!BC.PHASES[it.phase]) errors.push(`${it.id}.phase：${Object.keys(BC.PHASES).join('・')} のどれか`);
        if (![1, 2, 3].includes(it.intensity)) errors.push(`${it.id}.intensity：1〜3`);
        if (!BC.PLACES[it.place]) errors.push(`${it.id}.place：${Object.keys(BC.PLACES).join('・')} のどれか`);
        for (const f of ['equip', 'steps', 'points', 'easier', 'harder']) strs(it, f, it[f]);
        if (!(it.steps || []).length) errors.push(`${it.id}：steps がない`);
        pairs(it, 'ng', it.ng);
        refCheck(it, 'views', 'view', it.views); refCheck(it, 'tactics', 'tactic', it.tactics);
        diagramCheck(it, errors);
      } else if (k === 'view') {
        str(it, 'name', it.name, true); str(it, 'summary', it.summary, true); str(it, 'good', it.good); str(it, 'cue', it.cue);
        if (!BC.skillMap[it.skill]) errors.push(`${it.id}.skill：技能の id（${it.skill}）`);
        strs(it, 'checks', it.checks);
        if (!(it.checks || []).length) errors.push(`${it.id}：checks がない`);
        pairs(it, 'ng', it.ng);
        refCheck(it, 'drills', 'drill', it.drills);
      } else if (k === 'issue') {
        str(it, 'title', it.title, true); str(it, 'empathy', it.empathy); str(it, 'summary', it.summary, true); str(it, 'tip', it.tip);
        if (!BC.skillMap[it.skill]) errors.push(`${it.id}.skill：技能の id（${it.skill}）`);
        if (it.who && !['player', 'coach', 'both'].includes(it.who)) errors.push(`${it.id}.who：player・coach・both`);
        if (!(it.words || []).length) warns.push(`${it.id}：words がない（チャットで見つかりにくい）`);
        if (!(it.drills || []).length) errors.push(`${it.id}：drills がない`);
        for (const c of it.causes || []) {
          if (!c || typeof c.text !== 'string') { errors.push(`${it.id}.causes：{ text, check, views } の形`); continue; }
          for (const f of Object.keys(c)) if (!['text', 'check', 'views'].includes(f)) errors.push(`${it.id}.causes：知らない項目名（${f}）`);
          refCheck(it, 'causes.views', 'view', c.views);
        }
        if (it.ask) {
          if (typeof it.ask.q !== 'string' || !Array.isArray(it.ask.options)) errors.push(`${it.id}.ask：{ q, options: [{ label, to }] } の形`);
          else for (const o of it.ask.options) {
            // 行き先は、ふつうは困りごと。戦術・練習・視点もよい（例：ゾーンの形 → その戦術）
            const k = BC.kindOf(o.to);
            if (typeof o.label !== 'string') errors.push(`${it.id}.ask：label がない`);
            if (!k) errors.push(`${it.id}.ask.to：id でない（${o.to}）`);
            else refCheck(it, 'ask.to', k, [o.to]);
          }
        }
        refCheck(it, 'views', 'view', it.views); refCheck(it, 'drills', 'drill', it.drills); refCheck(it, 'tactics', 'tactic', it.tactics); refCheck(it, 'next', 'issue', it.next);
      }
    }
    // どこからも挙げられていないもの（チャットからたどれない）
    if (BC.lists.issue.length) {
      for (const d of BC.lists.drill) if (!BC.backlinks(d.id).length) warns.push(`${d.id}（${d.name}）：どの困りごと・視点・戦術からも挙げられていない`);
      for (const v of BC.lists.view) if (!BC.backlinks(v.id).length) warns.push(`${v.id}（${v.name}）：どの困りごと・練習からも挙げられていない`);
    }
    if (registry) {
      for (const k of Object.keys(registry)) for (const id of Object.keys(registry[k])) if (!BC.items[id]) warns.push(`${id}（${registry[k][id]}）：一覧にあるが、まだ書かれていない`);
    }
    return { errors, warns };
  };
  function diagramCheck(it, errors) {
    const dg = it.diagram;
    if (!dg) return;
    if (dg.court && !['half', 'full'].includes(dg.court)) errors.push(`${it.id}.diagram.court：half・full`);
    const raw = dg.frames && dg.frames.length ? dg.frames : [dg];
    const okPos = (p) => BC.pos(p) || (typeof p === 'string' && /^[ox][1-5]$/.test(p));
    raw.forEach((f, fi) => {
      const at = `${it.id}.diagram${raw.length > 1 ? '.frames[' + fi + ']' : ''}`;
      for (const k of ['o', 'x', 'cones']) for (const p of f[k] || []) if (!BC.pos(p)) errors.push(`${at}.${k}：場所がわからない（${JSON.stringify(p)}）`);
      for (const k of Object.keys(f)) if (!['o', 'x', 'ball', 'moves', 'note', 'cones', 'court', 'frames'].includes(k)) errors.push(`${at}：知らない項目名（${k}）`);
      for (const m of f.moves || []) {
        if (!['pass', 'cut', 'dribble', 'screen', 'handoff', 'move'].includes(m.t)) errors.push(`${at}.moves：t がちがう（${m.t}）`);
        for (const k of ['from', 'to', 'via']) if (m[k] != null && !okPos(m[k])) errors.push(`${at}.moves.${k}：場所がわからない（${JSON.stringify(m[k])}）`);
        if (m.from == null || m.to == null) errors.push(`${at}.moves：from と to がいる`);
      }
    });
    const frames = BC.frames(dg);
    frames.forEach((f, fi) => {
      if (typeof f.ball === 'number' && f.ball && !f.o[f.ball - 1]) errors.push(`${it.id}.diagram：ball の番号に攻めの人がいない（場面${fi + 1}）`);
      if (f.ball != null && typeof f.ball !== 'number' && !BC.pos(f.ball)) errors.push(`${it.id}.diagram：ball の場所がわからない（場面${fi + 1}）`);
      for (const m of f.moves) if (!m.from || !m.to) errors.push(`${it.id}.diagram：動きの o1〜o5・x1〜x5 に人がいない（場面${fi + 1}）`);
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
