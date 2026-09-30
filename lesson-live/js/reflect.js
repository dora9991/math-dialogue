/* ============================================================
   授業ライブ — 振り返りの観点評価（ブラウザ内・ルールベース）
   ・生徒の言葉から 10 観点を「−／○／◎」で見立て、根拠の一文を必ず添える
   ・文章のうまさ・前向きさは評価しない（書くのが苦手な子を守る）
   ・判定は下書き。先生が画面で直せる（teacher_eval）
   ・生徒には「光ったところ」と問い返しだけを返す（A/B/C は見せない）
   設計のもと：Obsidian 設計メモ_振り返りシートAI評価（5観点ルーブリック・#5接続が核）
   ============================================================ */
(function (root) {
  "use strict";

  const CATS = [
    { k: "matome", label: "まとめ", short: "まとめ", group: "知識", shine: "キーワードでまとめた", desc: "その時間の言葉を使って、自分の言葉でまとめている" },
    { k: "kanketsu", label: "簡潔", short: "簡潔", group: "知識", shine: "短く言い切れた", desc: "要点を短く、言い切りの形で書けている" },
    { k: "toi", label: "Niceな問い", short: "問い", group: "思考", shine: "Niceな問い", desc: "「なぜ」「もし〜なら」「いつでも〜？」など、次につながる問いを立てている" },
    { k: "mikata", label: "Niceな見方・考え方", short: "見方", group: "思考", shine: "Niceな見方・考え方", desc: "比べる・きまりを見つける・一般化する・図や式で表す など数学的な見方を使っている" },
    { k: "yosoku", label: "予測", short: "予測", group: "思考", shine: "予測を立てた", desc: "結果や次の学習を予想し、確かめようとしている" },
    { k: "kanshin", label: "関心", short: "関心", group: "主体性", shine: "おもしろさを見つけた", desc: "数学のおもしろさ・不思議さ・生活とのつながりに目を向けている" },
    { k: "manabikata", label: "学び方", short: "学び方", group: "主体性", shine: "学び方の工夫", desc: "図・表・説明・見直しなど、自分なりの学び方を工夫している" },
    { k: "kaizen", label: "改善の主体性", short: "改善", group: "主体性", shine: "次の一手を決めた", desc: "つまずきをもとに、次に何をどうするかを自分で決めている" },
    { k: "tsumazuki", label: "つまずきの自覚", short: "つまずき", group: "主体性", shine: "つまずきを言葉にできた", desc: "どこで・なぜつまずいたかを具体的に言えている" },
    { k: "setsuzoku", label: "前回との接続", short: "接続", group: "主体性", shine: "前回とつながった", desc: "前回の「次にやること」をふり返り、今回につなげている" },
  ];

  /* ---------- ことばのパターン ---------- */
  const P = {
    relation: /(は|とき|ときは|と|ならば|なら|すると|すれば|には|では|から).{0,24}(なる|なります|である|だ|です|できる|できます|する|します|ない|ません|使う|使います|等しい|同じ|反対|求め|表せ)/,
    filler: /(えっと|なんか|とりあえず|まあ|みたいな)/,
    question: /[？?]|なぜ|何で|なんで|どうして|だろう|のかな|かな$|のか(が)?(気にな|知りたい|疑問|不思議)|不思議|ふしぎ|疑問|気になる/,
    genQ: /もし|たら|なら(ば)?|いつでも|いつも|必ず|どんな(とき|場合|数)|ほかの|他の|逆|反対|でも(同じ|成り立|使え|でき)|一般|どうなる|成り立つ|なぜ|どうして|本当に|ほんとうに/,
    mikata: {
      hikaku: /比べ|くらべ|比較|ちがい|違い|似て|共通|同じ(よう|だ|で|に|な)/,
      kimari: /きまり|決まり|規則|パターン|法則|ルール/,
      ippan: /いつでも|必ず|どんな(数|とき|場合)でも|一般|まとめると|つまり|言いかえ|言い換え|要するに/,
      hyogen: /図(に|で|を)|表(に|で|を)|グラフ(に|で|を)|数直線|式(に|で)表|文字(を|で)(使|表)|記号(で|を)/,
      gyaku: /逆に|逆の|反対に|反対の|裏返/,
      kanren: /と(同じ|つなが|関係|似)|応用|置きかえ|置き換え|とみ(る|て|れば)|と考え(る|て|れば|ると)|に直(す|して|せば)|に変え(る|て|れば)/,
      rei: /場合(分け|に分け)|例えば|たとえば|具体的|具体例/,
      chakumoku: /注目|着目|目をつけ|に気づ|に気付/,
    },
    reason: /なぜなら|だから|ので|からだ|から[、。]|ため[、。に]|理由/,
    yosoku: /予想|予測|見通|と思(う|っ|い)|だろう|はず|たぶん|おそらく|になりそう|しそう|ではないか|じゃないか|かもしれない|のでは/,
    yosokuFeel: /(難し|むずかし|楽し|たのし|できる|頑張|がんば|わかる|分かる|大丈夫|いい|よかっ|うれし|嬉し)(い|る|か)?(と思|だろう|はず|かも)/,
    verify: /確かめ|実際|やってみたら|やってみると|当た|合って|あって|違って|ちがって|外れ|はずれ|その通り|そのとおり/,
    next: /次(は|から|の時間|回|の授業)|今度(は)?|これから|明日|家で|ようにする|ようにしたい|ようにしよう|気をつけ|気を付け|注意する|直す|なおす|やり直|見直(す|したい|そう)|復習(する|したい|しよう)|練習(する|したい|しよう)|確かめる|してみる|してみたい|やってみたい|目標|したい|しよう/,
    ganbaruOnly: /^(次も|これからも|もっと)?\s*(頑張|がんば)(る|ります|りたい|ろう)[。!！]?$/,
    kanshin: /おもしろ|面白|不思議|ふしぎ|もっと知りたい|知りたい|調べ(てみ|たい|る)|ワクワク|わくわく|すごい|感動|なるほど|びっくり|驚|気にな|挑戦したい|解いてみたい|やってみたい|楽し/,
    life: /日常|生活|身の回り|身近|実際の|にも使え|役に立|使えそう|ゲーム|買い物|スポーツ|天気|気温|お金|料理|部活/,
    fun: /楽し/,
    methods: {
      zu: /図(を|に|で)?(かい|書い|描い|かく|書く|描く)|線分図|数直線(を|に|で)/,
      hyo: /表(に|を)(まとめ|かい|書い|つく|作)|グラフ(を|に)(かい|書い|描い)/,
      hito: /(友達|友だち|となり|隣|ペア|班|グループ|先生|みんな)(に|と|の)(聞|教|説明|話|相談|確認|意見|考え)/,
      setsumei: /説明(し|して|する|でき)|教え(た|る|合)/,
      minaoshi: /見直し|見直す|見直した|確かめ算|検算|代入して確かめ|確かめた|確認した/,
      rei: /例(を|で)(作|考え|試)|自分で問題を|数を(変え|入れ)|具体的な数/,
      kurikaeshi: /くり返|繰り返|何度も|何回も|復習|予習|練習した/,
      note: /ノート(を|に)(見|まとめ|整理)|教科書(を|で)(見|読|確認)|まとめノート|色(ペン|を分け)|まちがい(直し|ノート)|間違い(直し|ノート)/,
      tool: /ラボ|アプリ|動画|プリント/,
      tejun: /まず.{0,12}(して|てから)|順番に|手順|ステップ/,
    },
    effect: /(わかりやす|分かりやす|解きやす|考えやす|見やす|間違えにく|まちがえにく|ミスが減|できるようにな|できた|わかった|分かった|すっきり|理解でき)/,
    struggle: /わからな|分からな|わかりませ|分かりませ|難し|むずかし|間違|まちが|ミス|できなかっ|解けなかっ|迷っ|迷う|悩ん|忘れ|混乱|こんがら|自信がない|あやふや|つまず|苦手/,
    specific: /符号|かっこ|括弧|分数|小数|移項|約分|通分|単位|計算|順序|順番|累乗|指数|係数|定数項|同類項|代入|分配|比例定数|座標|グラフ|変域|作図|中心角|おうぎ形|展開図|体積|表面積|度数|相対度数|中央値|平均|ところ|部分|とき|問題|問[0-9０-９]|[0-9０-９]番/,
    connect: /前回|この前|前の時間|前の授業|前時|昨日|先週|前に(やっ|習っ|学ん)|前は|さっき|小学校|と同じように|を使って|をいかして|を生かして|前の(単元|章)/,
    sos: /(死にたい|消えたい|いなくなりたい|つらい|辛い|しんどい|もう(やだ|いや|嫌|無理|むり)|学校(に)?(行き|いき)たくない|いじめ|泣き(そう|たい)|泣いた|こわい|怖い|ひとりぼっち|一人ぼっち|眠れな|寝れな|やめたい|死ね|うざい)/,
    help: /(全然|ぜんぜん|全く|まったく|なにも|何も)(わから|分から)|ついていけ|おいていかれ|置いていかれ|お手上げ|ギブアップ/,
    understood: /得意|とくい|できた|出来た|簡単|かんたん|楽勝|スラスラ|すらすら|ばっちり|バッチリ|わかった|分かった/,
  };

  /* ---------- 文の分割・根拠の切り出し ---------- */
  function norm(s) { return String(s || "").normalize("NFKC").replace(/\r/g, "").trim(); }
  function sentences(text) {
    // 句点・！・？ で区切る（小数の「.」では区切らない。古い Safari でも動く書き方）
    return (norm(text).match(/[^。．！？!?\n]+[。．！？!?]*/g) || []).map(s => s.trim()).filter(Boolean);
  }
  function findSentence(sents, re) {
    for (const s of sents) { const m = re.exec(s); if (m) return { s, m: m[0] }; }
    return null;
  }
  function clip(s, max) { s = String(s); return s.length > (max || 70) ? s.slice(0, (max || 70) - 1) + "…" : s; }
  const len = s => norm(s).replace(/\s/g, "").length;

  function vocabHits(text, vocab) {
    const t = norm(text);
    const hits = [];
    for (const w of vocab) {
      const ww = norm(w);
      if (ww.length >= 1 && t.includes(ww) && !hits.includes(ww)) hits.push(ww);
    }
    // 数式らしきもの（y=2x, -3+5 など）も単元の言葉として数える
    if (/[a-z]\s*=|[0-9]\s*[+\-×÷*/]\s*[0-9(]|[＋－×÷]/i.test(t)) hits.push("式");
    return hits;
  }

  // 2つの文章の似かた（文字 bigram の Dice 係数）— 使い回しの検出と「前回」との重なりに使う
  function similarity(a, b) {
    a = norm(a).replace(/\s/g, ""); b = norm(b).replace(/\s/g, "");
    if (!a.length || !b.length) return 0;
    if (a === b) return 1;
    const bg = s => { const o = []; for (let i = 0; i < s.length - 1; i++) o.push(s.substr(i, 2)); return o; };
    const A = bg(a), B = bg(b);
    if (!A.length || !B.length) return 0;
    const cnt = {}; B.forEach(g => cnt[g] = (cnt[g] || 0) + 1);
    let c = 0; A.forEach(g => { if (cnt[g] > 0) { c++; cnt[g]--; } });
    return 2 * c / (A.length + B.length);
  }

  /* ---------- 本体 ----------
     input = { body:{summary,stuck,how,next,question,predict,prev_done}, understanding, vocab:[...],
               prev:{body:{next,...}} | null, history:[過去の本文...] } */
  function analyze(input) {
    const b = input.body || {};
    const vocab = input.vocab || [];
    const fields = ["summary", "stuck", "how", "next", "question", "predict"];
    const all = fields.map(f => norm(b[f])).filter(Boolean).join("\n");
    const sents = sentences(all);
    const out = { v: 1, cats: {}, flags: {} };
    const set = (k, lv, ev, why) => { out.cats[k] = { lv, ev: ev ? [clip(ev)] : [], why: why || "" }; };

    // --- まとめ ---
    {
      const src = norm(b.summary) || all;
      const ss = sentences(src);
      const hits = vocabHits(src, vocab);
      const relSent = ss.find(s => P.relation.test(s) && vocabHits(s, vocab).length);
      if (hits.length >= 3 || (hits.length >= 2 && relSent)) set("matome", 2, relSent || ss[0], `言葉：${hits.slice(0, 4).join("・")}`);
      else if (hits.length >= 1) set("matome", 1, ss.find(s => vocabHits(s, vocab).length) || ss[0], `言葉：${hits.join("・")}`);
      else set("matome", 0, null, "その時間の言葉が見つからない");
    }
    // --- 簡潔 ---
    {
      const s = norm(b.summary);
      const n = len(s), sc = sentences(s).length, hasV = vocabHits(s, vocab).length > 0;
      if (n >= 12 && n <= 70 && sc <= 2 && hasV && !P.filler.test(s)) set("kanketsu", 2, s, `${n}字・${sc}文で言い切り`);
      else if (n >= 8 && n <= 120 && (hasV || P.relation.test(s))) set("kanketsu", 1, s, `${n}字`);
      else set("kanketsu", 0, null, !n ? "まとめ欄が空" : n > 120 ? "長め（要点をしぼれるとよい）" : "要点がつかみにくい");
    }
    // --- Niceな問い ---
    {
      const qs = sents.filter(s => P.question.test(s) && !/^(全然|ぜんぜん)?(わから|分から)(ない|なかった)[。]?$/.test(s));
      const strong = qs.find(s => P.genQ.test(s) && (vocabHits(s, vocab).length || /[0-9a-z]/i.test(s)));
      if (strong) set("toi", 2, strong, "次につながる問い（なぜ／もし／いつでも など）");
      else if (qs.length) set("toi", 1, qs[0], "問いを立てている");
      else set("toi", 0, null, "");
    }
    // --- Niceな見方・考え方 ---
    {
      const groups = [];
      let ev = null, strongEv = null;
      for (const g in P.mikata) {
        const f = findSentence(sents, P.mikata[g]);
        if (f) { groups.push(g); ev = ev || f.s; if (!strongEv && P.reason.test(f.s)) strongEv = f.s; }
      }
      const names = { hikaku: "比べる", kimari: "きまり", ippan: "一般化", hyogen: "図・式で表す", gyaku: "逆から", kanren: "関連づけ", rei: "具体例", chakumoku: "着目" };
      if (groups.length >= 2 || strongEv) set("mikata", 2, strongEv || ev, groups.map(g => names[g]).join("・") + (strongEv ? "＋理由" : ""));
      else if (groups.length === 1) set("mikata", 1, ev, names[groups[0]]);
      else set("mikata", 0, null, "");
    }
    // --- 予測 ---
    {
      const cands = sents.filter(s => P.yosoku.test(s) && !P.yosokuFeel.test(s));
      const strong = cands.find(s => /予想|予測|見通/.test(s) && (P.verify.test(s) || P.reason.test(s)));
      const mathy = cands.find(s => vocabHits(s, vocab).length || /[0-9]/.test(s) || /次(は|の)/.test(s));
      if (strong || (norm(b.predict) && P.reason.test(norm(b.predict)))) set("yosoku", 2, strong || norm(b.predict), "予想＋確かめ／理由");
      else if (mathy || norm(b.predict)) set("yosoku", 1, mathy || norm(b.predict), "予想を立てている");
      else set("yosoku", 0, null, "");
    }
    // --- 関心 ---
    {
      const f = findSentence(sents, P.kanshin);
      const lifeS = findSentence(sents, P.life);
      if (f && (lifeS || (vocabHits(f.s, vocab).length && !P.fun.test(f.m)) || /調べ|やってみ|試し/.test(f.s))) set("kanshin", 2, (lifeS || f).s, lifeS ? "生活とのつながり" : "対象をもった関心");
      else if (lifeS) set("kanshin", 2, lifeS.s, "生活とのつながり");
      else if (f && !(P.fun.test(f.m) && !vocabHits(f.s, vocab).length)) set("kanshin", 1, f.s, "関心のことば");
      else set("kanshin", 0, null, f ? "「楽しい」だけでは見立てない" : "");
    }
    // --- 学び方 ---
    {
      const found = [];
      let ev = null, strongEv = null;
      for (const g in P.methods) {
        const f = findSentence(sents, P.methods[g]);
        if (f) { found.push(g); ev = ev || f.s; if (!strongEv && (P.effect.test(f.s) || P.reason.test(f.s))) strongEv = f.s; }
      }
      if (found.length >= 2 || strongEv) set("manabikata", 2, strongEv || ev, strongEv ? "工夫＋効果" : "複数の工夫");
      else if (found.length === 1) set("manabikata", 1, ev, "学び方の工夫");
      else if (len(b.how) >= 6) set("manabikata", 1, norm(b.how), "学び方を書いている");
      else set("manabikata", 0, null, "");
    }
    // --- つまずきの自覚 ---
    {
      const f = findSentence(sents, P.struggle);
      const spec = sents.find(s => P.struggle.test(s) && (P.specific.test(s) || vocabHits(s, vocab).length));
      if (spec) set("tsumazuki", 2, spec, "どこでつまずいたかが具体的");
      else if (f) set("tsumazuki", 1, f.s, "つまずきを書いている");
      else set("tsumazuki", 0, null, "");
    }
    // --- 改善の主体性 ---
    {
      const nextText = norm(b.next);
      const pool = nextText ? sentences(nextText).concat(sents) : sents;
      const cands = pool.filter(s => P.next.test(s) && !P.ganbaruOnly.test(s));
      const strong = cands.find(s => P.specific.test(s) || vocabHits(s, vocab).length);
      const onlyGanbaru = !cands.length && pool.some(s => P.ganbaruOnly.test(s) || /(頑張|がんば)/.test(s));
      if (strong && (out.cats.tsumazuki.lv >= 1 || nextText)) set("kaizen", 2, strong, "何を・どうするかが具体的");
      else if (strong || cands.length) set("kaizen", 1, strong || cands[0], "次の行動を書いている");
      else set("kaizen", 0, null, onlyGanbaru ? "「頑張る」だけ（何をするかまで書けるとよい）" : "");
    }
    // --- 前回との接続 ---
    {
      const prev = input.prev && input.prev.body ? input.prev.body : null;
      const pd = b.prev_done;
      const f = findSentence(sents, P.connect);
      const overlap = prev && prev.next ? Math.max(...sents.map(s => similarity(s, prev.next)), 0) : 0;
      if (prev && pd && (f || overlap >= 0.35)) set("setsuzoku", 2, f ? f.s : sents[0], "前回の一手をふり返り、内容でもつないでいる");
      else if (prev && pd) set("setsuzoku", 1, `前回の「次にやること」→ ${({ yes: "できた", some: "少しできた", no: "まだ" })[pd] || pd}`, "前回の一手をふり返った");
      else if (f) set("setsuzoku", 1, f.s, "前に学んだこととつないでいる");
      else set("setsuzoku", 0, null, prev ? "前回の一手へのふり返りなし" : "");
    }

    // --- フラグ ---
    const sos = findSentence(sents, P.sos);
    const help = input.understanding === 1 || P.help.test(all);
    out.flags.sos = sos ? clip(sos.s) : null;
    out.flags.help = !!help;
    out.flags.short = len(all) < 10;
    let dup = null;
    for (const h of input.history || []) {
      if (len(all) >= 20 && len(h.text) >= 20 && similarity(all, h.text) >= 0.85) { dup = h.date || "前回"; break; }
    }
    out.flags.dup = dup;
    out.shine = CATS.filter(c => out.cats[c.k].lv >= 1).map(c => c.k);
    return out;
  }

  /* ---------- 生徒への声かけ（旧 quiz/ の REFL_MSG を土台に、観点別を追加） ---------- */
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const MSG = {
    sos: [
      "書いてくれてありがとう。先生はちゃんと読んでいるよ。話したくなったら、いつでも声をかけてね。",
      "しんどい気持ちを書けたこと、大事にしてほしい。ひとりで抱えなくていいからね。",
    ],
    struggle: [
      "難しいと思えたのは、ちゃんと自分の頭で考えた証拠。どこで止まったか覚えていたら、今度教えて。",
      "わからないをそのままにせず書けたの、それだけで十分な一歩だよ。次、そこから一緒に見よう。",
      "つまずくのは悪いことじゃない。むしろ、そこがこれから伸びる場所。",
      "今はわからなくていい。「今日わからなかった」がわかっただけでも収穫。",
      "解けなかった問題、答えを覚えるより、なぜ止まったのかを今度一緒に考えよう。",
      "難しいと感じるところがはっきりしてるのはいいこと。ぼんやりしたままより、ずっと前に進んでる。",
    ],
    toi: [
      "いい問いだね。自分なりの予想があるなら、それも聞いてみたい。",
      "その「なぜ」、そのまま持っておいて。次の授業で一緒に確かめよう。",
      "疑問が浮かぶのは、ちゃんと考えてる証拠。答えを急がず、少し自分でも考えてみて。",
      "気になったこと、そのままにせず書けたのがいいね。今度その話をしよう。",
      "その問い、数学者も同じところで立ち止まったかもしれない。大事にしてね。",
    ],
    yosoku: [
      "予想を立てたのがいいね。当たっていたかどうか、次に確かめてみよう。",
      "先を読もうとしているのが伝わってくる。外れても、そこから学べることがたくさんあるよ。",
      "予想してから確かめる。それが数学のいちばんおもしろいところかもしれない。",
    ],
    mikata: [
      "比べたり、きまりを見つけたりする見方ができているね。それはほかの単元でも使える力だよ。",
      "その見方、いいね。どうしてそう見ようと思ったのかも、今度聞かせて。",
      "式や図に表して考えられるのは強い。次も同じ見方が使えないか試してみて。",
    ],
    kaizen: [
      "次にやることが決まっているのがいいね。できたかどうか、次の振り返りで教えて。",
      "自分で次の一手を決められるのは、すごく大事な力。無理のないペースでいこう。",
      "その一手、小さくていいから本当にやってみよう。やったら次の振り返りで教えてね。",
    ],
    manabikata: [
      "自分に合う学び方を見つけているね。その工夫、ほかの問題でも使えそう？",
      "図や説明を使って考えたのがいいね。わかりやすくなった理由も言葉にしてみて。",
    ],
    kanshin: [
      "身の回りとつなげて考えられたのがいいね。ほかにも使えそうな場面、見つけたら教えて。",
      "おもしろいと思えたところ、大事にしてね。そこからまた新しい問いが生まれるよ。",
    ],
    understood: [
      "できたんだね。なんでできたと思う？それがわかると、次も同じようにできるよ。",
      "得意なんだね。それ、隣の人に説明できる？説明できたら、ほんとにわかってるってこと。",
      "簡単に感じたなら、次はどこで難しくなりそうか、予想してみて。",
      "スラスラ解けたのは積み重ねの結果。今日はどこが決め手だった？",
    ],
    connect: [
      "前回決めたことをちゃんとふり返れているね。こうやって自分で学びをつないでいけるのはすごいこと。",
      "前の時間とつなげて考えられているね。そのつながりが、数学を強くしていくよ。",
    ],
    tooShort: [
      "もう少し聞きたいな。今日、心に残ったことをひとつだけ教えて。",
      "短くて大丈夫。今日やったこと、ひとつだけ思い出してみて。",
    ],
    general: [
      "今日も自分と向き合えたね。",
      "書き続けているの、ちゃんと見てるよ。",
      "今日の気づき、そのうち別の場面でつながってくると思う。",
      "自分の言葉で書けているのがいいね。",
      "今日のあなたの考え方、聞けてよかった。",
      "積み重ねは目に見えにくいけど、ちゃんと残ってる。",
      "無理せず、今のペースでいいよ。",
      "書くのが得意じゃなくても、ちゃんと伝わってきたよ。",
      "今日も一歩。急がなくていい。",
      "今日感じたこと、大事にしていいよ。",
      "波があってもいい。今日書けたことが今日の全部。",
    ],
    dup: ["前の振り返りとほとんど同じ文みたい。今日の授業で気づいたことを、ひとつだけ自分の言葉で足してみよう。"],
  };
  // 次に書いてみるとよい観点（書き出しの例つき）
  const NUDGE = {
    toi: { t: "次は「問い」を一言入れてみよう", ex: "なぜ〜になるんだろう？ ／ もし〜だったらどうなる？" },
    yosoku: { t: "次は「予想」を立ててみよう", ex: "〜になると予想した。なぜなら〜 ／ 次の時間は〜を学ぶと思う" },
    mikata: { t: "次は「比べる・きまり」を使ってみよう", ex: "〜と比べると〜 ／ 〜というきまりがある" },
    kaizen: { t: "次は「次にやること」を具体的に", ex: "次は〜のところを、〜して確かめる" },
    manabikata: { t: "次は「どうやって学んだか」も書いてみよう", ex: "図をかいたら〜がわかりやすかった" },
    tsumazuki: { t: "つまずいたところを具体的に書いてみよう", ex: "〜のところで、〜をまちがえた" },
  };

  function feedback(ev, understanding, body) {
    const c = k => (ev.cats[k] ? ev.cats[k].lv : 0);
    let msg;
    if (ev.flags.sos) msg = pick(MSG.sos);
    else if (ev.flags.dup) msg = MSG.dup[0];
    else if (ev.flags.help || (c("tsumazuki") >= 1 && understanding <= 2)) msg = pick(MSG.struggle);
    else if (c("toi") >= 1) msg = pick(MSG.toi);
    else if (c("yosoku") >= 1) msg = pick(MSG.yosoku);
    else if (c("setsuzoku") >= 2) msg = pick(MSG.connect);
    else if (c("mikata") >= 1) msg = pick(MSG.mikata);
    else if (c("kanshin") >= 2) msg = pick(MSG.kanshin);
    else if (c("kaizen") >= 1) msg = pick(MSG.kaizen);
    else if (c("manabikata") >= 1) msg = pick(MSG.manabikata);
    else if (ev.flags.short) msg = pick(MSG.tooShort);
    else if (P.understood.test(Object.values(body || {}).join(" "))) msg = pick(MSG.understood);
    else msg = pick(MSG.general);
    // まだ書けていない観点から 1 つだけ、次の一歩を提案（責めない言い方で）
    const order = ["toi", "yosoku", "kaizen", "mikata", "manabikata", "tsumazuki"];
    const missing = order.filter(k => c(k) === 0 && !(k === "tsumazuki" && understanding >= 4));
    const nudgeKey = missing.length ? missing[Math.floor(Math.random() * Math.min(missing.length, 3))] : null;
    return { msg, nudge: nudgeKey && !ev.flags.sos ? NUDGE[nudgeKey] : null };
  }

  /* ---------- 先生用：生徒ごとの見立て（下書き） ----------
     rows = その生徒の振り返り（新しい順でも古い順でもよい）。
     「主体的に学習に取り組む態度」の2側面（粘り強さ・自己調整）＋思考の手がかりを割合で見る。 */
  function lvOf(r, k) {
    const te = r.teacher_eval && r.teacher_eval[k];
    if (te !== undefined && te !== null) return te;
    const ae = r.auto_eval && r.auto_eval.cats && r.auto_eval.cats[k];
    return ae ? ae.lv : 0;
  }
  function studentSummary(rows) {
    const n = rows.length;
    const rate = keys => n ? rows.filter(r => keys.some(k => lvOf(r, k) >= 1)).length / n : 0;
    const has2 = keys => rows.some(r => keys.some(k => lvOf(r, k) >= 2));
    // 1回だけでは傾向が読めないので、2回以上たまるまでは「—」
    const grade = (rt, strong) => (n < 2 ? "—" : rt >= 0.6 && strong ? "A" : rt >= 0.3 ? "B" : "C");
    const nebari = { rate: rate(["manabikata", "tsumazuki", "kanshin"]), strong: has2(["manabikata", "tsumazuki"]) };
    const jiko = { rate: rate(["kaizen", "setsuzoku"]), strong: has2(["kaizen", "setsuzoku"]) };
    const shiko = { rate: rate(["toi", "mikata", "yosoku"]), strong: has2(["toi", "mikata", "yosoku"]) };
    nebari.g = grade(nebari.rate, nebari.strong);
    jiko.g = grade(jiko.rate, jiko.strong);
    shiko.g = grade(shiko.rate, shiko.strong);
    const withPrev = rows.filter(r => r.body && r.body.prev_done);
    const doneRate = withPrev.length ? withPrev.filter(r => r.body.prev_done === "yes").length / withPrev.length : null;
    let attitude = "B";
    if (n < 2) attitude = "—";
    else if (nebari.g === "A" && jiko.g === "A") attitude = "A";
    else if (nebari.g === "C" && jiko.g === "C") attitude = "C";
    else if ((nebari.g === "A" || jiko.g === "A") && nebari.g !== "C" && jiko.g !== "C") attitude = "A";
    return { n, nebari, jiko, shiko, doneRate, attitude };
  }

  // AI に詳しく見てもらうためのプロンプト（先生が Claude などに貼る。氏名は含めない）
  function aiPrompt(lessonTitle, rows) {
    const lines = CATS.map(c => `- ${c.label}：${c.desc}`).join("\n");
    const data = rows.map(r => {
      const bd = r.body || {};
      const parts = [["まとめ", bd.summary], ["つまずき", bd.stuck], ["学び方", bd.how], ["次にやること", bd.next], ["問い", bd.question], ["予想", bd.predict]]
        .filter(([, v]) => v).map(([k, v]) => `${k}：${v}`).join(" ／ ");
      return `【${r.label}】理解度${r.understanding}${bd.prev_done ? `・前回の一手=${bd.prev_done}` : ""}　${parts}`;
    }).join("\n");
    return `あなたは中学1年の数学の先生の補助です。次の振り返りを、下の観点で「−／○／◎」の3段階で見立ててください。
・文章のうまさや前向きさは評価しない。書かれた内容だけを根拠にする。
・観点ごとに、根拠となる生徒の言葉を「」で1つ引用する。
・心配な表現（つらい・やめたい など）があれば最初に知らせる。
・最後に、生徒一人ひとりへ返す短い問い返し（1文）を提案する。

観点：
${lines}

授業：${lessonTitle}
振り返り：
${data}`;
  }

  root.RF = { CATS, analyze, feedback, studentSummary, aiPrompt, similarity, lvOf };
})(typeof window !== "undefined" ? window : globalThis);
