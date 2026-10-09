// 見た目のデータに「登録もれ」がないかを、Nodeだけで確かめる（ブラウザ不要）
//   ・技が使う構え（pose）・演出（fx）・飛び道具の絵が、ぜんぶ用意されているか
//   ・キャラごとに、ドット絵・ステージ・選択画面の色が用意されているか
//   ・ドット絵の色の名前に、パレットのぬけ（ピンクの点になる）がないか／座標が整数か
const fs = require('fs'), vm = require('vm'), path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = ['core.js', 'chars.js', 'chars2.js', 'sim.js', 'ai.js', 'art.js', 'art2.js', 'render.js', 'render2.js', 'stages.js', 'stages2.js'];
const code = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
const ctx = vm.createContext({ console });
vm.runInContext(code + '\nthis.API = { CHARS, ART, POSES, STAGES, PROP_ART, COL, SHADED, FX_DRAW, FX_UNDER, PROJ_DRAW, FXL_DRAW };', ctx);
const A = ctx.API;
const scenes = fs.readFileSync(path.join(dir, 'scenes.js'), 'utf8');
const render = fs.readFileSync(path.join(dir, 'render.js'), 'utf8');

let fail = 0;
const ok = (cond, name, extra) => { if (!cond) fail++; console.log((cond ? '  ok   ' : '  FAIL ') + name + (!cond && extra !== undefined ? '  → ' + JSON.stringify(extra) : '')); };

// render.js の switch に直接書かれている絵（ここにあるものは登録表になくてよい）
const builtin = (fn, re) => new Set([...fn.matchAll(re)].map((m) => m[1]));
const fxSrc = render.slice(render.indexOf('function drawMoveFx'), render.indexOf('/* ---------- 飛び道具'));
const projSrc = render.slice(render.indexOf('function drawProj'), render.indexOf('エフェクト（見た目だけ'));
const BUILTIN_FX = builtin(fxSrc, /case '(\w+)':/g), BUILTIN_PROJ = builtin(projSrc, /case '(\w+)':/g);

console.log('● 技が使う構え・演出・飛び道具');
{
  const noPose = new Set(), noFx = new Set(), noProj = new Set(), noProp = new Set();
  const projOk = (t) => BUILTIN_PROJ.has(t) || A.PROJ_DRAW[t];
  const specs = (p) => (p.spawn ? (Array.isArray(p.spawn) ? p.spawn : [p.spawn]) : []);
  for (const C of A.CHARS) for (const mv of Object.values(C.moves)) for (const p of mv.phases) {
    if (!p.hide) for (const name of [p.pose].concat(p.alt || [])) if (!A.POSES[name]) noPose.add(C.en + ':' + name);   // 姿を消している間は構えを描かない
    if (p.fx && !BUILTIN_FX.has(p.fx) && !A.FX_DRAW[p.fx]) noFx.add(C.en + ':' + p.fx);
    if (p.prop && !A.PROP_ART[p.prop]) noProp.add(p.prop);
    for (const s of specs(p)) { if (!projOk(s.type)) noProj.add(C.en + ':' + s.type); if (s.ground && !projOk(s.ground.type)) noProj.add(C.en + ':' + s.ground.type); }
  }
  ok(noPose.size === 0, '使っている構え(pose)が、ぜんぶ POSES にある', [...noPose]);
  ok(noFx.size === 0, '使っている技の演出(fx)が、ぜんぶ描ける', [...noFx]);
  ok(noProj.size === 0, '使っている飛び道具の種類が、ぜんぶ描ける', [...noProj]);
  ok(noProp.size === 0, '使っている小道具(prop)が、ぜんぶある', [...noProp]);
}

