/* 今の Excel（週行事のシート）を読み取って、このアプリのデータに入れる。
   シートの形：上から「第○週」、「日｜行事｜時間割｜出張等」、その下に 月〜金 のかたまり（クラス名の行＋C・1〜6・C）、土・日。
   画面の部分（ファイルを選ぶ・どれを入れるか選ぶ）は views/import.js。 */
(function () {
  const K = window.K;
  const u = K.u;
  const m = K.m;
  const I = (K.imp = {});

  const N = (v) => (v == null ? '' : typeof v === 'number' ? String(v) : u.norm(v));
  const classLabel = (v) => {
    const mm = /^([1-9])\s*[・･.\-－ー]\s*([1-9])$/.exec(N(v));
    return mm ? `${mm[1]}-${mm[2]}` : null;
  };
  const WDS = '日月火水木金土';
  const clean = (v) => {
    if (v == null || v === true || v === false) return '';
    if (typeof v === 'number') return v === 0 ? '' : String(v);
    const t = String(v).replace(/\r/g, '').trim();
    if (!t || t === '0' || /^#(REF|N\/A|VALUE|DIV\/0|NAME)/.test(t)) return '';
    return t;
  };
  const oneLine = (t) => t.replace(/\s*\n\s*/g, ' ').trim();
  const lines2 = (t) => t.split('\n').map((x) => x.trim()).filter(Boolean).join('\n'); // 改行は残す（行事欄では次の行へ）

  // 和暦の年（R8 → 2026）。見つからなければ null
  I.eraYear = (s) => {
    const mm = /(?:R|Ｒ|令和)\s*([0-9０-９]{1,2})/.exec(s || '');
    return mm ? 2018 + Number(u.norm(mm[1])) : null;
  };

  /* ---------- 1 枚のシートを読み取る ---------- */
  I.parseSheet = (sh) => {
    // クラス名の行を探す
    // クラス名の行をぜんぶ見て、クラスの列を決める（第1週のように一部のクラス名がない行もあるため）
    let headRow = 0;
    const colId = {};
    for (let r = 1; r <= 70; r++) {
      const cols = [];
      for (let c = 2; c <= 40; c++) {
        const id = classLabel(sh.get(r, c));
        if (id) cols.push({ c, id });
      }
      if (cols.length >= 2) {
        if (!headRow) headRow = r;
        cols.forEach((x) => colId[x.c] || (colId[x.c] = x.id));
      }
    }
    if (!headRow) return null;
    // 左のかたまり（最初の連続した列）だけ使う（右に同じ表の写しがあるため）
    const all = Object.keys(colId).map(Number).sort((a, b) => a - b);
    const classCols = [{ c: all[0], id: colId[all[0]] }];
    for (let i = 1; i < all.length && all[i] === all[i - 1] + 1; i++) classCols.push({ c: all[i], id: colId[all[i]] });
    const c0 = classCols[0].c;
    const cN = classCols[classCols.length - 1].c;
    const labCol = c0 - 1;
    const stCol = cN + 1;
    const memoCol = cN + 2;
    const isHead = (r) => classCols.filter((x) => classLabel(sh.get(r, x.c)) === x.id).length >= 2;
    const evText = (r) => {
      for (let c = 2; c < labCol; c++) {
        const t = clean(sh.get(r, c));
        if (t) return lines2(t);
      }
      return '';
    };
    // 太字・赤字（Excel の文字の書式）
    const isRed = (hex) => {
      if (!hex) return false;
      const [R, G, B] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
      return R > 180 && G < 90 && B < 90;
    };
    const evFmt = (r) => {
      for (let c = 2; c < labCol; c++) {
        if (clean(sh.get(r, c))) {
          const f = sh.font ? sh.font(r, c) : null;
          return f ? { b: !!f.b, red: isRed(f.color), big: f.sz >= 11.5 } : null;
        }
      }
      return null;
    };
    const cellFmt = (r, c) => {
      const f = sh.font ? sh.font(r, c) : null;
      return f ? { b: !!f.b, red: isRed(f.color), big: f.sz >= 11.5 } : null;
    };

    // 平日のかたまり
    const blocks = [];
    let cur = null;
    let r = headRow;
    for (; r <= sh.maxRow; r++) {
      if (isHead(r)) {
        cur = { rows: [{ r, slot: null }] };
        blocks.push(cur);
        continue;
      }
      if (!cur) continue;
      const lab = N(sh.get(r, labCol)).toUpperCase();
      let slot = null;
      if (/^[1-9]$/.test(lab)) slot = lab;
      else if (lab === 'C') slot = 'C';
      if (!slot) {
        // 校時の数字がない行：短縮日課の日の下の行（行事欄に文字があることがある）なら、その日の行として残す。
        // 1日ぶん（9行）をこえたら、その日のかたまりはここまで（休みの日はクラス名の行が省かれていることがある）
        if (cur.rows.some((x) => x.slot)) {
          if (cur.rows.length < 9 && !cur.closed) {
            cur.rows.push({ r, slot: null });
            continue;
          }
          if (blocks.length >= 5) break;
          cur.closed = true;
        }
        continue;
      }
      const hasPm = cur.rows.some((x) => x.slot === 'pm');
      const trailing = cur.rows.length > 1 && !cur.rows[cur.rows.length - 1].slot && cur.rows.some((x) => x.slot);
      if (cur.closed || trailing || (slot === 'C' && hasPm)) {
        cur = { rows: [{ r: r - 1, slot: null }] };
        blocks.push(cur);
      }
      if (slot === 'C') slot = cur.rows.some((x) => x.slot && x.slot !== 'am') ? 'pm' : 'am';
      cur.rows.push({ r, slot });
    }
    const endRow = r;

    // 1 つのかたまりの日付（A 列：月・／・日・曜日）
    const dateOf = (r1, r2) => {
      const nums = [];
      let wd = null;
      for (let i = r1; i <= r2; i++) {
        const v = sh.get(i, 1);
        if (typeof v === 'number' && v > 0) nums.push(v);
        else if (typeof v === 'string') {
          const t = N(v);
          if (t.length === 1 && WDS.includes(t)) wd = WDS.indexOf(t);
          else if (/^\d+$/.test(t) && Number(t) > 0) nums.push(Number(t));
        }
      }
      return { month: nums[0] || null, day: nums[1] || null, wd };
    };

    // 結合セル（クラスの列の中だけ）。何行にもまたがるものは、いちばん上の行に文字を入れ、下の行は空のまま結合にする
    const merges = sh.merges.filter((g) => g.c1 >= c0 && g.c2 <= cN && (g.c2 > g.c1 || g.r2 > g.r1));
    const mergeAt = (rr, c) => merges.find((g) => rr >= g.r1 && rr <= g.r2 && c >= g.c1 && c <= g.c2);

    const days = blocks.slice(0, 7).map((b, bi) => {
      const r1 = b.rows[0].r;
      const r2 = b.rows[b.rows.length - 1].r;
      const dt = dateOf(r1, r2);
      const rows = b.rows.map((x, i) => {
        const rr = x.r;
        const vals = {};
        const marks = {};
        if (x.slot)
          classCols.forEach(({ c, id }) => {
            const g = mergeAt(rr, c);
            const t = clean(g ? (rr === g.r1 ? sh.get(g.r1, g.c1) : '') : sh.get(rr, c));
            const f = sh.fill(rr, c);
            const ft = cellFmt(rr, c);
            vals[id] = { t: g && g.r2 > g.r1 ? lines2(t) : oneLine(t), m: g && (g.c2 > g.c1 || g.r2 > g.r1) ? `x${g.r1}_${g.c1}` : '' };
            if ((f && f !== 'FFFFFF') || (ft && (ft.b || ft.red))) marks[id] = { bg: f && f !== 'FFFFFF' ? '#' + f : '', b: !!(ft && ft.b), red: !!(ft && ft.red) };
          });
        return { i, slot: x.slot, vals, marks, slotFill: x.slot ? sh.fill(rr, labCol) : '', ev: evText(rr), evf: evFmt(rr), st: oneLine(clean(sh.get(rr, stCol))), stf: cellFmt(rr, stCol), memo: oneLine(clean(sh.get(rr, memoCol))) };
      });
      return { index: bi, month: dt.month, day: dt.day, wd: dt.wd != null ? dt.wd : bi + 1, rows };
    });

    // 土・日（A 列の「土」「日」から上へ 3 行がはじまり）
    const weekend = [];
    for (let rr = endRow; rr <= Math.min(sh.maxRow, endRow + 20); rr++) {
      const t = N(sh.get(rr, 1));
      if (t === '土' || t === '日') {
        const start = rr - 3;
        const len = t === '土' ? 6 : 4;
        const dt = dateOf(start, rr);
        const lines = {};
        const linesF = {};
        for (let i = 0; i < len; i++) {
          const e = evText(start + i);
          if (e) {
            lines[i] = e;
            linesF[i] = evFmt(start + i);
          }
        }
        const st = {};
        const stF = {};
        for (let i = 0; i < len; i++) {
          const e = oneLine(clean(sh.get(start + i, stCol)));
          if (e) {
            st[i] = e;
            stF[i] = cellFmt(start + i, stCol);
          }
        }
        // 土日に時間割（校時の数字のある行）があれば、授業日として読む
        const slotRows = [];
        for (let i = 0; i < len; i++) {
          const lab = N(sh.get(start + i, labCol)).toUpperCase();
          if (!/^[1-9]$/.test(lab)) continue;
          const vals = {};
          const marks = {};
          classCols.forEach(({ c, id }) => {
            const g = mergeAt(start + i, c);
            const tv = clean(g ? (start + i === g.r1 ? sh.get(g.r1, g.c1) : '') : sh.get(start + i, c));
            vals[id] = { t: oneLine(tv), m: g && (g.c2 > g.c1 || g.r2 > g.r1) ? `x${g.r1}_${g.c1}` : '' };
            const f = sh.fill(start + i, c);
            const ft = cellFmt(start + i, c);
            if ((f && f !== 'FFFFFF') || (ft && (ft.b || ft.red))) marks[id] = { bg: f && f !== 'FFFFFF' ? '#' + f : '', b: !!(ft && ft.b), red: !!(ft && ft.red) };
          });
          if (Object.values(vals).some((v) => v.t)) slotRows.push({ i, slot: lab, vals, marks, ev: '', st: '' });
        }
        // 土日の時間割の欄に書いた文字（「裏面 26週 確定」など）は枠にする
        const notes = [];
        for (let i = 0; i < len; i++)
          for (let c = c0; c <= cN; c++) {
            if (slotRows.some((x) => x.i === i)) continue;
            const v = clean(sh.get(start + i, c));
            if (!v) continue;
            const g = sh.merges.find((x) => x.r1 === start + i && x.c1 === c) || { r1: start + i, c1: c, r2: start + i, c2: c };
            const f = cellFmt(start + i, c) || {};
            const fillHex = sh.fill(start + i, c);
            notes.push({ text: lines2(v), c0: g.c1 - 1, co0: 0, r0: g.r1 - 1, ro0: 0, c1: g.c2, co1: 0, r1: g.r2, ro1: 0, shape: 'rect', fill: fillHex ? '#' + fillHex : 'transparent', line: 'transparent', lw: 0, color: f.red ? '#FF0000' : '#000000', size: 11, bold: !!f.b, anchor: 'ctr', align: 'center' });
          }
        weekend.push({ wd: t === '土' ? 6 : 0, month: dt.month, day: dt.day, lines, st, linesF, stF, notes, slotRows });
      }
    }

    // 見出し：週の番号・題・学校名
    let weekNo = null;
    let title = '';
    let school = '';
    for (let c = 1; c <= 4; c++) {
      const v = sh.get(1, c);
      if (typeof v === 'number' && weekNo == null) weekNo = v;
      if (typeof v === 'string' && /週/.test(v) && !title) title = v;
    }
    for (let c = 4; c <= cN; c++) {
      const v = sh.get(1, c);
      if (typeof v === 'string' && /学校|中学|高校|小学/.test(v)) school = u.norm(v);
    }
    let label = '';
    const tm = /事[\s\u3000]*([\s\S]*)$/.exec(title || '');
    if (tm) label = tm[1].trim();

    // 教科の一覧（下のほうの数える表）
    const subjects = [];
    for (let rr = endRow; rr <= sh.maxRow; rr++) {
      const v = clean(sh.get(rr, labCol));
      const n = sh.get(rr, labCol - 1);
      if (v && typeof n === 'number' && v !== '計' && !subjects.includes(v)) subjects.push(v);
    }

    const hasDates = days.some((d) => d.month && d.day);
    const filled = days.reduce((a, d) => a + d.rows.reduce((b, x) => b + Object.values(x.vals).filter((v) => v.t || v.m).length, 0), 0);
    // 図形（確定版の四角・お知らせの吹き出し）。印刷の範囲（出張等の列まで）にあるものだけ
    const boxes = (sh.shapes || []).filter((b) => b.c0 <= stCol - 1 && b.r0 <= sh.maxRow).concat(...weekend.map((w) => w.notes));
    return { classes: classCols.map((x) => x.id), days, weekend, weekNo, label, school, subjects, hasDates, filled, boxes };
  };

  // 月・日 → 'YYYY-MM-DD'（4〜12月はその年度の年、1〜3月は次の年）
  I.dateOf = (fy, month, day) => (month && day ? `${month >= 4 ? fy : fy + 1}-${u.pad(month)}-${u.pad(day)}` : null);
  // シートの各日の日付。月・日がそろっている日をもとに、曜日から残りの日を決める（「月」の数字が空の日があるため）
  I.fillDates = (p, fy) => {
    const all = p.days.map((d) => ({ x: d, wd: d.wd })).concat(p.weekend.map((w) => ({ x: w, wd: w.wd === 0 ? 7 : 6 })));
    const anchor = all.find((a) => a.x.month && a.x.day && a.wd >= 1);
    if (!anchor) return;
    const base = I.dateOf(fy, anchor.x.month, anchor.x.day);
    const mon = u.add(base, -((u.dow(base) + 6) % 7));
    all.forEach((a) => (a.x.date = u.add(mon, a.wd - 1)));
  };

  /* ---------- シートの種類を見分ける ---------- */
  I.scan = async (book, fileName, fy) => {
    const out = [];
    for (const s of book.sheets) {
      let p = null;
      try {
        p = I.parseSheet(await book.sheet(s.name, 95));
      } catch (e) {
        p = null;
      }
      if (!p || p.filled < 10) continue;
      const era = I.eraYear(s.name);
      const item = { file: fileName, sheet: s.name, parsed: p, era, hidden: s.hidden };
      if (p.hasDates) {
        I.fillDates(p, fy);
        item.kind = 'week';
        item.mon = u.monday(p.days.find((d) => d.date).date);
        item.weekNo = p.weekNo;
        item.use = (era == null || era === fy) && !/\(\d\)$/.test(s.name.trim());
      } else {
        item.kind = 'base';
        item.use = false;
      }
      out.push(item);
    }
    // 同じファイルに「R8の…」があれば、年度の書いていないシート（去年の残りなど）は最初は外しておく
    if (out.some((x) => x.era === fy)) out.forEach((x) => x.kind === 'week' && x.era == null && (x.use = false));
    return out;
  };

  // 基本の候補を、名前から期間に当てる（前期 → 1学期・2学期前期、後期 → 2学期後期・3学期後期）
  I.guessTerms = (name) => {
    const t = m.st.terms;
    if (/前期/.test(name)) return t.filter((x) => /1学期|前期/.test(x.name)).map((x) => x.id);
    if (/後期/.test(name)) return t.filter((x) => /後期/.test(x.name)).map((x) => x.id);
    return [];
  };

  /* ---------- 色 → このアプリの印 ---------- */
  const PALETTE = { y: 'FFFF00', o: 'FFC000', b: 'B4C6E7', g: 'E2EFDA', p: 'F8CBAD' };
  I.markOf = (hex) => {
    if (!hex || hex === 'FFFFFF') return '';
    const v = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    let best = '';
    let bd = 1e9;
    Object.entries(PALETTE).forEach(([k, h]) => {
      const w = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
      const dist = (v[0] - w[0]) ** 2 + (v[1] - w[1]) ** 2 + (v[2] - w[2]) ** 2;
      if (dist < bd) {
        bd = dist;
        best = k;
      }
    });
    return best;
  };

  /* ---------- データに入れる ---------- */
  // picks: [{item, terms:[termId]}]（基本） と [{item}]（週）。opts: {events:true, marks:true, staff:true}
  I.apply = (st, bases, weeks, opts) => {
    const o = Object.assign({ events: true, marks: true, school: true }, opts || {});
    const fy = st.school.year;
    const report = { bases: 0, weeks: 0, overrides: 0, events: 0, holidays: 0, lines: 0 };

    // クラス（Excel の並びに合わせる）
    const any = bases[0] || weeks[0];
    if (any) {
      const ids = any.item.parsed.classes;
      st.classes = ids.map((id) => {
        const [g, c] = id.split('-').map(Number);
        return { id, g, label: `${u.toZen(g)}・${u.toZen(c)}` };
      });
      if (o.school && any.item.parsed.school && !st.school.name) st.school.name = any.item.parsed.school;
    }

    // 教科（Excel の一覧にあって、まだないもの）
    const subjNames = new Set();
    [...bases, ...weeks].forEach((x) => x.item.parsed.subjects.forEach((s) => subjNames.add(s)));
    subjNames.forEach((code) => {
      if (!st.subjects.some((s) => u.key(s.code) === u.key(code)))
        st.subjects.push({ code, name: code, group: code === 'C' || code === 'Ｃ' ? '' : code, counted: !/^[CＣ]$/.test(code), joint: false });
    });

    // 曜日ごとの校時の並び（基本のシートから）
    const layoutFrom = (p) => {
      p.days.slice(0, 5).forEach((d, i) => {
        const lay = d.rows.filter((x) => x.slot).map((x) => x.slot);
        if (lay.length) st.daySlots[i + 1] = lay;
      });
    };

    // 基本時間割
    bases.forEach(({ item, terms }) => {
      const p = item.parsed;
      layoutFrom(p);
      (terms || []).forEach((tid) => {
        const b = (st.bases[tid] = { cells: {}, staff: {} });
        p.days.slice(0, 5).forEach((d, i) => {
          const wd = i + 1;
          d.rows.forEach((x) => {
            if (x.st) b.staff[`${wd}|${x.i}`] = x.st;
            if (!x.slot) return;
            Object.entries(x.vals).forEach(([cid, v]) => {
              if (v.t) b.cells[`${wd}|${x.slot}|${cid}`] = v.m ? { t: v.t, m: v.m } : { t: v.t };
            });
          });
        });
        report.bases++;
      });
    });

    // 週：まず日付と中身を集める
    const dayData = {};
    weeks.forEach(({ item }) => {
      const p = item.parsed;
      I.fillDates(p, fy);
      p.days.forEach((d) => d.date && (dayData[d.date] = { d, item }));
      p.weekend.forEach((w) => {
        if (!w.date) return;
        // 土曜授業など：時間割の行があれば、平日と同じように中身を入れる
        const d = w.slotRows && w.slotRows.length ? { wd: w.wd, rows: w.slotRows, weekend: true } : null;
        dayData[w.date] = d ? { w, d, item } : { w, item };
      });
      const mon = item.mon;
      const meta = (st.weekMeta[mon] = Object.assign({}, st.weekMeta[mon]));
      if (p.label) meta.label = p.label;
      if (p.boxes && p.boxes.length) meta.boxes = p.boxes;
    });

    // 期間の日付を、週のシートに授業がある日から決めなおす
    m.st = st;
    m.touch();
    const orig = st.terms.map((t) => ({ id: t.id, start: t.start, end: t.end }));
    const dist = (d, t) => (d >= t.start && d <= t.end ? 0 : Math.min(Math.abs(u.parse(d) - u.parse(t.start)), Math.abs(u.parse(d) - u.parse(t.end))));
    const assigned = {};
    Object.entries(dayData).forEach(([date, x]) => {
      if (!x.d) return;
      const cells = x.d.rows.filter((r) => r.slot && r.slot !== 'am' && r.slot !== 'pm');
      const filled = cells.reduce((a, r) => a + Object.values(r.vals).filter((v) => v.t || v.m).length, 0);
      const hasText = x.d.rows.some((r) => r.ev && !/休|振替|記念日/.test(r.ev));
      if (filled < 3 && (u.holiday(date) || (!filled && !hasText))) return;
      // どの基本時間割にいちばん近いか（同じ基本を使う期間どうしは、日付の近いほう）
      let best = null;
      let bestScore = -1;
      const near = orig.filter((t) => date >= u.add(t.start, -40) && date <= u.add(t.end, 40));
      if (filled < 3) {
        // 授業がほとんどない日（終業式・入学式など）は、日付のいちばん近い期間へ
        if (!near.length) return;
        best = near.slice().sort((a, b) => dist(date, a) - dist(date, b))[0];
        (assigned[best.id] = assigned[best.id] || []).push(date);
        return;
      }
      (near.length ? near : orig).forEach((t) => {
        const bs = st.bases[t.id];
        let score = 0;
        if (bs)
          cells.forEach((r) =>
            Object.entries(r.vals).forEach(([cid, v]) => {
              const bc = bs.cells[`${x.d.wd}|${r.slot}|${cid}`];
              if (bc && v.t && bc.t === v.t) score++;
            })
          );
        if (score > bestScore || (score === bestScore && best && dist(date, t) < dist(date, best))) {
          bestScore = score;
          best = t;
        }
      });
      if (best) (assigned[best.id] = assigned[best.id] || []).push(date);
    });
    st.terms.forEach((t, i) => {
      const ds = (assigned[t.id] || []).sort();
      if (!ds.length) return;
      t.start = ds[0];
      const later = st.terms.slice(i + 1).some((x) => (assigned[x.id] || []).length);
      t.end = later ? ds[ds.length - 1] : ds[ds.length - 1] > t.end ? ds[ds.length - 1] : t.end;
    });
    m.touch();

    // 授業がない平日は「休業日」に、祝日に授業がある日は「○曜校時」に
    Object.entries(dayData).forEach(([date, x]) => {
      if (!x.d) return;
      if (x.d.weekend) {
        if (!m.day(date).school) {
          st.events.push({ id: u.uid(), kind: 'swap', date, swapWd: null, title: `${u.WD[u.dow(date)]}曜授業`, targets: ['all'], inYear: true, inMonth: true, inWeek: false, imported: true });
          report.events++;
          m.touch();
        }
        return;
      }
      const filled = x.d.rows.reduce((a, r) => a + (r.slot && r.slot !== 'am' && r.slot !== 'pm' ? Object.values(r.vals).filter((v) => v.t || v.m).length : 0), 0);
      const day = m.day(date);
      if (filled === 0 && day.school) {
        const first = x.d.rows.map((r) => r.ev).find(Boolean) || '';
        const title = first.replace(/^[・･]\s*/, '');
        if (!title || /休|振替|記念日/.test(title)) {
          // 休みの日
          st.events.push({ id: u.uid(), kind: 'holiday', date, title: title || '休業日', targets: ['all'], inYear: true, inMonth: true, inWeek: false, imported: true });
          report.holidays++;
        } else {
          // 授業はないが学校のある日（体育大会・考査など）：時間割の欄は空のまま
          x.wholeDay = st.events.length;
          st.events.push({ id: u.uid(), kind: 'event', date, title, targets: ['all'], from: 'all', to: '', noText: true, countAs: '', row: x.d.rows.findIndex((r) => r.ev === first), inYear: true, inMonth: true, imported: true });
          report.events++;
        }
      }
      // 「火曜校時」などの文
      const sw = x.d.rows.map((r) => r.ev).find((t) => /^([月火水木金])曜校時/.test(u.norm(t)));
      if (sw && filled > 0) {
        const wd = '日月火水木金土'.indexOf(u.norm(sw)[0]);
        const swRow = x.d.rows.find((r) => r.ev === sw);
        st.events.push(Object.assign({ id: u.uid(), kind: 'swap', date, swapWd: wd, title: u.norm(sw), targets: ['all'], inYear: true, inMonth: true, row: x.d.rows.indexOf(swRow), imported: true }, swRow && swRow.evf && swRow.evf.b ? { bold: true } : {}));
        report.events++;
      }
    });
    m.touch();

    // 行事の文・出張等・中身の違い
    const holNames = (date) => [u.holiday(date)].filter(Boolean);
    Object.entries(dayData).forEach(([date, x]) => {
      const lines = (st.lines[date] = st.lines[date] || {});
      const evLines = {};
      const stLines = {};
      const evF = {};
      const stF = {};
      if (x.w) {
        Object.entries(x.w.lines).forEach(([i, t]) => ((evLines[i] = t), (evF[i] = x.w.linesF[i])));
        Object.entries(x.w.st).forEach(([i, t]) => ((stLines[i] = t), (stF[i] = x.w.stF[i])));
      } else {
        x.d.rows.forEach((r) => {
          if (r.ev) (evLines[r.i] = r.ev), (evF[r.i] = r.evf);
          if (r.st) (stLines[r.i] = r.st), (stF[r.i] = r.stf);
        });
        // 校時の数字の色（45分授業などで塗っていたもの）
        x.d.rows.forEach((r) => {
          if (o.marks && r.slot && r.slotFill && r.slotFill !== 'FFFFFF') (lines.sl = lines.sl || {})[r.slot] = '#' + r.slotFill;
        });
        const memo = x.d.rows.map((r) => r.memo).filter(Boolean);
        if (memo.length) st.memo[date] = memo.join('\n');
      }
      // 行事の文 → 年間行事（月行事にも出る）。祝日名・「○曜校時」は二重にしない
      Object.entries(evLines).forEach(([i, t]) => {
        const t0 = u.norm(t).replace(/^[・･]\s*/, '');
        const f0 = evF[i] || {};
        if (holNames(date).includes(t0) && (f0.b || f0.big)) {
          // 祝日名を太字・大きめで書いていたもの：その見た目のまま、その行に残す
          lines.ev = lines.ev || {};
          lines.ev[i] = Object.assign({ t }, f0.b ? { b: 1 } : {}, f0.big ? { big: 1 } : {}, f0.red ? { red: 1 } : {});
          return;
        }
        if (holNames(date).includes(t0) || /^[月火水木金]曜校時/.test(t0)) return;
        if (x.d && (u.norm(m.day(date).offName) === t0 || (x.wholeDay != null && u.norm(st.events[x.wholeDay].title) === t0))) return;
        // 行事の名前らしいものは年間行事へ。時刻・番号ではじまる行、文（。で終わる）、注意書きは、その週だけの書きこみに
        const weekOnly = /^[※＊*\s(（]/.test(t) || /^[0-9０-９①-⑳➀-➓]/.test(t0) || /。$/.test(t0) || t0.length > 30 || /\d{1,2}[:：]\d{2}/.test(t0);
        const f = evF[i] || {};
        if (o.events && !weekOnly) {
          const e = { id: u.uid(), kind: 'event', date, title: t.trim().replace(/^[・･]\s*/, ''), targets: ['all'], row: Number(i), inYear: true, inMonth: true, imported: true };
          if (f.b) e.bold = true;
          if (f.red) e.red = true;
          if (f.big) e.big = true;
          st.events.push(e);
          report.events++;
        } else {
          lines.ev = lines.ev || {};
          lines.ev[i] = f.b || f.red || f.big ? Object.assign({ t }, f.b ? { b: 1 } : {}, f.red ? { red: 1 } : {}, f.big ? { big: 1 } : {}) : t;
          report.lines++;
        }
      });
      // 出張等：定例（基本と同じ文）は入れない
      const day = m.day(date);
      const bs = day.term && st.bases[day.term.id];
      Object.entries(stLines).forEach(([i, t]) => {
        if (bs && bs.staff[`${day.wd}|${i}`] === t) return;
        const f = stF[i] || {};
        lines.st = lines.st || {};
        lines.st[i] = f.b || f.red ? Object.assign({ t }, f.b ? { b: 1 } : {}, f.red ? { red: 1 } : {}) : t;
        report.lines++;
      });
      if (!Object.keys(lines).length) delete st.lines[date];
    });
    m.touch();

    // 時間割の中身：基本・行事と違うところだけ「手で変えたコマ」として入れる
    Object.entries(dayData).forEach(([date, x]) => {
      if (!x.d) return;
      const day = m.day(date);
      if (!day.school) return;
      // Excel にその校時の行がない日（三者面談の短縮日課・土曜授業など）は、その校時を「授業なし」に
      const have = new Set(x.d.rows.filter((r) => r.slot).map((r) => r.slot));
      const missing = day.layout.filter((s) => !have.has(s));
      if (have.size && missing.length) {
        const L = (st.lines[date] = st.lines[date] || {});
        L.off = missing;
        m.touch();
      }
      x.d.rows.forEach((r) => {
        if (!r.slot || !day.layout.includes(r.slot)) return;
        Object.entries(r.vals).forEach(([cid, v]) => {
          const under = m.under(date, r.slot, cid);
          const same = v.t === under.t && (!!v.m === !!under.m);
          const look = o.marks ? r.marks[cid] : null;
          if (same && !look) return;
          const ov = { t: v.t };
          if (v.m) ov.m = v.m;
          if (look && look.bg) ov.bg = look.bg;
          if (look && look.b) ov.b = 1;
          if (look && look.red) ov.red = 1;
          st.ovr[m.ck(date, r.slot, cid)] = ov;
          report.overrides++;
        });
      });
    });
    report.weeks = weeks.length;
    m.touch();
    return report;
  };
})();
