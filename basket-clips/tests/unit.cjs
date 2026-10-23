// 回帰テスト（node basket-clips/tests/unit.cjs）
// DOM を使わない部分（入れた／入れられたの振り分け・クリップ・ハーフタイムの提案・手直しの引き継ぎ・保存・MP4 の読み取り、
// 「バスケ タップ記録」の記録の読み込み・時刻あわせ・場面・撮影時刻）を確かめる。
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
  { t: 10.0, hoop: 1, made: true, sure: true, tier: 'made' },
  { t: 20.0, hoop: 0, made: false, sure: true, tier: 'miss' },        // 外れ（一覧に入らない）
  { t: 30.0, hoop: 0, made: true, sure: true, tier: 'made' },
  { t: 120.0, hoop: 1, made: true, sure: true, tier: 'made' },        // 後半
  { t: 133.0, hoop: 0, made: true, sure: true, tier: 'made' }
] };
let items = C.items(result, setup, C.emptyEdits());
ok(items.length === 4, '「入った」だけが一覧に入る', items.length);
ok(items.map((it) => it.team).join('') === '0110', 'チーム：前半B=自分・前半A=相手・後半B=相手・後半A=自分', items.map((it) => it.team));
ok(C.autoTier({ made: true, sure: false }) === 'maybe' && C.autoTier({ made: true }) === 'made' && C.autoTier({ made: false }) === 'miss', '3段の判定がない古い結果：要確認の成功は「たぶん入った」、外れは「外れ」とみなす');
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

section('3段の判定（入った・たぶん入った・外れ）と、人が決める');
const r3 = { shots: [
  { t: 10.0, hoop: 1, made: true, tier: 'made' },
  { t: 11.5, hoop: 1, made: false, tier: 'miss' },                    // 得点の直後（同じゴール・2.5 秒以内）→ 同じシュート。どこにも出さない
  { t: 40.0, hoop: 1, made: false, tier: 'maybe', why: 'bounce' },    // 自分が打った（ゴールB は自分が攻める）。リングに来たあとネットが揺れた
  { t: 55.0, hoop: 0, made: false, tier: 'miss' },                    // 相手が打った外れ
  { t: 70.0, hoop: 0, made: false, tier: 'maybe', why: 'net' },       // ボールは見えないが、ネットが大きく揺れた
  { t: 85.0, hoop: 1, made: true, tier: 'maybe', why: 'faint' }       // ボールは通ったが、ネットの揺れが小さい
] };
const set3 = { hoopTeam: [1, 0], halfT: null };
const id3 = (i) => C.shotId(r3.shots[i]);
let mb = C.maybes(r3, set3, C.emptyEdits());
ok(mb.map((m) => [m.t, m.team, m.why].join(':')).join(' ') === '40:0:bounce 70:1:net 85:0:faint', '「たぶん入った」：打ったチームに分かれ、理由つき', mb.map((m) => [m.t, m.team, m.why]));
ok(C.misses(r3, set3, C.emptyEdits()).map((m) => m.t).join(',') === '55', '「外れ」：得点の直後のもの（同じシュート）は出さない');
ok(C.items(r3, set3, C.emptyEdits()).map((it) => it.t).join(',') === '10', '得点の一覧は「入った」だけ（たぶん入った・外れは入らない）');
const e3 = C.emptyEdits();
e3.judge[id3(2)] = 'made';
e3.judge[id3(5)] = 'miss';
const it3 = C.items(r3, set3, e3);
const pr = it3.find((it) => it.t === 40);
ok(pr && pr.promoted && pr.team === 0 && pr.auto, '「入った」にしたものは、得点の一覧に入る（ゴールでチームが決まる・確かめた印）');
ok(C.maybes(r3, set3, e3).map((m) => m.t).join(',') === '70', '決めたものは「たぶん入った」から消える');
ok(C.misses(r3, set3, e3).map((m) => m.t).join(',') === '55,85', '「外れ」にしたものは、外れに入る');
const pc = C.clipsOf(it3, 0, { lead: 4, lag: 1 }, 100).find((c) => c.at === 40);
ok(pc && pc.t1 === 40 + 1 + C.PROMOTE_TAIL, '確かめて入れた場面は、後ろを長めにする（弾んでから入るまで見える）', pc && pc.t1);
const eOld = C.emptyEdits();
eOld.promote[id3(3)] = true;
ok(C.items(r3, set3, eOld).some((it) => it.t === 55 && it.promoted), '前の版の「入っていた」（promote）も、入ったとして扱う');
const r4 = { shots: [{ t: 40.6, hoop: 1, made: false, tier: 'maybe' }, { t: 85.3, hoop: 1, made: true, tier: 'maybe' }] };
const e4 = C.carryEdits(r3, r4, Object.assign(e3, { rec: { [id3(2)]: { type: '3', no: '7' } } }));
ok(e4.judge[C.shotId(r4.shots[0])] === 'made' && e4.judge[C.shotId(r4.shots[1])] === 'miss', '解析をやり直しても、人が決めた「入った」「外れ」は同じシュートへ引き継ぐ', e4.judge);
ok(e4.rec[C.shotId(r4.shots[0])] && e4.rec[C.shotId(r4.shots[0])].no === '7', '記録（2点・3点・番号）も引き継ぐ', e4.rec);