console.log('● キャラごとのドット絵・ステージ');
{
  const noArt = [], noStage = [], noCell = [], badKey = [], dupKey = [];
  const keys = new Set();
  for (const C of A.CHARS) {
    if (keys.has(C.key)) dupKey.push(C.key); keys.add(C.key);
    if (!A.ART[C.key]) noArt.push(C.key);
    if (!A.STAGES[C.stage]) noStage.push(C.stage);
    if (!new RegExp(C.stage + "\\s*:\\s*'#").test(scenes)) noCell.push(C.stage);
    if (!/^[a-z]+$/.test(C.key) || !C.desc || C.desc.length !== 2 || !C.name || !C.en) badKey.push(C.key);
  }
  ok(!dupKey.length && !noArt.length && !badKey.length, 'キャラのキー・ドット絵・せつめい文がそろっている', { dupKey, noArt, badKey });
  ok(noStage.length === 0, 'ステージがぜんぶ定義されている', noStage);
  ok(noCell.length === 0, 'ステージごとに、選択画面のセルの色がある', noCell);
  ok(new Set(A.CHARS.map((c) => c.stage)).size === A.CHARS.length, 'ステージは、キャラごとに別々', A.CHARS.map((c) => c.stage));
  // 2人ならびの画面のせつめいらんは、全角13.5文字ぶん（半角の空白は半分）。最初の8体は、もとからはみ出すものがあるので、あとから足した分だけ調べる
  const wide = (l) => [...l].reduce((n, ch) => n + (ch === ' ' ? 0.5 : 1), 0);
  const tooLong = A.CHARS.slice(8).filter((c) => c.desc.some((l) => wide(l) > 13.5)).map((c) => c.en);
  ok(tooLong.length === 0, 'あとから足した8体のせつめいは、1行13.5文字ぶんまで（はみ出さない）', tooLong);
}

console.log('● ドット絵の命令');
{
  const badKeys = [], badInt = [], badSize = [];
  const colorOk = (pal, k) => !!(pal[k] || A.COL[k]);
  for (const [name, art] of Object.entries(A.ART)) {
    for (const part of ['head', 'torso', 'hand', 'foot']) {
      const sz = art.size[part];
      if (!sz || !(sz[0] > 0 && sz[1] > 0)) { badSize.push(name + ':' + part); continue; }
      const used = new Set();
      for (const op of art[part]) {
        const [o, ...a] = op;
        if (o === 'p' || o === 'pp') { const pts = o === 'p' ? [[a[0], a[1]]] : a[0]; for (const q of pts) if (!Number.isInteger(q[0]) || !Number.isInteger(q[1])) badInt.push(name + ':' + part + ':' + o + ':' + q); used.add(o === 'p' ? a[2] : a[1]); }
        else if (o === 'q' || o === 'qe') { used.add(a[a.length - 2]); used.add(a[a.length - 1]); }
        else if (o === 'r') { for (let i = 0; i < 4; i++) if (!Number.isInteger(a[i])) badInt.push(name + ':' + part + ':r:' + a.slice(0, 4)); used.add(a[4]); }
        else if (o === 'l') { for (let i = 0; i < 4; i++) if (!Number.isInteger(a[i])) badInt.push(name + ':' + part + ':l:' + a.slice(0, 4)); used.add(a[4]); }
        else used.add(a[a.length - 1]);
      }
      for (const k of used) {
        if (!colorOk(art.pal, k)) badKeys.push(name + ':' + part + ':' + k);
        if (A.SHADED[k] && !(colorOk(art.pal, k + 'H') && colorOk(art.pal, k + 'S'))) badKeys.push(name + ':' + part + ':' + k + '(H/S)');
      }
    }
  }
  ok(badKeys.length === 0, '使っている色の名前が、ぜんぶパレットにある（明暗つきの色は H/S もある）', badKeys);
  ok(badInt.length === 0, '点・四角・線の座標が整数（小数だとドットが出ない）', badInt);
  ok(badSize.length === 0, '各パーツの大きさが決まっている', badSize);
}

console.log(fail ? '\nFAILED ' + fail : '\nALL PASSED');
process.exit(fail ? 1 : 0);
