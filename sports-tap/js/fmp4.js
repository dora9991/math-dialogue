/* スポーツ タップ記録 — （バスケ タップ記録と同じしくみ）細切れの MP4（fragmented MP4）を、ふつうの MP4 に組み直す
   ブラウザの録画（MediaRecorder）は、少しずつ書き出せる「細切れの MP4」（moof と mdat のくり返し）を作る。
   そのままでも再生はできるが、長い動画では、先のほうへ飛ぶ（シーク）のが遅い・写真アプリに入らない、などがある。
   ここでは、細切れの目次（moof）を読んで、ふつうの MP4（moov に全部の目次・mdat に中身）を組み立てる。
     ・中身（映像と音のデータ）は読み込まない。元の Blob の「どこからどこまで」を並べた Blob を作るだけなので、
       1時間（1GB 以上）の動画でもメモリをほとんど使わない（読むのは目次の部分だけ）
     ・録画の途中でページが閉じた（最後が切れている）ファイルでも、そろっているところまでで組み立てる
     ・中身の形式（H.264・VP9・AAC・Opus など）には、さわらない（stsd をそのまま写す）
   DOM 非依存（node のテストからも読み込める。Blob の slice / arrayBuffer だけを使う）。 */
(function (root) {
  'use strict';
  const ST = root.ST = root.ST || {};

  const u32 = (dv, p) => dv.getUint32(p);
  const i32 = (dv, p) => dv.getInt32(p);
  const u64 = (dv, p) => dv.getUint32(p) * 4294967296 + dv.getUint32(p + 4);
  const four = (dv, p) => String.fromCharCode(dv.getUint8(p), dv.getUint8(p + 1), dv.getUint8(p + 2), dv.getUint8(p + 3));
  async function read(blob, start, end) { return new DataView(await blob.slice(start, end).arrayBuffer()); }

  /* dv の [p, end) にある箱の並び */
  function boxes(dv, p, end) {
    const out = [];
    while (p + 8 <= end) {
      let size = u32(dv, p), head = 8;
      const type = four(dv, p + 4);
      if (size === 1) { if (p + 16 > end) break; size = u64(dv, p + 8); head = 16; } else if (size === 0) size = end - p;
      if (size < head || p + size > end) break;
      out.push({ type, start: p, size, body: p + head, end: p + size });
      p += size;
    }
    return out;
  }
  const kid = (dv, box, type) => boxes(dv, box.body, box.end).find((b) => b.type === type) || null;

  /* いちばん外側の箱の並び（中身は読まない）。最後が切れている箱は complete: false */
  async function scan(blob) {
    const top = [];
    const N = blob.size;
    let p = 0;
    while (p + 8 <= N) {
      const dv = await read(blob, p, Math.min(N, p + 16));
      let size = u32(dv, 0), head = 8;
      const type = four(dv, 4);
      if (size === 1) { if (dv.byteLength < 16) break; size = u64(dv, 8); head = 16; } else if (size === 0) size = N - p;
      if (size < head) break;
      const complete = p + size <= N;
      top.push({ type, start: p, size, head, complete });
      if (!complete) break;
      p += size;
    }
    return top;
  }

  /* 書き込み（大きさの分からない箱は、あとで大きさを書き込む） */
  function writer() {
    let buf = new Uint8Array(4096), len = 0;
    const need = (n) => { if (len + n <= buf.length) return; let m = buf.length * 2; while (m < len + n) m *= 2; const b = new Uint8Array(m); b.set(buf.subarray(0, len)); buf = b; };
    const W = {
      get len() { return len; },
      u8(v) { need(1); buf[len++] = v & 255; },
      u16(v) { need(2); buf[len++] = (v >>> 8) & 255; buf[len++] = v & 255; },
      u32(v) { need(4); v = v >>> 0; buf[len++] = v >>> 24; buf[len++] = (v >>> 16) & 255; buf[len++] = (v >>> 8) & 255; buf[len++] = v & 255; },
      i32(v) { W.u32(v | 0); },
      u64(v) { W.u32(Math.floor(v / 4294967296)); W.u32(v % 4294967296); },
      str(s) { for (let i = 0; i < 4; i++) W.u8(s.charCodeAt(i)); },
      bytes(u8) { need(u8.length); buf.set(u8, len); len += u8.length; },
      box(type, fn) { const at = len; W.u32(0); W.str(type); fn(); const size = len - at; buf[at] = size >>> 24; buf[at + 1] = (size >>> 16) & 255; buf[at + 2] = (size >>> 8) & 255; buf[at + 3] = size & 255; },
      full(type, version, flags, fn) { W.box(type, () => { W.u8(version); W.u8(flags >>> 16); W.u16(flags & 0xffff); fn(); }); },
      out() { return buf.slice(0, len); }
    };
    return W;
  }
  const copy = (dv, box) => new Uint8Array(dv.buffer, dv.byteOffset + box.start, box.size).slice();
  /* 箱の写し（版によって位置の違う「長さ（duration）」の欄だけを書き換える） */
  function withDuration(dv, box, kind, value) {
    const b = copy(dv, box);
    const d = new DataView(b.buffer);
    const head = box.body - box.start;
    const v1 = b[head] === 1;
    // mvhd・mdhd：作成(4|8) 更新(4|8) timescale(4) 長さ(4|8) / tkhd：作成 更新 track_ID(4) reserved(4) 長さ
    const off = head + 4 + (v1 ? 16 : 8) + (kind === 'tkhd' ? 8 : 4);
    if (v1) { d.setUint32(off, Math.floor(value / 4294967296)); d.setUint32(off + 4, value % 4294967296); } else d.setUint32(off, Math.min(0xffffffff, value));
    return b;
  }
  const timescaleOf = (dv, box) => { const v1 = dv.getUint8(box.body) === 1; return u32(dv, box.body + 4 + (v1 ? 16 : 8)); };
  /* tkhd の写し b（Uint8Array）に、映す向き（時計回りの角度 90・180・270）の行列を書く。
     中身（コマ）はそのままで、再生するときに回して映す（ffmpeg の display_rotation と同じ書き方。x・y はずらさない） */
  const MATRIX = {
    0: [0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000],
    90: [0, 0x10000, 0, -0x10000, 0, 0, 0, 0, 0x40000000],
    180: [-0x10000, 0, 0, 0, -0x10000, 0, 0, 0, 0x40000000],
    270: [0, -0x10000, 0, 0x10000, 0, 0, 0, 0, 0x40000000]
  };
  function withMatrix(b, rotate) {
    const m = MATRIX[rotate];
    if (!m) return b;
    const d = new DataView(b.buffer, b.byteOffset, b.byteLength);
    const off = 8 + (b[8] === 1 ? 52 : 40);       // 箱の頭 8 ＋（版・フラグ・時刻・track_ID・reserved・長さ・reserved・layer・alternate_group・volume・reserved）
    m.forEach((v, i) => d.setInt32(off + i * 4, v));
    return b;
  }

  /* trak の中から、組み立てに使うものを取り出す */
  function readTrak(dv, trak) {
    const tkhd = kid(dv, trak, 'tkhd'), mdia = kid(dv, trak, 'mdia');
    const mdhd = mdia && kid(dv, mdia, 'mdhd'), hdlr = mdia && kid(dv, mdia, 'hdlr'), minf = mdia && kid(dv, mdia, 'minf');
    const stbl = minf && kid(dv, minf, 'stbl'), stsd = stbl && kid(dv, stbl, 'stsd');
    if (!tkhd || !mdhd || !hdlr || !minf || !stsd) return null;
    const v1 = dv.getUint8(tkhd.body) === 1;
    return {
      id: u32(dv, tkhd.body + 4 + (v1 ? 16 : 8)), handler: four(dv, hdlr.body + 8), ts: timescaleOf(dv, mdhd),
      box: { trak, tkhd, mdia, mdhd, hdlr, minf, stsd, edts: kid(dv, trak, 'edts') },
      sizes: [], durs: [], ctos: [], sync: [], chunks: [], first: null, time: 0, anyCto: false, negCto: false, allSync: true
    };
  }

  /* 細切れの MP4 を、ふつうの MP4 にする。
     戻り値 { flat, header（Uint8Array：ftyp＋moov＋mdat の頭）, ranges（元の Blob の [始め, 終わり) の並び。この順につなぐと mdat の中身）,
             duration（秒）, tracks: [{ handler, samples, duration }], truncated（最後が切れていた）}
     flat: false … もともと、ふつうの MP4（または組み立てられない形）。そのまま使う
     opts.rotate：映像を時計回りに何度回して映すか（0・90・180・270。画面の向きのロックをしたまま、横に置いて撮ったとき） */
  async function flatten(blob, opts) {
    const rotate = (((opts && opts.rotate) || 0) % 360 + 360) % 360;
    const top = await scan(blob);
    const ftypBox = top.find((b) => b.type === 'ftyp' && b.complete);
    const moovTop = top.find((b) => b.type === 'moov' && b.complete);
    if (!moovTop) throw new Error('MP4 の目次（moov）がありません');
    const mdv = await read(blob, moovTop.start, moovTop.start + moovTop.size);
    const moov = { type: 'moov', start: 0, size: moovTop.size, body: moovTop.head, end: moovTop.size };
    const mk = boxes(mdv, moov.body, moov.end);
    const mvex = mk.find((b) => b.type === 'mvex');
    const moofs = top.filter((b) => b.type === 'moof' && b.complete);
    if (!mvex || !moofs.length) return { flat: false, header: null, ranges: null, duration: null, tracks: [], truncated: false };
    const mvhd = mk.find((b) => b.type === 'mvhd');
    const movieTs = mvhd ? timescaleOf(mdv, mvhd) : 1000;
    const tracks = mk.filter((b) => b.type === 'trak').map((t) => readTrak(mdv, t)).filter(Boolean);
    const byId = {};
    tracks.forEach((T) => { byId[T.id] = T; });
    const trex = {};
    boxes(mdv, mvex.body, mvex.end).filter((b) => b.type === 'trex').forEach((b) => {
      trex[u32(mdv, b.body + 4)] = { sdi: u32(mdv, b.body + 8), dur: u32(mdv, b.body + 12), size: u32(mdv, b.body + 16), flags: u32(mdv, b.body + 20) };
    });
    const N = blob.size;
    const runs = [];          // { T, off, bytes, chunk }（中身の場所）
    let truncated = !top[top.length - 1].complete;
    for (const mf of moofs) {
      const dv = await read(blob, mf.start, mf.start + mf.size);
      const moof = { start: 0, body: mf.head, end: mf.size };
      let prevEnd = null;
      for (const traf of boxes(dv, moof.body, moof.end).filter((b) => b.type === 'traf')) {
        const tfhd = kid(dv, traf, 'tfhd');
        if (!tfhd) continue;
        const fl = u32(dv, tfhd.body) & 0xffffff;
        const T = byId[u32(dv, tfhd.body + 4)];
        const X = trex[u32(dv, tfhd.body + 4)] || { sdi: 1, dur: 0, size: 0, flags: 0 };
        let q = tfhd.body + 8;
        let base;
        if (fl & 0x1) { base = u64(dv, q); q += 8; } else base = (fl & 0x20000) ? mf.start : (prevEnd != null ? prevEnd : mf.start);
        const sdi = (fl & 0x2) ? u32(dv, (q += 4) - 4) : X.sdi;
        const ddur = (fl & 0x8) ? u32(dv, (q += 4) - 4) : X.dur;
        const dsize = (fl & 0x10) ? u32(dv, (q += 4) - 4) : X.size;
        const dflags = (fl & 0x20) ? u32(dv, (q += 4) - 4) : X.flags;
        if (!T) continue;
        // 時刻（tfdt）：あいだが空いていたら、前のサンプルを長くして、時刻の流れを保つ
        const tfdt = kid(dv, traf, 'tfdt');
        if (tfdt) {
          const t = dv.getUint8(tfdt.body) === 1 ? u64(dv, tfdt.body + 4) : u32(dv, tfdt.body + 4);
          if (T.first == null) { T.first = t; T.time = t; } else if (t > T.time && T.durs.length) { T.durs[T.durs.length - 1] += t - T.time; T.time = t; }
        } else if (T.first == null) { T.first = 0; T.time = 0; }
        let pos = base;
        for (const trun of boxes(dv, traf.body, traf.end).filter((b) => b.type === 'trun')) {
          const tf = u32(dv, trun.body) & 0xffffff, ver = dv.getUint8(trun.body);
          const n = u32(dv, trun.body + 4);
          let r = trun.body + 8;
          if (tf & 0x1) { pos = base + i32(dv, r); r += 4; }
          let firstFlags = null;
          if (tf & 0x4) { firstFlags = u32(dv, r); r += 4; }
          const start = pos;
          let bytes = 0, count = 0;
          for (let i = 0; i < n; i++) {
            const dur = (tf & 0x100) ? u32(dv, (r += 4) - 4) : ddur;
            const size = (tf & 0x200) ? u32(dv, (r += 4) - 4) : dsize;
            let sf = (tf & 0x400) ? u32(dv, (r += 4) - 4) : dflags;
            if (i === 0 && firstFlags != null) sf = firstFlags;
            const cto = (tf & 0x800) ? (ver === 0 ? u32(dv, (r += 4) - 4) : i32(dv, (r += 4) - 4)) : 0;
            if (start + bytes + size > N) { truncated = true; break; }        // 中身が切れている（録画の途中で閉じた）
            T.sizes.push(size); T.durs.push(dur); T.ctos.push(cto);
            if (cto) { T.anyCto = true; if (cto < 0) T.negCto = true; }
            const sync = T.handler !== 'vide' || !((sf >>> 16) & 1);
            T.sync.push(sync);
            if (!sync) T.allSync = false;
            T.time += dur;
            bytes += size; count++;
          }
          if (count) { const chunk = { n: count, sdi }; T.chunks.push(chunk); runs.push({ T, off: start, bytes, chunk }); }
          pos = start + bytes;
        }
        prevEnd = pos;
      }
    }
    const used = tracks.filter((T) => T.sizes.length);
    if (!used.length) throw new Error('動画の中身がありません');

    // 中身の並べ方：元の場所の順に、すき間なくつなぐ（となり合う所は1つの範囲にまとめる）
    runs.sort((a, b) => a.off - b.off);
    let payload = 0;
    const ranges = [];
    runs.forEach((x) => {
      x.chunk.rel = payload;
      const last = ranges[ranges.length - 1];
      if (last && last[1] === x.off) last[1] += x.bytes; else ranges.push([x.off, x.off + x.bytes]);
      payload += x.bytes;
    });

    // 長さ
    used.forEach((T) => {
      T.mediaDur = T.durs.reduce((s, d) => s + d, 0);
      T.lead = T.first > 0 ? Math.round(T.first / T.ts * movieTs) : 0;          // 最初のサンプルまでの空き（movie の時間の単位）
      T.movieDur = Math.round(T.mediaDur / T.ts * movieTs) + T.lead;      // （B フレームのずれは下で足す）
      // いちばん早く映るサンプルの時刻（B フレームがあると 0 より後）。空きを入れるときは、そこから映す（編集リスト）
      T.minCT = 0; T.maxEnd = T.mediaDur;
      if (T.anyCto && !T.negCto) {
        let dts = 0, m = Infinity, e = 0;
        for (let i = 0; i < T.durs.length; i++) { m = Math.min(m, dts + T.ctos[i]); e = Math.max(e, dts + T.ctos[i] + T.durs[i]); dts += T.durs[i]; }
        T.minCT = isFinite(m) ? m : 0; T.maxEnd = Math.max(e, T.mediaDur);
      }
      if (T.lead > 0) T.movieDur = T.lead + Math.round(T.maxEnd / T.ts * movieTs);
    });
    const movieDur = Math.max(...used.map((T) => T.movieDur));
    const ftyp = ftypBox ? new Uint8Array(await blob.slice(ftypBox.start, ftypBox.start + ftypBox.size).arrayBuffer())
      : (() => { const w = writer(); w.box('ftyp', () => { w.str('isom'); w.u32(512); ['isom', 'iso2', 'mp41'].forEach((s) => w.str(s)); }); return w.out(); })();

    const buildMoov = (base, co64) => {
      const w = writer();
      w.box('moov', () => {
        if (mvhd) w.bytes(withDuration(mdv, mvhd, 'mvhd', movieDur));
        used.forEach((T) => {
          const B = T.box;
          w.box('trak', () => {
            const tk = withDuration(mdv, B.tkhd, 'tkhd', T.movieDur);
            w.bytes(T.handler === 'vide' && rotate ? withMatrix(tk, rotate) : tk);
            if (B.edts) w.bytes(copy(mdv, B.edts));
            else if (T.lead > 0) {
              // 最初のサンプルまでの空き（映像と音の始まりのずれを保つ）。B フレームがあるときは、いちばん早く映るサンプルの時刻（minCT）から映す
              const empty = T.lead + Math.round(T.minCT / T.ts * movieTs);
              const shown = Math.round((T.maxEnd - T.minCT) / T.ts * movieTs);      // 映る長さ（最後のサンプルが映り終わるまで）
              w.box('edts', () => w.full('elst', 0, 0, () => {
                w.u32(2);
                w.u32(empty); w.i32(-1); w.u16(1); w.u16(0);
                w.u32(shown); w.i32(T.minCT); w.u16(1); w.u16(0);
              }));
            }
            w.box('mdia', () => {
              w.bytes(withDuration(mdv, B.mdhd, 'mdhd', T.mediaDur));
              w.bytes(copy(mdv, B.hdlr));
              w.box('minf', () => {
                boxes(mdv, B.minf.body, B.minf.end).forEach((b) => { if (b.type !== 'stbl') w.bytes(copy(mdv, b)); });
                w.box('stbl', () => {
                  w.bytes(copy(mdv, B.stsd));
                  // stts：サンプルの長さ（同じ長さが続く所はまとめる）
                  const stts = [];
                  T.durs.forEach((d) => { const l = stts[stts.length - 1]; if (l && l[1] === d) l[0]++; else stts.push([1, d]); });
                  w.full('stts', 0, 0, () => { w.u32(stts.length); stts.forEach(([c, d]) => { w.u32(c); w.u32(d); }); });
                  if (T.anyCto) {
                    const ctts = [];
                    T.ctos.forEach((o) => { const l = ctts[ctts.length - 1]; if (l && l[1] === o) l[0]++; else ctts.push([1, o]); });
                    w.full('ctts', T.negCto ? 1 : 0, 0, () => { w.u32(ctts.length); ctts.forEach(([c, o]) => { w.u32(c); w.i32(o); }); });
                  }
                  if (!T.allSync) {
                    const idx = [];
                    T.sync.forEach((s, i) => { if (s) idx.push(i + 1); });
                    w.full('stss', 0, 0, () => { w.u32(idx.length); idx.forEach((i) => w.u32(i)); });
                  }
                  w.full('stsz', 0, 0, () => { w.u32(0); w.u32(T.sizes.length); T.sizes.forEach((s) => w.u32(s)); });
                  const stsc = [];
                  T.chunks.forEach((c, i) => { const l = stsc[stsc.length - 1]; if (!l || l[1] !== c.n || l[2] !== c.sdi) stsc.push([i + 1, c.n, c.sdi]); });
                  w.full('stsc', 0, 0, () => { w.u32(stsc.length); stsc.forEach(([f, n, s]) => { w.u32(f); w.u32(n); w.u32(s); }); });
                  if (co64) w.full('co64', 0, 0, () => { w.u32(T.chunks.length); T.chunks.forEach((c) => w.u64(base + c.rel)); });
                  else w.full('stco', 0, 0, () => { w.u32(T.chunks.length); T.chunks.forEach((c) => w.u32(base + c.rel)); });
                });
              });
            });
          });
        });
        mk.filter((b) => b.type === 'udta').forEach((b) => w.bytes(copy(mdv, b)));
      });
      return w.out();
    };
    const big = payload + 8 > 0xffffffff;
    const mdatHead = big ? 16 : 8;
    let co64 = false;
    let moovBytes = buildMoov(0, false);
    let base = ftyp.length + moovBytes.length + mdatHead;
    if (base + payload > 0xffffffff) { co64 = true; moovBytes = buildMoov(0, true); base = ftyp.length + moovBytes.length + mdatHead; }
    moovBytes = buildMoov(base, co64);
    const w = writer();
    w.bytes(ftyp);
    w.bytes(moovBytes);
    if (big) { w.u32(1); w.str('mdat'); w.u64(payload + 16); } else { w.u32(payload + 8); w.str('mdat'); }
    return {
      flat: true, header: w.out(), ranges, truncated, rotate,
      duration: movieDur / movieTs,
      tracks: used.map((T) => ({ handler: T.handler, samples: T.sizes.length, duration: T.mediaDur / T.ts + T.lead / movieTs }))
    };
  }

  /* 組み立てた MP4 の Blob（header と、元の Blob の範囲をつなぐだけ。中身は写さない） */
  function compose(blob, plan, type) {
    if (!plan || !plan.flat) return blob;
    return new Blob([plan.header].concat(plan.ranges.map(([s, e]) => blob.slice(s, e))), { type: type || 'video/mp4' });
  }

  ST.fmp4 = { scan, flatten, compose, boxes };
})(typeof window !== 'undefined' ? window : globalThis);