section('📋 記録（シュート・リバウンド・2点/3点/FT）と集計');
{
  const E = C.emptyEdits();
  E.judge[id3(2)] = 'made';
  E.judge[id3(5)] = 'miss';
  E.added.push({ id: 'm1', t: 60, team: 1 }, { id: 'm2', t: 90, team: 0, res: 'miss' });
  const rows0 = C.record(r3, set3, E);
  ok(rows0.map((r) => `${r.t}:${r.res}:${r.team}`).join(' ') === '10:made:0 40:made:0 55:miss:1 60:made:1 70:maybe:1 85:miss:0 90:miss:0', 'ゴールに来たシュートを時刻順に全部（入った・外れ・確認待ち・手で足したもの）', rows0.map((r) => [r.t, r.res, r.team]));
  ok(rows0.find((r) => r.t === 70).res === 'maybe' && rows0.find((r) => r.t === 85).res === 'miss' && rows0.find((r) => r.t === 90).res === 'miss', '結果：確認待ち・人が決めた外れ・手で足した外れ');
  E.rec = {
    [id3(0)]: { type: '3', no: '7' },                               // 自分 #7 の 3点（成功）
    [id3(2)]: { type: '2', no: '7' },                               // 自分 #7 の 2点（確かめて入った）
    [id3(3)]: { type: '2', no: '5', reb: 0, rno: '4' },             // 相手 #5 の 2点の外れ → 自分 #4 がリバウンド（ディフェンス）
    [id3(5)]: { type: 'ft', no: '9', reb: 0, rno: '9' }             // 自分 #9 のフリースローの外れ → 自分 #9 がリバウンド（オフェンス）
  };
  const st = C.stats(C.record(r3, set3, E));
  const T0 = st.teams[0], T1 = st.teams[1];
  ok(T0.pts === 5 && T0.shots['3'].join('/') === '1/1' && T0.shots['2'].join('/') === '1/1' && T0.shots.ft.join('/') === '0/1' && T0.shots['?'].join('/') === '0/1', '自分：得点 5（3点 1/1・2点 1/1・FT 0/1・種類なし 0/1）', T0);
  ok(T0.oreb === 1 && T0.dreb === 1, '自分：リバウンド（オフェンス 1・ディフェンス 1）', [T0.oreb, T0.dreb]);
  ok(T1.pts === 2 && T1.guess === 1 && T1.shots['2'].join('/') === '0/1' && T1.pending === 1, '相手：種類なしの成功は 2 点として数え、確認待ちは数えない', T1);
  const p0 = st.players[0];
  ok(p0.map((p) => p.no).join(',') === '4,7,9' && p0.find((p) => p.no === '7').pts === 5 && p0.find((p) => p.no === '4').dreb === 1 && p0.find((p) => p.no === '9').oreb === 1, '番号ごと：得点・リバウンド', p0);
  const csv = C.recordCSV(C.record(r3, set3, E), ['致遠館', '相手校'], (t) => BS.fmtTime(t));
  const lines = csv.trim().split(/\r\n/);
  ok(lines.length === 8 && lines[0].startsWith('時刻,前後半,ゴール,チーム,結果,種類,打った人'), 'CSV：見出し＋シュートごとに1行', lines.length);
  ok(lines.some((l) => l.includes('相手校,外れ,2点,5,致遠館,4,ディフェンス')) && lines.some((l) => l.includes('致遠館,入った,3点,7')), 'CSV：結果・種類・番号・リバウンド（オフェンス／ディフェンス）', lines);
}

