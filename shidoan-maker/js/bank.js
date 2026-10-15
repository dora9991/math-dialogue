/* 指導案メーカー：入力欄ごとの文例をあつめる */
(function () {
  const SD = window.SD;
  const U = SD.U;
  const P = SD.phrases;
  const KN = ['知識・技能', '思考・判断・表現', '主体的に学習に取り組む態度'];

  const bigrams = (s) => { const t = String(s || '').replace(/[\s　・、。（）()]/g, ''); const a = []; for (let i = 0; i < t.length - 1; i += 1) a.push(t.slice(i, i + 2)); return a; };
  const sim = (a, b) => { const A = bigrams(a); const B = new Set(bigrams(b)); return A.filter((x) => B.has(x)).length; };

  // 躓きDB から、この単元・この題材に近いものを上に。
  // 「正負の数」のように単元中どこにでも出る言葉は軽く、「減法」のように少ない言葉を重く数える。
  SD.tzFor = (plan, limit = 40) => {
    const list = (SD.tsumazuki || []).filter((z) => z.u === plan.meta.unit);
    const t = plan.meta.topic || '';
    const df = {};
    const grams = list.map((z) => new Set(bigrams(`${z.sub} ${z.t} ${z.ex}`)));
    grams.forEach((set) => set.forEach((b) => { df[b] = (df[b] || 0) + 1; }));
    // 単元名の言葉や「正負」「〜の数」のような、どの時間にも出る言葉は数えない
    for (const b of [...bigrams(plan.meta.unit), '正負', '数の', 'の数', '負の', '正の', 'の式', '式の', 'いろ', 'ろい', 'いな', 'な式']) df[b] = list.length;
    const N = list.length || 1;
    const tg = [...new Set(bigrams(t))];
    const score = (z, i) => {
      let s = 0;
      if (t) {
        const subG = new Set(bigrams(z.sub));
        for (const b of tg) {
          const w = Math.log((N + 1) / ((df[b] || 0) + 1));
          if (subG.has(b)) s += w * 3; else if (grams[i].has(b)) s += w;
        }
      }
      return s + (z.star ? 0.6 : 0) + (z.freq === '高' ? 0.3 : 0);
    };
    return list.map((z, i) => ({ z, s: score(z, i) })).sort((a, b) => b.s - a.s).slice(0, limit).map((x) => x.z);
  };

  const g = (name, items, opt = {}) => ({ name, items: items.filter(Boolean).map((x) => (typeof x === 'string' ? { t: x } : x)), ...opt });
  const byPhase = (obj, grp) => {
    const order = ['導入', '展開', 'まとめ'];
    const first = grp && obj[grp] ? [grp] : [];
    return first.concat(order.filter((k) => k !== grp)).filter((k) => obj[k]).map((k) => g(k === grp ? `${k}（この行）` : k, obj[k]));
  };

  // target = { bank, phase, rowKanten }
  SD.getBank = (plan, target) => {
    const u = SD.unitByName(plan.meta.unit);
    const unitLabel = u ? `この単元（${u.name}）` : '';
    const grp = SD.phaseGroupOf(target.phase);
    const tz = u ? SD.tzFor(plan) : [];
    const navi = SD.navi && SD.navi.ok ? SD.navi.lessonsFor(plan.meta.unit) : [];
    const cur = navi.find((l) => l.no === U.num(plan.meta.lessonNo, 0));
    const groups = [];
    const my = (SD.myPhrases()[target.bank] || []);
    if (my.length) groups.push(g('マイ文例', my, { mine: true }));
    const evItems = (k, fmt) => (u ? u.ev[k].map(fmt) : []);
    switch (target.bank) {
      case 'tangenkan':
        if (u) groups.push(g(unitLabel, [u.view]));
        groups.push(g('よく使う文', P.tangenkan));
        break;
      case 'seitokan': groups.push(g('よく使う文', P.seitokan)); break;
      case 'shidokan': groups.push(g('よく使う文', P.shidokan)); break;
      case 'kenkyu': groups.push(g('よく使う文', P.kenkyu)); break;
      case 'goal_unit':
        if (u) groups.push(g(unitLabel, u.goals));
        break;
      case 'eval_chi': case 'eval_shi': case 'eval_tai': {
        const k = target.bank.slice(5);
        if (u) groups.push(g(unitLabel, u.ev[k]));
        const others = SD.units.filter((x) => x !== u && (!u || x.g === u.g)).flatMap((x) => x.ev[k].map((t) => ({ t, sub: x.name })));
        groups.push(g('ほかの単元の例', others.slice(0, 24)));
        break;
      }
      case 'goal_lesson':
        if (cur) groups.push(g(`授業ナビ 第${cur.no}時`, SD.navi.goalParts(cur).map((x) => ({ t: x.t, sub: x.k ? SD.KNAME[x.k] : '' }))));
        if (u) {
          groups.push(g('この時間に合わせた目標', SD.lessonGoalsFor(plan)));
          groups.push(g(`${unitLabel}の評価規準から`, ['chi', 'shi', 'tai'].flatMap((k) => u.ev[k].map((t) => ({ t: SD.toGoal(t), sub: SD.KNAME[k] })))));
        }
        groups.push(g('よく使う文', P.goal_lesson));
        break;
      case 'meate':
        if (cur) groups.push(g(`授業ナビ 第${cur.no}時`, [cur.title + (/[。？?！!]$/.test(cur.title) ? '' : '。')]));
        groups.push(g('めあての形', P.meate));
        groups.push(g('まとめの形', P.matome));
        break;
      case 'board':
        if (cur) groups.push(g(`授業ナビ 第${cur.no}時`, [`めあて　${cur.title}`, ...(cur.problems || []).map((p) => `${p.l}　${p.t}`), cur.matome ? `まとめ　${cur.matome}` : ''].filter(Boolean)));
        groups.push(g('めあて', P.meate.map((t) => `めあて　${t}`)));
        groups.push(g('まとめ', P.matome.map((t) => `まとめ　${t}`)));
        if (u) groups.push(g('問題', u.probs.map((t) => `問題　${t}`)));
        break;
      case 'junbi': groups.push(g('よく使うもの', P.junbi)); break;
      case 'mondai':
        if (cur) groups.push(g(`授業ナビ 第${cur.no}時`, (cur.problems || []).map((p) => ({ t: p.t, sub: p.l }))));
        if (u) groups.push(g(unitLabel, u.probs));
        break;
      case 'tsumazuki':
        if (tz.length) groups.push(g('予想される誤答（躓きデータベース）', tz.map((z) => ({ t: `${z.ex}（${z.bug}）→「${z.q}」と問いかけ、気付かせる。`, sub: `${z.sub}${z.star ? '　★重要' : ''}` }))));
        if (u) groups.push(g(unitLabel, u.miss));
        break;
      case 'hairyo': groups.push(g('よく使う文', P.hairyo)); break;
      case 'ict': groups.push(g('よく使う文', P.ict)); break;
      case 'keitai': groups.push(g('学習形態', P.keitai)); break;
      case 'hoho': groups.push(g('評価方法', P.hoho)); break;
      case 'hyoka_c': groups.push(g('よく使う文', P.hyoka_c)); break;
      case 'hyoka_a': groups.push(g('よく使う文', P.hyoka_a)); break;
      case 'kanten_name': groups.push(g('観点', KN)); break;
      case 'eval_lesson': {
        const rk = target.rowKanten || '';
        const ks = /知/.test(rk) ? ['chi'] : /思/.test(rk) ? ['shi'] : /態|主体/.test(rk) ? ['tai'] : ['chi', 'shi', 'tai'];
        if (u) groups.push(g(unitLabel, ks.flatMap((k) => u.ev[k].map((t) => ({ t, sub: SD.KNAME[k] })))));
        groups.push(g('よく使う文', ['〇〇の意味を理解している。', '〇〇を正しく求めることができる。', '既習事項と関連付けて、〇〇の方法を考え説明している。', '〇〇について粘り強く考え、解決しようとしている。']));
        break;
      }
      case 'eval_all':
        if (u) groups.push(g(unitLabel, ['chi', 'shi', 'tai'].flatMap((k) => u.ev[k].map((t) => `【${SD.KSHORT[k]}】${t}`))));
        break;
      case 'plan_naiyo':
        if (u) groups.push(g(unitLabel, u.plan.map((r) => r[0])));
        if (navi.length) groups.push(g('授業ナビの各時間', navi.map((l) => ({ t: l.title, sub: `第${l.no}時` }))));
        break;
      case 'plan_nerai':
        if (navi.length) groups.push(g('授業ナビの各時間のねらい', navi.map((l) => ({ t: SD.navi.goalOf(l), sub: `第${l.no}時` }))));
        groups.push(g('よく使う文', ['〇〇の意味を理解する。', '〇〇の方法を考え、説明する。', '〇〇を具体的な場面で活用する。', '学習を振り返り、単元のまとめをする。']));
        break;
      case 'katsudo':
        if (cur) groups.push(g(`授業ナビ 第${cur.no}時`, cur.flow.map((f) => SD.navi.toStudentVoice(f.head))));
        groups.push(...byPhase(P.katsudo, grp));
        break;
      case 'naiyo': groups.push(...byPhase(P.naiyo, grp)); break;
      case 'hatsumon':
        if (cur) groups.push(g(`授業ナビ 第${cur.no}時`, cur.flow.flatMap((f) => f.q || [])));
        groups.push(...byPhase(P.hatsumon, grp).slice(0, 1));
        if (tz.length) groups.push(g('つまずきに気付かせる発問（躓きDB）', tz.map((z) => ({ t: z.q, sub: `${z.t}` }))));
        groups.push(...byPhase(P.hatsumon, grp).slice(1));
        break;
      case 'hanno':
        groups.push(...byPhase(P.hanno, grp).slice(0, 1));
        if (tz.length) groups.push(g('予想される誤答（躓きDB）', tz.map((z) => ({ t: `（誤答）${z.ex}`, sub: z.bug }))));
        groups.push(...byPhase(P.hanno, grp).slice(1));
        break;
      case 'ryuiten': case 'shien':
        groups.push(...byPhase(P[target.bank], grp).slice(0, 1));
        if (tz.length) groups.push(g('つまずきへの手立て（躓きDB）', tz.map((z) => ({ t: `「${z.bug.replace(/（.*?）/g, '')}」と考えている生徒には、「${z.q}」と問いかける。`, sub: z.ex }))));
        groups.push(...byPhase(P[target.bank], grp).slice(1));
        break;
      case 'hyoka':
        if (u) {
          const fmt = (k, how) => (t) => `${t}【${SD.KSHORT[k]}】（${how}）`;
          groups.push(g(`${unitLabel}の評価規準から`, [...evItems('chi', fmt('chi', 'ノート・適用問題')), ...evItems('shi', fmt('shi', '発言・ノート')), ...evItems('tai', fmt('tai', '行動観察・振り返り'))]));
        }
        groups.push(g('よく使う文', P.hyoka));
        break;
      default: break;
    }
    return groups.filter((x) => x.items.length);
  };

  // 文例の中の 〇〇 を題材（なければ単元名）に
  SD.fillPh = (plan, t) => {
    const w = plan.meta.topic || plan.meta.unit;
    return w ? String(t).replace(/〇〇/g, w) : String(t);
  };

  SD.bankTitle = (bank) => ({
    tangenkan: '単元観の文例', seitokan: '生徒観の文例', shidokan: '指導観の文例', kenkyu: '研究主題との関わりの文例', goal_unit: '単元の目標',
    eval_chi: '評価規準（知識・技能）', eval_shi: '評価規準（思考・判断・表現）', eval_tai: '評価規準（主体的に学習に取り組む態度）',
    goal_lesson: '本時の目標の文例', meate: 'めあて・まとめ', board: '板書に書くこと', junbi: '準備物', mondai: '本時で扱う問題', tsumazuki: 'つまずきと手立て',
    hairyo: '個別の配慮・支援', ict: 'ICTの活用', keitai: '学習形態', hoho: '評価方法', hyoka_c: '努力を要する生徒への手立て', hyoka_a: '十分満足できる状況',
    kanten_name: '観点', eval_lesson: '評価規準', eval_all: '評価規準', plan_naiyo: '学習内容', plan_nerai: 'ねらい・学習活動',
    katsudo: '学習活動', naiyo: '学習内容', hatsumon: '主な発問', hanno: '予想される生徒の反応', ryuiten: '指導上の留意点', shien: '教師の支援・手立て', hyoka: '評価',
  }[bank] || '文例');
})();
