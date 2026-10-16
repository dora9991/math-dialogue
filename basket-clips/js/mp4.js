/* バスケ分析スタジオ — MP4 / MOV の読み取り（映像トラックの位置表だけを取り出す）
   自動解析で「全部のコマを順番に・取りこぼしなく」調べるために、動画ファイルを自分で読んで WebCodecs に渡す。
   対応：MP4 / MOV（H.264・HEVC。バスケ得点クリップでは VP9・AV1 も）。それ以外は呼び出し側が <video> 再生方式に切り替える。
   DOM 非依存（ブラウザ・Worker・node のどれでも動く）。 */
(function (root) {
  function mod(root) {
    'use strict';
    const BS = root.BS = root.BS || {};

    const fourcc = (u8, p) => String.fromCharCode(u8[p], u8[p + 1], u8[p + 2], u8[p + 3]);
    const u32 = (u8, p) => ((u8[p] << 24) | (u8[p + 1] << 16) | (u8[p + 2] << 8) | u8[p + 3]) >>> 0;
    const i32 = (u8, p) => (u8[p] << 24) | (u8[p + 1] << 16) | (u8[p + 2] << 8) | u8[p + 3];
    const u16 = (u8, p) => (u8[p] << 8) | u8[p + 1];
    const u64 = (u8, p) => u32(u8, p) * 4294967296 + u32(u8, p + 4);

    /* u8 の [start,end) に並ぶボックスを列挙：{ type, start(中身の先頭), end } */
    function boxes(u8, start, end) {
      const out = [];
      let p = start;
      while (p + 8 <= end) {
        let size = u32(u8, p), hdr = 8;
        const type = fourcc(u8, p + 4);
        if (size === 1) { size = u64(u8, p + 8); hdr = 16; } else if (size === 0) size = end - p;
        if (size < hdr || p + size > end) break;
        out.push({ type, start: p + hdr, end: p + size });
        p += size;
      }
      return out;
    }
    const child = (u8, b, type) => boxes(u8, b.start, b.end).find((x) => x.type === type) || null;

    /* ファイルの先頭から順にボックスの見出しだけを読んで moov を探す。reader: { size, read(start,end) → Promise<Uint8Array> } */
    async function readMoov(reader) {
      let pos = 0;
      while (pos + 8 <= reader.size) {
        const head = await reader.read(pos, Math.min(reader.size, pos + 16));
        let size = u32(head, 0), hdr = 8;
        const type = fourcc(head, 4);
        if (size === 1) { size = u64(head, 8); hdr = 16; } else if (size === 0) size = reader.size - pos;
        if (size < hdr) break;
        if (type === 'moov') {
          if (size > 256 * 1024 * 1024) throw new Error('moov が大きすぎます');
          return reader.read(pos + hdr, pos + size);
        }
        pos += size;
      }
      throw new Error('MP4 / MOV の目次（moov）が見つかりません');
    }

    function hex2(n) { return (n < 16 ? '0' : '') + n.toString(16); }
    function avcCodec(type, c) { return (type === 'avc3' ? 'avc3.' : 'avc1.') + hex2(c[1]) + hex2(c[2]) + hex2(c[3]); }
    /* VP9（vpcC：FullBox。版1 なら profile, level, bitDepth(上位4ビット)…） → 'vp09.PP.LL.DD' */
    function vp9Codec(u8, b) {
      const p = b.start + 4;
      const dd = (n) => (n < 10 ? '0' : '') + n;
      return 'vp09.' + dd(u8[p]) + '.' + dd(u8[p + 1]) + '.' + dd(u8[p + 2] >> 4);
    }
    /* AV1（av1C：marker/version, seq_profile(3)+seq_level_idx_0(5), tier(1)+high_bitdepth(1)+twelve_bit(1)…） → 'av01.P.LLT.DD' */
    function av1Codec(c) {
      const profile = c[1] >> 5, level = c[1] & 31, tier = c[2] >> 7, hi = (c[2] >> 6) & 1, twelve = (c[2] >> 5) & 1;
      const depth = hi ? (twelve ? 12 : 10) : 8;
      return 'av01.' + profile + '.' + (level < 10 ? '0' : '') + level + (tier ? 'H' : 'M') + '.' + (depth < 10 ? '0' : '') + depth;
    }
    function hevcCodec(type, c) {
      const b1 = c[1];
      const space = ['', 'A', 'B', 'C'][b1 >> 6], tier = (b1 >> 5) & 1, profile = b1 & 31;
      let compat = u32(c, 2), rev = 0;
      for (let i = 0; i < 32; i++) { rev = (rev * 2) + (compat & 1); compat = Math.floor(compat / 2); }
      const cons = [c[6], c[7], c[8], c[9], c[10], c[11]];
      while (cons.length && cons[cons.length - 1] === 0) cons.pop();
      return (type === 'hev1' ? 'hev1.' : 'hvc1.') + space + profile + '.' + rev.toString(16).toUpperCase() + '.' + (tier ? 'H' : 'L') + c[12] +
        cons.map((x) => '.' + x.toString(16).toUpperCase()).join('');
    }

    /* moov（中身）→ 映像トラックの情報とサンプル表 */
    function parseMoov(u8) {
      const top = boxes(u8, 0, u8.length);
      const mvhd = top.find((b) => b.type === 'mvhd');
      let movieScale = 600;
      if (mvhd) movieScale = u8[mvhd.start] === 1 ? u32(u8, mvhd.start + 20) : u32(u8, mvhd.start + 12);
      for (const trak of top.filter((b) => b.type === 'trak')) {
        const mdia = child(u8, trak, 'mdia');
        if (!mdia) continue;
        const hdlr = child(u8, mdia, 'hdlr');
        if (!hdlr || fourcc(u8, hdlr.start + 8) !== 'vide') continue;
        const mdhd = child(u8, mdia, 'mdhd');
        const v1 = u8[mdhd.start] === 1;
        const timescale = v1 ? u32(u8, mdhd.start + 20) : u32(u8, mdhd.start + 12);
        const minf = child(u8, mdia, 'minf');
        const stbl = minf && child(u8, minf, 'stbl');
        if (!stbl) continue;
        const sb = {};
        boxes(u8, stbl.start, stbl.end).forEach((b) => { sb[b.type] = b; });
        if (!sb.stsd || !sb.stts || !sb.stsc || !sb.stsz || !(sb.stco || sb.co64)) continue;

        // --- コーデック ---
        const ent = sb.stsd.start + 8;                 // 最初のサンプル記述
        const entSize = u32(u8, ent), entType = fourcc(u8, ent + 4);
        const width = u16(u8, ent + 32), height = u16(u8, ent + 34);
        let codec = null, description = null;
        for (const b of boxes(u8, ent + 86, ent + entSize)) {
          if (b.type === 'avcC') { description = u8.slice(b.start, b.end); codec = avcCodec(entType, description); }
          else if (b.type === 'hvcC') { description = u8.slice(b.start, b.end); codec = hevcCodec(entType, description); }
          else if (b.type === 'vpcC') codec = vp9Codec(u8, b);
          else if (b.type === 'av1C') { description = u8.slice(b.start, b.end); codec = av1Codec(description); }
        }
        if (!codec) throw new Error('対応していない映像形式です（' + entType + '）');

        // --- 回転（tkhd の行列） ---
        const tkhd = child(u8, trak, 'tkhd');
        let rotation = 0;
        if (tkhd) {
          const m = tkhd.start + (u8[tkhd.start] === 1 ? 52 : 40);
          const a = i32(u8, m) / 65536, b = i32(u8, m + 4) / 65536, c = i32(u8, m + 12) / 65536, d = i32(u8, m + 16) / 65536;
          if (a === 0 && d === 0) rotation = b > 0 && c < 0 ? 90 : b < 0 && c > 0 ? 270 : 0;
          else if (a < 0 && d < 0) rotation = 180;
        }

        // --- 編集リスト（表示時刻の原点） ---
        let mediaStart = 0, startOffset = 0;
        const edts = child(u8, trak, 'edts'), elst = edts && child(u8, edts, 'elst');
        if (elst) {
          const ev1 = u8[elst.start] === 1, n = u32(u8, elst.start + 4);
          let p = elst.start + 8;
          for (let i = 0; i < n; i++) {
            const dur = ev1 ? u64(u8, p) : u32(u8, p);
            const mt = ev1 ? (u32(u8, p + 8) === 0xFFFFFFFF && u32(u8, p + 12) === 0xFFFFFFFF ? -1 : u64(u8, p + 8)) : i32(u8, p + 4);
            p += ev1 ? 20 : 12;
            if (mt < 0) { startOffset += dur / movieScale; continue; }
            mediaStart = mt; break;
          }
        }

        // --- サンプル表 ---
        const count = u32(u8, sb.stsz.start + 8), fixed = u32(u8, sb.stsz.start + 4);
        if (!count) throw new Error('この MP4 は断片化された形式（録画ソフトなどが作る形）で、位置の表がありません');
        const size = new Uint32Array(count), offset = new Float64Array(count), dts = new Float64Array(count), cts = new Float64Array(count), sync = new Uint8Array(count);
        for (let i = 0; i < count; i++) size[i] = fixed || u32(u8, sb.stsz.start + 12 + i * 4);
        // 時刻（デコード順）
        { let p = sb.stts.start + 8, n = u32(u8, sb.stts.start + 4), i = 0, t = 0;
          for (let e = 0; e < n && i < count; e++, p += 8) { const c = u32(u8, p), d = u32(u8, p + 4); for (let k = 0; k < c && i < count; k++) { dts[i++] = t; t += d; } }
          for (; i < count; i++) dts[i] = t; }
        // 表示時刻とのずれ
        cts.set(dts);
        if (sb.ctts) {
          let p = sb.ctts.start + 8, n = u32(u8, sb.ctts.start + 4), i = 0;
          for (let e = 0; e < n && i < count; e++, p += 8) { const c = u32(u8, p), o = i32(u8, p + 4); for (let k = 0; k < c && i < count; k++) cts[i++] += o; }
        }
        // キーフレーム
        if (sb.stss) { const n = u32(u8, sb.stss.start + 4); for (let e = 0; e < n; e++) { const s = u32(u8, sb.stss.start + 8 + e * 4) - 1; if (s >= 0 && s < count) sync[s] = 1; } } else sync.fill(1);
        // ファイル内の位置（チャンク → サンプル）
        { const co64 = !!sb.co64, cb = sb.co64 || sb.stco, nChunk = u32(u8, cb.start + 4);
          const nEnt = u32(u8, sb.stsc.start + 4);
          let i = 0;
          for (let e = 0; e < nEnt && i < count; e++) {
            const p = sb.stsc.start + 8 + e * 12;
            const first = u32(u8, p), per = u32(u8, p + 4);
            const next = e + 1 < nEnt ? u32(u8, p + 12) : nChunk + 1;
            for (let ch = first; ch < next && i < count; ch++) {
              let off = co64 ? u64(u8, cb.start + 8 + (ch - 1) * 8) : u32(u8, cb.start + 8 + (ch - 1) * 4);
              for (let k = 0; k < per && i < count; k++) { offset[i] = off; off += size[i]; i++; }
            }
          } }
        const time = new Float64Array(count);
        let duration = 0;
        for (let i = 0; i < count; i++) { time[i] = (cts[i] - mediaStart) / timescale + startOffset; if (time[i] > duration) duration = time[i]; }
        const fps = count > 1 ? (count - 1) / Math.max(1e-6, (dts[count - 1] - dts[0]) / timescale) : 30;
        // description が無い形式（VP9）は undefined にしておく（VideoDecoder の設定に null を渡すと受け付けないため）
        return { codec, description: description || undefined, width, height, rotation, timescale, count, size, offset, time, sync, duration: duration + 1 / fps, fps, entType };
      }
      throw new Error('映像トラックが見つかりません');
    }

    /* 時刻 t のコマを得るために、どのサンプルからデコードを始めるか（その前の最後のキーフレーム） */
    function keyBefore(track, t) {
      let best = 0;
      for (let i = 0; i < track.count; i++) { if (track.sync[i] && track.time[i] <= t + 1e-6) best = i; else if (track.sync[i]) break; }
      return best;
    }

    /* File（Blob）や URL を「範囲を指定して読む」形にそろえる */
    function blobReader(blob) {
      return { size: blob.size, read: async (a, b) => new Uint8Array(await blob.slice(a, b).arrayBuffer()) };
    }
    async function urlReader(url) {
      const head = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' } });
      const cr = head.headers.get('Content-Range');
      const size = cr ? Number(cr.split('/')[1]) : Number(head.headers.get('Content-Length'));
      if (!isFinite(size) || size <= 0) throw new Error('動画の大きさが分かりません');
      // 通信が一瞬切れても止まらないよう、3回までやり直す
      const read = async (a, b) => {
        let lastErr = null;
        for (let k = 0; k < 3; k++) {
          try {
            const r = await fetch(url, { headers: { Range: `bytes=${a}-${b - 1}` } });
            if (!r.ok) throw new Error('HTTP ' + r.status);
            const u8 = new Uint8Array(await r.arrayBuffer());
            if (u8.length !== b - a) throw new Error('読み込みが途中で切れました');
            return u8;
          } catch (e) { lastErr = e; await new Promise((res) => setTimeout(res, 300 * (k + 1))); }
        }
        throw lastErr;
      };
      return { size, read };
    }

    async function open(reader) {
      const moov = await readMoov(reader);
      return parseMoov(moov);
    }

    BS.mp4 = { open, readMoov, parseMoov, keyBefore, blobReader, urlReader, boxes };
  }
  mod(root);
  (root.BS.src = root.BS.src || {}).mp4 = mod;
})(typeof window !== 'undefined' ? window : globalThis);
