/* 指導案メーカー：データの形・保存・様式の当てはめ・自動入力・番号づけ */
(function () {
  const SD = window.SD;
  const U = SD.U = {};

  // ───────── 小道具 ─────────
  U.uid = () => Math.random().toString(36).slice(2, 10);
  U.clone = (o) => JSON.parse(JSON.stringify(o));
  U.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.zen = (n) => String(n).replace(/[0-9]/g, (d) => String.fromCharCode(d.charCodeAt(0) + 0xFEE0));
  U.han = (s) => String(s ?? '').replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xFEE0));
  U.roman = (n) => ['', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ', 'Ⅺ', 'Ⅻ'][n] || String(n);
  U.circled = (n) => (n >= 1 && n <= 20 ? String.fromCharCode(0x2460 + n - 1) : `(${n})`);
  U.kana = (n) => 'アイウエオカキクケコサシスセソタチツテトナニヌネノ'[n - 1] || String(n);
  U.debounce = (fn, ms) => { let t; const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; d.flush = (...a) => { clearTimeout(t); fn(...a); }; return d; };
  U.num = (v, d = 0) => { const n = parseFloat(U.han(v)); return Number.isFinite(n) ? n : d; };
  U.lines = (s) => String(s ?? '').replace(/\r/g, '').split('\n');
  U.nonEmpty = (s) => String(s ?? '').trim() !== '';
  U.fmtTime = (t) => { const d = new Date(t); const p = (x) => String(x).padStart(2, '0'); return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`; };

  // ───────── 保存（このブラウザの中） ─────────
  const LS = 'shidoan.v1.';
  const store = SD.store = {
    get(k, d) { try { const v = localStorage.getItem(LS + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(LS + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(LS + k); } catch (e) { /* 使えないときは何もしない */ } },
  };
  SD.listPlans = () => store.get('index', []).sort((a, b) => b.updated - a.updated);
  SD.loadPlan = (id) => { const p = store.get('plan.' + id, null); return p ? SD.migrate(p) : null; };
  SD.savePlan = (plan) => {
    plan.updated = Date.now();
    const ok = store.set('plan.' + plan.id, plan);
    const idx = store.get('index', []).filter((e) => e.id !== plan.id);
    idx.push({ id: plan.id, name: SD.planName(plan), updated: plan.updated, pattern: plan.patternName || '', unit: plan.meta.unit, grade: plan.meta.grade, lessonNo: plan.meta.lessonNo });
    store.set('index', idx);
    return ok;
  };
  SD.deletePlan = (id) => { store.del('plan.' + id); store.set('index', store.get('index', []).filter((e) => e.id !== id)); };
  SD.prefs = () => store.get('prefs', {});
  SD.setPrefs = (o) => store.set('prefs', Object.assign(SD.prefs(), o));
  SD.myPatterns = () => store.get('mypatterns', []);
  SD.setMyPatterns = (a) => store.set('mypatterns', a);
  SD.myPhrases = () => store.get('myphrases', {});
  SD.setMyPhrases = (o) => store.set('myphrases', o);

  // ───────── 単元・名前 ─────────
  SD.unitByName = (name) => SD.units.find((u) => u.name === name) || null;
  SD.unitsOf = (g) => SD.units.filter((u) => u.g === +g);
  SD.planName = (plan) => {
    if (plan.name) return plan.name;
    const m = plan.meta;
    const parts = [];
    if (m.grade) parts.push(`中${m.grade}`);
    if (m.unit) parts.push(m.unit);
    if (m.lessonNo && hasHonji(plan)) parts.push(`第${m.lessonNo}時`);
    if (m.topic && hasHonji(plan)) parts.push(`（${m.topic}）`);
    return parts.join(' ').replace(' （', '（') || '無題の指導案';
  };
  const hasHonji = (plan) => plan.sections.some((s) => s.on && ['tenkai', 'honji_goal', 'honji'].includes(s.key));

  SD.defaultStyle = () => ({ n1: 'zen', n2: 'zenparen', fs: 10.5, tfs: 14, mt: 15, mb: 15, ml: 17, mr: 17, tblfs: 0 });

  // ───────── 項目をつくる ─────────
  SD.canonOrder = ['header', 'unit_name', 'unit_goal', 'unit_eval', 'views', 'tangenkan', 'seitokan', 'shidokan', 'kenkyu', 'plan', 'honji', 'honji_goal', 'honji_kadai', 'honji_eval', 'junbi', 'mondai', 'tenkai', 'board', 'tsumazuki', 'hairyo', 'ict'];
  const PARENT = { tangenkan: 'views', seitokan: 'views', shidokan: 'views', honji_goal: 'honji', honji_kadai: 'honji', honji_eval: 'honji', junbi: 'honji', mondai: 'honji', tenkai: 'honji', board: 'honji', tsumazuki: 'honji', hairyo: 'honji', ict: 'honji' };

  SD.makeSection = (key, o = {}) => {
    const d = SD.sectionDefs[key];
    const s = { id: U.uid(), key, kind: d.kind, title: d.title, on: true, level: d.level || 1, num: !['header', 'pagebreak'].includes(d.kind), pb: false, opts: U.clone(d.opts || {}) };
    switch (d.kind) {
      case 'header':
        s.docTitle = '';
        s.align = 'right';
        s.lines = SD.headerLines.map((l) => ({ k: l.k, label: l.label, on: ['date', 'place', 'klass', 'teacher'].includes(l.k) }));
        break;
      case 'text': s.text = ''; s.inline = !!d.inline; break;
      case 'list': s.items = ['']; s.style = d.style || 'none'; break;
      case 'kanten': s.layout = d.layout || 'h'; s.f = { chi: '', shi: '', tai: '' }; break;
      case 'table':
        s.role = d.role;
        s.cols = SD.cols[d.role].map((c) => ({ key: c.key, on: true }));
        s.marks = {};
        s.rows = [];
        if (d.role === 'hyoka') s.rows = ['知識・技能', '思考・判断・表現', '主体的に学習に取り組む態度'].map((k) => SD.makeRow({ h_kanten: k }));
        if (d.role === 'free') s.rows = [SD.makeRow(), SD.makeRow()];
        break;
      case 'board':
        s.parts = [{ label: '課題・めあて', text: '' }, { label: '生徒の考え', text: '' }, { label: 'まとめ・練習', text: '' }];
        s.showLabels = false;
        break;
      default: break;
    }
    return Object.assign(s, o);
  };
  SD.makeRow = (f = {}, extra = {}) => Object.assign({ id: U.uid(), phase: '', min: '', hours: 1, f: Object.assign({}, f) }, extra);

  // 表の列のならびを様式どおりにする（使う列を先に、この順で）
  function arrangeCols(sec, keys) {
    if (!keys) return;
    const cat = SD.cols[sec.role];
    const byKey = Object.fromEntries(sec.cols.map((c) => [c.key, c]));
    const first = keys.filter((k) => byKey[k] || cat.find((c) => c.key === k)).map((k) => Object.assign(byKey[k] || { key: k }, { on: true }));
    const rest = sec.cols.filter((c) => !keys.includes(c.key)).map((c) => Object.assign(c, { on: false }));
    sec.cols = first.concat(rest);
  }
  function arrangeHeader(sec, keys) {
    if (!keys) return;
    const byK = Object.fromEntries(sec.lines.filter((l) => l.k !== 'custom').map((l) => [l.k, l]));
    const first = keys.filter((k) => byK[k]).map((k) => Object.assign(byK[k], { on: true }));
    const rest = sec.lines.filter((l) => !keys.includes(l.k)).map((l) => (l.k === 'custom' ? l : Object.assign(l, { on: false })));
    sec.lines = first.concat(rest);
  }

  // 様式パターンから項目の列をつくる（extras はOFFで、ふさわしい位置に差しこむ）
  SD.buildSections = (pat) => {
    const list = pat.sections.map((k) => SD.makeSection(k, { on: true }));
    const canon = (k) => { const i = SD.canonOrder.indexOf(k); return i < 0 ? 999 : i; };
    for (const k of (pat.extras || []).slice().sort((a, b) => canon(a) - canon(b))) {
      if (list.some((s) => s.key === k)) continue;
      const ck = canon(k);
      let at = 1;
      list.forEach((s, i) => { if (canon(s.key) < ck) at = i + 1; });
      list.splice(at, 0, SD.makeSection(k, { on: false }));
    }
    fixLevels(list);
    for (const s of list) {
      if (s.kind === 'table' && pat.cols) arrangeCols(s, pat.cols[s.role]);
      if (s.kind === 'header') arrangeHeader(s, pat.header);
    }
    return list;
  };
  // 親の見出し（単元について／本時の学習）がないときは1段目にする
  function fixLevels(list) {
    const onKeys = new Set(list.filter((s) => s.on).map((s) => s.key));
    for (const s of list) {
      const par = PARENT[s.key];
      if (!par) continue;
      s.level = onKeys.has(par) ? 2 : 1;
    }
  }

  SD.newPlan = (o = {}) => {
    const pat = o.pattern || SD.patterns.find((p) => p.id === o.patternId) || SD.patterns[0];
    const pr = SD.prefs();
    const plan = {
      id: U.uid(), app: 'shidoan-maker', v: 1, name: '', created: Date.now(), updated: Date.now(),
      patternId: pat.id, patternName: pat.name,
      meta: {
        subject: pr.subject || '数学', grade: o.grade || 1, klass: '', boys: '', girls: '', place: '', date: '', period: '',
        teacher: pr.teacher || '', school: pr.school || '', unit: o.unit || '', lessonNo: o.lessonNo || 1, totalHours: '', minutes: o.minutes || 50, topic: '',
      },
      style: Object.assign(SD.defaultStyle(), pat.style || {}),
      titleBase: pat.title || '', titleSuffix: pat.titleSuffix || '',
      sections: pat.skeleton ? SD.fromSkeleton(pat.skeleton) : SD.buildSections(pat),
    };
    return plan;
  };

  // 保存した「マイ様式」は中身を空にした骨組み
  SD.toSkeleton = (plan) => {
    const sk = U.clone(plan.sections);
    for (const s of sk) {
      if (s.kind === 'text') s.text = '';
      if (s.kind === 'list') s.items = [''];
      if (s.kind === 'kanten') s.f = { chi: '', shi: '', tai: '' };
      if (s.kind === 'board') s.parts.forEach((p) => { p.text = ''; });
      if (s.kind === 'table') {
        if (s.role === 'hyoka') s.rows = s.rows.map((r) => SD.makeRow({ h_kanten: r.f.h_kanten || '' }));
        else if (s.role === 'free') s.rows = s.rows.map(() => SD.makeRow());
        else s.rows = [];
      }
      if (s.kind === 'header') s.lines.forEach((l) => { if (l.k === 'custom') l.v = ''; });
    }
    return sk;
  };
  SD.fromSkeleton = (sk) => U.clone(sk).map((s) => Object.assign(s, { id: U.uid() }));

  // 読み込んだ古いデータを今の形にそろえる
  SD.migrate = (plan) => {
    plan.style = Object.assign(SD.defaultStyle(), plan.style || {});
    plan.meta = Object.assign({ subject: '数学', grade: 1, klass: '', boys: '', girls: '', place: '', date: '', period: '', teacher: '', school: '', unit: '', lessonNo: 1, totalHours: '', minutes: 50, topic: '' }, plan.meta || {});
    for (const s of plan.sections) {
      if (s.kind === 'table') {
        const have = new Set(s.cols.map((c) => c.key));
        for (const c of SD.cols[s.role] || []) if (!have.has(c.key)) s.cols.push({ key: c.key, on: false });
        s.marks = s.marks || {};
        s.opts = s.opts || {};
        for (const r of s.rows) { r.f = r.f || {}; if (r.hours == null) r.hours = 1; }
      }
      if (s.kind === 'header') {
        const have = new Set(s.lines.map((l) => l.k));
        for (const l of SD.headerLines) if (!have.has(l.k)) s.lines.push({ k: l.k, label: l.label, on: false });
      }
      s.opts = s.opts || {};
    }
    return plan;
  };

  // 様式を切りかえる：同じ種類の項目の中身は引きつぐ。新しい様式にない項目はOFFにして最後に残す。
  SD.applyPattern = (plan, pat) => {
    const fresh = pat.skeleton ? SD.fromSkeleton(pat.skeleton) : SD.buildSections(pat);
    const old = plan.sections.slice();
    const used = new Set();
    for (const ns of fresh) {
      const os = old.find((s) => !used.has(s.id) && s.key === ns.key && s.kind === ns.kind);
      if (!os) continue;
      used.add(os.id);
      const def = SD.sectionDefs[os.key];
      if (def && os.title !== def.title && !pat.skeleton) ns.title = os.title; // 自分で変えた見出しは残す
      switch (ns.kind) {
        case 'text': ns.text = os.text; break;
        case 'list': ns.items = os.items; break;
        case 'kanten': ns.f = os.f; break;
        case 'board': ns.parts = os.parts; ns.showLabels = os.showLabels; break;
        case 'table': ns.rows = os.rows; ns.marks = Object.assign({}, os.marks, ns.marks); ns.opts = Object.assign({}, os.opts, ns.opts); break;
        case 'header': {
          ns.docTitle = os.docTitle;
          const customs = os.lines.filter((l) => l.k === 'custom');
          ns.lines = ns.lines.concat(customs);
          for (const l of ns.lines) { const ol = os.lines.find((x) => x.k === l.k && x.k !== 'custom'); if (ol && ol.label) l.label = ol.label; }
          break;
        }
        default: break;
      }
    }
    const leftovers = old.filter((s) => !used.has(s.id) && hasContent(s)).map((s) => Object.assign(s, { on: false }));
    plan.sections = fresh.concat(leftovers);
    plan.patternId = pat.id;
    plan.patternName = pat.name;
    plan.titleBase = pat.title || '';
    plan.titleSuffix = pat.titleSuffix || '';
    plan.style = Object.assign(SD.defaultStyle(), { n1: plan.style.n1, n2: plan.style.n2 }, pat.style || {});
    if (pat.styleAll) plan.style = Object.assign(SD.defaultStyle(), pat.styleAll);
  };
  function hasContent(s) {
    switch (s.kind) {
      case 'text': return U.nonEmpty(s.text);
      case 'list': return s.items.some(U.nonEmpty);
      case 'kanten': return Object.values(s.f).some(U.nonEmpty);
      case 'board': return s.parts.some((p) => U.nonEmpty(p.text));
      case 'table': return s.rows.some((r) => Object.values(r.f).some(U.nonEmpty));
      default: return false;
    }
  }
  SD.hasContent = hasContent;

  // ───────── 自動入力 ─────────
  SD.sec = (plan, key) => plan.sections.find((s) => s.key === key);
  SD.secs = (plan, key) => plan.sections.filter((s) => s.key === key);
  const KANTEN = { 知: 'chi', 思: 'shi', 態: 'tai' };
  const KNAME = { chi: '知識・技能', shi: '思考・判断・表現', tai: '主体的に学習に取り組む態度' };
  const KSHORT = { chi: '知', shi: '思', tai: '態' };
  SD.KNAME = KNAME; SD.KSHORT = KSHORT;
  const HOHO = { chi: ['ノート', '小テスト'], shi: ['ノート', '発言'], tai: ['行動観察', '振り返りシート'] };

  // '知1思0' → [{k:'chi',i:1},{k:'shi',i:0}]
  SD.parseKanten = (code) => Array.from(String(code || '').matchAll(/([知思態])(\d)/g)).map((m) => ({ k: KANTEN[m[1]], i: +m[2] }));

  SD.planRowsFromUnit = (u) => u.plan.map(([t, h, code]) => {
    const ks = SD.parseKanten(code);
    const has = (k) => ks.some((x) => x.k === k);
    const kijun = ks.map((x) => `【${KSHORT[x.k]}】${u.ev[x.k][x.i] || ''}`).join('\n');
    const hoho = [...new Set(ks.flatMap((x) => HOHO[x.k]))].join('・');
    return SD.makeRow({ p_naiyo: t, p_kijun: kijun, p_hoho: hoho, chi: has('chi') ? '○' : '', shi: has('shi') ? '○' : '', tai: has('tai') ? '○' : '' }, { hours: h });
  });

  // 単元の中身を入れる。overwrite=false なら空の項目だけ埋める。
  SD.fillUnit = (plan, overwrite) => {
    const u = SD.unitByName(plan.meta.unit);
    if (!u) return false;
    const setText = (s, v) => { if (s && (overwrite || !U.nonEmpty(s.text))) s.text = v; };
    const setItems = (s, v) => { if (s && (overwrite || !s.items.some(U.nonEmpty))) s.items = v.slice(); };
    for (const s of SD.secs(plan, 'unit_goal')) setItems(s, u.goals);
    for (const s of SD.secs(plan, 'unit_eval')) {
      for (const k of ['chi', 'shi', 'tai']) if (overwrite || !U.nonEmpty(s.f[k])) s.f[k] = u.ev[k].join('\n');
    }
    for (const s of SD.secs(plan, 'tangenkan')) setText(s, u.view);
    for (const s of SD.secs(plan, 'plan')) if (overwrite || !s.rows.length) s.rows = SD.planRowsFromUnit(u);
    for (const s of SD.secs(plan, 'tsumazuki')) setItems(s, u.miss);
    plan.meta.totalHours = u.plan.reduce((a, r) => a + r[1], 0);
    plan.meta.domain = u.domain;
    return true;
  };

  // 指導計画の表から「第n時」の行（学習内容）を探す
  SD.planRanges = (sec) => {
    let at = 1;
    return sec.rows.map((r) => { const h = Math.max(0, Math.round(U.num(r.hours, 1))); const a = at; at += h; return { row: r, from: a, to: a + h - 1, h }; });
  };
  SD.totalHours = (plan) => {
    const ps = SD.secs(plan, 'plan').find((s) => s.rows.length);
    if (ps) return SD.planRanges(ps).reduce((a, x) => a + x.h, 0);
    return U.num(plan.meta.totalHours, 0) || '';
  };
  SD.topicFor = (plan, n) => {
    const ps = SD.secs(plan, 'plan').find((s) => s.rows.length);
    if (ps) {
      const hit = SD.planRanges(ps).find((x) => n >= x.from && n <= x.to);
      if (hit) return String(hit.row.f.p_naiyo || '').split('\n')[0].trim();
    }
    const u = SD.unitByName(plan.meta.unit);
    if (u) { let at = 1; for (const [t, h] of u.plan) { if (n >= at && n < at + h) return t; at += h; } }
    return '';
  };
  // 本時で見る観点と評価規準：指導計画の表（あればその行の ○ と【知】…の文）→ なければ単元データ
  SD.kantenFor = (plan, n) => {
    const ps = SD.secs(plan, 'plan').find((s) => s.rows.length);
    if (ps) {
      const hit = SD.planRanges(ps).find((x) => n >= x.from && n <= x.to);
      if (hit) {
        const r = hit.row;
        const lines = U.lines(r.f.p_kijun).filter((l) => l.trim());
        const out = [];
        for (const k of ['chi', 'shi', 'tai']) {
          if (!r.f[k]) continue;
          const ln = lines.find((l) => l.startsWith(`【${KSHORT[k]}】`));
          out.push({ k, text: ln ? ln.replace(/^【.】/, '') : '' });
        }
        if (out.length) return out;
      }
    }
    const u = SD.unitByName(plan.meta.unit);
    if (!u) return [];
    let at = 1;
    for (const [, h, code] of u.plan) { if (n >= at && n < at + h) return SD.parseKanten(code).map((x) => ({ k: x.k, text: u.ev[x.k][x.i] || '' })); at += h; }
    return [];
  };

  // 評価規準の文末を「本時の目標」らしく
  SD.toGoal = (s) => String(s).replace(/ようとしている。$/, 'ようとする。').replace(/している。$/, 'することができる。').replace(/っている。$/, 'ることができる。');

  SD.lessonGoalsFor = (plan) => {
    const t = plan.meta.topic || '〇〇';
    const ks = SD.kantenFor(plan, U.num(plan.meta.lessonNo, 1));
    const out = [];
    const calc = /法$|計算|展開|因数分解|解き方|解の公式|求め方|作図|表し方|体積|表面積|面積|長さ|式の値/.test(t);
    if (ks.some((k) => k.k === 'shi')) out.push(`既習事項と関連付けながら、${t}の${calc ? '仕方' : '意味や性質'}を考え、説明することができる。`);
    if (ks.some((k) => k.k === 'chi') || !out.length) out.push(calc ? `${t}の仕方を理解し、正しく求めることができる。` : `${t}の意味を理解し、言葉や式を用いて説明することができる。`);
    if (ks.some((k) => k.k === 'tai') && out.length < 2) out.push(`${t}について粘り強く考え、学んだことを生かそうとする。`);
    return out;
  };

  // 本時の中身を入れる（題材・目標・評価・板書のめあて）
  SD.fillLesson = (plan, overwrite) => {
    const n = U.num(plan.meta.lessonNo, 1);
    const topic = SD.topicFor(plan, n);
    if (topic && (overwrite || !plan.meta.topic)) plan.meta.topic = topic.replace(/（.*?）/g, '');
    const t = plan.meta.topic;
    const u = SD.unitByName(plan.meta.unit);
    for (const s of SD.secs(plan, 'honji_goal')) if (overwrite || !s.items.some(U.nonEmpty)) s.items = SD.lessonGoalsFor(plan).slice(0, 1);
    for (const s of SD.secs(plan, 'honji_kadai')) if (t && (overwrite || !U.nonEmpty(s.text))) s.text = `${t}の方法を考えよう。`;
    for (const s of SD.secs(plan, 'honji_eval')) {
      const ks = SD.kantenFor(plan, n);
      if (!ks.length) continue;
      if (!(overwrite || !s.rows.some((r) => U.nonEmpty(r.f.h_kijun)))) continue;
      s.rows = ks.filter((k, i, a) => a.findIndex((x) => x.k === k.k) === i).map((k) => SD.makeRow({
        h_kanten: KNAME[k.k], h_kijun: k.text || (u ? u.ev[k.k][0] : ''), h_hoho: HOHO[k.k].join('・'), h_c: SD.phrases.hyoka_c[k.k === 'chi' ? 1 : 0],
      }));
    }
    for (const s of SD.secs(plan, 'board')) if (t && (overwrite || !U.nonEmpty(s.parts[0].text))) s.parts[0].text = `めあて　${t}の方法を考えよう。`;
    for (const s of SD.secs(plan, 'mondai')) if (u && (overwrite || !s.items.some(U.nonEmpty))) s.items = [u.probs.find((p) => t && p.includes(t.slice(0, 2))) || u.probs[0]];
  };

  // 分を比例配分して合計をそろえる
  SD.scaleMinutes = (mins, total) => {
    const sum = mins.reduce((a, b) => a + b, 0) || 1;
    const out = mins.map((m) => Math.max(1, Math.round((m * total) / sum)));
    let diff = total - out.reduce((a, b) => a + b, 0);
    while (diff !== 0) {
      const i = out.indexOf(Math.max(...out));
      out[i] += diff > 0 ? 1 : -1;
      diff += diff > 0 ? -1 : 1;
    }
    return out;
  };

  // 展開の型を入れる
  SD.applyFlow = (plan, flowId, mode = 'replace') => {
    const flow = SD.flows.find((f) => f.id === flowId);
    const sec = SD.sec(plan, 'tenkai');
    if (!flow || !sec) return false;
    const total = U.num(plan.meta.minutes, 50) || 50;
    const mins = SD.scaleMinutes(flow.rows.map((r) => r.m), total);
    const t = plan.meta.topic;
    const fill = (v) => (t ? String(v).replace(/〇〇/g, t) : v);
    const rows = flow.rows.map((r, i) => {
      const f = {};
      for (const k of Object.keys(SD.parts)) if (r[k] != null) f[k] = fill(r[k]);
      return SD.makeRow(f, { phase: r.p, min: mins[i] });
    });
    sec.rows = mode === 'append' ? sec.rows.concat(rows) : rows;
    sec.flowId = flow.id;
    return true;
  };

  // ───────── 表示用の計算 ─────────
  SD.fmt1 = (n, st) => ({ zen: `${U.zen(n)}　`, han: `${n}　`, dot: `${n}．`, zendot: `${U.zen(n)}．`, roman: `${U.roman(n)}　`, none: '' }[st] ?? `${U.zen(n)}　`);
  SD.fmt2 = (n, st) => ({ zenparen: `（${U.zen(n)}）`, paren: `(${n}) `, circle: `${U.circled(n)} `, kana: `${U.kana(n)}　`, none: '' }[st] ?? `（${U.zen(n)}）`);
  SD.numbering = (plan) => {
    const map = {};
    let a = 0; let b = 0;
    for (const s of plan.sections) {
      if (!s.on || s.kind === 'header' || s.kind === 'pagebreak') continue;
      if (s.level === 1) {
        b = 0;
        if (s.num !== false) { a += 1; map[s.id] = SD.fmt1(a, plan.style.n1); }
      } else if (s.num !== false) { b += 1; map[s.id] = SD.fmt2(b, plan.style.n2); }
    }
    return map;
  };
  SD.headTitle = (plan, s) => {
    let t = s.title;
    if (s.key === 'plan' && s.opts && s.opts.total) { const th = SD.totalHours(plan); if (th) t += `（全${th}時間）`; }
    if (s.key === 'honji' && s.opts && s.opts.pos && plan.meta.lessonNo) {
      const th = SD.totalHours(plan);
      t += th ? `（${plan.meta.lessonNo}／${th}時）` : `（第${plan.meta.lessonNo}時）`;
    }
    return t;
  };
  SD.docTitle = (plan) => {
    const h = plan.sections.find((s) => s.kind === 'header');
    if (h && U.nonEmpty(h.docTitle)) return h.docTitle;
    const m = plan.meta;
    const who = m.grade ? `第${U.zen(m.grade)}学年${m.klass ? U.zen(m.klass) + '組' : ''}` : '';
    const base = plan.titleBase ? `${m.subject}科　${plan.titleBase}` : `${m.subject}科学習指導案`;
    return `${who}${who ? '　' : ''}${base}${plan.titleSuffix || ''}`;
  };
  SD.headerValue = (plan, line) => {
    const m = plan.meta;
    switch (line.k) {
      case 'date': return [m.date, m.period ? `第${m.period}校時` : ''].filter(Boolean).join('　');
      case 'place': return m.place;
      case 'klass': {
        const k = m.grade ? `第${m.grade}学年${m.klass ? m.klass + '組' : ''}` : '';
        const b = U.num(m.boys, NaN); const g = U.num(m.girls, NaN);
        let n = '';
        if (Number.isFinite(b) || Number.isFinite(g)) n = `（男子${Number.isFinite(b) ? b : '　'}名　女子${Number.isFinite(g) ? g : '　'}名　計${(Number.isFinite(b) ? b : 0) + (Number.isFinite(g) ? g : 0)}名）`;
        return k + n;
      }
      case 'teacher': return m.teacher;
      case 'school': return m.school;
      case 'unit': return m.unit;
      case 'position': { const th = SD.totalHours(plan); return m.lessonNo ? `第${m.lessonNo}時${th ? `／全${th}時間` : ''}${m.topic ? `（${m.topic}）` : ''}` : ''; }
      case 'custom': return line.v || '';
      default: return '';
    }
  };

  // 行頭の記号をつける（すでに記号・番号・全角スペースで始まる行にはつけない）
  // 行頭がすでに記号・番号・見出し（【課題】（考えＡ）(1) など）なら記号をつけない。(+3) のような式は記号とみなさない。
  const MARK_RE = /^([\s　・○◎●◆◇■□☆★※→⇒＊*＃#【〔①-⑳]|[ＴＳTS][：:]|[0-9０-９]+[\s　.．、)）]|[ア-ン][　.．、]|[（(](?:[0-9０-９]{1,2}|(?![+\-−＋－0-9０-９])[^（()）]{1,8})[）)])/;
  SD.MARK_RE = MARK_RE;
  SD.markLine = (line, mark) => (!mark || !String(line).trim() || MARK_RE.test(line) ? line : mark + line);
  // ぶら下げ（2行目以降を記号のぶんだけ下げる）の幅：全角1＝1字、半角＝0.5字
  SD.hangOf = (line) => {
    const m = String(line).match(/^([ＴＳTS][：:]|[0-9０-９]{1,2}　|[①-⑳]|[・○◎●◆◇■□☆★※→⇒＊*])/);
    if (!m) return 0;
    const w = [...m[1]].reduce((a, ch) => a + (/[ -~]/.test(ch) ? 0.5 : 1), 0);
    return Math.min(3, Math.ceil(w));
  };
  SD.colDef = (role, key) => (SD.cols[role] || []).find((c) => c.key === key) || null;
  SD.colInfo = (sec, c) => {
    const def = SD.colDef(sec.role, c.key) || { key: c.key, label: c.label || '列', w: 20, parts: [c.key] };
    return Object.assign({}, def, { label: c.label || def.label, w: c.w || def.w, on: c.on, custom: !SD.colDef(sec.role, c.key) });
  };
  SD.partMark = (sec, colKey, part) => {
    const k = `${colKey}.${part}`;
    if (sec.marks && sec.marks[k] != null) return sec.marks[k];
    const def = SD.colDef(sec.role, colKey);
    if (def && def.marks && def.marks[part] != null) return def.marks[part];
    return (SD.parts[part] && SD.parts[part].mark) || '';
  };
  SD.partLabel = (p) => (SD.parts[p] ? SD.parts[p].label : p);
  SD.phaseGroupOf = (phase) => SD.phaseGroup[String(phase || '').trim()] || null;

  // 展開の「学習活動」に通し番号をつける（行の最初の1行だけ）
  SD.activityNumbers = (sec) => {
    const map = {};
    let n = 0;
    for (const r of sec.rows) { if (U.nonEmpty(r.f.katsudo)) { n += 1; map[r.id] = n; } }
    return map;
  };

  // セルに入れる文字（記号・番号つき）を行の配列で返す
  SD.cellLines = (plan, sec, col, row, actNo) => {
    const out = [];
    const parts = col.parts || [col.key];
    for (const p of parts) {
      const mark = SD.partMark(sec, col.key, p);
      let ls = U.lines(row.f[p]).filter((l, i, a) => l.trim() !== '' || (i > 0 && i < a.length - 1));
      if (!ls.some((l) => l.trim())) continue;
      ls = ls.map((l, i) => {
        if (p === 'katsudo' && i === 0 && sec.opts && sec.opts.num !== false && actNo && !/^[0-9０-９]/.test(l)) return `${U.zen(actNo)}　${l}`;
        if (p === 'katsudo' && i > 0 && !MARK_RE.test(l) && l.trim()) return `　${l}`;
        return SD.markLine(l, mark);
      });
      out.push(...ls);
    }
    return out;
  };

  // ───────── 項目の中身の状態（一覧の●○と「次の空欄へ」で使う） ─────────
  SD.secTexts = (plan, s) => {
    switch (s.kind) {
      case 'text': return [s.bind === 'unit' || s.key === 'unit_name' ? plan.meta.unit : s.text];
      case 'list': return s.items;
      case 'kanten': return Object.values(s.f);
      case 'board': return s.parts.map((p) => p.text);
      case 'table': return s.rows.flatMap((r) => Object.values(r.f));
      default: return [];
    }
  };
  // 'na'＝中身のない種類（表題・見出し・改ページ）／'empty'＝まだ空／'ph'＝〇〇などが残っている／'ok'
  SD.secStatus = (plan, s) => {
    if (s.kind === 'header') {
      // 表題：入れている行（本時の位置は自動なので除く）に空があれば「空」
      const vals = s.lines.filter((l) => l.on && l.k !== 'position').map((l) => SD.headerValue(plan, l));
      if (vals.some((v) => !String(v || '').trim() || /^第\d+学年$/.test(v))) return 'empty';
      if (vals.some((v) => /〇〇|○○/.test(v))) return 'ph';
      return 'ok';
    }
    if (['heading', 'pagebreak'].includes(s.kind)) return 'na';
    const ts = SD.secTexts(plan, s).join('\n');
    if (!ts.trim()) return 'empty';
    if (/〇〇|○○|〇[％%名人問点割]/.test(ts)) return 'ph';
    return 'ok';
  };

  // ───────── 点検 ─────────
  SD.check = (plan) => {
    const out = [];
    const nums = SD.numbering(plan);
    const name = (s) => `${(nums[s.id] || '').trim()} ${s.title}`.trim();
    const texts = (s) => {
      switch (s.kind) {
        case 'text': return [s.bind === 'unit' || s.key === 'unit_name' ? plan.meta.unit : s.text];
        case 'list': return s.items;
        case 'kanten': return Object.values(s.f);
        case 'board': return s.parts.map((p) => p.text);
        case 'table': return s.rows.flatMap((r) => Object.values(r.f));
        default: return [];
      }
    };
    for (const s of plan.sections) {
      if (!s.on || ['header', 'heading', 'pagebreak'].includes(s.kind)) continue;
      const ts = texts(s).join('\n');
      if (/〇〇|○○/.test(ts)) out.push({ lv: 'warn', sid: s.id, msg: `「${name(s)}」に「〇〇」が残っています。` });
      else if (/〇[％%名人問点]|〇割/.test(ts)) out.push({ lv: 'info', sid: s.id, msg: `「${name(s)}」に数字を入れる「〇」が残っています。` });
      if (!ts.trim()) out.push({ lv: 'info', sid: s.id, msg: `「${name(s)}」がまだ空です。` });
    }
    const ten = plan.sections.find((s) => s.on && s.key === 'tenkai');
    if (ten && ten.rows.length) {
      const sum = ten.rows.reduce((a, r) => a + U.num(r.min, 0), 0);
      const total = U.num(plan.meta.minutes, 50);
      if (sum && sum !== total) out.push({ lv: 'warn', sid: ten.id, msg: `本時の展開の時間の合計が ${sum}分 です（授業は ${total}分）。` });
      const hasEvalCol = ten.cols.some((c) => c.on && (SD.colInfo(ten, c).parts || []).includes('hyoka'));
      if (hasEvalCol && !ten.rows.some((r) => U.nonEmpty(r.f.hyoka))) out.push({ lv: 'warn', sid: ten.id, msg: '本時の展開に「評価」が1つも書かれていません。' });
    }
    const pl = plan.sections.find((s) => s.on && s.key === 'plan' && s.rows.length);
    if (pl && hasHonji(plan)) {
      const n = U.num(plan.meta.lessonNo, 0);
      const th = SD.totalHours(plan);
      if (n > th) out.push({ lv: 'warn', sid: pl.id, msg: `本時（第${n}時）が指導計画の時数（全${th}時間）をこえています。` });
    }
    const goal = plan.sections.find((s) => s.on && s.key === 'honji_goal');
    const ev = plan.sections.find((s) => s.on && s.key === 'honji_eval');
    if (goal && ev) {
      const g = goal.items.join('');
      if (/説明|考え|見いだ/.test(g) && !ev.rows.some((r) => /思/.test(r.f.h_kanten || ''))) out.push({ lv: 'info', sid: ev.id, msg: '本時の目標は「思考・判断・表現」寄りですが、評価規準に「思考・判断・表現」の行がありません。' });
    }
    return out;
  };
})();
