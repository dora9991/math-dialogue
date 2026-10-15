/* すべてのリックを、拍の位置をずらしながら楽譜（SVG）と MusicXML にして、小節の長さ・NaN・タイの整合を確かめる
   （16分・3連符・休符のあとの3連符・付点・タイ・ずれた位置からの入り、などの書き方の落とし穴を、辞典ぜんぶで洗う）
   使い方：node adlib/test/render.js */
const fs = require('fs'), path = require('path');
const D = path.join(__dirname, '../js/');
['theory', 'chart', 'analysis', 'licks'].forEach(f => require(D + f + '.js'));
fs.readdirSync(D).filter(f => /^licks-.*\.js$/.test(f)).sort().forEach(f => require(D + f));
['solo', 'comping', 'glyphs', 'notation', 'presets', 'player', 'export'].forEach(f => require(D + f + '.js'));
const { T, C, L, N, X } = AL;
const { checkMusicXml } = require('./xmlcheck.js');
let bad = 0, n = 0; const byOff = {};
const fail = (m, ctx) => { bad++; const o = /位置([\d.]+)/.exec(ctx || ''); const k = o ? o[1] : '?'; byOff[k] = (byOff[k] || 0) + 1; if (bad <= 15) console.log('✗', m, ctx || ''); };
const INST = { transpose: 0, clef: 'treble' };
for (const bpb of [4, 3]) {
  const ch = C.parse('| Cmaj7 | % | % | % |', { beatsPerBar: bpb });
  const slots = C.slotsOf(ch);
  for (const l of L.all) {
    if (bpb === 4 ? l.bpb !== 4 : false) continue;
    if (bpb === 3 && l.bpb !== 3 && !(l.bpb === 4 && l.segs.length === 1 && l.cuts.some(c => c >= 1.5 && c <= 3))) continue;
    // 位置：エンジンがリックを置くのは、コードの頭か、そこから1拍・2拍あとの「拍の頭」だけ
    // （半拍ずれた位置から始まる3連符は、楽譜に素直には書けない＝エンジンは作らないので、ここでは見ない）
    for (const off of (bpb === 4 ? [0, 1, 2] : [0, 1])) {
      const chords = l.refSrc.map(s => T.parseChord(s));
      const limit = bpb === 3 && l.bpb === 4 ? Math.min(3, l.cuts.filter(c => c <= 3 + 1e-9).pop() || 3) : undefined;
      const r = L.realize(l, chords, { t0: off, lo: 55, hi: 84, limit: limit == null ? undefined : limit });
      const ev = r.events.filter(e => !e.rest);
      if (!ev.length) continue;
      const end = Math.max.apply(null, ev.map(e => e.t + e.dur));
      if (end > ch.chorusBeats - 0.01) continue;
      n++;
      const ctx = `${l.id}「${l.name}」bpb${bpb} 位置${off}`;
      try {
        const score = N.scoreFromEvents({ events: ev.map((e, k) => Object.assign({}, e, { id: k })), slots, bpb, bars: ch.chorusBars, keySpell: T.parseSpell('C'), keyMode: 'major', inst: INST, feel: 'x', marks: [] });
        const out = N.render(score, { width: 700, ss: 8, barsPerSystem: 4 });
        if (!out.svg || /NaN|undefined|Infinity/.test(out.svg)) fail('SVG に NaN/undefined', ctx);
        const xml = X.buildMusicXml({ title: 't', tempo: 120, score, mode: 'major', inst: Object.assign({ id: 'piano', jp: 'x' }, INST), feel: 'x' });
        checkMusicXml(xml, bpb).forEach(m => fail('MusicXML ' + m, ctx));
        // 音の数：書いた音（タイでつながったものは1つ）と、楽譜の音の数が合う
        const tiesStart = (xml.match(/<tie type="start"\/>/g) || []).length, tiesStop = (xml.match(/<tie type="stop"\/>/g) || []).length;
        if (tiesStart !== tiesStop) fail(`タイの始まりと終わりの数が違う ${tiesStart}/${tiesStop}`, ctx);
        const nNotes = (xml.match(/<note>(?:(?!<rest)[\s\S])*?<\/note>/g) || []).length - tiesStop;
        if (nNotes !== ev.length) fail(`音の数が違う：楽譜 ${nNotes}／リック ${ev.length}`, ctx);
      } catch (e) { fail('例外：' + (e && e.stack ? e.stack.split('\n').slice(0, 2).join(' | ') : e), ctx); }
    }
  }
}
console.log(`render：${n} 通り（リック × 位置）を、楽譜と MusicXML にして確認`);
if (bad) { console.log(bad + ' 件の問題（位置ごと）', JSON.stringify(byOff)); process.exit(1); }
console.log('render: OK');
