// 回帰テスト（node basket-clips/tests/unit.cjs）
// DOM を使わない部分（入れた／入れられたの振り分け・クリップ・ハーフタイムの提案・手直しの引き継ぎ・保存・MP4 の読み取り）を確かめる。
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

function load(files, extra) {
  const ctx = Object.assign({ console, Math, Date, JSON, setTimeout, clearTimeout }, extra || {});
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
  return ctx.BS;
}
let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); } };
const section = (t) => console.log('\n■ ' + t);

const BS = load(['core.js', 'clips.js']);
const C = BS.clips;

section('どちらのチームの得点か（ゴールと前半・後半）');
// ゴールA（hoop 0）は相手、ゴールB（hoop 1）は自分が、動画のはじめに攻めている。100 秒から後半
const setup = { hoopTeam: [1, 0], halfT: 100 };
ok(C.baseTeam({ hoop: 1, t: 50 }, setup) === 0, '前半：ゴールB に入った → 自分の得点（入れた）');
ok(C.baseTeam({ hoop: 0, t: 50 }, setup) === 1, '前半：ゴールA に入った → 相手の得点（入れられた）');
ok(C.baseTeam({ hoop: 1, t: 150 }, setup) === 1, '後半：ゴールB に入った → 相手の得点（入れ替わる）');
ok(C.baseTeam({ hoop: 0, t: 150 }, setup) === 0, '後半：ゴールA に入った → 自分の得点');
ok(C.baseTeam({ hoop: 0, t: 100 }, setup) === 0, '後半の始まりちょうどは後半');
ok(C.baseTeam({ hoop: 0, t: 150 }, { hoopTeam: [1, 0], halfT: null }) === 1, '後半を決めていなければ、動画のはじめの向きのまま');

section('得点の一覧（手直しを含む）');
const result = { shots: [
  { t: 10.0, hoop: 1, made: true, sure: true },
  { t: 20.0, hoop: 0, made: false, sure: true },        // 外れ（一覧に入らない）
  { t: 30.0, hoop: 0, made: true, sure: false },        // 要確認
  { t: 120.0, hoop: 1, made: true, sure: true },        // 後半
  { t: 133.0, hoop: 0, made: true, sure: true }
] };
let items = C.items(result, setup, C.emptyEdits());
ok(items.length === 4, '成功だけが一覧に入る', items.length);
ok(items.map((it) => it.team).join('') === '0110', 'チーム：前半B=自分・前半A=相手・後半B=相手・後半A=自分', items.map((it) => it.team));
ok(items[1].unsure === true && items[0].unsure === false, '「要確認」の印');
ok(items.map((it) => it.half).join('') === '1122', '前半・後半の印');
const id30 = C.shotId(result.shots[2]);
const edits = { fix: { [id30]: 0 }, off: { [C.shotId(result.shots[0])]: true }, added: [{ id: 'm1', t: 60, team: 1 }] };
items = C.items(result, setup, edits);
ok(items.find((it) => it.id === id30).team === 0 && items.find((it) => it.id === id30).fixed, '手で「入れた」に直した得点');
ok(!items.find((it) => it.t === 10).on, '外した得点は on=false');
ok(items.some((it) => it.id === 'm1' && it.team === 1 && !it.auto), '手で足した得点も入る');
ok(items.map((it) => it.t).join(',') === '10,30,60,120,133', '時刻の順に並ぶ');
const swapped = C.items(result, { hoopTeam: [0, 1], halfT: 100 }, edits);
ok(swapped.find((it) => it.id === id30).team === 0 && swapped.find((it) => it.id === 'm1').team === 1, '「⇄ 入れ替える」でも、手で決めたものはそのまま');
ok(swapped.find((it) => it.t === 120).team === 0, '「⇄ 入れ替える」で、自動の分は入れ替わる');

