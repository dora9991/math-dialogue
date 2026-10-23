// 細切れの MP4 → ふつうの MP4（js/fmp4.js）の確かめ：node basket-tap/tests/fmp4.cjs
// ffmpeg で、ブラウザの録画と同じ形の「細切れの MP4」（empty_moov・moof＋mdat のくり返し）を作り、組み直す。
// 組み直した MP4 を ffprobe・ffmpeg で読み、元の動画とコマの中身・時刻が全部同じかを確かめる。ffmpeg がなければ飛ばす。
const fs = require('fs');
const path = require('path');
const os = require('os');
const vm = require('vm');
const { execFileSync } = require('child_process');

let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); } };
const has = (cmd) => { try { execFileSync(cmd, ['-version'], { stdio: 'ignore' }); return true; } catch (e) { return false; } };
if (!has('ffmpeg') || !has('ffprobe')) { console.log('ffmpeg・ffprobe がないので飛ばします'); process.exit(0); }

const ctx = { console, Math, Date, JSON, Blob, DataView, Uint8Array, Promise };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'fmp4.js'), 'utf8'), ctx, { filename: 'fmp4.js' });
const F = ctx.BT.fmp4;
const W = fs.mkdtempSync(path.join(os.tmpdir(), 'btap-fmp4-'));
const ff = (args) => execFileSync('ffmpeg', ['-loglevel', 'error', '-y'].concat(args));
const FRAG = ['-movflags', 'frag_keyframe+empty_moov+default_base_moof'];
const probe = (f) => JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-count_packets', '-show_entries', 'format=duration:stream=codec_type,codec_name,nb_read_packets,start_time', '-of', 'json', f]).toString());
/* 各コマの「時刻・中身の指紋」（デコードしたもの） */
const frames = (f) => execFileSync('ffmpeg', ['-v', 'error', '-i', f, '-f', 'framemd5', '-']).toString().split('\n').filter((l) => l && l[0] !== '#').map((l) => { const c = l.split(/,\s*/); return [c[0], c[2], c[5]].join(' '); });
const tops = (f) => { const d = fs.readFileSync(f); const out = []; let p = 0; while (p + 8 <= d.length) { let sz = d.readUInt32BE(p); const ty = d.toString('latin1', p + 4, p + 8); if (sz === 1) sz = Number(d.readBigUInt64BE(p + 8)); if (sz < 8) break; out.push(ty); p += sz; } return out; };
async function flat(src, dst) {
  const blob = new Blob([fs.readFileSync(src)]);
  const plan = await F.flatten(blob);
  fs.writeFileSync(dst, Buffer.from(await F.compose(blob, plan).arrayBuffer()));
  return plan;
}
/* 元と組み直しが同じか（コマの数・時刻・中身・長さ） */
function same(a, b) {
  const pa = probe(a), pb = probe(b);
  const fa = frames(a), fb = frames(b);
  const packets = (p) => p.streams.map((s) => s.codec_type + ':' + s.nb_read_packets).sort().join(',');
  return { ok: fa.length > 0 && fa.join('\n') === fb.join('\n') && packets(pa) === packets(pb) && Math.abs(+pa.format.duration - +pb.format.duration) < 0.06, a: packets(pa), b: packets(pb), da: pa.format.duration, db: pb.format.duration, frames: fa.length };
}