section('ネットの揺れから3段に分ける（auto.js の classify）');
{
  const BA = load(['core.js', 'vision.js', 'auto.js']);
  const A = BA.auto;
  // 15 コマ/秒のネットの動きの記録 [t, netFg, netOnly, sideFg, fg, cx, cy, w, aboveFg]。ふだんは 0.02
  const ser = [];
  const at = (t) => ser.find((r) => Math.abs(r[0] - t) < 0.034);
  for (let k = 0; k < 15 * 120; k++) { const t = k / 15; ser.push([t, 0.02, 0.02, 0.0, 0.03, 300, 200, 30, 0]); }
  const bump = (t0, vals) => vals.forEach((v, i) => { const r = at(t0 + i / 15); r[1] = r[2] = v; });
  bump(10, [0.3, 0.5, 0.55, 0.5, 0.45, 0.4, 0.3, 0.2, 0.15, 0.1, 0.05]);         // 入った：急に大きく揺れて、すぐ収まる
  bump(30, [0.2, 0.25, 0.2, 0.1]);                                             // 弱い揺れ（リングで弾んだ外れ）
  bump(90, [0.35, 0.5, 0.5, 0.45, 0.4, 0.35, 0.3, 0.2, 0.15, 0.1]);             // シュートは見えないが、入ったような揺れ
  for (let i = 0; i < 40; i++) { const r = at(50 + i / 15); r[5] = 300 + i * 18; r[2] = r[1] = Math.min(0.45, 0.02 + i * 0.02); }   // カメラを振ったあと、ゆっくり上がって下がらない
  const shots = [{ t: 10.3, hoop: 0, made: true, sure: true }, { t: 29.8, hoop: 0, made: false }, { t: 70, hoop: 0, made: true, sure: true }];
  A.classify(shots, [ser]);
  const by = (t) => shots.find((s) => Math.abs(s.t - t) < 0.5);
  ok(by(10.3).tier === 'made', 'ボールがリングを通り、ネットも大きく揺れた → 入った');
  ok(by(29.8).tier === 'miss', 'リングに来て、ネットの揺れが弱い → 外れ');
  ok(by(70).tier === 'maybe' && by(70).why === 'faint', 'ボールは通ったが、ネットが揺れていない → たぶん入った（確かめる）');
  ok(by(90) && by(90).tier === 'maybe' && by(90).why === 'net' && !by(90).made, 'シュートは見えないが、ネットが大きく揺れた → たぶん入った（シュートとして足す）');
  ok(!shots.some((s) => s.t > 49 && s.t < 54), 'カメラを振ったあとの、ゆっくり上がって下がらない動きは使わない', shots.map((s) => [s.t, s.tier]));
}

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

