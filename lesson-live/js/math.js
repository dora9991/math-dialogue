/* ============================================================
   授業ライブ — 数式エンジン（生徒・教師・テスト共通）
   ・入力を正規化 → 字句解析 → 構文木(AST) → 評価／表示／採点
   ・旧 quiz/quizdata.js の考え方（表記ゆれを同値判定）を受け継ぎつつ、
     「計算問題に式をそのまま書くと正解になる」抜け穴をふさぐため、
     答えの“形”（数だけか・同類項がまとまっているか・×÷を省いたか）も見る。
   ============================================================ */
(function (root) {
  "use strict";

  /* ---------- 正規化 ---------- */
  const SUP = { "²": "^2", "³": "^3", "⁴": "^4", "⁵": "^5", "¹": "^1" };
  function normalize(s) {
    let t = String(s == null ? "" : s);
    t = t.replace(/[²³⁴⁵¹]/g, c => SUP[c]);
    t = t.replace(/㎠/g, "cm^2").replace(/㎤/g, "cm^3").replace(/㎡/g, "m^2");
    t = t.normalize("NFKC");
    t = t.replace(/[−–—ー―‐‑ｰ]/g, "-")
      .replace(/[×✕✖・⋅]/g, "*")
      .replace(/[{\[]/g, "(").replace(/[}\]]/g, ")")
      .replace(/[、，]/g, ",")
      .replace(/<=|=</g, "≦").replace(/>=|=>/g, "≧")
      .replace(/≤/g, "≦").replace(/≥/g, "≧")
      .replace(/\s+/g, "")
      .toLowerCase()
      .replace(/pi/g, "π");
    return t;
  }

  /* ---------- 字句解析 ---------- */
  function tokenize(s) {
    const out = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/[0-9.]/.test(c)) {
        let j = i;
        while (j < s.length && /[0-9.]/.test(s[j])) j++;
        const raw = s.slice(i, j);
        if ((raw.match(/\./g) || []).length > 1 || raw === ".") throw perr("数の書き方がおかしいところがあります", i);
        out.push({ t: "n", v: parseFloat(raw), raw, i });
        i = j;
      } else if (c === "π") { out.push({ t: "pi", i }); i++; }
      else if (/[a-z]/.test(c)) { out.push({ t: "v", v: c, i }); i++; }
      else if ("+-*/÷^(),".includes(c)) { out.push({ t: "o", v: c, i }); i++; }
      else if ("=<>≦≧".includes(c)) { out.push({ t: "r", v: c, i }); i++; }
      else throw perr(`使えない文字「${c}」があります`, i);
    }
    return out;
  }
  function perr(msg, pos) { const e = new Error(msg); e.userMsg = msg; e.pos = pos; return e; }

  /* ---------- 構文解析（再帰下降） ----------
     expr  := term (('+'|'-') term)*
     term  := unary (('*'|'/'|'÷'|暗黙の積) unary)*
     unary := ('-'|'+') unary | power
     power := atom ('^' unary)?
     atom  := 数 | π | 文字 | '(' expr ')'                       */
  function parseTokens(tokens) {
    let p = 0;
    const peek = () => tokens[p];
    const isOp = (tk, v) => tk && tk.t === "o" && tk.v === v;
    const startsAtom = tk => tk && (tk.t === "n" || tk.t === "v" || tk.t === "pi" || isOp(tk, "("));
    function expr() {
      let a = term();
      while (isOp(peek(), "+") || isOp(peek(), "-")) {
        const op = tokens[p++].v;
        const b = term();
        a = { k: op === "+" ? "add" : "sub", a, b };
      }
      return a;
    }
    function term() {
      let a = unary();
      for (;;) {
        const tk = peek();
        if (isOp(tk, "*")) { p++; a = { k: "mul", a, b: unary(), imp: false }; }
        else if (isOp(tk, "/")) { p++; a = { k: "div", a, b: unary(), sym: "/" }; }
        else if (isOp(tk, "÷")) { p++; a = { k: "div", a, b: unary(), sym: "÷" }; }
        else if (startsAtom(tk)) { a = { k: "mul", a, b: power(), imp: true }; }
        else break;
      }
      return a;
    }
    function unary() {
      const tk = peek();
      if (isOp(tk, "-")) { p++; return { k: "neg", a: unary() }; }
      if (isOp(tk, "+")) { p++; return { k: "pos", a: unary() }; }
      return power();
    }
    function power() {
      const a = atom();
      if (isOp(peek(), "^")) { p++; return { k: "pow", a, b: unary() }; }
      return a;
    }
    function atom() {
      const tk = tokens[p];
      if (!tk) throw perr("式が途中で終わっています", -1);
      if (tk.t === "n") { p++; return { k: "num", v: tk.v, raw: tk.raw }; }
      if (tk.t === "pi") { p++; return { k: "pi" }; }
      if (tk.t === "v") { p++; return { k: "var", n: tk.v }; }
      if (isOp(tk, "(")) {
        p++;
        if (isOp(peek(), ")")) throw perr("かっこの中が空です", tk.i);
        const e = expr();
        if (!isOp(peek(), ")")) throw perr("かっこが閉じていません", tk.i);
        p++;
        return { k: "par", a: e };
      }
      if (isOp(tk, ")")) throw perr("閉じかっこ「)」が多すぎます", tk.i);
      throw perr(`「${tk.v}」の前に数や文字が必要です`, tk.i);
    }
    const e = expr();
    if (p < tokens.length) {
      const tk = tokens[p];
      if (isOp(tk, ")")) throw perr("閉じかっこ「)」が多すぎます", tk.i);
      throw perr("式の形が読み取れません", tk.i);
    }
    return e;
  }

  // 等号・不等号で区切る（「y=3x」「-2<x≦5」「3a+2b=500」など）
  function parseRelation(src) {
    const s = typeof src === "string" ? normalize(src) : src;
    const tokens = tokenize(s);
    const sides = [[]], ops = [];
    for (const tk of tokens) {
      if (tk.t === "r") { ops.push(tk.v); sides.push([]); }
      else sides[sides.length - 1].push(tk);
    }
    if (sides.some(sd => !sd.length)) throw perr(ops.length ? "等号・不等号の両側に式が必要です" : "何も入力されていません", -1);
    return { sides: sides.map(parseTokens), ops };
  }
  function parse(src) {
    const r = parseRelation(src);
    if (r.ops.length) throw perr("ここでは等号・不等号は使いません", -1);
    return r.sides[0];
  }

  /* ---------- 評価 ---------- */
  function evalAST(n, env) {
    switch (n.k) {
      case "num": return n.v;
      case "pi": return Math.PI;
      case "var": return env && n.n in env ? env[n.n] : NaN;
      case "neg": return -evalAST(n.a, env);
      case "pos": return evalAST(n.a, env);
      case "par": return evalAST(n.a, env);
      case "add": return evalAST(n.a, env) + evalAST(n.b, env);
      case "sub": return evalAST(n.a, env) - evalAST(n.b, env);
      case "mul": return evalAST(n.a, env) * evalAST(n.b, env);
      case "div": return evalAST(n.a, env) / evalAST(n.b, env);
      case "pow": return Math.pow(evalAST(n.a, env), evalAST(n.b, env));
    }
    return NaN;
  }
  function varsOf(n, set) {
    set = set || new Set();
    if (!n) return set;
    if (n.k === "var") set.add(n.n);
    if (n.a) varsOf(n.a, set);
    if (n.b) varsOf(n.b, set);
    return set;
  }
  function hasNode(n, pred) {
    if (!n) return false;
    if (pred(n)) return true;
    return hasNode(n.a, pred) || hasNode(n.b, pred);
  }

  const BASE = [1.37, -2.11, 0.73, 3.19, -0.57, 2.41, -1.63, 4.07, -3.29, 0.31];
  function samples(vars) {
    const vs = [...vars].sort();
    const out = [];
    for (let i = 0; i < BASE.length; i++) {
      const env = {};
      vs.forEach((v, j) => { env[v] = BASE[(i + 3 * j) % BASE.length] + 0.137 * j; });
      out.push(env);
    }
    return out;
  }
  const close = (p, q) => Math.abs(p - q) <= 1e-8 * (1 + Math.abs(q));
  function equivalent(a, b) {
    const vars = new Set([...varsOf(a), ...varsOf(b)]);
    let n = 0;
    for (const env of samples(vars)) {
      const p = evalAST(a, env), q = evalAST(b, env);
      if (!isFinite(p) || !isFinite(q)) continue;
      if (!close(p, q)) return false;
      n++;
    }
    return n >= 4;
  }
  // a ≡ k·b となる定数 k を返す（無ければ null）
  function ratioOf(a, b) {
    const vars = new Set([...varsOf(a), ...varsOf(b)]);
    let k = null, n = 0;
    for (const env of samples(vars)) {
      const p = evalAST(a, env), q = evalAST(b, env);
      if (!isFinite(p) || !isFinite(q)) continue;
      if (Math.abs(q) < 1e-9) { if (Math.abs(p) > 1e-9) return null; continue; }
      const r = p / q;
      if (k === null) k = r; else if (!close(r, k)) return null;
      n++;
    }
    return n >= 3 ? k : null;
  }

  /* ---------- 表示（HTML） ---------- */
  const escH = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function fmtNumRaw(n) {
    if (n.raw != null) return n.raw;
    return String(n.v);
  }
  function stripPar(n) { return n && n.k === "par" ? n.a : n; }
  function render(n) {
    switch (n.k) {
      case "num": return `<span class="mn">${escH(fmtNumRaw(n))}</span>`;
      case "pi": return `<span class="mi">π</span>`;
      case "var": return `<i class="mv">${escH(n.n)}</i>`;
      case "neg": return `<span class="mo">−</span>${render(n.a)}`;
      case "pos": return `<span class="mo">+</span>${render(n.a)}`;
      case "par": return `<span class="mp">(</span>${render(n.a)}<span class="mp">)</span>`;
      case "add": return `${render(n.a)}<span class="mo b">+</span>${render(n.b)}`;
      case "sub": return `${render(n.a)}<span class="mo b">−</span>${render(n.b)}`;
      case "mul": return n.imp ? `${render(n.a)}${render(n.b)}` : `${render(n.a)}<span class="mo b">×</span>${render(n.b)}`;
      case "div": {
        if (n.sym === "÷") return `${render(n.a)}<span class="mo b">÷</span>${render(n.b)}`;
        let num = stripPar(n.a), sign = "";
        if (num.k === "neg") { sign = `<span class="mo">−</span>`; num = stripPar(num.a); }
        return `${sign}<span class="frac"><span class="fn">${render(num)}</span><span class="fd">${render(stripPar(n.b))}</span></span>`;
      }
      case "pow": return `${render(n.a)}<sup>${render(stripPar(n.b))}</sup>`;
    }
    return "";
  }
  const REL_SYM = { "=": "=", "<": "&lt;", ">": "&gt;", "≦": "≦", "≧": "≧" };
  // 文字列 → 数式HTML。読めない場合は文字列をそのまま（エスケープして）返す。
  function toHTML(src) {
    try {
      const r = parseRelation(src);
      const parts = [];
      r.sides.forEach((sd, i) => {
        parts.push(render(sd));
        if (i < r.ops.length) parts.push(`<span class="mo b">${REL_SYM[r.ops[i]]}</span>`);
      });
      return `<span class="math">${parts.join("")}</span>`;
    } catch (e) {
      return escH(src);
    }
  }
  // 問題文中の $...$ を数式として描画する（残りはエスケープ・改行は<br>）
  function richText(text) {
    const s = String(text == null ? "" : text);
    const out = [];
    const re = /\$([^$]+)\$/g;
    let last = 0, m;
    while ((m = re.exec(s))) {
      out.push(escH(s.slice(last, m.index)));
      out.push(toHTML(m[1]));
      last = re.lastIndex;
    }
    out.push(escH(s.slice(last)));
    return out.join("").replace(/\n/g, "<br>");
  }
  // 問題文中の最初の $...$ の式（テスト用：計算問題の答えの自動検算）
  function mathIn(text) {
    const m = /\$([^$]+)\$/.exec(String(text || ""));
    return m ? m[1] : null;
  }

  /* ---------- 単位のとりのぞき ---------- */
  const UNIT_JP = "円|個|本|人|分|秒|時間|時|度|枚|冊|点|回|倍|歳|才|日|週|年|か月|ヶ月|番目|通り|種類|辺|面|頂点|組|問|ページ|m分|%|％|°|°c|℃|g分";
  const UNIT_METRIC = "cm\\^?3|cm\\^?2|m\\^?3|m\\^?2|km/h|km|mm|cm|kg|mg|ml|dl";
  const UNIT_SINGLE = "m|g|l";
  function stripUnits(s, allowSingle) {
    let t = s, prev;
    const reJP = new RegExp(`\\(?(?:${UNIT_JP}|後|前|目|分間|秒間|時間後)\\)?$`);
    const reMet = new RegExp(`\\(?(?:${UNIT_METRIC})\\)?$`);
    // 古い Safari（iOS 16.3 以前）は後読み (?<=…) が使えないので、前の文字をつかまえて残す
    const reOne = new RegExp(`([0-9π)])\\(?(?:${UNIT_SINGLE})\\)?$`);
    do {
      prev = t;
      t = t.replace(reJP, "");
      t = t.replace(reMet, "");
      if (allowSingle) t = t.replace(reOne, "$1");
    } while (t !== prev && t.length);
    return t;
  }
  function stripLabel(s) {
    // 「x=5」「y=-3」「a=12」→ 右辺だけ。「答え:」「こたえ」などの前置きも捨てる
    return s.replace(/^(こたえ|答え|答|ans)[:：]?/, "");
  }

  /* ---------- 答えの“形”の検査 ---------- */
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const isInt = v => Number.isFinite(v) && Math.abs(v - Math.round(v)) < 1e-12;

  // 数だけの答え（整数・小数・分数・πの倍数）か。{ok, v, issues}
  function literalInfo(n) {
    const issues = [];
    function lit(x, top) {
      switch (x.k) {
        case "num": return true;
        case "pi": return true;
        case "pos": return lit(x.a, top);
        case "neg": return lit(x.a, false);
        case "par": return lit(x.a, false);
        case "div":
          if (x.sym === "÷") return false;
          if (!lit(x.a, false) || !lit(x.b, false)) return false;
          checkFrac(x);
          return true;
        case "mul":
          if (!x.imp) return false;
          // 「3π」「(2/3)π」「2/3π」のような π の倍数だけ
          return (hasPi(x.a) !== hasPi(x.b)) && lit(x.a, false) && lit(x.b, false);
        default: return false;
      }
    }
    function hasPi(x) { return hasNode(x, y => y.k === "pi"); }
    function checkFrac(x) {
      const a = stripPar(x.a), b = stripPar(x.b);
      const av = numOnly(a), bv = numOnly(b);
      if (bv === 1) issues.push("den1");
      if (av != null && bv != null && isInt(av) && isInt(bv) && gcd(av, bv) > 1) issues.push("unreduced");
      if (b.k === "neg") issues.push("negDen");
    }
    function numOnly(x) {
      x = stripPar(x);
      if (x.k === "num") return x.v;
      if (x.k === "neg") { const v = numOnly(x.a); return v == null ? null : -v; }
      if (x.k === "mul" && x.imp) {
        const a = stripPar(x.a), b = stripPar(x.b);
        if (a.k === "num" && b.k === "pi") return a.v;
        if (a.k === "pi" && b.k === "num") return b.v;
      }
      return null;
    }
    const ok = lit(n, true);
    return { ok, v: ok ? evalAST(n, {}) : NaN, issues };
  }

  // 1次式・単項式の「まとめた形」になっているか。{ok, issues:[...], terms}
  function simplifiedInfo(root0) {
    const issues = new Set();
    const terms = [];
    (function flat(n, sign) {
      if (n.k === "add") { flat(n.a, sign); flat(n.b, sign); }
      else if (n.k === "sub") { flat(n.a, sign); flat(n.b, -sign); }
      else if (n.k === "neg" && terms.length === 0 && !isAddLike(n.a)) terms.push({ sign: -sign, n: n.a });
      else if (n.k === "pos" && terms.length === 0) terms.push({ sign, n: n.a });
      else terms.push({ sign, n });
    })(root0, 1);
    function isAddLike(n) { return n.k === "add" || n.k === "sub"; }
    const sigs = new Map();
    for (const t of terms) {
      const m = mono(t.n);
      if (!m) { issues.add("notMono"); continue; }
      m.issues.forEach(i => issues.add(i));
      if (Math.abs(m.coef) < 1e-12 && terms.length > 1) issues.add("zeroTerm");
      const key = Object.keys(m.sig).sort().map(k => k + m.sig[k]).join("");
      if (sigs.has(key)) issues.add("likeTerms"); else sigs.set(key, true);
    }
    return { ok: issues.size === 0, issues: [...issues], terms: terms.length };

    // 単項式の解析：係数・文字の指数・表記上の問題点
    function mono(n) {
      switch (n.k) {
        case "num": return { coef: n.v, sig: {}, hasNum: true, issues: [] };
        case "pi": return { coef: 1, sig: { "π": 1 }, hasNum: false, issues: [] };
        case "var": return { coef: 1, sig: { [n.n]: 1 }, hasNum: false, issues: [] };
        case "neg": {
          const m = mono(n.a); if (!m) return null;
          return { ...m, coef: -m.coef, issues: m.issues.concat(n.a.k === "neg" ? ["doubleSign"] : []) };
        }
        case "pos": { const m = mono(n.a); if (!m) return null; return { ...m, issues: m.issues.concat(["plusSign"]) }; }
        case "par": {
          const inner = stripPar(n.a);
          const li = literalInfo(inner);
          if (li.ok) {
            const m = mono(inner); if (!m) return null;
            return { ...m, issues: m.issues.concat(inner.k === "div" ? [] : ["paren"]) };
          }
          return null; // (x+3) など
        }
        case "pow": {
          const base = stripPar(n.a), ex = stripPar(n.b);
          if (ex.k !== "num" || !isInt(ex.v)) return null;
          if (base.k === "var") return { coef: 1, sig: { [base.n]: ex.v }, hasNum: false, issues: ex.v === 1 ? ["pow1"] : [] };
          if (base.k === "num" || base.k === "neg") return { coef: evalAST(n, {}), sig: {}, hasNum: true, issues: ["powNum"] };
          return null;
        }
        case "mul": {
          const a = mono(n.a), b = mono(n.b);
          if (!a || !b) return null;
          const iss = a.issues.concat(b.issues);
          if (!n.imp) iss.push("timesSign");
          if (a.hasNum && b.hasNum) iss.push("numTimesNum");
          if (b.hasNum && !a.hasNum && Object.keys(a.sig).length) iss.push("numAfterVar");
          const sig = { ...a.sig };
          for (const k in b.sig) {
            if (sig[k]) iss.push("repeatVar");
            sig[k] = (sig[k] || 0) + b.sig[k];
          }
          const coefIsOne = (m, raw) => m.hasNum && Math.abs(Math.abs(m.coef) - 1) < 1e-12 && raw.k !== "div" && stripPar(raw).k !== "div";
          if (coefIsOne(a, n.a) && Object.keys(b.sig).length && !a.sig["π"]) iss.push("coef1");
          return { coef: a.coef * b.coef, sig, hasNum: a.hasNum || b.hasNum, issues: iss };
        }
        case "div": {
          const a = mono(n.a), b = mono(n.b);
          if (!a || !b) return null;
          const iss = a.issues.concat(b.issues);
          if (n.sym === "÷") iss.push("divSign");
          const bNum = stripPar(n.b);
          if (b.hasNum && !Object.keys(b.sig).length) {
            // ○/数
            if (bNum.k === "neg") iss.push("negDen");
            if (Math.abs(b.coef - 1) < 1e-12) iss.push("den1");
            if (a.hasNum && isInt(a.coef) && isInt(b.coef) && gcd(a.coef, b.coef) > 1) iss.push("unreduced");
            if (!a.hasNum && isInt(b.coef) && Math.abs(b.coef) === 1) iss.push("den1");
            return { coef: a.coef / b.coef, sig: a.sig, hasNum: true, issues: iss };
          }
          if (!a.sig || Object.keys(a.sig).length === 0) {
            // 数/文字（反比例 y=12/x など）
            const sig = {};
            for (const k in b.sig) sig[k] = -b.sig[k];
            if (a.hasNum && b.hasNum && isInt(a.coef) && isInt(b.coef) && gcd(a.coef, b.coef) > 1) iss.push("unreduced");
            return { coef: a.coef / b.coef, sig, hasNum: a.hasNum, issues: iss };
          }
          return null;
        }
      }
      return null;
    }
  }

  // 等式・不等式の答えで見る、表記のきまり（×÷を使わない・1を省く など）
  function notationIssues(n) {
    const iss = new Set();
    (function walk(x) {
      if (!x) return;
      // 数どうしの × ÷（120×3 など）は許し、文字がからむときだけ注意する
      const withVar = y => hasNode(y, z => z.k === "var");
      if (x.k === "mul" && !x.imp && withVar(x)) iss.add("timesSign");
      if (x.k === "div" && x.sym === "÷" && withVar(x)) iss.add("divSign");
      if (x.k === "mul" && x.imp) {
        const a = stripPar(x.a);
        if (a.k === "num" && Math.abs(a.v) === 1 && stripPar(x.b).k === "var") iss.add("coef1");
        if (stripPar(x.b).k === "num" && (a.k === "var" || a.k === "pow")) iss.add("numAfterVar");
      }
      walk(x.a); walk(x.b);
    })(n);
    return [...iss];
  }

  /* ---------- 採点 ---------- */
  const WHY = {
    empty: "答えが入力されていません",
    parse: "式として読み取れませんでした",
    notLiteral: "計算の途中の式ではなく、答えの数だけを書こう",
    unreduced: "約分できます。いちばん簡単な分数にしよう",
    den1: "分母が1の分数は整数で書こう",
    negDen: "分母にマイナスはつけず、分数の前につけよう",
    unsimplified: "まだ計算できます。同類項をまとめよう",
    likeTerms: "同類項（同じ文字の項・数の項）をまとめよう",
    notMono: "かっこをはずして、項ごとに整理しよう",
    timesSign: "文字式では × の記号を省いて書こう",
    divSign: "÷ は使わず、分数の形で書こう",
    coef1: "係数の1は省いて書こう（1x → x）",
    numAfterVar: "数は文字の前に書こう（a3 → 3a）",
    repeatVar: "同じ文字の積は累乗で書こう（aa → a²）",
    powNum: "数の累乗は計算して答えよう",
    zeroTerm: "0になる項は書かないでおこう",
    paren: "不要なかっこは省こう",
    doubleSign: "符号が重なっています",
    plusSign: "先頭の＋は省いて書こう",
    pow1: "1乗は書かないでおこう",
    form: "答えは合っていますが、書き方（表し方）を確認しよう",
    solved: "方程式（等式）の形で書こう",
    useExp: "同じ数の積は累乗（指数）を使って書こう",
    notPrime: "素数だけの積で表そう",
    count: "答えの個数が合っていません",
    order: "並べる順番を確認しよう",
    dir: "不等号の向きを確認しよう",
  };

  function prep(raw) { return stripLabel(normalize(raw)); }

  function answerNode(ans) {
    if (typeof ans === "number") return { k: "num", v: ans };
    return parse(String(ans));
  }

  // 数の答え
  function gradeNum(raw, ans, opt) {
    opt = opt || {};
    let s = prep(raw);
    if (!s) return { ok: false, why: "empty" };
    s = stripUnits(s, true);
    // 「x=5」のように左辺が1文字だけなら右辺を見る
    const m = /^([a-z])=(.+)$/.exec(s);
    if (m) s = m[2];
    let n;
    try { n = parse(s); } catch (e) { return { ok: false, why: "parse", msg: e.userMsg }; }
    const target = evalAST(answerNode(ans), {});
    const li = literalInfo(n);
    const v = evalAST(n, {});
    if (!li.ok) {
      if (isFinite(v) && close(v, target)) return { ok: false, why: "notLiteral" };
      return { ok: false };
    }
    if (!close(li.v, target)) return { ok: false };
    if (!opt.allowUnreduced) {
      for (const i of ["unreduced", "den1", "negDen"]) if (li.issues.includes(i)) return { ok: false, why: i };
    }
    if (opt.fracOnly && /\./.test(s)) return { ok: false, why: "form" };
    return { ok: true };
  }

  function lhsStrip(s) {
    const m = /^([a-z])=(.+)$/.exec(s);
    return m ? { lhs: m[1], rhs: m[2] } : { lhs: null, rhs: s };
  }

  // 文字式（まとめた形まで要求）
  function gradeLin(raw, ans, opt) {
    opt = opt || {};
    let s = prep(raw);
    if (!s) return { ok: false, why: "empty" };
    s = stripUnits(s, false);
    const u = lhsStrip(s), c = lhsStrip(normalize(String(ans)));
    if (u.lhs && c.lhs && u.lhs !== c.lhs) return { ok: false };
    let un, cn;
    try { un = parse(u.rhs); } catch (e) { return { ok: false, why: "parse", msg: e.userMsg }; }
    cn = parse(c.rhs);
    if (!equivalent(un, cn)) return { ok: false };
    if (opt.lenient) return { ok: true };
    const si = simplifiedInfo(un);
    if (!si.ok) {
      const order = ["timesSign", "divSign", "notMono", "likeTerms", "powNum", "numTimesNum", "unreduced", "den1", "negDen", "coef1", "numAfterVar", "repeatVar", "zeroTerm", "paren", "doubleSign", "pow1", "plusSign"];
      const w = order.find(k => si.issues.includes(k)) || "unsimplified";
      return { ok: false, why: w === "numTimesNum" ? "unsimplified" : w };
    }
    return { ok: true };
  }

  // 表し方そのもの（候補の書き方のどれかと一致）
  function formKey(s) {
    let t = String(s).replace(/[²³]/g, c => SUP[c]).normalize("NFKC")
      .replace(/[−–—ー―‐‑ｰ]/g, "-").replace(/[×✕✖*・]/g, "×").replace(/\s+/g, "").toLowerCase()
      .replace(/\^2/g, "²").replace(/\^3/g, "³");
    t = t.replace(/^\((.*)\)$/, "$1") === t ? t : t;
    return t;
  }
  function gradeForm(raw, accepted) {
    const k = formKey(raw);
    if (!k) return { ok: false, why: "empty" };
    const list = Array.isArray(accepted) ? accepted : [accepted];
    if (list.some(a => formKey(a) === k)) return { ok: true };
    try {
      const un = parse(normalize(raw)), cn = parse(normalize(list[0]));
      if (equivalent(un, cn)) return { ok: false, why: "form" };
    } catch (e) { /* 読めない入力 */ }
    return { ok: false };
  }

  // 等式・不等式（関係を表す式・方程式を立てる問題）
  const FLIP = { ">": "<", "≧": "≦", "<": ">", "≦": "≧", "=": "=" };
  function gradeRel(raw, ans, opt) {
    opt = opt || {};
    let s = prep(raw);
    if (!s) return { ok: false, why: "empty" };
    s = stripUnits(s, false);
    let ur, cr;
    try { ur = parseRelation(s); } catch (e) { return { ok: false, why: "parse", msg: e.userMsg }; }
    cr = parseRelation(String(ans));
    if (ur.ops.length !== 1) return { ok: false, why: ur.ops.length ? "parse" : "solved" };
    // L op R を「D op' 0」（op' は = か < か ≦）にそろえる
    const canon = r => {
      let [L, R] = r.sides, op = r.ops[0];
      if (op === ">" || op === "≧") { [L, R] = [R, L]; op = FLIP[op]; }
      return { D: { k: "sub", a: L, b: { k: "par", a: R } }, op };
    };
    const U = canon(ur), C = canon(cr);
    if (U.op !== C.op) {
      const strictness = o => o === "<" || o === "≦";
      if (strictness(U.op) && strictness(C.op)) return { ok: false, why: "dir" };
      return { ok: false };
    }
    const k = ratioOf(U.D, C.D);
    if (k === null || Math.abs(k) < 1e-9) return { ok: false };
    if (C.op !== "=" && k < 0) return { ok: false, why: "dir" };
    if (!opt.scale && !close(Math.abs(k), 1)) return { ok: false };
    if (opt.notSolved) {
      const isBare = n => { n = stripPar(n); return n.k === "var"; };
      const isLit = n => literalInfo(n).ok;
      const [L, R] = ur.sides;
      if ((isBare(L) && isLit(R)) || (isBare(R) && isLit(L))) return { ok: false, why: "solved" };
    }
    if (!opt.lenient) {
      const iss = ur.sides.flatMap(notationIssues);
      if (iss.length) return { ok: false, why: iss[0] };
    }
    return { ok: true };
  }

  // 変域（x についての不等式）。1文字・両側不等式に対応
  function parseInterval(s) {
    const r = parseRelation(s);
    if (!r.ops.length || r.ops.some(o => o === "=")) throw perr("不等号で書こう", -1);
    let lo = -Infinity, loI = false, hi = Infinity, hiI = false, v = null;
    const val = n => { const li = literalInfo(n); if (!li.ok) throw perr("境目は数で書こう", -1); return li.v; };
    const isVar = n => stripPar(n).k === "var";
    const apply = (a, op, b) => {
      if (isVar(a) && !isVar(b)) {
        v = stripPar(a).n; const x = val(b);
        if (op === ">") { lo = x; loI = false; } else if (op === "≧") { lo = x; loI = true; }
        else if (op === "<") { hi = x; hiI = false; } else { hi = x; hiI = true; }
      } else if (isVar(b) && !isVar(a)) {
        v = stripPar(b).n; const x = val(a);
        if (op === ">") { hi = x; hiI = false; } else if (op === "≧") { hi = x; hiI = true; }
        else if (op === "<") { lo = x; loI = false; } else { lo = x; loI = true; }
      } else throw perr("x の範囲の形で書こう", -1);
    };
    if (r.ops.length === 1) apply(r.sides[0], r.ops[0], r.sides[1]);
    else if (r.ops.length === 2) { apply(r.sides[0], r.ops[0], r.sides[1]); apply(r.sides[1], r.ops[1], r.sides[2]); }
    else throw perr("不等号が多すぎます", -1);
    return { v, lo, loI, hi, hiI };
  }
  function gradeIneq(raw, ans) {
    const s = prep(raw);
    if (!s) return { ok: false, why: "empty" };
    let a, b;
    try { a = parseInterval(s); } catch (e) { return { ok: false, why: "parse", msg: e.userMsg }; }
    b = parseInterval(normalize(ans));
    const eq = (p, q) => p === q || (isFinite(p) && isFinite(q) && close(p, q));
    const ok = a.v === b.v && eq(a.lo, b.lo) && eq(a.hi, b.hi) && a.loI === b.loI && a.hiI === b.hiI;
    if (!ok && a.v === b.v && eq(a.lo, b.lo) && eq(a.hi, b.hi)) return { ok: false, why: "dir" };
    return { ok };
  }

  // 座標 (3, -2)
  function splitTop(s) {
    const out = []; let depth = 0, cur = "";
    for (const c of s) {
      if (c === "(") depth++;
      if (c === ")") depth--;
      if (c === "," && depth === 0) { out.push(cur); cur = ""; } else cur += c;
    }
    out.push(cur);
    return out;
  }
  function gradeCoord(raw, pt) {
    let s = prep(raw);
    if (!s) return { ok: false, why: "empty" };
    s = s.replace(/^[a-z]?=?/, "");
    s = s.replace(/^\((.*)\)$/, "$1");
    const parts = splitTop(s);
    if (parts.length !== 2) return { ok: false, why: "parse", msg: "(x座標, y座標) の形で書こう" };
    for (let i = 0; i < 2; i++) {
      let n;
      try { n = parse(parts[i]); } catch (e) { return { ok: false, why: "parse", msg: e.userMsg }; }
      const li = literalInfo(n);
      if (!li.ok || !close(li.v, evalAST(answerNode(pt[i]), {}))) return { ok: false };
    }
    return { ok: true };
  }

  // 数の並び（順番あり／なし）
  function gradeList(raw, arr, ordered) {
    const s = stripUnits(prep(raw), true);
    if (!s) return { ok: false, why: "empty" };
    const parts = splitTop(s.replace(/^\((.*)\)$/, "$1")).filter(x => x !== "");
    const vals = [];
    for (const p of parts) {
      let n;
      try { n = parse(stripUnits(p, true)); } catch (e) { return { ok: false, why: "parse", msg: e.userMsg }; }
      const li = literalInfo(n);
      if (!li.ok) return { ok: false, why: "notLiteral" };
      vals.push(li.v);
    }
    const want = arr.map(a => evalAST(answerNode(a), {}));
    if (vals.length !== want.length) return { ok: false, why: "count" };
    if (ordered) {
      const ok = vals.every((v, i) => close(v, want[i]));
      if (!ok) {
        const sa = [...vals].sort((x, y) => x - y), sb = [...want].sort((x, y) => x - y);
        if (sa.every((v, i) => close(v, sb[i]))) return { ok: false, why: "order" };
      }
      return { ok };
    }
    const sa = [...vals].sort((x, y) => x - y), sb = [...want].sort((x, y) => x - y);
    return { ok: sa.every((v, i) => close(v, sb[i])) };
  }

  // ことば
  function textKey(s) {
    return String(s).normalize("NFKC").replace(/\s+/g, "").toLowerCase()
      .replace(/[「」『』。．.]/g, "").replace(/[−–—―‐‑]/g, "-");
  }
  function gradeText(raw, accepted) {
    const k = textKey(raw);
    if (!k) return { ok: false, why: "empty" };
    const list = Array.isArray(accepted) ? accepted : [accepted];
    return { ok: list.some(a => textKey(a) === k) };
  }

  // 素因数分解
  function isPrime(n) { if (!isInt(n) || n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; }
  function gradeFactor(raw, n) {
    const s = prep(raw);
    if (!s) return { ok: false, why: "empty" };
    let t;
    try { t = parse(s); } catch (e) { return { ok: false, why: "parse", msg: e.userMsg }; }
    const factors = [];
    let bad = false;
    (function walk(x) {
      x = stripPar(x);
      if (x.k === "mul") { walk(x.a); walk(x.b); return; }
      if (x.k === "num") { factors.push([x.v, 1]); return; }
      if (x.k === "pow" && stripPar(x.a).k === "num" && stripPar(x.b).k === "num") { factors.push([stripPar(x.a).v, stripPar(x.b).v]); return; }
      bad = true;
    })(t);
    if (bad) return { ok: false, why: "parse", msg: "×（かける）と累乗だけで書こう" };
    const prod = factors.reduce((p, [b, e]) => p * Math.pow(b, e), 1);
    if (!close(prod, n)) return { ok: false };
    if (factors.some(([b]) => !isPrime(b))) return { ok: false, why: "notPrime" };
    const bases = factors.map(f => f[0]);
    if (new Set(bases).size !== bases.length) return { ok: false, why: "useExp" };
    return { ok: true };
  }

  /* 1つの小問を採点：sub = {mode, a, ...} */
  function gradeSub(sub, raw) {
    if (raw == null || String(raw).trim() === "") return { ok: false, why: "empty" };
    try {
      switch (sub.mode) {
        case "num": return gradeNum(raw, sub.a, sub);
        case "lin": return gradeLin(raw, sub.a, sub);
        case "expr": return gradeLin(raw, sub.a, { lenient: true });
        case "form": return gradeForm(raw, sub.a);
        case "rel": return gradeRel(raw, sub.a, sub);
        case "ineq": return gradeIneq(raw, sub.a);
        case "coord": return gradeCoord(raw, sub.a);
        case "list": return gradeList(raw, sub.a, true);
        case "set": return gradeList(raw, sub.a, false);
        case "text": return gradeText(raw, sub.a);
        case "factor": return gradeFactor(raw, sub.a);
      }
    } catch (e) {
      return { ok: false, why: "parse", msg: e.userMsg };
    }
    return { ok: false };
  }

  // 入力中のプレビュー（読み取り結果の表示とエラーの案内）
  function preview(raw, mode) {
    const s0 = String(raw == null ? "" : raw);
    if (!s0.trim()) return { html: "", err: null };
    if (mode === "text") return { html: escH(s0), err: null };
    let s = stripLabel(normalize(s0));
    if (mode === "num" || mode === "list" || mode === "set") s = stripUnits(s, true);
    else if (mode !== "form") s = stripUnits(s, false);
    try {
      if (mode === "coord") {
        const inner = s.replace(/^[a-z]?=?/, "").replace(/^\((.*)\)$/, "$1");
        const parts = splitTop(inner);
        if (parts.length !== 2) return { html: escH(s0), err: "(x座標, y座標) の形で書こう" };
        return { html: `<span class="math"><span class="mp">(</span>${render(parse(parts[0]))}<span class="mo">, </span>${render(parse(parts[1]))}<span class="mp">)</span></span>`, err: null };
      }
      if (mode === "list" || mode === "set") {
        const parts = splitTop(s).filter(x => x !== "");
        return { html: `<span class="math">${parts.map(p => render(parse(p))).join('<span class="mo">, </span>')}</span>`, err: null };
      }
      const r = parseRelation(s);
      const parts = [];
      r.sides.forEach((sd, i) => {
        parts.push(render(sd));
        if (i < r.ops.length) parts.push(`<span class="mo b">${REL_SYM[r.ops[i]]}</span>`);
      });
      return { html: `<span class="math">${parts.join("")}</span>`, err: null };
    } catch (e) {
      return { html: escH(s0), err: e.userMsg || "式として読み取れません" };
    }
  }

  // 正解の表示用HTML
  function answerHTML(sub) {
    const a = sub.a;
    switch (sub.mode) {
      case "coord": return toHTML(`(${a[0]},${a[1]})`);
      case "list": case "set": return `<span class="math">${a.map(x => toHTML(String(x))).join('<span class="mo">, </span>')}</span>`;
      case "text": return escH(Array.isArray(a) ? a[0] : a);
      case "form": return toHTML(Array.isArray(a) ? a[0] : a);
      case "factor": return toHTML(sub.show || String(a));
      default: return toHTML(String(a)) + (sub.unit ? `<span class="unit">${escH(sub.unit)}</span>` : "");
    }
  }

  const api = {
    normalize, tokenize, parse, parseRelation, evalAST, equivalent, ratioOf,
    render, toHTML, richText, mathIn, escH,
    literalInfo, simplifiedInfo, notationIssues, stripUnits, isPrime,
    gradeNum, gradeLin, gradeForm, gradeRel, gradeIneq, gradeCoord, gradeList, gradeText, gradeFactor,
    gradeSub, preview, answerHTML, WHY,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.LM = api;
})(typeof window !== "undefined" ? window : globalThis);