(async () => {
  try {
    console.log('\n■ H.264＋AAC（B フレームあり）');
    const a = path.join(W, 'h264.mp4'), af = path.join(W, 'h264_flat.mp4');
    ff(['-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=30', '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=44100', '-t', '7', '-c:v', 'libx264', '-g', '15', '-bf', '2', '-c:a', 'aac'].concat(FRAG, [a]));
    ok(tops(a).filter((t) => t === 'moof').length >= 5, `元は細切れの MP4（moof ${tops(a).filter((t) => t === 'moof').length} 個）`);
    let plan = await flat(a, af);
    ok(plan.flat && !plan.truncated && plan.tracks.length === 2, `組み直した（${plan.tracks.map((t) => `${t.handler} ${t.samples}`).join('・')}・${plan.duration.toFixed(2)} 秒）`, plan.tracks);
    ok(!tops(af).includes('moof') && tops(af).join(' ') === 'ftyp moov mdat', `ふつうの MP4：${tops(af).join(' ')}`);
    let r = same(a, af);
    ok(r.ok, `コマの中身・時刻（${r.frames} コマ）・数・長さが元と同じ`, r);

    console.log('\n■ VP9＋Opus（Chrome の録画と同じ組み合わせ）');
    const b = path.join(W, 'vp9.mp4'), bf = path.join(W, 'vp9_flat.mp4');
    ff(['-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=25', '-f', 'lavfi', '-i', 'sine=frequency=330:sample_rate=48000', '-t', '6', '-c:v', 'libvpx-vp9', '-deadline', 'realtime', '-cpu-used', '8', '-g', '25', '-c:a', 'libopus'].concat(FRAG, [b]));
    plan = await flat(b, bf);
    r = same(b, bf);
    ok(plan.flat && r.ok, `VP9＋Opus も同じ（${r.frames} コマ・${plan.duration.toFixed(2)} 秒）`, r);

    console.log('\n■ 録画の途中で閉じた（最後が切れている）');
    const c = path.join(W, 'cut.mp4'), cf = path.join(W, 'cut_flat.mp4');
    const d = fs.readFileSync(a);
    fs.writeFileSync(c, d.subarray(0, Math.floor(d.length * 0.6)));
    plan = await flat(c, cf);
    const pc = probe(cf);
    ok(plan.flat && plan.truncated && plan.duration > 2 && plan.duration < 6, `切れていても、そろっている所まで（${plan.duration.toFixed(2)} 秒）`, plan.tracks);
    let decodeOk = true;
    try { execFileSync('ffmpeg', ['-v', 'error', '-xerror', '-i', cf, '-f', 'null', '-']); } catch (e) { decodeOk = false; }
    ok(decodeOk && pc.streams.length === 2, '組み直した MP4 は、最後までエラーなく読める');

    console.log('\n■ 映像の始まりが音より遅い（tfdt が 0 でない）');
    // 映像の tfdt を全部 0.5 秒ぶん後ろへずらした細切れ MP4 を作る
    const e = path.join(W, 'lead.mp4'), ef = path.join(W, 'lead_flat.mp4');
    const L = Buffer.from(fs.readFileSync(a));
    (function patch(p, end, inTraf, tid) {
      while (p + 8 <= end) {
        const sz = L.readUInt32BE(p), ty = L.toString('latin1', p + 4, p + 8);
        if (ty === 'moof') patch(p + 8, p + sz, false, null);
        else if (ty === 'traf') { let q = p + 8, id = null; while (q < p + sz) { const s2 = L.readUInt32BE(q); if (L.toString('latin1', q + 4, q + 8) === 'tfhd') id = L.readUInt32BE(q + 12); q += s2; } patch(p + 8, p + sz, true, id); }
        else if (ty === 'tfdt' && inTraf && tid === 1) { const v1 = L[p + 8] === 1; if (v1) L.writeBigUInt64BE(L.readBigUInt64BE(p + 12) + 7680n, p + 12); else L.writeUInt32BE(L.readUInt32BE(p + 12) + 7680, p + 12); }
        p += sz;
      }
    })(0, L.length, false, null);
    fs.writeFileSync(e, L);
    plan = await flat(e, ef);
    const pe = probe(ef);
    const vst = pe.streams.find((s) => s.codec_type === 'video');
    // （元の細切れ MP4 は tfdt だけを書きかえた作り物なので、全体の長さの表示は比べない。コマの時刻と中身を比べる）
    const fe = frames(e), fef = frames(ef);
    const vst0 = probe(e).streams.find((s) => s.codec_type === 'video');
    ok(Math.abs(+vst.start_time - +vst0.start_time) < 0.01 && +vst.start_time > 0.5 && fe.length > 0 && fe.join('\n') === fef.join('\n') && Math.abs(plan.duration - 7.5) < 0.1,
      `映像の最初のコマは元と同じ ${(+vst.start_time).toFixed(3)} 秒（0.5 秒の空き＋B フレームのずれ。編集リスト）・コマの時刻と中身も同じ（${fe.length} コマ）`, { start: vst.start_time, orig: vst0.start_time, dur: plan.duration });

    console.log('\n■ もともと、ふつうの MP4');
    const n = path.join(W, 'normal.mp4');
    ff(['-f', 'lavfi', '-i', 'testsrc2=size=160x90:rate=10', '-t', '2', '-c:v', 'libx264', n]);
    plan = await F.flatten(new Blob([fs.readFileSync(n)]));
    ok(plan.flat === false, 'ふつうの MP4 は、そのまま使う（flat: false）');
    let threw = null;
    try { await F.flatten(new Blob([Buffer.from('not a video at all')])); } catch (err) { threw = err.message; }
    ok(threw && /moov/.test(threw), 'MP4 でないものは、分かる言葉で断る', threw);
  } catch (err) {
    fail++;
    console.log('  FAIL 途中で止まりました:', err && err.stack || err);
  } finally {
    fs.rmSync(W, { recursive: true, force: true });
  }
  console.log(`\n${pass} ok / ${fail} fail`);
  process.exit(fail ? 1 : 0);
})();
