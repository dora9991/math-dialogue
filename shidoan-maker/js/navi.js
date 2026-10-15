/* 指導案メーカー：中1 授業ナビ（lesson-navi）のデータがとなりのフォルダにあれば、本時の下書きに使う。
   授業ナビのデータは自分のPCで使うためのもの（公開しない）。ないときはこの機能を出さない。 */
(function () {
  const SD = window.SD;
  const U = SD.U;
  const N = SD.navi = { ok: false, loading: null, LDB: null };
  const BASE = '../lesson-navi/data/';
  const FILES = ['units.js', 'k1_seifu.js', 'k1_moji.js', 'k1_hou.js', 'k2_hirei.js', 'k2_heimen.js', 'k2_kukan.js', 'k2_data.js'];

  const loadScript = (src) => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = () => res(); s.onerror = () => rej(new Error(src));
    document.head.append(s);
  });
  const isLocal = () => location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || /\.local$/.test(location.hostname);

  N.load = () => {
    if (N.loading) return N.loading;
    N.loading = (async () => {
      if (!isLocal()) return false;
      try {
        await loadScript(BASE + 'books.js');
        for (const f of FILES) await loadScript(BASE + f);
        N.LDB = window.LDB;
        N.ok = !!(N.LDB && N.LDB.lessons && N.LDB.lessons.length);
      } catch (e) { N.ok = false; }
      return N.ok;
    })();
    return N.loading;
  };

  N.lessonsFor = (unitName) => {
    const u = SD.unitByName(unitName);
    if (!N.ok || !u || !u.navi) return [];
    return N.LDB.lessons.filter((l) => l.unit === u.navi).sort((a, b) => a.no - b.no);
  };
  // 目標を「文と観点」に分ける。例：'〜計算をする。（知・技）〜考察し表現する。（思・判・表）' → 2つ
  N.goalParts = (l) => {
    const src = String(l.goal || '');
    const out = [];
    const re = /([^（）]+?)（(知・技|思・判・表|主体的[^）]*|態度)）/g;
    let m; let last = 0;
    while ((m = re.exec(src))) { out.push({ t: m[1].trim(), k: /知/.test(m[2]) ? 'chi' : /思/.test(m[2]) ? 'shi' : 'tai' }); last = re.lastIndex; }
    const rest = src.slice(last).trim();
    if (rest) out.push({ t: rest, k: '' });
    return out.filter((x) => x.t);
  };
  N.goalOf = (l) => N.goalParts(l).map((x) => x.t).join('');
  // 目標の文（〜する。）を評価規準の文末（〜している。／〜することができる。）に
  N.toKijun = (g) => {
    const s = String(g || '').trim();
    if (/理解する。$/.test(s)) return s.replace(/理解する。$/, '理解している。');
    if (/知る。$/.test(s)) return s.replace(/知る。$/, '知っている。');
    if (/(考察し表現|説明|判断)する。$/.test(s)) return s.replace(/する。$/, 'することができる。');
    if (/する。$/.test(s)) return s.replace(/する。$/, 'することができる。');
    if (/[うくぐすつぬぶむる]。$/.test(s)) return s.replace(/。$/, 'ことができる。');
    return s;
  };
  N.kantenOf = (l) => [...new Set(N.goalParts(l).map((x) => x.k).filter(Boolean))];
  N.stageToPhase = (st) => (/^端緒/.test(st) ? '導入' : /^振り返り/.test(st) ? 'まとめ' : '展開');

  // 「〜させる」（先生の目線）を「〜する」（生徒の目線）に。うまくいかない形はそのまま。
  const ICHI = 'えけせてねへめれげぜでべぺいきしちにひみりぎじびぴ';
  const A2U = { か: 'く', が: 'ぐ', さ: 'す', た: 'つ', な: 'ぬ', ば: 'ぶ', ま: 'む', ら: 'る', わ: 'う' };
  const A2I = { か: 'き', が: 'ぎ', さ: 'し', た: 'ち', な: 'に', ば: 'び', ま: 'み', ら: 'り', わ: 'い' };
  const SAHEN = ['解決', '説明', '発表', '確認', '検討', '比較', '練習', '整理', '考察', '交流', '共有', '予想', '発見', '理解', '作図', '計算', '証明'];
  N.toStudentVoice = (src) => {
    let s = String(src || '').trim();
    s = s.replace(/([をに])させ(る|、|て)/g, (m, p, e) => `${p}${e === 'る' ? 'する' : e === '、' ? 'し、' : 'して'}`);
    s = s.replace(/(\p{Script=Han}{2,})させ(る|、|て)/gu, (m, k, e) => `${k}${e === 'る' ? 'する' : e === '、' ? 'し、' : 'して'}`);
    s = s.replace(new RegExp(`([${ICHI}])させ(る|、|て)`, 'g'), (m, k, e) => `${k}${e === 'る' ? 'る' : e === '、' ? '、' : 'て'}`);
    s = s.replace(/(\p{Script=Han})させ(る|、|て)/gu, (m, k, e) => `${k}${e === 'る' ? 'す' : e === '、' ? 'し、' : 'して'}`);
    s = s.replace(/([かがさたなばまらわ])せ(る|、)/g, (m, k, e) => (e === 'る' ? A2U[k] : A2I[k] + '、'));
    s = s.replace(/を伝える$/, 'を知る');
    if (SAHEN.some((w) => new RegExp(`[をにで]\\p{Script=Han}*${w}$`, 'u').test(s))) s += 'する';
    if (!/[。？?！!）)]$/.test(s)) s += '。';
    return s;
  };

  // 本時の下書きを入れる
  N.applyLesson = (plan, l, overwrite = true) => {
    plan.meta.topic = N.topicOf(l);
    plan.meta.lessonNo = l.no;
    const parts = N.goalParts(l);
    const HOHO = { chi: 'ノート・適用問題', shi: 'ノート・発言', tai: '行動観察・振り返りシート' };
    for (const s of SD.secs(plan, 'honji_goal')) if (overwrite || !s.items.some(U.nonEmpty)) s.items = parts.length ? parts.map((x) => x.t) : SD.lessonGoalsFor(plan).slice(0, 1);
    for (const s of SD.secs(plan, 'honji_kadai')) if (overwrite || !U.nonEmpty(s.text)) s.text = l.title + (/[。？?！!]$/.test(l.title) ? '' : '。');
    for (const s of SD.secs(plan, 'mondai')) if (overwrite || !s.items.some(U.nonEmpty)) s.items = (l.problems || []).map((p) => `${p.l}　${p.t}`);
    const u = SD.unitByName(plan.meta.unit);
    const ks = N.kantenOf(l);
    for (const s of SD.secs(plan, 'honji_eval')) {
      if (!(overwrite || !s.rows.some((r) => U.nonEmpty(r.f.h_kijun)))) continue;
      const withK = parts.filter((x) => x.k);
      s.rows = (withK.length ? withK : [{ t: parts.map((x) => x.t).join(''), k: 'chi' }]).map((x) => SD.makeRow({
        h_kanten: SD.KNAME[x.k], h_kijun: N.toKijun(x.t), h_hoho: HOHO[x.k], h_c: SD.phrases.hyoka_c[x.k === 'shi' ? 0 : 1],
      }));
      if (u && !ks.includes('tai')) s.rows.push(SD.makeRow({ h_kanten: SD.KNAME.tai, h_kijun: u.ev.tai[0], h_hoho: HOHO.tai, h_c: SD.phrases.hyoka_c[5] }));
    }
    for (const s of SD.secs(plan, 'board')) {
      if (!(overwrite || !s.parts.some((p) => U.nonEmpty(p.text)))) continue;
      const pr = (l.problems || [])[0];
      const parts = [
        [`めあて　${l.title}`, pr ? `${pr.l}　${pr.t}` : ''].filter(Boolean).join('\n'),
        (l.flow || []).flatMap((f) => (f.q || []).slice(0, 1)).slice(0, 3).map((q) => `・${q}`).join('\n'),
        [l.matome ? `まとめ　${l.matome}` : '', ...(l.problems || []).slice(1, 2).map((p) => `${p.l}　${p.t}`)].filter(Boolean).join('\n'),
      ];
      s.parts.forEach((p, i) => { p.text = parts[i] != null ? parts[i] : ''; });
    }
    // 展開：授業ナビの流れを行に
    for (const s of SD.secs(plan, 'tenkai')) {
      const flow = (l.flow || []).filter((f) => f.st !== '（以下）');
      if (!flow.length) continue;
      const phases = flow.map((f) => N.stageToPhase(f.st));
      const total = U.num(plan.meta.minutes, 50) || 50;
      const base = phases.map((p) => (p === '導入' ? 8 : p === 'まとめ' ? 8 : 16));
      const mins = SD.scaleMinutes(base, total);
      // 評価の場面：思考は展開の最後の行（考えの共有）、知識・技能はいちばん最後の行（適用問題）
      const lastTenkai = phases.lastIndexOf('展開');
      const at = (k) => (k === 'shi' && lastTenkai >= 0 ? lastTenkai : flow.length - 1);
      const evs = {};
      parts.filter((x) => x.k).forEach((x) => { const i = at(x.k); (evs[i] = evs[i] || []).push(`${N.toKijun(x.t)}【${SD.KSHORT[x.k]}】（${x.k === 'shi' ? '発言・ノート' : '適用問題'}）`); });
      s.rows = flow.map((f, i) => {
        const pr = (f.p || []).map((pi) => (l.problems || [])[pi]).filter(Boolean);
        const katsudo = [N.toStudentVoice(f.head), ...pr.map((p) => `【${p.l}】${p.t}`)].join('\n');
        return SD.makeRow({
          katsudo, hatsumon: (f.q || []).join('\n'), ryuiten: f.tx || '', shien: f.tx || '', hyoka: (evs[i] || []).join('\n'),
        }, { phase: phases[i], min: mins[i] });
      });
    }
  };

  // 指導計画を「1時間1行」にする（学習内容＝小見出し、ねらい＝その時間の課題）
  N.topicOf = (l) => { const sub = String(l.sub || '').split('／'); return (sub[1] || sub[0] || l.title).trim(); };
  N.planRows = (unitName) => N.lessonsFor(unitName).map((l) => {
    const parts = N.goalParts(l).filter((x) => x.k);
    const ks = parts.map((x) => x.k);
    const hoho = [...new Set(ks.flatMap((k) => (k === 'shi' ? ['ノート', '発言'] : k === 'tai' ? ['行動観察'] : ['ノート', '小テスト'])))].join('・');
    return SD.makeRow({
      p_naiyo: N.topicOf(l), p_nerai: l.title + (/[。？?！!]$/.test(l.title) ? '' : '。'),
      p_kijun: parts.map((x) => `【${SD.KSHORT[x.k]}】${N.toKijun(x.t)}`).join('\n'), p_hoho: hoho,
      chi: ks.includes('chi') ? '○' : '', shi: ks.includes('shi') ? '○' : '', tai: ks.includes('tai') ? '○' : '',
    }, { hours: 1 });
  });
  // 指導計画の時数が授業ナビとちがうときは、授業ナビの1時間1行にそろえる（本時の番号をそろえるため）
  N.alignPlan = (plan) => {
    const rows = N.planRows(plan.meta.unit);
    if (!rows.length) return false;
    let changed = false;
    for (const s of SD.secs(plan, 'plan')) {
      const total = SD.planRanges(s).reduce((a, x) => a + x.h, 0);
      if (total === rows.length && s.rows.length === rows.length) continue;
      s.rows = U.clone(rows).map((r) => Object.assign(r, { id: U.uid() }));
      changed = true;
    }
    plan.meta.totalHours = rows.length;
    return changed;
  };
})();
