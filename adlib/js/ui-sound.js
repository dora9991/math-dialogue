/* アドリブ・ラボ：④音と書き出しタブ（楽器・ミキサー・WAV/MIDI/MusicXML/印刷・保存）と、はじめての使い方 */
(function () {
  'use strict';
  const AL = window.AL;
  const { T, C, A, L, S, B, Au, N, X, P, U } = AL;
  const { h, $, $$ } = U;
  const App = AL.App;
  const st = () => App.st;
  const el = {};
  const PARTS = [['comp', 'コード（伴奏）'], ['bass', 'ベース'], ['drums', 'ドラム'], ['solo', 'ソロ']];

  /* ---------------- 書き出し ---------------- */
  const fname = ext => U.safeName(st().title || 'adlib') + '.' + ext;
  function exportLoops() { return el.exLoops ? +el.exLoops.value : 2; }
  // 画面を一度も鳴らしていなくても書き出せるように、Engine の設定を素の値で渡す
  const engineLike = () => ({ mix: st().mix, reverb: st().reverb, muted: st().muted, inst: { comp: st().comp, bass: st().bass, drums: st().drums, solo: st().soloInst } });

  App.exportWav = async function () {
    if (!App.hasChords) { U.toast('先にコード譜を入力してください'); return; }
    const btn = el.wavBtn;
    try {
      btn.disabled = true; btn.textContent = '書き出し中…（しばらくお待ちください）';
      await new Promise(r => setTimeout(r, 30));
      const plan = App.makePlan();
      const buf = await Au.renderOffline(plan, engineLike(), { loops: exportLoops(), solo: st().soloMode !== 'off', sampleRate: 44100, tail: 2.2 });
      U.download(fname('wav'), Au.encodeWav(buf));
      U.toast('WAV を書き出しました（' + Math.round(buf.duration) + '秒）');
    } catch (e) { console.error(e); U.toast('書き出しに失敗しました：' + e.message); }
    finally { btn.disabled = false; btn.textContent = '🔊 WAV（音声）'; }
  };
  App.exportMidi = function () {
    if (!App.hasChords) { U.toast('先にコード譜を入力してください'); return; }
    const loops = exportLoops(), plan = App.makePlan(), col = X.collect(plan, loops, { solo: st().soloMode !== 'off' });
    const key = App.an.key;
    const markers = [];
    for (let k = 0; k < loops; k++) App.slots.forEach(s => markers.push({ t: s.t0 + k * plan.chorusBeats, text: s.src }));
    const bytes = X.buildMidi({
      title: st().title || 'アドリブ・ラボ', bpb: App.bpb, tempo: st().tempo, feel: App.feel(), keyFifths: key.fifths, keyMinor: key.mode === 'minor', markers,
      tracks: [
        { name: 'コード', channel: 0, program: X.GM_PROGRAM[st().comp] || 0, events: col.comp },
        { name: 'ベース', channel: 1, program: X.GM_PROGRAM[st().bass] || 32, events: col.bass },
        { name: 'ソロ（' + App.soloInstDef().jp + '）', channel: 2, program: X.GM_PROGRAM[st().soloInst] || 65, events: col.solo, volume: 110 },
      ],
      drums: { name: 'ドラム', events: col.drums },
    });
    U.download(fname('mid'), new Blob([bytes], { type: 'audio/midi' }));
    U.toast('MIDI を書き出しました（実音。シャッフルなどのノリは、再生と同じ時間のずれとして入っています）');
  };
  App.exportXml = function () {
    if (!App.hasChords) { U.toast('先にコード譜を入力してください'); return; }
    const sb = App.buildScore(App.solo);
    const xml = X.buildMusicXml({ title: st().title || 'アドリブ・ソロ', tempo: st().tempo, score: sb.score, mode: sb.mode, inst: sb.inst, feel: App.feelLabel() });
    U.download(fname('musicxml'), new Blob([xml], { type: 'application/vnd.recordare.musicxml+xml' }));
    U.toast('MusicXML を書き出しました（MuseScore などで開けます）');
  };
  App.exportText = function () {
    const txt = '// ' + (st().title || 'アドリブ・ラボ') + '\n// スタイル：' + B.STYLES[st().style].jp + '  テンポ：' + st().tempo + '\n' + st().text + '\n';
    U.download(fname('txt'), new Blob([txt], { type: 'text/plain;charset=utf-8' }));
  };
  App.printScore = function () {
    if (!App.hasChords) { U.toast('先にコード譜を入力してください'); return; }
    let area = $('#printArea');
    if (area) area.remove();
    area = h('div', { id: 'printArea', 'aria-hidden': 'true' });
    area.appendChild(h('h1', null, st().title || 'アドリブ・ラボ'));
    area.appendChild(h('p', { class: 'p-sub' }, App.an.key.name + '　' + B.STYLES[st().style].jp + '　♩=' + st().tempo + '　' + App.soloInstDef().jp + (st().concert ? '（実音）' : '')));
    const g = $('#chartGrid');
    if (g) { const c = g.cloneNode(true); c.classList.remove('picking'); $$('.playing,.now,.sel,.inrange', c).forEach(x => x.classList.remove('playing', 'now', 'sel', 'inrange')); area.appendChild(c); }
    const sb = App.buildScore(App.solo);
    const r = N.render(sb.score, { width: 720, ss: 8, barsPerSystem: 4 });
    area.appendChild(h('h2', null, 'ソロ譜（' + sb.inst.jp + (st().concert ? '・実音' : sb.inst.transpose ? '・移調譜' : '') + '）'));
    area.appendChild(h('div', { class: 'p-score', html: r.svg }));
    document.body.appendChild(area);
    document.body.classList.add('printing');
    const done = () => { document.body.classList.remove('printing'); area.remove(); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(() => { window.print(); setTimeout(done, 1000); }, 50);
  };

  /* ---------------- 画面 ---------------- */
  function sliderRow(label, value, min, max, step, onInput, fmt) {
    const out = h('span', { class: 'val' }, fmt(value));
    const rng = h('input', { type: 'range', class: 'rng', min, max, step, value, 'aria-label': label, oninput: () => { out.textContent = fmt(+rng.value); onInput(+rng.value); } });
    return { rng, out, root: h('div', { class: 'srow' }, rng, out) };
  }
  const pct = v => Math.round(v * 100) + '%';

  function build() {
    const root = $('#tab-sound');
    U.clear(root);

    /* --- はじめての使い方 --- */
    root.appendChild(h('div', { class: 'card howto' },
      h('div', { class: 'card-h' }, h('h2', null, 'はじめての使い方')),
      h('ol', null,
        h('li', null, h('b', null, 'コード譜を入れる'), '　「① コード譜」でサンプルをえらぶか、コードを打ちこみます。▶（またはスペースキー）で伴奏が鳴ります。'),
        h('li', null, h('b', null, 'コードの役割を知る'), '　譜面のコードをタップすると、そのコードが ii・V・I のどれか、セカンダリー・ドミナントか裏コードか…と、役割をいくつも読みとって教えます。'),
        h('li', null, h('b', null, 'ソロを聴く・見る'), '　「② ソロ」で、役割に合うリックをつないだソロが楽譜になって鳴ります。フレーズをタップして、別のリックに差しかえられます。'),
        h('li', null, h('b', null, 'リックを集める'), '　「③ リック辞典」には、ドミナント・ii–V–I・ターンアラウンドなど、種類ごとのリックが入っています。キーを変えて、楽譜と音で確かめられます。')),
      h('p', { class: 'muted small' }, 'キーボード：スペース＝再生／停止、Esc＝停止。操作は、このブラウザの中だけで完結します（コード譜や設定の保存も、このブラウザの中だけ）。')));

    /* --- 楽器 --- */
    el.comp = U.select(Au.INSTRUMENTS.comp.map(i => [i.id, i.jp]), st().comp, v => App.setBacking({ comp: v }), { 'aria-label': 'コードの楽器' });
    el.bass = U.select(Au.INSTRUMENTS.bass.map(i => [i.id, i.jp]), st().bass, v => App.setBacking({ bass: v }), { 'aria-label': 'ベースの楽器' });
    el.drums = U.select(Au.INSTRUMENTS.drums.map(i => [i.id, i.jp]), st().drums, v => App.setBacking({ drums: v }), { 'aria-label': 'ドラムの種類' });
    el.solo = U.select(Au.INSTRUMENTS.solo.map(i => [i.id, i.jp]), st().soloInst, v => App.setSoloParams({ soloInst: v }), { 'aria-label': 'ソロの楽器' });
    const reseed = h('button', { type: 'button', class: 'btn', onclick: () => { App.setBacking({ seed: (st().seed * 5 + 17 + Math.floor(Math.random() * 1000)) % 99991 + 1 }); U.toast('伴奏のパターンをつくりなおしました'); } }, '🎲 伴奏のパターンを変える');
    root.appendChild(h('div', { class: 'card' },
      h('div', { class: 'card-h' }, h('h2', null, '楽器'), reseed),
      h('div', { class: 'fields' }, U.field('コード', el.comp), U.field('ベース', el.bass), U.field('ドラム', el.drums), U.field('ソロ', el.solo))));

    /* --- MIDI で送る（Kontakt など） --- */
    root.appendChild(buildMidi());

    /* --- ミキサー --- */
    el.mixRows = {};
    const mixCard = h('div', { class: 'card mixer' }, h('div', { class: 'card-h' }, h('h2', null, 'ミキサー'), h('button', { type: 'button', class: 'btn sm ghost', onclick: resetMix }, '初期値にもどす')));
    const list = h('div', { class: 'mix-list' });
    PARTS.concat([['click', 'クリック'], ['master', '全体の音量']]).forEach(([id, label]) => {
      const vol = sliderRow(label + 'の音量', st().mix[id], 0, 1.5, 0.01, v => { st().mix[id] = v; if (App.engine) App.engine.setVolume(id, v); App.save(); }, pct);
      const hasMute = id !== 'click' && id !== 'master';
      const mute = hasMute ? h('input', { type: 'checkbox', class: 'mute', 'aria-label': label + 'を消す', checked: st().muted[id] ? true : null, onchange: () => { st().muted[id] = mute.checked; if (App.engine) App.engine.setMute(id, mute.checked); App.save(); } }) : null;
      const rev = hasMute ? sliderRow(label + 'の残響', st().reverb[id] == null ? 0 : st().reverb[id], 0, 1, 0.01, v => { App.setReverb(id, v); App.save(); }, pct) : null;
      el.mixRows[id] = { vol, mute, rev };
      list.appendChild(h('div', { class: 'mix-row' + (hasMute ? '' : ' single') },
        h('div', { class: 'ml' }, label),
        hasMute ? h('label', { class: 'mm' }, mute, h('span', null, '消す')) : h('span'),
        h('div', { class: 'mv' }, h('span', { class: 'mlab' }, '音量'), vol.root),
        rev ? h('div', { class: 'mr' }, h('span', { class: 'mlab' }, '残響'), rev.root) : null));
    });
    mixCard.appendChild(list);
    root.appendChild(mixCard);

    /* --- 書き出し --- */
    el.exLoops = U.select([[1, '1コーラス'], [2, '2コーラス'], [3, '3コーラス'], [4, '4コーラス'], [6, '6コーラス'], [8, '8コーラス']], 2, () => {}, { 'aria-label': '書き出すコーラスの数' });
    el.wavBtn = h('button', { type: 'button', class: 'btn primary', onclick: () => App.exportWav() }, '🔊 WAV（音声）');
    root.appendChild(h('div', { class: 'card' },
      h('div', { class: 'card-h' }, h('h2', null, '書き出し')),
      h('div', { class: 'row gap wrap' }, U.field('書き出すながさ（WAV・MIDI）', el.exLoops)),
      h('div', { class: 'row gap wrap mt' },
        el.wavBtn,
        h('button', { type: 'button', class: 'btn', onclick: () => App.exportMidi() }, '🎹 MIDI（伴奏＋ソロ）'),
        h('button', { type: 'button', class: 'btn', onclick: () => App.exportXml() }, '🎼 MusicXML（ソロ譜）'),
        h('button', { type: 'button', class: 'btn', onclick: () => App.printScore() }, '🖨 印刷・PDF'),
        h('button', { type: 'button', class: 'btn', onclick: () => App.exportText() }, '📄 コード譜（テキスト）')),
      h('ul', { class: 'muted small notes' },
        h('li', null, 'WAV・MIDI は「ソロ」の設定（あり／なし／毎回あたらしく）を引きつぎます。'),
        h('li', null, 'MIDI は実音で、シャッフルなどのノリは、再生と同じ時間のずれとして入ります。コード名はマーカーとして入ります。'),
        h('li', null, 'MusicXML は、いま画面に出ているソロ（コード記号つき）を、MuseScore・Finale・Sibelius・Dorico などで開けます。'),
        h('li', null, '印刷は、ブラウザの印刷画面で「PDF に保存」を選べば PDF になります。'))));

    /* --- 保存・初期化 --- */
    root.appendChild(h('div', { class: 'card' },
      h('div', { class: 'card-h' }, h('h2', null, 'このブラウザの保存')),
      h('p', { class: 'muted small' }, '設定とコード譜は、自動でこのブラウザに保存されます（サーバーには送りません）。'),
      h('div', { class: 'row gap wrap' },
        h('button', { type: 'button', class: 'btn', onclick: () => { if (window.confirm('設定を初期値にもどしますか？（保存した譜面は消えません）')) { U.store.remove('state'); location.hash = ''; location.reload(); } } }, '設定を初期値にもどす'),
        h('button', { type: 'button', class: 'btn ghost', onclick: () => { if (window.confirm('保存した譜面（マイ譜面）をすべて削除しますか？')) { U.store.remove('saved'); U.toast('削除しました'); } } }, 'マイ譜面をすべて削除'))));

    /* --- しくみ --- */
    root.appendChild(h('div', { class: 'card about' },
      h('div', { class: 'card-h' }, h('h2', null, 'しくみ')),
      h('p', { class: 'small' }, 'リック辞典（' + L.all.length + '本）は、すべて「C の調で、楽譜を読むように」書いたデータで、コードのルートからの度数に直して、どのキーにも綴りを崩さず移調します。ソロの自動作成は、コード進行から ii–V–I などの「かたまり」を見つけて区切り、かたまりごとに辞典から合うリックを選び、前の音に近いオクターブで置いてつなぎます。伴奏もソロも、ブラウザの中で合成した音です。'),
      h('p', { class: 'muted small' }, 'キー推定やコードの役割の読みとりは、ひとつの解釈です。違うと思ったら「キーの読みかえ」で変えられます。')));
  }
  function resetMix() {
    const d = App.defaults();
    Object.keys(d.mix).forEach(k => { st().mix[k] = d.mix[k]; });
    Object.keys(d.reverb).forEach(k => { App.setReverb(k, d.reverb[k]); });
    st().muted = {};
    App.applyAudio(); App.save();
    Object.keys(el.mixRows).forEach(id => {
      const r = el.mixRows[id];
      r.vol.rng.value = st().mix[id]; r.vol.out.textContent = pct(st().mix[id]);
      if (r.mute) r.mute.checked = false;
      if (r.rev) { r.rev.rng.value = st().reverb[id] || 0; r.rev.out.textContent = pct(st().reverb[id] || 0); }
    });
    U.toast('ミキサーを初期値にもどしました');
  }
  function refresh() {
    if (!el.comp) return;
    el.comp.value = st().comp; el.bass.value = st().bass; el.drums.value = st().drums; el.solo.value = st().soloInst;
    updateMidi();
  }

  /* ---------------- MIDI で送る（Kontakt など） ---------------- */
  const MIDI_PARTS = [['comp', 'コード', 1], ['bass', 'ベース', 2], ['solo', 'ソロ', 3], ['drums', 'ドラム', 10]];
  function buildMidi() {
    const MO = AL.MO, m = st().midi;
    const card = h('div', { class: 'card midi-card', id: 'midiCard' }, h('div', { class: 'card-h' }, h('h2', null, 'Kontakt などで鳴らす（MIDI で送る）')));
    card.appendChild(h('p', { class: 'muted' }, 'チェックしたパートを、ブラウザでは鳴らさず、MIDI でパソコンの中の音源（Kontakt など）へ送ります。▶ を押せば、その場で音源が弾きます（差しかえ・テンポ変更もそのまま）。'));
    el.midiStatus = h('p', { class: 'midi-status', id: 'midiStatus', role: 'status' });
    if (!MO.supported()) {
      card.appendChild(el.midiStatus);
      el.midiStatus.textContent = 'このブラウザは MIDI の送り出しに対応していません。Mac なら Chrome（か Edge）で開いてください（Safari・iPhone では使えません）。';
      card.appendChild(midiHowto());
      return card;
    }
    el.midiSw = U.switchEl('MIDI で送る', m.on, on => App.setMidi({ on }), 'オンにすると、チェックしたパートを MIDI で送ります');
    el.midiSel = h('select', { id: 'midiOut', 'aria-label': 'MIDI の送り先', onchange: () => App.setMidi({ out: el.midiSel.value }) });
    el.midiParts = {};
    const parts = h('div', { class: 'midi-parts' });
    MIDI_PARTS.forEach(([id, label, ch]) => {
      const cb = h('input', { type: 'checkbox', checked: m.parts[id] ? true : null, onchange: () => App.setMidi({ parts: { [id]: cb.checked } }) });
      el.midiParts[id] = cb;
      parts.appendChild(h('label', { class: 'midi-part' }, cb, h('span', null, label + '（' + ch + 'ch）')));
    });
    el.midiOffset = sliderRow('タイミング', m.offset, -150, 150, 5, v => App.setMidi({ offset: v }), v => (v > 0 ? '+' : '') + v + ' ms');
    const testBtn = h('button', { type: 'button', class: 'btn', id: 'midiTest', onclick: () => {
      if (!MO.active()) { U.toast('先に「MIDI で送る」をオンにして、送り先を選んでください'); return; }
      const done = MO.test();
      U.toast(done.length ? 'テスト音を送りました（' + done.map(p => MIDI_PARTS.find(x => x[0] === p)[1]).join('・') + '）' : '送るパートにチェックがありません');
    } }, '🔔 テスト音を送る');
    card.appendChild(h('div', { class: 'fields' },
      h('div', { class: 'field' }, h('label', { class: 'f-label' }, '送る'), el.midiSw),
      U.field('送り先', el.midiSel, 'Mac なら「IAC ドライバ」のバス'),
      U.field('送るパート（チャンネル）', parts, 'チェックしたパートは、ブラウザでは鳴りません（ミキサーの音量・残響も効きません。音量は Kontakt で）'),
      U.field('タイミング', el.midiOffset.root, '音源の音が、ブラウザの音（カウント・メトロノームなど）より遅れて聞こえるときは、マイナスに')));
    card.appendChild(h('div', { class: 'row gap wrap' }, testBtn));
    card.appendChild(el.midiStatus);
    card.appendChild(midiHowto());
    updateMidi();
    return card;
  }
  function midiHowto() {
    return h('details', { class: 'help midi-howto' },
      h('summary', null, 'Mac での準備（はじめに1回だけ）'),
      h('ol', null,
        h('li', null, '「Audio MIDI 設定」を開く（アプリケーション → ユーティリティ）。メニューの「ウインドウ」→「MIDI スタジオを表示」→「IAC ドライバ」をダブルクリックして、「装置はオンライン」にチェックを入れる。'),
        h('li', null, 'Kontakt を単体で起動し、設定（Options／Preferences）の「MIDI」で、IAC ドライバのバス（IAC Driver Bus 1）の入力をオンにする。'),
        h('li', null, 'Kontakt に音色を読みこみ、それぞれの MIDI チャンネルを合わせる：コード＝1、ベース＝2、ソロ＝3、ドラム＝10（音色の上の帯の「MIDI Ch」）。ドラムは GM の並び（キック 36・スネア 38・ハイハット 42…）で送ります。'),
        h('li', null, 'このページを Chrome で開き、「MIDI で送る」をオン →（はじめての時は、Chrome が MIDI の使用の許可を聞くので「許可」）→ 送り先にそのバスを選ぶ →「テスト音を送る」で鳴るか確かめる。')),
      h('p', { class: 'f-hint' }, 'Logic Pro で受けることもできます（ソフトウェア音源のトラックに Kontakt を立てる）。ただ、Kontakt 単体のほうが手順が少なく、軽く済みます。'),
      h('p', { class: 'f-hint' }, '重いときは、Kontakt の設定（Audio）でバッファ（Latency）を大きめに。弾きながらではなく、聞くための使い方なので、遅れは気になりません。止めたあと、少しだけ音が残ることがあります（先に予約した分）。'));
  }
  function updateMidi() {
    const MO = AL.MO, m = st().midi;
    if (!el.midiSel) return;
    el.midiSw.input.checked = !!m.on;
    const outs = MO.outputs(), cur = MO.outName() || m.out;
    U.clear(el.midiSel);
    if (!outs.length) el.midiSel.appendChild(h('option', { value: '' }, m.on ? '（見つかりません）' : '（オンにすると、ここに出ます）'));
    outs.forEach(o => el.midiSel.appendChild(h('option', { value: o.name }, o.name)));
    if (cur && !outs.some(o => o.name === cur)) el.midiSel.appendChild(h('option', { value: cur }, cur + '（いまは見つかりません）'));
    el.midiSel.value = cur || '';
    el.midiSel.disabled = !m.on;
    MIDI_PARTS.forEach(([id]) => { el.midiParts[id].checked = !!m.parts[id]; });
    el.midiStatus.textContent = App.midiStatus || (MO.active()
      ? '「' + MO.outName() + '」へ送っています（' + MIDI_PARTS.filter(([id]) => m.parts[id]).map(([, l, ch]) => l + ' ' + ch + 'ch').join('・') + '）'
      : m.on ? '送り先を選んでください' : 'オフ：すべてブラウザの音で鳴らしています');
    el.midiStatus.classList.toggle('on', MO.active());
  }
  App.on('init', build);
  App.on('midi', updateMidi);
  App.on('settings', refresh);
  App.on('solo', refresh);
  App.on('tab', name => { if (name === 'sound') refresh(); });
})();
