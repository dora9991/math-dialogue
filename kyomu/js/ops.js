/* 時間割を変える操作：入れ替え・変更・学年（全校）でまとめる・元に戻す。
   週の時間割の操作は、必ず記録（log）を残す。記録の文は「出張等」の欄にも出る。 */
(function () {
  const K = window.K;
  const u = K.u;
  const m = K.m;
  const ops = (K.ops = {});

  const slotMark = (s) => (s === 'am' ? '朝' : s === 'pm' ? '帰' : u.circled(s));

  // 手で変えた中身を書く（元と同じになったら、手で変えた印を消す）
  function writeOvr(st, d, s, c, t, extra) {
    const key = m.ck(d, s, c);
    const under = m.under(d, s, c);
    const e = extra || {};
    if (t === under.t && !e.m) delete st.ovr[key];
    else st.ovr[key] = Object.assign({ t }, e.m ? { m: e.m } : {}, e.mk ? { mk: e.mk } : {});
  }

  /* ---------- 記録の文 ---------- */
  ops.noteTexts = (en) => {
    if (en.kind === 'swap') {
      const a = en.a;
      const b = en.b;
      if (a.c !== b.c) {
        const t = `${a.c}${a.from}⇄${b.c}${b.from}`;
        return a.d === b.d && a.s === b.s ? [{ d: a.d, s: a.s, text: t }] : [{ d: a.d, s: a.s, text: t }, { d: b.d, s: b.s, text: t }];
      }
      if (a.d === b.d) return [{ d: a.d, s: a.s, text: `${a.c} ${slotMark(a.s)}${a.to}・${slotMark(b.s)}${b.to}入替` }];
      return [
        { d: a.d, s: a.s, text: `${a.c}${a.to}は${m.dateWord(b.d, a.d)}分` },
        { d: b.d, s: b.s, text: `${b.c}${b.to}は${m.dateWord(a.d, b.d)}分` },
      ];
    }
    if (en.kind === 'set') {
      // 同じ日・同じ時間・同じ中身はまとめて1行に（1-1・1-2国は…）
      const groups = {};
      en.cells.forEach((x) => {
        const k = `${x.d}|${x.s}|${x.to}|${x.from}`;
        (groups[k] = groups[k] || []).push(x);
      });
      return Object.values(groups).map((list) => {
        const x = list[0];
        const who = list.map((y) => y.c).join('・');
        let text;
        if (en.why === 'adjust') text = `${who}${x.to}は時間数調整`;
        else if (en.why === 'makeup' && en.src) text = `${who}${x.to}は${m.dateWord(en.src, x.d)}分`;
        else if (en.why === 'self') text = `${who}${x.from || ''}→自習`;
        else if (en.why === 'text') text = en.text || '';
        else if (en.why === 'none') text = '';
        else text = `${who}${x.from || '（空き）'}→${x.to || '（空き）'}`;
        return { d: x.d, s: x.s, text };
      });
    }
    if (en.kind === 'merge') return en.text ? [{ d: en.d, s: en.s, text: en.text }] : [];
    return [];
  };
  ops.entryNotes = (en) => (en.hideNote ? [] : en.notes || ops.noteTexts(en));

  // 記録をひとことで（右の一覧に出す文）
  ops.describe = (en) => {
    const at = (x) => `${u.mdw(x.d)}${slotMark(x.s)}`;
    if (en.kind === 'swap') return `${at(en.a)} ${en.a.c} ${en.a.from || '空き'} ⇄ ${at(en.b)} ${en.b.c} ${en.b.from || '空き'}`;
    if (en.kind === 'set') {
      const x = en.cells[0];
      const who = [...new Set(en.cells.map((y) => y.c))].join('・');
      const more = en.cells.length > 1 && new Set(en.cells.map((y) => y.d + y.s)).size > 1 ? ` ほか${en.cells.length - 1}コマ` : '';
      return `${at(x)} ${who} ${x.from || '空き'} → ${x.to || '空き'}${more}`;
    }
    if (en.kind === 'merge') return `${u.mdw(en.d)}${slotMark(en.s)} ${en.cls.join('・')} を「${en.t}」でまとめる`;
    if (en.kind === 'unmerge') return `${u.mdw(en.d)}${slotMark(en.s)} まとめを解除`;
    return en.kind;
  };
  ops.weekOf = (en) => {
    const d = en.kind === 'swap' ? en.a.d : en.kind === 'set' ? en.cells[0].d : en.d;
    return u.monday(d);
  };
  ops.touches = (en, mon) => {
    const end = u.add(mon, 6);
    const ds = en.kind === 'swap' ? [en.a.d, en.b.d] : en.kind === 'set' ? en.cells.map((x) => x.d) : [en.d];
    return ds.some((d) => d >= mon && d <= end);
  };

  /* ---------- 週の操作 ---------- */
  ops.swap = (a, b) => {
    const ra = m.cell(a.d, a.s, a.c);
    const rb = m.cell(b.d, b.s, b.c);
    return K.store.commit('入れ替え', (st) => {
      writeOvr(st, a.d, a.s, a.c, rb.t, { mk: 'y' });
      writeOvr(st, b.d, b.s, b.c, ra.t, { mk: 'y' });
      const en = { id: u.uid(), ts: Date.now(), kind: 'swap', a: { d: a.d, s: a.s, c: a.c, from: ra.t, to: rb.t }, b: { d: b.d, s: b.s, c: b.c, from: rb.t, to: ra.t } };
      en.notes = ops.noteTexts(en);
      st.log.push(en);
      return en;
    });
  };

  // cells: [{d,s,c}]、opt: {why, src, text, mk}
  ops.set = (cells, t, opt) => {
    const o = opt || {};
    const list = cells.map((x) => ({ d: x.d, s: x.s, c: x.c, from: m.cell(x.d, x.s, x.c).t, to: t }));
    return K.store.commit('授業の変更', (st) => {
      list.forEach((x) => writeOvr(st, x.d, x.s, x.c, t, { mk: o.mk || 'o' }));
      const en = { id: u.uid(), ts: Date.now(), kind: 'set', cells: list, why: o.why || '', src: o.src || '', text: o.text || '' };
      en.notes = ops.noteTexts(en);
      st.log.push(en);
      return en;
    });
  };

  // 学年・全校でまとめる（1くくりの枠にする）
  ops.merge = (d, s, cls, t, opt) => {
    const o = opt || {};
    const key = 'b' + u.uid();
    return K.store.commit('まとめる', (st) => {
      cls.forEach((c) => (st.ovr[m.ck(d, s, c)] = { t, m: key }));
      const en = { id: u.uid(), ts: Date.now(), kind: 'merge', d, s, cls: cls.slice(), t, text: o.text || '' };
      en.notes = ops.noteTexts(en);
      st.log.push(en);
    });
  };
  ops.unmerge = (d, s, cls) =>
    K.store.commit('まとめを解除', (st) => {
      cls.forEach((c) => {
        const key = m.ck(d, s, c);
        const o = st.ovr[key];
        const under = m.under(d, s, c);
        if (o) {
          if ((o.t || '') === under.t && !o.mk) delete st.ovr[key];
          else st.ovr[key] = { t: o.t || '', mk: o.mk || '' };
        } else if (under.m) {
          st.ovr[key] = { t: under.t };
        }
      });
    });

  // コマの色（黄・橙・青・緑・なし）
  ops.mark = (cells, mk) =>
    K.store.commit('色をつける', (st) => {
      cells.forEach((x) => {
        const key = m.ck(x.d, x.s, x.c);
        const r = m.cell(x.d, x.s, x.c);
        const o = st.ovr[key] || { t: r.t, m: r.m };
        if (mk) o.mk = mk;
        else ['mk', 'bg', 'b', 'red'].forEach((k) => delete o[k]);
        if (!o.mk && !o.m && !o.bg && !o.b && !o.red && (o.t || '') === m.under(x.d, x.s, x.c).t) delete st.ovr[key];
        else st.ovr[key] = o;
      });
    });

  // 基本の時間割に戻す
  ops.reset = (cells) =>
    K.store.commit('基本に戻す', (st) => {
      cells.forEach((x) => delete st.ovr[m.ck(x.d, x.s, x.c)]);
    });

  // 記録を取り消す（変更そのものを戻す）
  ops.revert = (id) => {
    const en = m.st.log.find((x) => x.id === id);
    if (!en) return false;
    const cells = en.kind === 'swap' ? [en.a, en.b] : en.kind === 'set' ? en.cells : [];
    const moved = cells.filter((x) => m.cell(x.d, x.s, x.c).t !== x.to);
    if (moved.length) {
      u.toast('そのあと同じコマがさらに変わっているので、自動では戻せません。記録だけ消すか、手で直してください。', 5000);
      return false;
    }
    K.store.commit('記録を取り消す', (st) => {
      cells.forEach((x) => writeOvr(st, x.d, x.s, x.c, x.from, {}));
      if (en.kind === 'merge') en.cls.forEach((c) => delete st.ovr[m.ck(en.d, en.s, c)]);
      st.log = st.log.filter((x) => x.id !== id);
    });
    return true;
  };
  ops.dropLog = (id) =>
    K.store.commit('記録を消す', (st) => {
      st.log = st.log.filter((x) => x.id !== id);
    });
  ops.editNote = (id, notes) =>
    K.store.commit('記録の文を直す', (st) => {
      const en = st.log.find((x) => x.id === id);
      if (en) en.notes = notes;
    });

  /* ---------- 基本時間割の操作 ---------- */
  ops.baseSet = (termId, cells, t) =>
    K.store.commit('基本時間割を変える', (st) => {
      const b = m.base(termId);
      cells.forEach((x) => {
        const k = `${x.wd}|${x.s}|${x.c}`;
        if (!t) delete b.cells[k];
        else b.cells[k] = { t };
      });
    });
  ops.baseSwap = (termId, a, b) =>
    K.store.commit('基本時間割の入れ替え', (st) => {
      const bs = m.base(termId);
      const ka = `${a.wd}|${a.s}|${a.c}`;
      const kb = `${b.wd}|${b.s}|${b.c}`;
      const va = bs.cells[ka] ? { t: bs.cells[ka].t } : null;
      const vb = bs.cells[kb] ? { t: bs.cells[kb].t } : null;
      if (vb && vb.t) bs.cells[ka] = vb;
      else delete bs.cells[ka];
      if (va && va.t) bs.cells[kb] = va;
      else delete bs.cells[kb];
    });
  ops.baseMerge = (termId, wd, s, cls, t) =>
    K.store.commit('基本時間割でまとめる', (st) => {
      const key = 'b' + u.uid();
      const b = m.base(termId);
      cls.forEach((c) => (b.cells[`${wd}|${s}|${c}`] = { t, m: key }));
    });
  ops.baseUnmerge = (termId, wd, s, cls) =>
    K.store.commit('基本時間割のまとめを解除', (st) => {
      const b = m.base(termId);
      cls.forEach((c) => {
        const x = b.cells[`${wd}|${s}|${c}`];
        if (x) delete x.m;
      });
    });
})();