section('「入っていたかも？」（外れと判定したシュート）と「入っていた」');
const r3 = { shots: [
  { t: 10.0, hoop: 1, made: true },
  { t: 11.5, hoop: 1, made: false },      // 得点の直後（同じゴール・2.5 秒以内）→ 候補に出さない
  { t: 40.0, hoop: 1, made: false },      // 自分が打った外れ（ゴールB は自分が攻める）
  { t: 55.0, hoop: 0, made: false }       // 相手が打った外れ
] };
const set3 = { hoopTeam: [1, 0], halfT: null };
let mb = C.maybes(r3, set3, C.emptyEdits());
ok(mb.length === 2 && mb[0].t === 40 && mb[0].team === 0 && mb[1].team === 1, '外れの候補：打ったチームに分かれ、得点の直後のものは出ない', mb.map((m) => [m.t, m.team]));
const e3 = C.emptyEdits();
e3.promote[C.shotId(r3.shots[2])] = true;
const it3 = C.items(r3, set3, e3);
const pr = it3.find((it) => it.t === 40);
ok(pr && pr.promoted && pr.team === 0 && pr.auto, '「入っていた」にした外れは、得点の一覧に入る（ゴールでチームが決まる）');
ok(C.maybes(r3, set3, e3).every((m) => m.t !== 40), '「入っていた」にしたものは候補から消える');
const pc = C.clipsOf(it3, 0, { lead: 4, lag: 1 }, 100).find((c) => c.at === 40);
ok(pc && pc.t1 === 40 + 1 + C.PROMOTE_TAIL, '「入っていた」の場面は、後ろを長めにする（弾んでから入るまで見える）', pc && pc.t1);
const r4 = { shots: [{ t: 40.6, hoop: 1, made: true }] };
const e4 = C.carryEdits(r3, r4, e3);
ok(e4.promote[C.shotId(r4.shots[0])], '解析をやり直しても「入っていた」の印は同じシュートへ引き継ぐ', e4.promote);

section('クリップ（5秒）と、続けて再生の区間');
const cl = C.clipsOf(C.items(result, setup, C.emptyEdits()), 0, null, 140);
ok(cl.length === 2 && cl[0].t0 === 6 && cl[0].t1 === 11, '入った瞬間の前4秒・後1秒（＝5秒）', cl[0]);
ok(cl[1].t1 === 134 && cl[1].n === 2 && cl[1].total === 2, '番号と本数・動画の終わりで切れる', cl[1]);
const cl2 = C.clipsOf([{ id: 'a', t: 1, team: 0, on: true }], 0, { lead: 4, lag: 1 }, 100);
ok(cl2[0].t0 === 0, '動画の頭より前にはならない');
const overlap = C.reel([{ id: 'a', t0: 10, t1: 15, on: true }, { id: 'b', t0: 13, t1: 18, on: true }, { id: 'c', t0: 30, t1: 35, on: false }]);
ok(overlap.length === 2 && overlap[1].t0 === 15 && overlap[1].t1 === 18, '重なった分は、後ろの区間から削る（同じところを2回見せない）', overlap);
ok(!overlap.some((s) => s.ids.includes('c')), '外した場面は入らない');
const nearly = C.reel([{ id: 'a', t0: 10, t1: 15, on: true }, { id: 'b', t0: 10.2, t1: 15.2, on: true }]);
ok(nearly.length === 1 && nearly[0].ids.length === 2 && nearly[0].t1 === 15.2, 'ほとんど重なるなら1つにまとめる', nearly);

section('ハーフタイムの提案');
const mk = (ts) => ({ shots: ts.map((t, i) => ({ t, hoop: i % 2, made: i % 3 === 0 })) });
const game = mk([30, 60, 90, 130, 170, 210, 250, 600, 640, 680, 720, 760]);       // 250〜600 に 350 秒のすき間
const sug = C.suggestHalf(game, 900);
ok(sug && sug.from === 250 && sug.to === 600 && sug.at > 250 && sug.at < 600, '4分以上シュートのない時間を、後半の始まりとして提案', sug);
ok(!C.suggestHalf(mk([30, 60, 90, 130, 170, 210, 250, 400, 440, 480]), 600), '短いすき間（2.5分）は提案しない');
ok(!C.suggestHalf(mk([30, 60, 400, 430, 460, 490, 520]), 600), '前後にシュートが少ない（動画の端の空白）は提案しない');
ok(!C.suggestHalf(mk([30, 60, 90]), 600), 'シュートが少なすぎるときは提案しない');