section('ゴールの自動検出（リング＋ネットを探す）');
{
  const BG = load(['core.js', 'vision.js', 'goalfind.js']);
  const G = BG.goalfind;
  /* 絵を描く小さな道具（RGBA）。体育館の床・壁、リングとネット、まぎらわしい物（ボール・赤いユニフォーム・オレンジの床の線・観客のオレンジの服） */
  const W = 640, H = 360;
  const img = new Uint8Array(W * H * 4);
  const px = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const p = (y * W + x) * 4; img[p] = c[0]; img[p + 1] = c[1]; img[p + 2] = c[2]; img[p + 3] = 255; };
  const rect = (x0, y0, x1, y1, c) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) px(x, y, c); };
  const disk = (cx, cy, r, c) => { for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) px(x, y, c); };
  const line = (x0, y0, x1, y1, t, c) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; for (let dy = -t / 2; dy <= t / 2; dy += 0.5) for (let dx = -t / 2; dx <= t / 2; dx += 0.5) px(x + dx, y + dy, c); } };
  const ring = (cx, cy, a, b, t, c) => { for (let i = 0; i < 720; i++) { const q = i / 720 * Math.PI * 2; for (let d = -t / 2; d <= t / 2; d += 0.5) px(cx + (a + d) * Math.cos(q), cy + (b + d) * Math.sin(q), c); } };
  rect(0, 0, W, 150, [40, 44, 54]);                 // 壁（暗い）
  rect(0, 150, W, H, [168, 117, 69]);               // 木の床（オレンジがかった茶色）
  rect(0, 40, W, 46, [154, 163, 178]);              // ギャラリーの手すり
  for (let x = 20; x < W; x += 34) rect(x, 20, x + 9, 38, (x / 34) % 3 ? [70, 110, 200] : [240, 123, 63]);   // 観客（オレンジの服も）
  // ゴール：白いボード・内側の四角、リング（オレンジの輪。横長）、白いネット
  const R = { cx: 300, cy: 120, a: 18, b: 5 };
  rect(R.cx - 40, R.cy - 52, R.cx + 40, R.cy + 6, [226, 232, 240]);
  line(R.cx - 13, R.cy - 34, R.cx + 13, R.cy - 34, 2, [250, 250, 250]); line(R.cx - 13, R.cy - 4, R.cx + 13, R.cy - 4, 2, [250, 250, 250]);
  line(R.cx - 13, R.cy - 34, R.cx - 13, R.cy - 4, 2, [250, 250, 250]); line(R.cx + 13, R.cy - 34, R.cx + 13, R.cy - 4, 2, [250, 250, 250]);
  for (let i = 0; i < 9; i++) { const u = -1 + 2 * i / 8; line(R.cx + R.a * u, R.cy + 3, R.cx + R.a * 0.6 * u * 0.9 + 3, R.cy + 30, 1, [245, 245, 245]); }
  ring(R.cx, R.cy, R.a, R.b, 2.5, [255, 106, 26]);
  disk(470, 230, 9, [200, 90, 30]);                 // ボール（塗りつぶした丸）
  rect(120, 190, 150, 240, [224, 65, 58]);          // 赤いユニフォーム
  line(380, 300, 600, 300, 3, [235, 110, 40]);      // オレンジの床の線
  const found = G.findRims(img, W, H);
  const top = found[0];
  ok(top && Math.hypot(top.cx - R.cx, top.cy - R.cy) <= 4 && Math.abs(2 * top.a - 2 * R.a) <= 0.2 * 2 * R.a, 'リング（オレンジの細い輪＋白いネット）を見つける', top && [Math.round(top.cx), Math.round(top.cy), +(2 * top.a).toFixed(1)]);
  ok(found.every((c) => Math.hypot(c.cx - R.cx, c.cy - R.cy) <= 2 * R.a), 'ボール・赤いユニフォーム・オレンジの線・観客の服は、リングとみなさない', found.map((c) => [Math.round(c.cx), Math.round(c.cy)]));
  const tap = G.fitAt(img, W, H, R.cx + 12, R.cy + 9);
  ok(tap && Math.hypot(tap.cx - R.cx, tap.cy - R.cy) <= 4, 'リングのそばをタップすると、そのリングを見つける', tap && [Math.round(tap.cx), Math.round(tap.cy)]);
  ok(!G.fitAt(img, W, H, 480, 300), 'リングのない所をタップしても、何も見つけない');
  const bx = G.boxFromRim({ cx: 300, cy: 120, w: 36 }, W, H);
  ok(bx.x <= 300 - 36 && bx.x + bx.w >= 300 + 36 && bx.y + bx.h > 120 && bx.y < 120 - 36, 'リングから決める追跡の枠は、リングの上（ボードのあたり）を広く含む', bx);
  const gray = BG.vision.toGray(img, W, H, 'rgba');
  const bb = G.boardBox(gray, W, H, { cx: 300, cy: 120, w: 36 });
  ok(bb.x < 300 && bb.x + bb.w > 300 && bb.y < 120 && bb.y + bb.h >= 120, '模様で選ぶ枠も、リングの位置にかかる', bb);
  // 何コマかの候補から、ゴールを2つ選ぶ（同じ見た目＝同じゴール）。自分で教えたゴールがあれば、もう1つだけ
  const mk = (t, cx, cy, a, d) => ({ t, cx, cy, a, b: 4, score: 1.2, fw: W, fh: H, desc: d });
  // 見た目（descriptor と同じく、平均 0・ばらつき 1 にそろえたもの）
  const z = (f) => { const d = new Float32Array(24 * 24).map((v, i) => f(i)); const m = d.reduce((a, v) => a + v, 0) / d.length; const sd = Math.sqrt(d.reduce((a, v) => a + (v - m) * (v - m), 0) / d.length); return d.map((v) => (v - m) / sd); };
  const dA = z((i) => Math.sin(i * 0.37)), dB = z((i) => Math.cos(i * 0.91 + 1));
  const cands = [mk(1, 100, 100, 15, dA), mk(5, 140, 100, 15, dA), mk(9, 500, 110, 14, dB), mk(13, 480, 110, 14, dB), mk(17, 120, 100, 15, dA)];
  const goals = G.pickGoals(cands, 1, W, H);
  ok(goals.length === 2 && Math.abs(goals[0].rim.cx - goals[1].rim.cx) > 200, '何コマにも映る2つのゴールを、1つずつ選ぶ', goals.map((g) => [g.t, g.rim.cx, g.seen]));
  const kn = Object.assign(mk(3, 110, 100, 15, dA), { known: true, score: 99 });
  const g2 = G.pickGoals(cands, 1, W, H, [kn]);
  ok(g2.length === 1 && g2[0].rim.cx > 400, '自分で教えたゴールがあれば、もう片方のゴールだけを選ぶ', g2.map((g) => [g.t, g.rim.cx]));
}

