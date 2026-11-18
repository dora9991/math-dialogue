/* MusicXML の中身の整合を調べる（test/render.js と test/fuzz.js から使う）
   ・小節の長さ（duration の合計）が、拍子どおり
   ・音符の形（<type>・<dot/>・<time-modification>＝3連符）から数えた長さが、<duration> と合う
   ・3連符の音が、かたまり（tuplet の start〜stop）の中にあり、かたまりの長さがちょうど1拍
   divisions は 12（4分音符＝12） */
const TICKS = { whole: 48, half: 24, quarter: 12, eighth: 6, '16th': 3, '32nd': 1.5 };

function checkMusicXml(xml, bpb) {
  const problems = [];
  xml.split('<measure ').slice(1).forEach((ms, k) => {
    const body = ms.replace(/<harmony>[\s\S]*?<\/harmony>/g, '');
    const notes = body.match(/<note>[\s\S]*?<\/note>/g) || [];
    const at = `${k + 1}小節目`;
    let sum = 0, inTup = false, tupSum = 0;
    notes.forEach(nt => {
      const dur = +/<duration>(\d+)<\/duration>/.exec(nt)[1];
      sum += dur;
      if (/<rest measure="yes"\/>/.test(nt)) return;
      const ty = /<type>([^<]+)<\/type>/.exec(nt);
      const dot = /<dot\/>/.test(nt);
      const tm = /<time-modification><actual-notes>(\d+)<\/actual-notes><normal-notes>(\d+)<\/normal-notes>/.exec(nt);
      if (!ty || TICKS[ty[1]] == null) { problems.push(`${at}：音符の種類がない／知らない種類 ${ty && ty[1]}`); return; }
      const want = TICKS[ty[1]] * (dot ? 1.5 : 1) * (tm ? +tm[2] / +tm[1] : 1);
      if (Math.abs(want - dur) > 1e-6) problems.push(`${at}：音符の形（${ty[1]}${dot ? '＋付点' : ''}${tm ? '・3連' : ''}）の長さ ${want} と、<duration> ${dur} が合わない`);
      if (tm && !inTup && !/<tuplet type="start"/.test(nt)) problems.push(`${at}：3連符の音が、かたまりの外にある`);
      if (/<tuplet type="start"/.test(nt)) { inTup = true; tupSum = 0; }
      if (inTup) tupSum += dur;
      if (/<tuplet type="stop"/.test(nt)) { inTup = false; if (tupSum !== 12) problems.push(`${at}：3連符のかたまりの長さが ${tupSum}（1拍＝12 のはず）`); }
    });
    if (inTup) problems.push(`${at}：3連符のかたまりが閉じていない`);
    if (sum !== bpb * 12) problems.push(`${at}の長さ ${sum}（${bpb * 12} のはず）`);
  });
  return problems;
}

module.exports = { checkMusicXml };
