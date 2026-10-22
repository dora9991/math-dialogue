/* 生徒指導 対応ナビ：データの入れ物（SN）。
   場面のファイル（data/<id>.js）は、SN.scenario({...}) で自分を登録する。
   画面（js/app.js）は、ここに集まったデータだけを見て描く。データの書き方は README.md の「場面の足し方」。

   ■ 場面（SN.scenario に渡すもの）
     id       半角の英小文字・数字・_（例：'ijime'）。data/common.js の SN.cats に同じ id を書く
     title    場面の名前（一覧のカードの見出し）
     lead     どんなときに開くか（カードの説明。1〜2行）
     example  場面の例（はじめの画面に「たとえば」として出す。架空の例）
     words    検索で見つけてほしい言葉（本文にない言いかえ。例：'LINE'、'リスカ'）
     related  関連する場面の id（さいごの画面に出す）
     start    はじめの分かれ道の id（書かなければ 'start'）
     nodes    分かれ道（下の形）を id ごとに

   ■ 分かれ道（nodes の中の1つ）
     title    見出し（18字まで。分岐マップにも出る）
     alert    赤い注意（命・安全にかかわるとき、まず目に入れたい1〜2文）
     text     状況の説明・考え方（です・ます。\n で改行。**太字** が使える）
     steps    対応の手順（順番に。常体の短い文）
     say      声かけの例（「」でくくる。だれに向けた言葉かは（　）で前に書く）
     avoid    避けたい言葉・対応 [['言葉や対応', 'なぜ避けるか'], …]
     team     連携・報告先の id（data/common.js の SN.team）
     record   記録すること
     points   ポイント・注意
     basis    根拠・参考（法律・通知・手引き。確かなものだけ）
     question 次の分かれ道の問い
     options  選択肢 [{ label, to }]（同じ場面の分かれ道へ）または [{ label, jump }]（ほかの場面へ。'sns' や 'sns~seiteki' のように、~ で道すじも書ける）
              sub に小さな補足を書ける */
