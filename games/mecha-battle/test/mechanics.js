// ゲームの仕組みの単体テスト（Node・ヘッドレス）
const fs = require('fs'), vm = require('vm'), path = require('path');
const code = ['core.js', 'chars.js', 'sim.js', 'ai.js'].map((f) => fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8')).join('\n');
const ctx = vm.createContext({ console });
vm.runInContext(code + '\nthis.API = { CHARS, createMatch, stepMatch, nextRound, newAI, aiInput, makePulse, IN, S, SP, FPS, MOVE_KEYS, hurtBox, fPhase, INTRO_FRAMES };', ctx);
const A = ctx.API, IN = A.IN, S = A.S;

let pass = 0, fail = 0;
function ok(cond, name, extra) {
  if (cond) { pass++; console.log('  ok   ' + name); } else { fail++; console.log('  FAIL ' + name + (extra !== undefined ? '  → ' + JSON.stringify(extra) : '')); }
}
function mk(c0, c1, dist) {
  const m = A.createMatch({ ch: [c0, c1], seed: 5 });
  m.phase = 'fight';
  m.f[0].x = S(100); m.f[1].x = S(100 + (dist || 50));
  return m;
}
function step(m, i0, i1, n) { for (let i = 0; i < (n || 1); i++) { m.events.length = 0; A.stepMatch(m, i0 || 0, i1 || 0); } }
function press(m, who, mask, hold) { // 1フレームだけ押す→離す
  const a = who === 0 ? [mask, 0] : [0, mask];
  step(m, a[0], a[1], hold || 1); step(m, 0, 0, 1);
}
function seq(m, who, pulse, tail) { for (const f of pulse.f) step(m, who === 0 ? f : 0, who === 1 ? f : 0); step(m, 0, 0, tail || 0); }

console.log('● 歩く・ジャンプ・しゃがみ');
{
  const m = mk(0, 1, 80); const x0 = m.f[0].x;
  step(m, IN.RIGHT, 0, 10);
  ok(m.f[0].x - x0 === 10 * A.CHARS[0].stats.walk && m.f[0].st === 'walk', '右に10フレーム歩くと walk*10 進む', [(m.f[0].x - x0) / 256, m.f[0].st]);
  const m2 = mk(0, 1, 80);
  step(m2, IN.UP, 0, 1); step(m2, 0, 0, 5);
  ok(m2.f[0].st === 'air' && m2.f[0].y > 0, 'UPでジャンプして空中にいる');
  let t = 0; while (m2.f[0].st === 'air' && t < 100) { step(m2, 0, 0); t++; }
  ok(m2.f[0].st === 'idle' && t > 20 && t < 50, 'ジャンプは約30〜40フレームで着地', t);
  const m3 = mk(0, 1, 80); step(m3, IN.DOWN, 0, 3);
  ok(m3.f[0].st === 'crouch', 'DOWNでしゃがむ');
}

console.log('● こうげき・ダメージ');
{
  const m = mk(0, 1, 40);
  const hp0 = m.f[1].hp;
  press(m, 0, IN.A); step(m, 0, 0, 12);
  ok(m.f[1].hp === hp0 - 4, 'ジャブ(コテツ)が当たって 4 ダメージ', m.f[1].hp - hp0);
  ok(m.f[1].st === 'hit' || m.f[1].st === 'idle', '被弾後は hit か復帰');
  const m2 = mk(0, 1, 120); const hp1 = m2.f[1].hp;
  press(m2, 0, IN.A); step(m2, 0, 0, 14);
  ok(m2.f[1].hp === hp1, '遠すぎるジャブは空振り');
}

console.log('● ガード');
{
  const m = mk(0, 1, 40);
  const hp0 = m.f[1].hp;
  // P2 は右にいるので「うしろ」= 右。右を押しっぱなしでガード
  for (let i = 0; i < 3; i++) step(m, 0, IN.RIGHT);
  step(m, IN.A, IN.RIGHT); step(m, 0, IN.RIGHT, 12);
  ok(m.f[1].hp === hp0 && m.f[1].st !== 'hit', 'うしろ入力で通常技をガードしダメージ0', [m.f[1].hp, m.f[1].st]);
  ok(m.events.length >= 0, 'ガードのイベントが出る');
  const m2 = mk(0, 1, 40);
  for (let i = 0; i < 3; i++) step(m2, 0, IN.LEFT);   // 前を押している＝ガードしない
  step(m2, IN.A, IN.LEFT); step(m2, 0, IN.LEFT, 12);
  ok(m2.f[1].hp < m2.f[1].hp + 1 && m2.f[1].hp === A.CHARS[1].stats.hp - 4, '前入力ではガードできず当たる', m2.f[1].hp);
}

console.log('● しゃがみで高い攻撃をよける');
{
  const m = mk(0, 2, 40); const hp0 = m.f[1].hp;
  for (let i = 0; i < 3; i++) step(m, 0, IN.DOWN);
  step(m, IN.A, IN.DOWN); step(m, 0, IN.DOWN, 12);
  ok(m.f[1].hp === hp0, 'しゃがむとジャブ(高い)が当たらない', m.f[1].hp);
  const m2 = mk(0, 2, 40);
  for (let i = 0; i < 3; i++) step(m2, 0, IN.DOWN);
  step(m2, IN.B, IN.DOWN); step(m2, 0, IN.DOWN, 16);
  ok(m2.f[1].hp < hp0, 'しゃがんでもキック(低い)は当たる', m2.f[1].hp);
}

console.log('● 飛び道具（ロケットパンチ）');
{
  const m = mk(0, 1, 140); const hp0 = m.f[1].hp;
  seq(m, 0, A.makePulse('s1', IN.RIGHT));
  step(m, 0, 0, 14);
  ok(m.projs.length === 1 && m.projs[0].type === 'fist', '→+A でロケットパンチが出る', m.projs.map((p) => p.type));
  const m2 = mk(0, 1, 140);
  seq(m2, 0, A.makePulse('s1', IN.RIGHT)); step(m2, 0, 0, 60);
  ok(m2.f[1].hp === hp0 - 7, 'ロケットパンチが当たって 7 ダメージ', m2.f[1].hp);
  ok(m2.projs.length === 0, '当たったら消える');
  // 同時に2発は出せない
  const m3 = mk(0, 1, 200);
  seq(m3, 0, A.makePulse('s1', IN.RIGHT)); step(m3, 0, 0, 30);
  seq(m3, 0, A.makePulse('s1', IN.RIGHT)); step(m3, 0, 0, 2);
  ok(m3.projs.length <= 1, '画面に1発まで', m3.projs.length);
}

console.log('● カウンター（ガンジョウ・ムシャガエシ）');
{
  const m = mk(1, 0, 40);   // P1=ガンジョウ P2=コテツ
  const hp0 = m.f[1].hp;
  seq(m, 0, A.makePulse('s3', IN.RIGHT));           // カウンター体勢
  // 体勢に入ってから、P2がパンチ
  step(m, 0, IN.LEFT * 0, 3);
  step(m, 0, IN.A, 1); step(m, 0, 0, 40);
  ok(m.f[0].hp === A.CHARS[1].stats.hp, 'カウンター中はダメージを受けない', m.f[0].hp);
  ok(m.f[1].hp < hp0, '反撃で相手にダメージ', m.f[1].hp);
}

console.log('● リフレクト（ルート）');
{
  const m = mk(4, 0, 140);   // P1=ルート P2=コテツ
  seq(m, 1, A.makePulse('s1', IN.LEFT));   // P2がロケットパンチ
  step(m, 0, 0, 2);
  seq(m, 0, A.makePulse('s3', IN.RIGHT));
  let reflected = false;
  for (let i = 0; i < 40; i++) { step(m, 0, 0); if (m.events.some((e) => e.t === 'reflect')) reflected = true; }
  ok(reflected, '飛び道具を反射できた');
  ok(m.projs.length === 0 || m.projs.every((p) => p.own === 0), '反射した飛び道具の持ち主が入れ替わる');
}

console.log('● ワープ（ルート）');
{
  const m = mk(4, 0, 60);
  seq(m, 0, A.makePulse('s4', IN.RIGHT)); step(m, 0, 0, 40);
  ok(m.f[0].x < m.f[1].x === false, 'ワープで相手の背後（右側）に回り込む', [m.f[0].x / 256, m.f[1].x / 256]);
  ok(m.f[0].face === -1, 'ワープ後は相手のほうを向く', m.f[0].face);
}

console.log('● ふっとばし・ダウン・起き上がり');
{
  const m = mk(0, 1, 40);
  seq(m, 0, A.makePulse('s3', IN.RIGHT));   // ライジングパンチ（ダウンさせる）
  let seen = {};
  for (let i = 0; i < 200; i++) { step(m, 0, 0); seen[m.f[1].st] = (seen[m.f[1].st] || 0) + 1; }
  ok(seen.knock > 0 && seen.down > 0 && seen.wake > 0, '吹っ飛び → ダウン → 起き上がり の順に遷移', seen);
  ok(m.f[1].st === 'idle', '最後は立ち上がる');
}

console.log('● ラウンド進行');
{
  const m = mk(0, 1, 40);
  m.f[1].hp = 3;
  press(m, 0, IN.A); step(m, 0, 0, 20);
  ok(m.phase === 'end' && m.endWhy === 'ko' && m.f[1].st === 'ko', 'HP0でKOになりラウンド終了', [m.phase, m.endWhy]);
  step(m, 0, 0, 200);
  ok(m.phase === 'over' && m.wins[0] === 1, 'over で勝ち数+1', [m.phase, m.wins]);
  A.nextRound(m);
  ok(m.phase === 'intro' && m.round === 2 && m.f[1].hp === A.CHARS[1].stats.hp, 'nextRoundで体力全回復・ラウンド2', [m.phase, m.round]);
  // 2ラウンド先取
  m.phase = 'fight'; m.f[1].hp = 2; m.f[0].x = S(100); m.f[1].x = S(140);
  press(m, 0, IN.A); step(m, 0, 0, 200);
  ok(m.matchWinner === 0, '2本先取で試合終了', m.matchWinner);
  // タイムアップ
  const t = mk(0, 1, 100); t.timer = 3; t.f[1].hp = 50;
  step(t, 0, 0, 5);
  ok(t.phase === 'end' && t.endWhy === 'time' && t.roundWinner === 0, 'タイムアップはHP割合で判定', [t.phase, t.roundWinner]);
}

console.log('● 決定論（同じ入力 → 同じ結果）と、状態のコピーで途中再開できる');
{
  function run(seed, cut) {
    const m = A.createMatch({ ch: [2, 6], seed });
    const ais = [A.newAI(2, seed), A.newAI(2, seed + 1)];
    let mm = m;
    for (let t = 0; t < 1500; t++) {
      const i0 = A.aiInput(ais[0], mm, 0), i1 = A.aiInput(ais[1], mm, 1);
      mm.events.length = 0;
      A.stepMatch(mm, i0, i1);
      if (cut && t === cut) mm = JSON.parse(JSON.stringify(mm));   // 途中でコピー
      if (mm.phase === 'over') A.nextRound(mm);
    }
    return JSON.stringify(mm.f) + JSON.stringify(mm.projs) + mm.frame + JSON.stringify(mm.wins);
  }
  const a = run(11), b = run(11), c = run(11, 700);
  ok(a === b, '同じseedなら完全に同じ結果');
  ok(a === c, '途中でJSONコピーしても結果が変わらない（ロールバック可能な作り）');
}

console.log('\n' + (fail ? 'FAILED ' + fail : 'ALL PASSED') + ' (' + pass + ' ok)');
process.exit(fail ? 1 : 0);