const pending = [];
section('「バスケ タップ記録」の記録（読み込み・時刻あわせ・場面）');
{
  // 記録アプリ（basket-tap/js/core.js）で作って書き出したものを、そのまま読み込めるか（2つのアプリの約束ごと）
  const tctx = { console, Math, Date, JSON };
  tctx.globalThis = tctx;
  vm.createContext(tctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', '..', 'basket-tap', 'js', 'core.js'), 'utf8'), tctx, { filename: 'basket-tap/core.js' });
  const BT = tctx.BT;
  const T0 = Date.UTC(2026, 9, 19, 6, 30, 0);
  const game = BT.newGame({ now: T0, tz: 540, teams: [{ name: '致遠館', players: BT.parseNumbers('4-15').map((no) => ({ no, name: no === '7' ? 'たけし' : '' })) }, { name: '城南', color: '#2f6fed', players: BT.parseNumbers('4-9').map((no) => ({ no })) }] });
  game.startedAt = T0 + 12000;
  BT.addEvent(game, { t: 0, type: 'period', period: 1 });
  [[5, 'fg2', 0, '7'], [20, 'fg2x', 0, '5'], [21.5, 'reb', 1, '9'], [33, 'fg3', 1, '4'], [47, 'pass', 0, '7'], [61, 'fg2', 0, '10'], [78, 'reb', 0, null], [90, 'ft', 1, null], [100, 'mark', 0, '7'], [130, 'fg2', 1, '6']]
    .forEach(([t, type, team, no]) => BT.addEvent(game, { t, type, team, no }));
  BT.addEvent(game, { t: 70, type: 'period', period: 2 });
  const BSL = load(['core.js', 'clips.js', 'mp4.js', 'taplog.js'], { escape, decodeURIComponent });
  const TL = BSL.taplog;
  const log = TL.parse(JSON.stringify(BT.exportData(game)), 'game.json');
  ok(log.teams[0].name === '致遠館' && log.teams[1].color === '#2f6fed' && log.startedAt === T0 + 12000, '記録アプリが書き出した JSON を読み込める（チーム・色・スタートの時刻）');
  ok(TL.plays(log).length === 10 && log.events.every((e, i) => i === 0 || log.events[i - 1].t <= e.t), 'プレー 10 件・時刻の順');
  ok(log.events.find((e) => e.t === 78).period === 2 && log.events.find((e) => e.t === 61).period === 1, 'ピリオド（70 秒から 2Q）');
  ok(TL.eventLabel(log, log.events.find((e) => e.t === 5)) === '#7 たけし 2P成功' && TL.eventLabel(log, log.events.find((e) => e.t === 78), true) === '致遠館 リバウンド', '呼び名：「#7 たけし 2P成功」「致遠館 リバウンド」');
  const stored = TL.parse(JSON.parse(JSON.stringify(game)));      // 記録アプリがブラウザに保存している形（書き出す前）でも読める
  ok(TL.plays(stored).length === 10 && stored.events.find((e) => e.t === 78).period === 2, 'ブラウザに保存された形（同じ端末から読み込むとき）も読める');
  let err = null;
  try { TL.parse({ format: 'basket-tap', teams: [], events: [{ t: 0, type: 'period', period: 1 }] }); } catch (e) { err = e.message; }
  ok(err && /プレーの記録がありません/.test(err), 'プレーのない記録は、分かる言葉で断る', err);
  err = null;
  try { TL.parse('{ broken'); } catch (e) { err = e.message; }
  ok(err && /JSON/.test(err), '壊れたファイルも断る');

  // チームなしの記録（記録の画面の下の「パスミス」「★ あとで見る」。だれのかは決めずに時刻だけ）
  {
    const gf = BT.newGame({ now: T0, tz: 540, teams: [{ name: '致遠館', players: BT.parseNumbers('4-8').map((no) => ({ no })) }, { name: '城南' }] });
    gf.startedAt = T0;
    BT.addEvent(gf, { t: 0, type: 'period', period: 1 });
    [[5, 'fg2', 0, '7'], [10, 'pass', null, null], [15, 'mark', null, null], [20, 'fg3', 1, null], [25, 'pass', 0, '7']].forEach(([t, type, team, no]) => BT.addEvent(gf, { t, type, team, no }));
    const lf = TL.parse(JSON.stringify(BT.exportData(gf)));
    const pf = lf.events.find((e) => e.t === 10), mf = lf.events.find((e) => e.t === 15);
    ok(pf.team === null && pf.no === null && mf.team === null, 'チームなしの記録（パスミス・★）は、チームなしのまま読み込む');
    ok(TL.eventLabel(lf, pf, true) === 'パスミス' && TL.eventLabel(lf, lf.events.find((e) => e.t === 25), true) === '致遠館 #7 パスミス', '呼び名：チームなしは「パスミス」だけ（チーム名を付けない）');
    ok(TL.score(lf).join() === '2,3', 'チームなしの記録があっても、得点は変わらない');
    const A0 = TL.setAnchor([], 0, 0, true);
    const only1 = TL.clips(lf, A0, { teams: [false, true] }, null, 100).clips;
    ok(only1.map((c) => c.type).join() === 'pass,mark,fg3', '「相手だけ」でも、チームなしの記録は外さない（だれのか決めていないため）', only1.map((c) => c.type));
    const cf = TL.counts(lf, {});
    ok(cf.grp.pass === 2 && cf.grp.mark === 1 && cf.players['0:7'] === 2 && Object.keys(cf.players).length === 1, '絞り込みの数：チームなしは選手に入れない', cf);
    const old = TL.parse({ format: 'basket-tap', teams: [], events: [{ t: 1, type: 'fg2', team: null, no: '7' }, { t: 2, type: 'reb', team: 1, no: '4' }] });
    ok(old.events[0].team === 0 && old.events[1].team === 1, 'チームのない得点は、自分のチームの得点にする（得点はチームなしにできない）');
  }

  // 撮影しながら記録した動画（記録の videos）：録画を始めた時刻から、ぴったり合わせる
  {
    const gv = JSON.parse(JSON.stringify(game));
    gv.videos = [{ vid: 'va', n: 1, startedAt: game.startedAt - 2150, duration: 600, name: 'バスケ記録_2026-10-19_1530_致遠館vs城南_動画1.mp4' },
      { vid: 'vb', n: 2, startedAt: game.startedAt + 6530, duration: 300.4, name: 'バスケ記録_2026-10-19_1530_致遠館vs城南_動画2.mp4' }];
    const lv = TL.parse(JSON.stringify(BT.exportData(gv)));
    ok(lv.videos.length === 2 && lv.videos[1].startedAt === game.startedAt + 6530, '記録の videos（動画のファイル名・録画を始めた時刻・長さ）を読み込む');
    const a1 = TL.videoAnchors(lv, lv.videos[0]);
    ok(a1 && a1[0].t === 0 && a1[0].v === 2.15 && TL.toVideo(5, a1) === 7.15, '動画1（スタートの 2.15 秒前から録画）：記録の 0:00 ＝ 動画の 2.15 秒', a1);
    const a2 = TL.videoAnchors(lv, lv.videos[1]);
    ok(a2 && a2[0].t === 6.5 && Math.abs(TL.toVideo(20, a2) - 13.47) < 1e-9, '動画2（スタートの 6.53 秒後から）：記録の 20 秒 ＝ 動画の 13.47 秒', a2);
    ok(TL.matchVideo(lv, 'バスケ記録_2026-10-19_1530_致遠館vs城南_動画2.mp4', 0) === lv.videos[1], '開いた動画を、ファイル名で見つける');
    ok(TL.matchVideo(lv, 'IMG_0123.MOV', 600.8) === lv.videos[0], 'ファイル名が変わっていても、長さ（ほぼ同じ・1本だけ）で見つける');
    ok(TL.matchVideo(lv, 'IMG_0123.MOV', 450) === null && TL.matchVideo(log, 'x.mp4', 600) === null, '長さも名前も合わなければ、見つけない（videos のない記録も）');
  }

  // 時刻あわせ
  ok(TL.toVideo(10, []) === null, '合わせる前は、動画の時刻は決まらない');
  let A = TL.setAnchor([], 0, 12, true);
  ok(TL.toVideo(5, A) === 17 && TL.toVideo(100, A) === 112, '1か所（記録 0:00 ＝ 動画 0:12）で合わせると、全部 12 秒ずれる');
  A = TL.shift(A, -0.5);
  ok(TL.toVideo(5, A) === 16.5, '全部を 0.5 秒前へ');
  const A2 = TL.setAnchor(A, 80, 70, true);           // 撮影を途中で止めた：記録 80 秒 ＝ 動画 70 秒
  ok(TL.toVideo(78, A2) === 89.5 && TL.toVideo(90, A2) === 80, '合わせる点を足すと、その点より後ろの記録は、その点のずれ');
  const A3 = TL.setAnchor(A2, 95, 86, false);          // 95 秒の記録に効いている点（80 秒の点）だけ直す
  ok(A3.length === 2 && TL.toVideo(95, A3) === 86 && TL.toVideo(5, A3) === 16.5, '「⌖」：その記録に効いている点だけを直す（ほかの点はそのまま）', A3);

  // 場面と絞り込み
  const S12 = TL.setAnchor([], 0, 12, true);
  let r = TL.clips(log, S12, {}, { lead: 6, lag: 2 }, 120, {});
  ok(r.clips.length === 9 && r.outside === 1, '動画（120 秒）の中の場面 9・外 1（記録 130 秒 → 動画 142 秒）', { n: r.clips.length, out: r.outside });
  const c0 = r.clips[0];
  ok(c0.at === 17 && c0.t0 === 11 && c0.t1 === 19 && c0.label === '#7 たけし 2P成功' && c0.n === 1 && c0.total === 9, '1場面：タップの前 6 秒・後 2 秒（動画 0:11〜0:19）', c0);
  r = TL.clips(log, S12, { groups: { score: true } }, null, 120);
  ok(r.clips.map((c) => c.t).join() === '5,33,61,90', '「得点」だけ', r.clips.map((c) => c.t));
  r = TL.clips(log, S12, { players: ['0:7'] }, null, 120);
  ok(r.clips.map((c) => c.type).join() === 'fg2,pass,mark', '「#7（自分）」だけ：2P成功・パスミス・★');
  r = TL.clips(log, S12, { teams: [false, true] }, null, 120);
  ok(r.clips.every((c) => c.team === 1) && r.clips.length === 3, '相手のチームだけ');
  r = TL.clips(log, S12, {}, null, 120, { [log.events.find((e) => e.t === 47).id]: true });
  ok(r.clips.find((c) => c.t === 47).on === false, '外した場面は on=false');
  const cnt = TL.counts(log, {});
  ok(cnt.grp.score === 5 && cnt.grp.reb === 2 && cnt.players['0:7'] === 3 && cnt.players['1:4'] === 1, '絞り込みの数（まとまり・選手）', cnt);
  // 重なる場面は、続けて再生で1つにつながる（taplog.reel）
  const all = TL.clips(log, S12, {}, { lead: 6, lag: 2 }, 120).clips;
  const merged = TL.reel(all);
  const mr = merged.find((x) => x.ids.length === 2);
  ok(mr && mr.t0 === 26 && mr.t1 === 35.5 && merged.length === all.length - 1, '近い場面（2P失敗 → 1.5 秒後のリバウンド）は、1つの場面（0:26〜0:35.5）につながる', mr);
  const chain = TL.reel([0, 5, 10, 15, 20, 25].map((t, i) => ({ id: 'c' + i, t0: t, t1: t + 8, on: true })), 24);
  ok(chain.length === 2 && chain[0].t1 - chain[0].t0 <= 24 && chain[1].t0 === chain[0].t1, '続けてつなぐのは 24 秒まで（そのあとは、重なった分を削って次の場面に）', chain.map((x) => [x.t0, x.t1]));
  ok(TL.reel([{ id: 'a', t0: 0, t1: 8, on: true }, { id: 'b', t0: 2, t1: 9, on: false }]).length === 1, '外した場面は入れない');

  // 自動で探した得点と照らし合わせる（人のタップは 0.3〜2 秒遅れる。見落とし・まちがいもある）
  const made = TL.plays(log).filter((e) => TL.TYPES[e.type].made).map((e) => e.t);       // 5, 33, 61, 90, 130
  const shotsV = [5 + 12 - 1.2, 33 + 12 - 0.4, 61 + 12 - 1.9, 90 + 12 - 0.8, 55, 151];    // 130 の得点は見落とし・55 と 151 は誤り
  const m = TL.matchShots(log, shotsV);
  ok(m && m.matched === 4 && Math.abs(m.offset - (12 - 1)) <= 1, `照らし合わせ：記録の得点 ${made.length} 本のうち 4 本が重なる・ずれ ${m && m.offset} 秒（タップの遅れぶん、12 秒より少し小さい）`, m);
  ok(TL.matchShots(log, [3, 50]) === null, '数が少なすぎると、照らし合わせない');

  // 撮影時刻から合わせる
  const fc = TL.fromCreation(log, T0, 120);
  ok(fc && fc.anchors[0].t === 0 && fc.anchors[0].v === 12 && fc.inside === 9, '撮影の始まり 15:30:00・記録のスタート 15:30:12 → 記録 0:00 ＝ 動画 0:12');
  ok(TL.fromCreation(log, T0 - 3600000, 120) === null, '1時間ずれた（別の試合の）動画では合わせない');
  ok(TL.parseISO('2026-10-19T15:30:00+0900') === T0 && TL.parseISO('2026-10-19T06:30:00Z') === T0 && TL.parseISO('2026-10-19T15:30:00.500+09:00') === T0 + 500, '撮影時刻の書式（+0900・Z・+09:00）');
  // 同じ端末の記録の一覧（localStorage）
  const mem = { 'btap:games': JSON.stringify([{ id: 'g1', n: 3, startedAt: 2 }, { id: 'g0', n: 0 }, { id: 'g2', n: 5, startedAt: 9 }]), 'btap:game:g2': JSON.stringify(game) };
  const fake = { getItem: (k) => (k in mem ? mem[k] : null) };
  ok(TL.localGames(fake).map((g) => g.id).join() === 'g2,g1' && TL.localGame('g2', fake).id === game.id, '同じ端末で記録した試合の一覧（記録のないものは出さない）');

  // 撮影時刻を、動画のファイル（MP4 / MOV）から読む
  let ff = true;
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); } catch (e) { ff = false; }
  if (!ff) console.log('  （ffmpeg がないので、撮影時刻の読み取りは省きます）');
  else {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bclip-meta-'));
    const mk = (name, extra) => { const f = path.join(dir, name); execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc=size=160x90:rate=30', '-t', '3', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', ...extra, f], { stdio: 'ignore' }); return fs.readFileSync(f); };
    const files = [
      ['mvhd.mp4', ['-metadata', 'creation_time=2026-10-19T06:31:03Z'], T0 + 60000, 'mvhd', '作成時刻（mvhd・撮影を終えた時刻）から動画の長さ 3 秒を引く'],
      ['apple.mov', ['-movflags', 'use_metadata_tags', '-metadata', 'com.apple.quicktime.creationdate=2026-10-19T15:30:00+0900', '-metadata', 'creation_time=2026-10-19T06:31:03Z'], T0, 'apple', 'iPhone の撮影開始時刻（com.apple.quicktime.creationdate）があれば、そちらを使う'],
      ['none.mp4', [], null, null, '撮影時刻がない動画は、目安なし']
    ];
    try {
      for (const [name, extra, want, how, label] of files) {
        const buf = mk(name, extra);
        const reader = { size: buf.length, read: async (a, b) => new Uint8Array(buf.buffer, buf.byteOffset + a, Math.min(b, buf.length) - a) };
        pending.push(BSL.mp4.readMoov(reader).then((moov) => {
          const ct = TL.creationTime(moov);
          ok(want == null ? ct === null : (ct && ct.start === want && ct.how === how), label, ct);
        }));
      }
    } catch (e) { console.log('  （撮影時刻のテスト用の動画を作れないので省きます）', e.message); }
    Promise.all(pending).then(() => fs.rmSync(dir, { recursive: true, force: true }));
  }
}

section('MP4 の読み取り（H.264・HEVC・VP9・AV1）');
const BS3 = load(['core.js', 'mp4.js']);
let ffmpeg = true;
try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); } catch (e) { ffmpeg = false; }
if (!ffmpeg) console.log('  （ffmpeg がないので省きます）');
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