section('解析をやり直したときの手直しの引き継ぎ');
const r1 = { shots: [{ t: 10.0, hoop: 1, made: true }, { t: 50.0, hoop: 0, made: true }] };
const r2 = { shots: [{ t: 10.4, hoop: 1, made: true }, { t: 52.5, hoop: 0, made: true }] };
const e1 = { fix: { [C.shotId(r1.shots[0])]: 1 }, off: { [C.shotId(r1.shots[1])]: true, m9: true }, added: [{ id: 'm9', t: 80, team: 0 }] };
const e2 = C.carryEdits(r1, r2, e1);
ok(e2.fix[C.shotId(r2.shots[0])] === 1, '同じ得点（1.5 秒以内・同じゴール）には、手で決めたチームを引き継ぐ', e2);
ok(!e2.off[C.shotId(r2.shots[1])], '離れすぎた得点（2.5 秒）には引き継がない');
ok(e2.added.length === 1 && e2.off.m9, '手で足した得点はそのまま残る');

section('ゴールが映っていた時間');
const cov = C.coverage({ spans: [[0, 50, 1], [50, 60, 3], [60, 100, 2]] }, 100, 2);
ok(Math.abs(cov[0] - 0.6) < 0.01 && Math.abs(cov[1] - 0.5) < 0.01, 'ゴールごとの割合', cov);

section('保存（動画ごと）');
const mem = {};
const fakeLS = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };
const BS2 = load(['core.js', 'clips.js', 'store.js'], { localStorage: fakeLS });
const S2 = BS2.store;
const key = S2.videoKey({ name: 'game.mp4', size: 123, lastModified: 456 });
ok(key === 'game.mp4|123|456', '動画の見分け：名前・大きさ・更新日時', key);
const st = S2.fresh();
st.teams[0] = { color: '#2f6fed', colorName: '青', name: '致遠館' };
st.result = { shots: [{ t: 1, hoop: 0, made: true }] };
st.edits.off.x = true;
S2.save(key, st);
const back = S2.load(key);
ok(back && back.result.shots.length === 1 && back.edits.off.x && back.teams[0].name === '致遠館', '保存して読み戻せる');
ok(S2.fresh().teams[0].colorName === '青', '次の動画でも、前回の色から始まる');
ok(S2.load('nothing') === null, '保存していない動画は null');

section('MP4 の読み取り（H.264・HEVC・VP9・AV1）');
const BS3 = load(['core.js', 'mp4.js']);
let ffmpeg = true;
try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); } catch (e) { ffmpeg = false; }
if (!ffmpeg) console.log('  （ffmpeg がないので省きます）');
const pending = [];
if (ffmpeg) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bclip-mp4-'));
  const kinds = [['h264', ['-c:v', 'libx264', '-pix_fmt', 'yuv420p'], /^avc1\.64/], ['hevc', ['-c:v', 'libx265', '-tag:v', 'hvc1', '-pix_fmt', 'yuv420p', '-x265-params', 'log-level=error'], /^hvc1\./],
    ['vp9', ['-c:v', 'libvpx-vp9', '-pix_fmt', 'yuv420p', '-b:v', '200k'], /^vp09\.00\.\d\d\.08$/], ['av1', ['-c:v', 'libsvtav1', '-pix_fmt', 'yuv420p', '-preset', '12', '-svtav1-params', 'verbosity=0'], /^av01\.0\.\d\dM\.08$/]];
  for (const [name, args, re] of kinds) {
    const f = path.join(dir, name + '.mp4');
    try { execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc=size=320x180:rate=30', '-t', '1', ...args, f], { stdio: 'ignore' }); }
    catch (e) { console.log(`  （${name} のエンコーダーがないので省きます）`); continue; }
    const buf = fs.readFileSync(f);
    const reader = { size: buf.length, read: async (a, b) => new Uint8Array(buf.buffer, buf.byteOffset + a, Math.min(b, buf.length) - a) };
    pending.push(BS3.mp4.open(reader).then((tr) => {
      ok(re.test(tr.codec) && tr.width === 320 && tr.height === 180 && tr.count === 30, `${name}：${tr.codec}・320×180・30コマ`, { codec: tr.codec, count: tr.count });
      if (name === 'vp9') ok(tr.description === undefined, 'VP9 は description なし（VideoDecoder に null を渡さない）');
    }, (e) => ok(false, name + ' を読めない', e.message)));
  }
  Promise.all(pending).then(() => fs.rmSync(dir, { recursive: true, force: true }));
}

Promise.all(pending).then(() => {
  console.log(`\n${pass} ok / ${fail} fail`);
  process.exit(fail ? 1 : 0);
});
