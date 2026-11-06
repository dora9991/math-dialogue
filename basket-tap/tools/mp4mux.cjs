// H.264（WebCodecs の avc 形式）のコマを、ふつうの MP4 に入れる（ブラウザの中で動かす文字列。page.addScriptTag で入れて window.__mux に）
//   make-demo-video.cjs（デモの見本の動画）と tests/tools/chrome-video.cjs（テスト用の動画）が使う
const MUX = `
function mux(chunks, avcC, W, H, fps) {
  const u32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  const u16 = (n) => [(n >>> 8) & 255, n & 255];
  const str = (s) => Array.from(s).map((c) => c.charCodeAt(0));
  const zeros = (n) => new Array(n).fill(0);
  const box = (type, ...parts) => { const body = [].concat(...parts.map((p) => Array.from(p))); return [...u32(8 + body.length), ...str(type), ...body]; };
  const full = (type, ver, flags, ...parts) => box(type, [ver, (flags >> 16) & 255, (flags >> 8) & 255, flags & 255], ...parts);
  const TS = 90000, n = chunks.length;
  const delta = Math.round(TS / fps), dur = n * delta, durMs = Math.round(dur * 1000 / TS);
  const matrix = [...u32(0x10000), ...u32(0), ...u32(0), ...u32(0), ...u32(0x10000), ...u32(0), ...u32(0), ...u32(0), ...u32(0x40000000)];
  const ftyp = box('ftyp', str('isom'), u32(512), str('isom'), str('iso2'), str('avc1'), str('mp41'));
  const build = (offset) => {
    const avc1 = box('avc1', zeros(6), u16(1), zeros(16), u16(W), u16(H), u32(0x480000), u32(0x480000), u32(0), u16(1), zeros(32), u16(0x18), [255, 255], box('avcC', avcC));
    const offs = []; let o = offset; chunks.forEach((c) => { offs.push(o); o += c.d.length; });
    const stbl = box('stbl',
      full('stsd', 0, 0, u32(1), avc1),
      full('stts', 0, 0, u32(1), u32(n), u32(delta)),
      full('stss', 0, 0, u32(chunks.filter((c) => c.key).length), [].concat(...chunks.map((c, i) => (c.key ? u32(i + 1) : [])))),
      full('stsc', 0, 0, u32(1), u32(1), u32(n), u32(1)),
      full('stsz', 0, 0, u32(0), u32(n), [].concat(...chunks.map((c) => u32(c.d.length)))),
      full('stco', 0, 0, u32(1), u32(offset)));
    const minf = box('minf', full('vmhd', 0, 1, u16(0), u16(0), u16(0), u16(0)), box('dinf', full('dref', 0, 0, u32(1), full('url ', 0, 1))), stbl);
    const mdia = box('mdia', full('mdhd', 0, 0, u32(0), u32(0), u32(TS), u32(dur), u16(0x55c4), u16(0)), full('hdlr', 0, 0, u32(0), str('vide'), zeros(12), str('VideoHandler'), [0]), minf);
    const trak = box('trak', full('tkhd', 0, 3, u32(0), u32(0), u32(1), u32(0), u32(durMs), zeros(8), u16(0), u16(0), u16(0), u16(0), matrix, u32(W << 16), u32(H << 16)), mdia);
    return box('moov', full('mvhd', 0, 0, u32(0), u32(0), u32(1000), u32(durMs), u32(0x10000), u16(0x100), zeros(10), matrix, zeros(24), u32(2)), trak);
  };
  let moov = build(0);
  const dataStart = ftyp.length + moov.length + 8;
  moov = build(dataStart);
  const total = chunks.reduce((a, c) => a + c.d.length, 0);
  return new Blob([new Uint8Array(ftyp), new Uint8Array(moov), new Uint8Array([...u32(8 + total), ...str('mdat')]), ...chunks.map((c) => c.d)], { type: 'video/mp4' });
}`;
module.exports = { MUX };