(function () {
  const SN = (window.SN = window.SN || {});
  SN.scenarios = {};
  SN.cats = SN.cats || [];
  SN.team = SN.team || {};

  SN.scenario = function (def) {
    if (!def || !def.id) throw new Error('SN.scenario：id がありません');
    if (SN.scenarios[def.id]) throw new Error('SN.scenario：id が重複しています：' + def.id);
    def.start = def.start || 'start';
    def.nodes = def.nodes || {};
    for (const nid of Object.keys(def.nodes)) def.nodes[nid].id = nid;
    SN.scenarios[def.id] = def;
  };

  // 一覧の並び（SN.cats に書いた順。データのない場面は飛ばす）
  SN.ordered = function () {
    return SN.cats.flatMap((c) => c.ids.filter((id) => SN.scenarios[id]).map((id) => SN.scenarios[id]));
  };

  // はじめの分かれ道から nid までの、いちばん短い道すじ（[start, …, nid]）。たどり着けなければ null
  SN.pathTo = function (sid, nid) {
    const s = SN.scenarios[sid];
    if (!s || !s.nodes[nid]) return null;
    const prev = { [s.start]: null }, q = [s.start];
    while (q.length) {
      const cur = q.shift();
      if (cur === nid) break;
      for (const o of s.nodes[cur].options || []) if (o.to && !(o.to in prev)) { prev[o.to] = cur; q.push(o.to); }
    }
    if (!(nid in prev)) return null;
    const path = [];
    for (let c = nid; c !== null; c = prev[c]) path.unshift(c);
    return path;
  };

  // 道すじ（['start','honnin',…]）が、選択肢どおりにつながっているか
  SN.validPath = function (sid, path) {
    const s = SN.scenarios[sid];
    if (!s || !path.length || path[0] !== s.start) return false;
    for (let i = 1; i < path.length; i++) {
      const n = s.nodes[path[i - 1]];
      if (!n || !(n.options || []).some((o) => o.to === path[i])) return false;
    }
    return !!s.nodes[path[path.length - 1]];
  };

  // データの検査。tools/check.cjs と、画面の読みこみ時（エラーの表示）に使う
  SN.validate = function () {
    const errors = [], warns = [];
    const E = (m) => errors.push(m), W = (m) => warns.push(m);
    const ID = /^[a-z][a-z0-9_]*$/;
    const NODE_KEYS = ['id', 'title', 'alert', 'text', 'steps', 'say', 'avoid', 'team', 'record', 'points', 'basis', 'question', 'options'];
    const SC_KEYS = ['id', 'title', 'lead', 'example', 'words', 'related', 'start', 'nodes'];
    const OPT_KEYS = ['label', 'to', 'jump', 'sub'];
    const catalog = new Set(SN.cats.flatMap((c) => c.ids));
    const isStrArr = (a) => Array.isArray(a) && a.every((x) => typeof x === 'string' && x.trim());
    const len = (t) => [...String(t)].length;
    const stars = (t, at) => { if ((String(t).match(/\*\*/g) || []).length % 2) E(`${at}：** の数が合わない（太字の閉じ忘れ）`); };
    const seenCat = new Set();
    for (const c of SN.cats) for (const id of c.ids) {
      if (seenCat.has(id)) E(`SN.cats：「${id}」が2回ある`);
      seenCat.add(id);
      if (!SN.scenarios[id]) W(`場面「${id}」：一覧（SN.cats）にあるが、データ（data/${id}.js）がまだない`);
    }
    for (const [tid, t] of Object.entries(SN.team)) if (!t.name || !t.role) E(`SN.team「${tid}」：name と role を書く`);

    for (const [sid, s] of Object.entries(SN.scenarios)) {
      const at = `場面「${sid}」`;
      if (!ID.test(sid)) E(`${at}：id は半角の英小文字・数字・_ で`);
      if (!catalog.has(sid)) E(`${at}：data/common.js の SN.cats に入っていない`);
      for (const k of Object.keys(s)) if (!SC_KEYS.includes(k)) E(`${at}：知らない項目「${k}」`);
      if (!s.title) E(`${at}：title がない`);
      if (!s.lead) E(`${at}：lead がない`);
      if (s.words !== undefined && !isStrArr(s.words)) E(`${at}：words は文字の配列で`);
      if (s.related !== undefined && !isStrArr(s.related)) E(`${at}：related は場面の id の配列で`);
      for (const r of s.related || []) if (!catalog.has(r)) E(`${at}：related の「${r}」という場面はない`);
      const nodes = s.nodes || {};
      if (!nodes[s.start]) E(`${at}：はじめの分かれ道「${s.start}」がない`);
      for (const [nid, n] of Object.entries(nodes)) {
        const nat = `${at} › 「${nid}」`;
        if (!ID.test(nid)) E(`${nat}：id は半角の英小文字・数字・_ で`);
        for (const k of Object.keys(n)) if (!NODE_KEYS.includes(k)) E(`${nat}：知らない項目「${k}」`);
        if (!n.title) E(`${nat}：title がない`);
        else if (len(n.title) > 18) W(`${nat}：title が長い（${len(n.title)}字。18字まで）`);
        for (const k of ['steps', 'say', 'record', 'points', 'basis']) if (n[k] !== undefined && !isStrArr(n[k])) E(`${nat}：${k} は文字の配列で`);
        for (const k of ['alert', 'text', 'question']) if (n[k] !== undefined && (typeof n[k] !== 'string' || !n[k].trim())) E(`${nat}：${k} は文字で`);
        if (n.avoid !== undefined && !(Array.isArray(n.avoid) && n.avoid.every((a) => Array.isArray(a) && a.length === 2 && a.every((x) => typeof x === 'string' && x.trim())))) E(`${nat}：avoid は [['言葉や対応', '理由'], …] の形で`);
        if (n.team !== undefined && !isStrArr(n.team)) E(`${nat}：team は連携先の id の配列で`);
        for (const t of n.team || []) if (!SN.team[t]) E(`${nat}：team の「${t}」は data/common.js の SN.team にない`);
        if (!n.text && !n.steps) W(`${nat}：text も steps もない`);
        for (const k of ['alert', 'text']) if (n[k]) stars(n[k], `${nat} › ${k}`);
        for (const k of ['steps', 'say', 'record', 'points']) (n[k] || []).forEach((t, i) => {
          stars(t, `${nat} › ${k}[${i}]`);
          if (len(t) > 110) W(`${nat} › ${k}[${i}]：長い（${len(t)}字）。2つに分けられないか`);
        });
        (n.say || []).forEach((t, i) => { if (!t.includes('「')) W(`${nat} › say[${i}]：「」がない`); });
        const opts = n.options || [];
        if (n.options !== undefined && !Array.isArray(n.options)) E(`${nat}：options は配列で`);
        if (opts.length && !n.question) E(`${nat}：options があるのに question がない`);
        if (!opts.length && n.question) E(`${nat}：question があるのに options がない`);
        for (const o of opts) {
          const oat = `${nat} › 選択肢「${o.label || '?'}」`;
          for (const k of Object.keys(o)) if (!OPT_KEYS.includes(k)) E(`${oat}：知らない項目「${k}」`);
          if (!o.label) E(`${nat}：label のない選択肢がある`);
          if (!!o.to === !!o.jump) E(`${oat}：to か jump の、どちらか一つを書く`);
          if (o.to && !nodes[o.to]) E(`${oat}：行き先「${o.to}」がない`);
          if (o.to === nid) E(`${oat}：自分自身に戻っている`);
          if (o.jump) {
            const [js, ...jp] = o.jump.split('~');
            if (js === sid) E(`${oat}：同じ場面の中は jump ではなく to で`);
            else if (!catalog.has(js)) E(`${oat}：jump 先「${js}」という場面はない`);
            else if (!SN.scenarios[js]) W(`${oat}：jump 先「${js}」のデータがまだない`);
            else if (jp.length && !SN.validPath(js, [SN.scenarios[js].start, ...jp])) E(`${oat}：jump の道すじ「${o.jump}」が、つながっていない`);
          }
        }
      }
      // はじめからたどり着けるか
      const seen = new Set([s.start]), q = [s.start];
      while (q.length) {
        const n = nodes[q.shift()];
        for (const o of (n && n.options) || []) if (o.to && nodes[o.to] && !seen.has(o.to)) { seen.add(o.to); q.push(o.to); }
      }
      for (const nid of Object.keys(nodes)) if (!seen.has(nid)) E(`${at}：「${nid}」に、はじめからたどり着けない`);
    }
    return { errors, warns };
  };
})();
