/* 授業プレイヤー：play.html?l=<授業ID>
   1セリフずつ進む（ふきだし・声・口パク・字が少しずつ出る）。問題は 2〜4択／数の入力／ボタン操作。
   まちがえたらヒント→もう1回（2回まちがえたら答えと説明）。正解で星・紙ふぶき・キャラがよろこぶ。
   ステージ（3つ前後）ごとに帯が出て、上の地図をピヨが進む。途中で「ひと休み」。最後に成績とシール。 */
(function () {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const R = t => RUBY.html(t);
  /* 画面の決まった言葉。1・2年はひらがなに（教科書のように） */
  const LO = [['目次', 'もくじ'], ['正解', 'せいかい'], ['授業', 'じゅぎょう'], ['1回', '1かい'], ['星', 'ほし'], ['数を', 'かずを'], ['入れて', 'いれて'], ['音が出ます', 'おとが でます'], ['漢字', 'かんじ'], ['帳', 'ちょう'], ['見本', 'みほん'], ['何年生', 'なんねんせい'], ['習', 'なら'], ['声', 'こえ'], ['自動で進む', 'じどうで すすむ'], ['書く', 'かく']];
  const U = t => (L && L.grade <= 2 ? LO.reduce((a, [k, v]) => a.split(k).join(v), t) : L && L.grade <= 4 ? t.split('正解').join('せいかい') : t);
  const RU = t => R(U(t));
  const qs = new URLSearchParams(location.search);
  const LID = window.HS_LID || qs.get('l') || (location.hash || '').slice(1) || 'kazu10-01';
  /* コツコツくんなどの画面の中に埋めこんで見るとき（?embed=1）：目次・つぎの授業へを隠し、進み具合と「答え（まちがいも）」を親の画面へ postMessage で知らせる。
     { src:'ho-sho', scene:授業ID, ev:'ready'|'start'|'step'|'answer'|'result', … }
       answer … { id:問ID, ok, tries(0=1回目), kind:'q'|'n', qText, pickText, rightText, right, answered, total }（まちがいのたびに ok:false で来る）／result … { right, total, first } */
  const EMBED = qs.get('embed') === '1';
  const plain = t => String(t == null ? '' : t).replace(/\{([^|{}]+)\|[^{}]+\}/g, '$1').replace(/\[\[([^\]\/]*)\/([^\]]*)\]\]/g, '$1/$2').replace(/\*\*/g, '').replace(/\n/g, ' ').trim();
  const note = (ev, o) => { if (!EMBED) return; try { parent.postMessage(Object.assign({ src: 'ho-sho', scene: LID, ev }, o || {}), '*'); } catch (e) { /* 親がない */ } };
  let lastPick = null, lastI = -1;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 保存できない環境 */ } } };

  /* ---------- 画面の大きさ ---------- */
  function fit() {
    const st = $('#stage'), k = Math.min(innerWidth / 1280, innerHeight / 720);
    st.style.transform = `scale(${k})`; st.style.left = (innerWidth - 1280 * k) / 2 + 'px'; st.style.top = (innerHeight - 720 * k) / 2 + 'px';
  }
  addEventListener('resize', fit);

  /* ---------- 設定（漢字の学年・ふりがな・声・自動） ---------- */
  let L = null, SET = null;
  function loadSettings() {
    const s = Object.assign({ furi: 'new', mi: 'kana', voice: false, auto: false }, store.get('hosho.set', {}));
    s.kg = store.get('hosho.kg.g' + L.grade, L.grade || 6);   // 漢字の学年は、授業の学年ごとにおぼえる（はじめは授業の学年）
    if (qs.get('kg')) s.kg = +qs.get('kg'); if (qs.get('furi')) s.furi = qs.get('furi'); if (qs.get('mi')) s.mi = qs.get('mi');
    if (qs.get('voice')) s.voice = qs.get('voice') !== '0'; if (qs.get('auto')) s.auto = qs.get('auto') === '1';
    s.voice = false; SET = s; RUBY.setSettings(s);   // クメール語版には声がない
  }
  function saveSettings() { const { kg, ...rest } = SET; store.set('hosho.set', rest); store.set('hosho.kg.g' + L.grade, kg); RUBY.setSettings(SET); }
  const CM = () => HS.commonFor(L.grade);   // 決まったセリフ（1・2年はひらがな）
  const CDIR = () => 'common-g' + L.grade;

  /* ---------- 声 ---------- */
  const VO = () => Object.assign({}, (window.HSVOICE || {})[CDIR()] || {}, (window.HSVOICE || {})[LID] || {});
  let audio = null;
  /* 声は1つの audio 要素を使い回す（iPad の Safari は、さいしょにタップで鳴らした要素なら、あとから自動でも鳴らせる） */
  const EL = new Audio(); EL.preload = 'auto';
  let curBlob = null;   // audio.bin から切り出した声の URL（つぎの声にかわったら かたづける）
  function playUrl(url) { EL.onended = null; EL.pause(); EL.src = url; try { EL.currentTime = 0; } catch (e) { /* 読みこみ前 */ } EL.onerror = () => { if (EL.onended) EL.onended(); };
    if (curBlob && curBlob !== url) { try { URL.revokeObjectURL(curBlob); } catch (e) { /* なくてよい */ } curBlob = null; }
    if (url.startsWith('blob:')) curBlob = url;
    EL.play().catch(() => { /* 再生できない環境 → 字だけで進む */ if (EL.src.endsWith(url) && EL.onended) EL.onended(); }); return EL; }
  /* 声のまとめ（audio.bin）：公開した形は、1授業の声を1ファイルにまとめてある（deploy.py。Cloudflare Pages の 20,000ファイルの上限のため）。
     meta の1つ分が [長さ, 口パク, はじまり, バイト数] なら、まとめから切り出して鳴らす（切り出したものは 元の m4a と同じバイト列）。
     手元の授業（meta が [長さ, 口パク] だけ）は、これまでどおり 1セリフ1ファイルの m4a を読む。 */
  const PACKS = {};
  function fetchPack(url) {   // XHR：file:// でも http でも動く。失敗しても 1回だけやり直す。だめなら null（字だけで進む）
    const once = () => new Promise(res => { try { const x = new XMLHttpRequest(); x.open('GET', url); x.responseType = 'blob'; x.onload = () => res((x.status === 200 || x.status === 0) && x.response && x.response.size > 0 ? x.response : null); x.onerror = () => res(null); x.send(); } catch (e) { res(null); } });
    return once().then(b => b || once());
  }
  function unlockAudio() {
    try {
      const n = 2400, b = new ArrayBuffer(44 + n * 2), d = new DataView(b), w = (o, t) => [...t].forEach((c, i) => d.setUint8(o + i, c.charCodeAt(0)));
      w(0, 'RIFF'); d.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); d.setUint32(16, 16, true); d.setUint16(20, 1, true); d.setUint16(22, 1, true); d.setUint32(24, 48000, true); d.setUint32(28, 96000, true); d.setUint16(32, 2, true); d.setUint16(34, 16, true); w(36, 'data'); d.setUint32(40, n * 2, true);
      EL.src = URL.createObjectURL(new Blob([b], { type: 'audio/wav' })); EL.play().catch(() => {});
    } catch (e) { /* なくてよい */ }
  }
  function voiceOf(who, text, sayTxt) {
    if (!SET.voice) return null;
    const key = RUBY.voiceKey(who, sayTxt || text), v = VO()[key]; if (!v) return null;
    const dir = (window.HSVOICE[LID] || {})[key] ? LID : CDIR();
    if (v.length > 2) { const pk = PACKS[dir]; if (!pk) return null; return { url: URL.createObjectURL(pk.slice(v[2], v[2] + v[3], 'audio/mp4')), dur: v[0], env: v[1] }; }
    return { url: `audio/${dir}/${key}.m4a`, dur: v[0], env: v[1] };
  }
  function stopVoice() { EL.onended = null; EL.onerror = null; if (audio) { EL.pause(); audio = null; } }

  /* ---------- 状態 ---------- */
  let frames = [], trail = [], ops = [], stars = 0, total = 0, firstTry = 0, answered = {}, combo = 0, state = 'idle', curStep = null, typing = null, readyT = 0, idleT = 0, stageNo = 0, token = 0;
  const stages = () => L.stages || [];

  /* ---------- ふきだし（字が少しずつ出る・声・口パク） ---------- */
  function speak(who, text, sayTxt, opt) {
    const o = opt || {}, my = ++token;
    stopVoice(); clearTimeout(readyT);
    const bb = $('#bubble'); bb.className = who; bb.querySelector('.nm').textContent = CH.NAME[who];
    const r = RUBY.html(text, { typing: true }); const tx = bb.querySelector('.txt'); tx.innerHTML = r.html; tx.dataset.raw = text;
    bb.classList.toggle('small', RUBY.visLen(text) > 54);
    const cs = [...tx.querySelectorAll('.c')], n = cs.length;
    const v = voiceOf(who, text, sayTxt);
    let dur = Math.max(1.0, RUBY.visLen(text) * 0.115), t0 = performance.now(), level = null;
    if (v) {
      audio = playUrl(v.url); dur = v.dur;
      const env = v.env, a = audio;
      level = () => { const i = Math.floor(a.currentTime * 30); return i < env.length ? (parseInt(env[i], 36) / 9) : 0; };
      a.onended = () => { if (my === token) { CH.talk(who, false); audio = null; checkReady(); } };
    }
    CH.talk(who, true, level);
    $('#bNext').classList.remove('ready');
    typing = { my, who, cs, n, shown: 0, done: false, t0, dur: dur * 0.92, onDone: o.onDone, voice: !!v };
    (function tick() {
      if (!typing || typing.my !== my) return;
      const u = Math.min(1, (performance.now() - t0) / 1000 / typing.dur), k = Math.ceil(u * n);
      for (let i = typing.shown; i < k; i++) cs[i].classList.add('on'); typing.shown = Math.max(typing.shown, k);
      if (u < 1) requestAnimationFrame(tick); else finishTyping();
    })();
  }
  function finishTyping() {
    if (!typing || typing.done) return;
    typing.cs.forEach(c => c.classList.add('on')); typing.done = true;
    if (!typing.voice) CH.talk(typing.who, false);
    const f = typing.onDone; typing.onDone = null; f && f();
    checkReady();
  }
  function checkReady() {
    if (!typing || !typing.done || audio) return;
    CH.talk(null, false);
    if (state === 'say') {
      state = 'ready'; $('#bNext').classList.add('ready');
      if (SET.auto) readyT = setTimeout(() => { if (state === 'ready') next(); }, 1100);
    }
  }

  /* ---------- キャラの反応 ---------- */
  function react(s) {
    const other = s.who === 'ho' ? 'piyo' : 'ho';
    CH.face(s.who, s.face || 'normal'); if (s.act) CH.act(s.who, s.act); if (s.mark) CH.mark(s.who, s.mark);
    const o = s.o || {}; CH.face(other, o.face || 'normal'); if (o.act) CH.act(other, o.act); if (o.mark) CH.mark(other, o.mark);
    if (s.sfx) FX.sfx(s.sfx);
  }

  /* ---------- ノートの操作 ---------- */
  function doOps(list) { (list || []).forEach(op => { ops.push(op); BOARD.apply(op); }); }
  async function doOpsWait(list) { for (const op of list || []) { ops.push(op); await BOARD.apply(op); } }

  /* ---------- 進む ---------- */
  function pull() {
    while (frames.length && frames[frames.length - 1].i >= frames[frames.length - 1].list.length) frames.pop();
    if (!frames.length) return null;
    const f = frames[frames.length - 1]; return f.list[f.i++];
  }
  async function next() {
    if (state === 'busy') { BOARD.finish(); return; }
    if (['q', 'num', 'tap', 'act', 'end', 'break', 'banner', 'busy2', 'q-wait'].includes(state)) return;
    clearTimeout(readyT); clearTimeout(idleT); stopVoice();
    await BOARD.finish();
    const snapFrames = frames.map(f => ({ list: f.list, i: f.i }));
    const s = pull(); if (!s) return;
    trail.push({ frames: snapFrames, opsLen: ops.length, step: s });
    if (trail.length > 400) trail.shift();
    run(s);
  }
  function run(s) {
    curStep = s; hidePanel();
    if (EMBED && frames[0] && frames[0].i !== lastI) { lastI = frames[0].i; note('step', { i: lastI, steps: L.steps.length, right: stars, answered: Object.keys(answered).length, total }); }
    if (s.k === 'say') { state = 'say'; react(s); doOps(s.ops); speak(s.who, s.text, s.say); return; }
    if (s.k === 'stage') return runStage(s);
    if (s.k === 'q') return runQ(s, 0);
    if (s.k === 'num') return runNum(s, 0);
    if (s.k === 'tap') return runTap(s);
    if (s.k === 'act') return runAct(s);
    if (s.k === 'break') return runBreak();
    if (s.k === 'reask') return s.q.k === 'q' ? runQ(s.q, s.tries, true) : runNum(s.q, s.tries, true);
    if (s.k === 'end') return runEnd(s);
    next();
  }
  async function goBack() {
    if (['end', 'break', 'banner', 'busy', 'busy2'].includes(state)) return;
    if (trail.length < 2) { again(); return; }
    trail.pop(); let prev = trail.pop();
    while (prev && prev.step.k === 'stage' && trail.length) prev = trail.pop();   // 帯の場面はとばす
    clearTimeout(readyT); stopVoice(); state = 'idle'; document.querySelectorAll('.acthint').forEach(e => e.remove());
    frames = prev.frames.map(f => ({ list: f.list, i: f.i })); ops.length = prev.opsLen;
    await BOARD.finish(); await BOARD.replay(ops);
    next();
  }
  function again() { if (!curStep || !['ready', 'say', 'q', 'num', 'tap', 'act'].includes(state)) return; const s = curStep; if (s.k === 'say') { speak(s.who, s.text, s.say); state = 'say'; } else if (s.text) speak(s.who, s.text, s.say); }

  /* ---------- ステージ ---------- */
  function drawMap() {
    const m = $('#map'), n = stages().length; let h = '';
    for (let i = 1; i <= n; i++) h += (i > 1 ? `<i class="bar ${i <= stageNo ? 'done' : ''}"></i>` : '') + `<span class="dot ${i < stageNo ? 'done' : i === stageNo ? 'now' : ''}" title="${esc(stages()[i - 1])}">${i < stageNo ? '★' : i}</span>`;
    h += `<i class="bar ${stageNo > n ? 'done' : ''}"></i><span class="dot goal ${stageNo > n ? 'done' : ''}">🏁</span>`;
    m.innerHTML = h + `<span class="me">${CH.imgHTML('piyo', 'normal')}</span>`;
    const dots = m.querySelectorAll('.dot'), d = dots[Math.max(0, Math.min(dots.length - 1, stageNo - 1))];
    requestAnimationFrame(() => { const me = m.querySelector('.me'); if (me && d) me.style.left = (d.offsetLeft + d.offsetWidth / 2 - 15) + 'px'; });
  }
  function runStage(s) {
    const prevNo = stageNo; stageNo = s.n; drawMap();
    store.set('hosho.pos.' + LID, { i: frames.length === 1 ? frames[0].i - 1 : null, stars, firstTry, answered, stageNo });
    if (prevNo === 0 && s.n === 1) { next(); return; }   // はじめのステージは、開始の画面で見せている
    state = 'banner';
    FX.sfx('stage'); FX.banner(`<small>ដំណាក់កាលទី ${s.n}</small>${R(stages()[s.n - 1] || '')}`, '', 1900);
    CH.face('piyo', 'happy'); CH.act('piyo', 'hop'); CH.face('ho', 'happy');
    setTimeout(() => { state = 'idle'; next(); }, 1900);
  }

  /* ---------- 問題（えらぶ） ---------- */
  const MK = ['●', '▲', '■', '★'];
  function panel(h) { const p = $('#panel'); p.style.background = ''; p.style.boxShadow = ''; p.innerHTML = h; p.classList.remove('hidden'); p.style.animation = 'none'; void p.offsetWidth; p.style.animation = ''; return p; }
  function hidePanel() { $('#panel').classList.add('hidden'); clearTimeout(idleT); }
  function runQ(s, tries, re) {
    state = 'q-wait'; react(s);
    if (!re) doOps(s.ops);
    const show = () => {
      if (curStep !== s && !(curStep && curStep.k === 'reask' && curStep.q === s)) return;
      state = 'q';
      const off = s._off || [];
      const p = panel(`<div class="ph">${s.opinion ? '🤔 សាកល្បងទាយមើល' : '✏️ សូមជ្រើសរើស'}<span class="tries">${tries ? RU('ម្តងទៀត!') : ''}</span>${s.tip ? '<button class="hintbtn" type="button">💡 តម្រុយ</button>' : ''}</div><div class="opts n${s.opts.length}${s.opts.length === 4 && s.opts.some(o => RUBY.visLen(o.t) > 9) ? ' wide' : ''}">${s.opts.map((o, i) => `<button class="opt c${i} ${off.includes(i) ? 'off' : ''}${RUBY.visLen(o.t) > 15 ? ' long' : ''}" data-i="${i}" type="button"><span class="mk">${MK[i]}</span><span class="tx">${R(o.t)}</span></button>`).join('')}</div>`);
      p.querySelectorAll('.opt').forEach(b => b.onclick = () => choose(+b.dataset.i));
      const hb = p.querySelector('.hintbtn'); if (hb) hb.onclick = () => showTip(s);
      armIdle(s);
    };
    if (re) { s._re = true; speak(s.who, pick(CM().reask.slice(0, 1)), null, { onDone: show }); }
    else { if (!tries) s._off = []; speak(s.who, s.text, s.say, { onDone: show }); }
  }
  function armIdle(s) {
    clearTimeout(idleT);
    idleT = setTimeout(() => { if (!['q', 'num'].includes(state)) return; const hb = $('#panel .hintbtn'); if (hb) hb.classList.add('nudge'); CH.act('piyo', 'hop'); CH.mark('piyo', 'q'); const v = hb && voiceOf('piyo', CM().nudge[0]); if (v && !audio) { audio = playUrl(v.url); EL.onended = () => { audio = null; }; } }, 22000);
  }
  function showTip(s) {
    const p = $('#panel'); if (!p.querySelector('.tipbox')) { const d = document.createElement('div'); d.className = 'tipbox'; d.innerHTML = '💡 ' + R(s.tip); p.querySelector('.ph').after(d); }
    p.querySelector('.hintbtn').classList.remove('nudge'); CH.face('ho', 'think');
    const v = voiceOf('ho', s.tip, s.tipSay); if (v) { stopVoice(); audio = playUrl(v.url); const a = audio, env = v.env; CH.talk('ho', true, () => { const i = Math.floor(a.currentTime * 30); return i < env.length ? parseInt(env[i], 36) / 9 : 0; }); a.onended = () => { CH.talk('ho', false); audio = null; }; }
  }
  function btnCenter(b) { const st = $('#stage').getBoundingClientRect(), r = b.getBoundingClientRect(), k = st.width / 1280; return [(r.left - st.left + r.width / 2) / k, (r.top - st.top + r.height / 2) / k]; }
  function choose(i) {
    if (state !== 'q') return;
    const s = curStep.k === 'reask' ? curStep.q : curStep, b = $(`#panel .opt[data-i="${i}"]`); if (!b || b.classList.contains('off')) return;
    clearTimeout(idleT); stopVoice(); CH.talk(null, false);
    const tries = curStep.k === 'reask' ? curStep.tries : 0;
    if (s.opinion) {
      state = 'busy2'; FX.sfx('pop'); b.classList.add('ok'); $$('#panel .opt').forEach(x => { if (x !== b) x.classList.add('off'); });
      CH.act('piyo', 'hop');
      setTimeout(() => { hidePanel(); pushFrame([...(s.pick[i] || []), ...s.after]); state = 'idle'; next(); }, 900);
      return;
    }
    lastPick = plain(s.opts[i].t);
    if (s.opts[i].ok) return correct(s, tries, b);
    wrong(s, tries, b, i);
  }
  function noteAnswer(s, key, ok, tries) {   // 埋めこみのとき、1回ごとの答えを知らせる（まちがいも）
    if (!EMBED) return;
    const right = s.k === 'num' || s.ans ? (s.ans || [])[0] : plain((s.opts.find(o => o.ok) || {}).t);
    note('answer', { id: String(key), ok, tries, kind: s.ans ? 'n' : 'q', qText: plain(s.text), pickText: lastPick, rightText: String(right), right: stars, answered: Object.keys(answered).length, total });
  }
  function correct(s, tries, el) {
    state = 'busy2'; FX.sfx('ok'); if (el) el.classList.add('ok');
    const [x, y] = el ? btnCenter(el) : [900, 300];
    FX.confetti(x, y, 60);
    const key = s.id || s.text; let got = false;
    if (!answered[key]) { answered[key] = tries ? 2 : 1; got = true; stars++; if (!tries) firstTry++; }
    noteAnswer(s, key, true, tries);
    combo = tries ? 0 : combo + 1;
    if (got) setTimeout(() => FX.flyStar(x, y, () => { $('#stars b').textContent = stars; }), 250);
    if (combo >= 2) setTimeout(() => { FX.sfx('combo'); FX.toast(`${combo} ${RU('ត្រូវជាប់ៗគ្នា')}!`); }, 700);
    CH.face('piyo', 'cheer'); CH.act('piyo', 'jump'); CH.face('ho', 'happy'); CH.act('ho', 'hop'); CH.mark('piyo', 'sparkle');
    const praise = s.praise ? s.praise : [tries ? HS.T(pick(CM().praise2), { face: 'happy', o: { face: 'happy' } }) : (Math.random() < 0.5 ? HS.T(pick(CM().praiseHo), { face: 'happy', o: { face: 'cheer' } }) : HS.P(pick(CM().praisePiyo), { face: 'cheer', act: 'hop', o: { face: 'happy' } }))];
    setTimeout(() => { hidePanel(); pushFrame([...praise, ...s.exp, ...(s.after || [])]); state = 'idle'; next(); }, 1300);
  }
  function wrong(s, tries, el, i) {
    state = 'busy2'; FX.sfx('ng'); combo = 0;
    noteAnswer(s, s.id || s.text, false, tries);
    if (el) { el.classList.remove('ng'); void el.offsetWidth; el.classList.add('ng'); }
    CH.face('piyo', 'confused'); CH.act('piyo', 'shake'); CH.mark('piyo', 'sweat'); CH.face('ho', 'think');
    const ng = Array.isArray(s.ng) ? s.ng : (s.ng[i] || s.ng.any || []);
    const hint = ng.length ? ng : [HS.T(pick(CM().ng1), { face: 'sorry', o: { face: 'sad' } })];
    setTimeout(() => {
      if (el) el.classList.add('off'); if (s.k === 'q') { s._off = s._off || []; if (i !== undefined) s._off.push(i); }
      hidePanel();
      if (tries + 1 < 2) pushFrame([...hint, { k: 'reask', q: s, tries: tries + 1, who: s.who }]);
      else { const key = s.id || s.text; if (!answered[key]) answered[key] = -1; pushFrame([...hint, HS.T(HS.reveal(s), { face: 'normal', o: { face: 'think' } }), ...s.exp, ...(s.after || [])]); }
      state = 'idle'; next();
    }, 1000);
  }
  function pushFrame(list) { if (list && list.length) frames.push({ list, i: 0 }); }

  /* ---------- 問題（数を入れる） ---------- */
  let numVal = '';
  function runNum(s, tries, re) {
    state = 'q-wait'; react(s); if (!re) doOps(s.ops);
    const show = () => {
      state = 'num'; numVal = '';
      const intOnly = s.keys ? s.keys === 'int' : (L.grade <= 4 && s.ans.every(a => Number.isInteger(a)));
      const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', intOnly ? '' : '.', 'bs'];
      const kh = keys.map((k, i) => k === '' ? '' : `<button class="key ${k === 'bs' ? 'bs' : ''}" data-k="${k}" type="button" style="grid-column:${(i % 3) + 1};grid-row:${Math.floor(i / 3) + 1}">${k === 'bs' ? '⌫ លុប' : k}</button>`).join('') + `<button class="key go" data-k="go" type="button">ឆ្លើយ</button>`;
      const p = panel(`<div class="ph">🔢 ${RU(s.label || 'សូមបញ្ចូលលេខ')}<span class="tries">${tries ? RU('ម្តងទៀត!') : ''}</span>${s.tip ? '<button class="hintbtn" type="button">💡 តម្រុយ</button>' : ''}</div><div class="numrow"><div class="numbox empty"></div><div class="numunit">${R(s.unit === '人' ? '{人|にん}' : (s.unit || ''))}</div></div><div class="keys">${kh}</div>`);
      p.querySelectorAll('.key').forEach(b => b.onclick = () => numKey(b.dataset.k));
      const hb = p.querySelector('.hintbtn'); if (hb) hb.onclick = () => showTip(s);
      armIdle(s);
    };
    if (re) speak(s.who, CM().reask[1], null, { onDone: show }); else speak(s.who, s.text, s.say, { onDone: show });
  }
  function numKey(k) {
    if (state !== 'num') return;
    const box = $('#panel .numbox'); if (!box) return;
    armIdle();
    if (k === 'go') return numSubmit();
    if (k === 'bs') numVal = numVal.slice(0, -1);
    else if (k === '.') { if (!$('#panel .key[data-k="."]')) return; if (!numVal.includes('.') && numVal.length < 10) numVal = (numVal || '0') + '.'; }
    else if (numVal.length < 10) numVal = numVal === '0' ? k : numVal + k;
    FX.sfx('key');
    box.classList.toggle('empty', !numVal); box.innerHTML = esc(numVal) + '<span class="cur"></span>';
  }
  function numSubmit() {
    const s = curStep.k === 'reask' ? curStep.q : curStep, tries = curStep.k === 'reask' ? curStep.tries : 0, box = $('#panel .numbox');
    if (!numVal || numVal === '.') { box.classList.remove('ng'); void box.offsetWidth; box.classList.add('ng'); return; }
    clearTimeout(idleT); stopVoice(); CH.talk(null, false);
    const v = parseFloat(numVal); lastPick = numVal;
    if (s.ans.some(a => Math.abs(a - v) < 1e-9)) { box.classList.add('ok'); correct(s, tries, box); }
    else { box.classList.remove('ng'); void box.offsetWidth; box.classList.add('ng'); wrong(s, tries, null); }
  }

  /* ---------- ボタン操作 ---------- */
  function runTap(s) {
    state = 'q-wait'; react(s); doOps(s.ops);
    speak(s.who, s.text, s.say, {
      onDone: () => {
        if (curStep !== s) return;
        state = 'tap';
        const p = panel(`<div class="tapwrap"><div><button class="tapbtn" type="button">${R(s.btn || 'សាកល្បង!')}</button>${s.hand ? '<span class="taphand">👆</span>' : ''}</div></div>`);
        p.style.background = 'transparent'; p.style.boxShadow = 'none';
        p.querySelector('.tapbtn').onclick = () => tapGo(s);
      }
    });
  }
  async function tapGo(s) {
    if (state !== 'tap') return;
    state = 'busy'; FX.sfx('tap'); hidePanel(); stopVoice(); CH.talk(null, false);
    CH.face('piyo', 'surprised'); CH.act('piyo', 'hop');
    await doOpsWait(s.run);
    await new Promise(r => setTimeout(r, 350));
    state = 'idle'; next();
  }

  /* ---------- 図を子どもがさわる（動かす・数える） ---------- */
  function runAct(s) {
    state = 'q-wait'; react(s); doOps(s.ops);
    speak(s.who, s.text, s.say, {
      onDone: async () => {
        if (curStep !== s) return;
        state = 'act';
        const h = document.createElement('div'); h.className = 'acthint'; h.innerHTML = '👆 ' + R(s.hint || CM().actHint[0]); $('#board').appendChild(h);
        await doOpsWait(s.run);
        h.remove();
        if (curStep !== s || state !== 'act') return;   // とちゅうで「もどる」
        CH.face('piyo', 'happy'); CH.act('piyo', 'hop');
        state = 'busy'; await new Promise(r => setTimeout(r, 450)); state = 'idle'; next();
      }
    });
  }

  /* ---------- ひと休み ---------- */
  function runBreak() {
    state = 'break'; stopVoice(); CH.talk(null, false);
    const ov = $('#ov'); ov.classList.remove('hidden');
    ov.innerHTML = `<div class="card breakcard"><h2>ពេលលាតខ្លួន</h2>${CH.imgHTML('piyo', 'cheer', 'bigpiyo')}<div class="count"></div><div class="msg">${R(CM().breakA[0])}</div><button class="big sub" id="bSkip" type="button">បន្ត ▶</button></div>`;
    const bp = ov.querySelector('.bigpiyo'); if (bp) bp.style.animation = 'stretch 2.4s ease-in-out infinite';
    let n = 6, done = false; const cnt = ov.querySelector('.count');
    const v = voiceOf('piyo', CM().breakA[0]); if (v) audio = playUrl(v.url);
    const iv = setInterval(() => { n--; if (n > 0 && n <= 5) { cnt.textContent = n; FX.sfx('count'); } if (n <= 0) end(); }, 1000);
    function end() {
      if (done) return; done = true; clearInterval(iv); stopVoice();
      ov.querySelector('.msg').innerHTML = R(CM().breakB[0]); cnt.textContent = '';
      const v2 = voiceOf('piyo', CM().breakB[0]); if (v2) audio = playUrl(v2.url);
      setTimeout(() => { stopVoice(); ov.classList.add('hidden'); ov.innerHTML = ''; state = 'idle'; CH.face('piyo', 'happy'); CH.act('piyo', 'hop'); next(); }, 1500);
    }
    ov.querySelector('#bSkip').onclick = end;
  }

  /* ---------- おわり ---------- */
  function runEnd(s) {
    state = 'end'; stopVoice(); CH.talk(null, false); stageNo = stages().length + 1; drawMap();
    const prog = store.get('hosho.prog', {}), old = prog[LID] || {};
    prog[LID] = { stars: Math.max(old.stars || 0, stars), total, first: Math.max(old.first || 0, firstTry), done: true, at: Date.now() };
    store.set('hosho.prog', prog); try { localStorage.removeItem('hosho.pos.' + LID); } catch (e) { /* なくてよい */ }
    note('result', { right: stars, total, first: firstTry });
    FX.sfx('clear'); FX.confetti(640, 300, 140, 3); setTimeout(() => FX.confetti(300, 360, 70), 400); setTimeout(() => FX.confetti(980, 360, 70), 700);
    CH.face('ho', 'cheer'); CH.face('piyo', 'cheer'); CH.act('piyo', 'jump'); CH.act('ho', 'hop');
    const list = window.HS_LESSONS || [], idx = list.findIndex(x => x.id === LID), nx = list[idx + 1] && list[idx + 1].unit === (list[idx] || {}).unit ? list[idx + 1] : null;   // 「つぎの授業へ」は同じ単元の中だけ
    let starsH = ''; for (let i = 0; i < total; i++) starsH += `<svg viewBox="0 0 24 24" class="${i < stars ? 'got' : ''}" style="animation-delay:${0.3 + i * 0.12}s"><path d="M12 2.2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.1l-6.1 3.5 1.5-6.8L2.2 9.2l6.9-.7z"/></svg>`;
    const ov = $('#ov'); ov.classList.remove('hidden');
    ov.innerHTML = `<div class="card rescard"><div class="cl">${R(L.clearTitle || 'ជោគជ័យ!')}</div><h2>${R(L.title)}</h2><div class="starrow">${starsH}</div>
      <div class="stats">${RU('ផ្កាយដែលប្រមូលបាន')} <b>${stars}</b> / ${total}　（${RU('ត្រូវតាំងពីលើកដំបូង')} <b>${firstTry}</b>）</div>
      <div class="sticker">${L.sticker || '⭐'}</div><div class="sticker-cap">${EMBED ? RU('ទទួលបានត្រា!') : RU('ទទួលបានត្រា! បានបិទក្នុងសៀវភៅត្រានៃមាតិកា')}</div>
      <div><button class="big sub" id="bRe" type="button">↻ ម្តងទៀត</button>${nx && !EMBED ? `<button class="big" id="bNx" type="button">${RU('មេរៀនបន្ទាប់')} ▶</button>` : ''}${EMBED ? '' : `<button class="big sub" id="bIdx" type="button">${RU('ទៅមាតិកា')}</button>`}</div></div>`;
    ov.querySelector('#bRe').onclick = () => { location.href = 'play-' + LID + '.html'; };
    if (nx && !EMBED) ov.querySelector('#bNx').onclick = () => { location.href = 'play-' + nx.id + '.html'; };
    if (!EMBED) ov.querySelector('#bIdx').onclick = () => { location.href = 'menu.html'; };
    const t = s.o && s.o.text; if (t) { const v = voiceOf('ho', t); if (v) audio = playUrl(v.url); }
  }

  /* ---------- せってい ---------- */
  function openSettings() {
    const ov = $('#ov'), prevState = state; ov.classList.remove('hidden'); stopVoice(); CH.talk(null, false);
    const sample = L.sample || '円の面積は、半径×半径×円周率で求めます。';
    const seg = (key, items) => `<div class="seg" data-key="${key}">${items.map(([v, t]) => `<button type="button" data-v="${v}" class="${String(SET[key]) === String(v) ? 'on' : ''}">${t}</button>`).join('')}</div>`;
    function draw() {
      ov.innerHTML = `<div class="card setcard"><h1 style="text-align:center">⚙ ការកំណត់</h1>
        <div class="setrow"><div class="k" style="width:auto">ដំណើរការស្វ័យប្រវត្តិ</div>${seg('auto', [[false, 'OFF'], [true, 'ON']])}</div>
        <div style="text-align:center"><button class="big green" id="bSetOk" type="button">OK</button></div></div>`;
      ov.querySelectorAll('.seg').forEach(sg => sg.querySelectorAll('button').forEach(b => b.onclick = () => {
        const k = sg.dataset.key; let v = b.dataset.v; if (k === 'kg') v = +v; if (v === 'true') v = true; if (v === 'false') v = false;
        SET[k] = v; saveSettings(); FX.sfx('tap'); draw();
      }));
      ov.querySelector('#bSetOk').onclick = close;
    }
    function close() {
      ov.classList.add('hidden'); ov.innerHTML = ''; applySettingsToScreen(); state = prevState;
      if (state === 'say' || state === 'ready') { state = 'ready'; $('#bNext').classList.add('ready'); }
    }
    draw();
  }
  function applySettingsToScreen() {
    $('#bAuto').textContent = 'ស្វ័យប្រវត្តិ ' + (SET.auto ? 'ON' : 'OFF'); $('#bAuto').classList.toggle('on', SET.auto);
    $('#hd .ttl').innerHTML = R(L.title);
    const tx = $('#bubble .txt'); if (tx.dataset.raw) { tx.innerHTML = RUBY.html(tx.dataset.raw); }
    if (typing) { typing.done = true; typing.cs = []; }
    BOARD.rerender();
    $$('#panel .opt .tx').forEach(el => { const s = curStep && (curStep.k === 'reask' ? curStep.q : curStep); if (s && s.opts) el.innerHTML = R(s.opts[+el.parentNode.dataset.i].t); });
    const tb = $('#panel .tipbox'); if (tb) { const s = curStep && (curStep.k === 'reask' ? curStep.q : curStep); if (s && s.tip) tb.innerHTML = '💡 ' + R(s.tip); }
  }

  /* ---------- はじめの画面 ---------- */
  function startCard() {
    const ov = $('#ov'), pos = store.get('hosho.pos.' + LID, null);
    ov.classList.remove('hidden');
    ov.innerHTML = `<div class="card startcard"><h2>${R(`ថ្នាក់ទី ${L.grade}　${L.unit}`)}　${L.no ? `មេរៀនទី ${L.no}` : ''}</h2><h1>${R(L.title)}</h1>
      <div class="duo">${CH.imgHTML('ho', 'happy')}${CH.imgHTML('piyo', 'normal')}</div>
      ${L.goal ? `<div class="goal">${R('គោលដៅ')}៖${R(L.goal)}</div>` : ''}
      <div class="stg">${stages().map((t, i) => `<span><b>${i + 1}</b>${R(t)}</span>`).join('')}</div>
      <div><button class="big" id="bGo" type="button">ចាប់ផ្តើម!</button>${pos && pos.i ? `<button class="big sub" id="bRes" type="button">▶ ${R('បន្តពីកន្លែងចាស់')} (ដំណាក់កាលទី ${pos.stageNo})</button>` : ''}</div>
      <p class="note-sm">Enter／Space = បន្ទាប់　1–4 = ជ្រើសរើស　← = ត្រឡប់ក្រោយ　　<a href="#" id="bSet2">⚙ ${RU('ការកំណត់')}</a>${EMBED ? '' : `　<a href="menu.html">${RU('ទៅមាតិកា')}</a>`}</p></div>`;
    ov.querySelector('#bGo').onclick = () => begin(0);
    if (pos && pos.i) ov.querySelector('#bRes').onclick = () => begin(pos);
    ov.querySelector('#bSet2').onclick = e => { e.preventDefault(); openSettings(); const okb = () => { const b = $('#bSetOk'); if (b) { const old = b.onclick; b.onclick = () => { old(); startCard(); }; } }; okb(); };
  }
  function collectOps(list, out) {
    (list || []).forEach(s => { out.push(...(s.ops || [])); if (s.k === 'tap' || s.k === 'act') out.push(...(s.run || [])); if (s.k === 'q' || s.k === 'num') { collectOps(s.praise || [], out); collectOps(s.exp, out); collectOps(s.after, out); if (s.opinion) collectOps(s.pick[0] || [], out); } });
    return out;
  }
  async function begin(pos) {
    FX.unlock(); $('#ov').classList.add('hidden'); $('#ov').innerHTML = '';
    unlockAudio();
    frames = [{ list: L.steps, i: 0 }]; trail = []; ops = []; stars = 0; firstTry = 0; answered = {}; combo = 0; stageNo = 0;
    BOARD.setLesson(L);
    if (pos && pos.i) {
      collectOps(L.steps.slice(0, pos.i), ops); await BOARD.replay(ops);
      frames[0].i = pos.i; stars = pos.stars || 0; firstTry = pos.firstTry || 0; answered = pos.answered || {}; stageNo = (pos.stageNo || 1) - 1;
      $('#stars b').textContent = stars;
    } else { CH.act('ho', 'enterL'); CH.act('piyo', 'enterR'); }
    drawMap(); state = 'idle';
    note('start', { steps: L.steps.length, total });
    setTimeout(next, pos && pos.i ? 100 : 700);
  }

  /* ---------- 操作 ---------- */
  function onNext() {
    if (state === 'say' && typing && !typing.done) { finishTyping(); if (!audio) return; return; }
    if (state === 'say' && audio) { stopVoice(); CH.talk(null, false); state = 'ready'; }
    if (state === 'q-wait' && typing && !typing.done) { finishTyping(); return; }
    if (state === 'ready' || state === 'say' || state === 'busy') next();
  }
  function bind() {
    $('#bNext').onclick = e => { e.stopPropagation(); onNext(); };
    $('#bubble').onclick = () => onNext();
    $('#bBack').onclick = e => { e.stopPropagation(); goBack(); };
    $('#bAgain').onclick = e => { e.stopPropagation(); again(); };
    $('#bAuto').onclick = e => { e.stopPropagation(); SET.auto = !SET.auto; saveSettings(); applySettingsToScreen(); if (SET.auto && state === 'ready') next(); };
    $('#bSet').onclick = () => openSettings();
    addEventListener('keydown', e => {
      if (!$('#ov').classList.contains('hidden') && !['end'].includes(state)) { if (e.key === 'Enter' && $('#bGo')) { e.preventDefault(); $('#bGo').click(); } return; }
      const k = e.key;
      if (state === 'num') { if (/^[0-9.]$/.test(k)) return numKey(k); if (k === 'Backspace') return numKey('bs'); if (k === 'Enter') { e.preventDefault(); return numKey('go'); } }
      if (state === 'q' && /^[1-4]$/.test(k)) return choose(+k - 1);
      if (state === 'tap' && (k === 'Enter' || k === ' ')) { e.preventDefault(); const b = $('#panel .tapbtn'); if (b) b.click(); return; }
      if (k === 'Enter' || k === ' ' || k === 'ArrowRight') { e.preventDefault(); onNext(); }
      else if (k === 'ArrowLeft') goBack();
      else if (k === 'r' || k === 'R') again();
      else if (k === 'a' || k === 'A') $('#bAuto').click();
    });
  }

  /* ---------- 読みこみ ---------- */
  function loadScript(src) { return new Promise(res => { const s = document.createElement('script'); s.src = src; s.onload = () => res(true); s.onerror = () => res(false); document.head.appendChild(s); }); }
  async function boot() {
    fit();
    const ok = await loadScript(`lessons/${LID}.js`);
    L = HS_DATA[LID];
    if (!ok || !L) { document.body.insertAdjacentHTML('beforeend', `<p style="position:fixed;inset:20px;font-size:24px">រកមិនឃើញមេរៀន «${esc(LID)}»។</p>`); return; }
    await loadScript(`audio/common-g${L.grade}/meta.js`); await loadScript(`audio/${LID}/meta.js`);
    if (qs.get('voice') !== '0') await Promise.all([`common-g${L.grade}`, LID].map(async d => { const f = (window.HSPACK || {})[d]; if (f) PACKS[d] = await fetchPack(`audio/${d}/${f}`); }));   // 声のまとめ（あれば）
    document.body.classList.add('g' + L.grade); if (EMBED) document.body.classList.add('embed');
    loadSettings();
    total = L.steps.filter(s => (s.k === 'q' && !s.opinion) || s.k === 'num').length;
    $('#hd .unit').innerHTML = R(`ថ្នាក់ទី ${L.grade} ${L.unit}`); $('#hd .ttl').innerHTML = R(L.title);
    document.title = `${L.title}｜មេរៀនគណិតវិទ្យារបស់គ្រូហូ និងពីយ៉ូ`;
    CH.init(); bind(); applySettingsToScreen(); drawMap(); BOARD.setLesson(L);
    if (qs.get('test') === '1') window.PLAY = { next, choose, numKey, state: () => state, step: () => curStep, begin, goBack, stars: () => stars, total: () => total, tap: () => { const b = $('#panel .tapbtn'); if (b) b.click(); }, act: () => BOARD.finish(), finishTyping, frames: () => frames, L: () => L };
    if (qs.get('autostart') === '1') begin(0); else startCard();
    note('ready', { steps: L.steps.length, total });
  }
  boot();
})();
