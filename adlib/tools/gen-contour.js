#!/usr/bin/env node
/* 「跳ぶ・ジグザグ・戻る・まぜる」リック（js/licks-zz-contour.js）を、型（テンプレート）× コード・スケールの音から作る。
   node tools/gen-contour.js            … 候補の一覧（検査つき）を出して、js/licks-zz-contour.js を書き出す
   node tools/gen-contour.js list       … 書き出さずに、全候補の検査結果だけ見る（● 選んだ／○ 使える／× 検査に通らない）
   node tools/gen-contour.js check      … いまの js/licks-zz-contour.js が、このスクリプトの出力と同じかを確かめる（test/licks.js から呼ぶ）
   型は「スケールの何番目の音か（0 = 根音、N = 1オクターブ上）」で書いてあるので、どのスケールにも当てはめられる。
   名前と解説の度数は、実際の音から数えて入れる（手で書かない）。
   どのコード・スケールにどの型を使うか・個別の言いかえは、tools/contour-overrides.js にある。
   型を足す・選びなおすときは、ここか contour-overrides.js を直して作りなおす（js/licks-zz-contour.js は手で直さない）。
   番号（id）は並び順で決まるので、すでに公開したリックの順番は変えず、足すときは各コードの最後に足すこと。 */
const path = require('path'), fs = require('fs');
const dir = path.resolve(__dirname, '../js');
const OUT = 'licks-zz-contour.js';
['theory', 'chart', 'analysis', 'licks'].forEach(f => require(path.join(dir, f + '.js')));
fs.readdirSync(dir).filter(f => /^licks-.*\.js$/.test(f) && f !== OUT).sort().forEach(f => require(path.join(dir, f)));
const { T, L } = globalThis.AL;
const mode = process.argv[2] || 'write';
const OV = require('./contour-overrides.js');
const quiet = mode === 'check';
const log = (...a) => { if (!quiet) console.log(...a); };

/* ---- コード・スケールごとの音 ---- */
// S：スケール（7音か8音。C から上へ）。T・F・V：3度・5度・7度にあたる音が、スケールの何番目か。P：合うペンタトニック（5音。低い順）
const CTX = {
  dom7: { ref: 'C7', title: 'ドミナント7th（ミクソリディアン）', S: 'C D E F G A Bb', T: 2, F: 4, V: 6, P: 'C D E G Bb', pjp: '1-2-3-5-♭7 のペンタ' },
  dom7alt: { ref: 'C7alt', title: 'オルタード・ドミナント', S: 'C Db Eb E Gb Ab Bb', T: 3, F: 5, V: 6, P: 'Db Eb Gb Ab Bb', pjp: 'E♭ マイナー・ペンタ', tags: ['alt'] },
  'dom7#11': { ref: 'C7#11', title: 'リディアン♭7（7♯11）', S: 'C D E F# G A Bb', T: 2, F: 4, V: 6, tags: ['lydian'] },
  dom7sus: { ref: 'C7sus4', title: '7sus4', S: 'C D F G A Bb', T: 2, F: 3, V: 5, P: 'C D F G Bb', pjp: 'sus のペンタ（1-2-4-5-♭7）',
    zn: '1つとばしのジグザグ', zu: 'スケールを1つとばして上がっては1つ戻る', zd: 'スケールを1つとばして下がっては1つ戻る' },   // 3度（E）を使わない6音
  blues7: { ref: 'C7', title: 'ブルースのドミナント', S: 'C D E F G A Bb', T: 2, F: 4, V: 6, P: 'C Eb F G Bb', pjp: 'マイナー・ペンタ', tags: ['blues'] },
  maj7: { ref: 'Cmaj7', title: 'メジャー7th', S: 'C D E F G A B', T: 2, F: 4, V: 6, P: 'C D E G A', pjp: 'メジャー・ペンタ' },
  'maj7#11': { ref: 'Cmaj7#11', title: 'リディアン（maj7♯11）', S: 'C D E F# G A B', T: 2, F: 4, V: 6, P: 'D E F# A B', pjp: 'D メジャー・ペンタ（9-3-♯11-13-7）', tags: ['lydian'] },
  min7: { ref: 'Cm7', title: 'マイナー7th（ドリアン）', S: 'C D Eb F G A Bb', T: 2, F: 4, V: 6, P: 'C Eb F G Bb', pjp: 'マイナー・ペンタ' },
  min6: { ref: 'Cm6', title: 'マイナー6th（メロディックマイナー）', S: 'C D Eb F G A B', T: 2, F: 4, V: 5, P: 'C D Eb G A', pjp: 'マイナー6のペンタ（1-2-♭3-5-6）' },
  minmaj7: { ref: 'Cm(maj7)', title: 'マイナー・メジャー7th（メロディックマイナー）', S: 'C D Eb F G A B', T: 2, F: 4, V: 6 },
  m7b5: { ref: 'Cm7b5', title: 'ハーフディミニッシュ（ロクリアン♯2）', S: 'C D Eb F Gb Ab Bb', T: 2, F: 4, V: 6, P: 'C Eb F Gb Bb', pjp: '1-♭3-4-♭5-♭7 のペンタ' },
  dim7: { ref: 'Cdim7', title: 'ディミニッシュ7th（全・半）', S: 'C D Eb F Gb Ab A B', T: 2, F: 4, V: 6, tags: ['dim'] },
};
const ORDER = Object.keys(CTX);

/* ---- 型 ---- */
// notes：m（その ctx の音）から、音の書き方を作る。s(i) = スケールの i 番目の音、p(i) = ペンタの i 番目の音
// name／idea：d(k) = k 番目に鳴る音の度数（実際の音から数えたもの）
const TPL = [
  /* ---------- 跳ぶ ---------- */
  { key: 'A1', fam: 'leap', lvl: 1, tags: ['leap'],
    notes: m => `${m.s(0)}:q ${m.s(m.F)}:q / ${m.s(m.N)}:h`,
    name: d => `${d(0)}→${d(1)}→オクターブ上へ跳んで、のばす`,
    idea: d => `根音から ${d(1)}、そして1オクターブ上の根音へ。4分音符で2回跳んで、2分音符でのばす。跳ぶだけでできた、いちばん素朴な形。` },
  { key: 'A2', fam: 'leap', lvl: 1, tags: ['leap', 'syncopation'],
    notes: m => `${m.s(0)}:e ${m.s(m.N)}:q. / ${m.s(m.N - 1)}:e ${m.s(m.N - 2)}:e ${m.s(m.N - 3)}:q`,
    name: () => `オクターブ上へ跳んで、のばしてから降りる`,
    idea: d => `1拍目の裏で1オクターブ上の根音へ跳び、そのままのばす。後半は ${d(2)}・${d(3)} と順に降りて、${d(4)} で止まる。` },
  { key: 'A3', fam: 'leap', lvl: 1, tags: ['leap'],
    notes: m => `${m.s(m.F - m.N)}:e ${m.s(0)}:e ${m.s(m.F)}:q / ${m.s(m.T)}:q r:q`,
    name: d => `下の${d(0)}から、根音・上の${d(2)}へ続けて跳ぶ`,
    idea: d => `下の ${d(0)} から根音へ、さらに上の ${d(2)} へと、続けて跳ぶ。${d(3)} に降りて、1拍休む。` },
  { key: 'A4', fam: 'leap', lvl: 1, tags: ['leap', 'syncopation'],
    notes: m => `${m.s(m.T)}:e ${m.s(m.N)}:q. / ${m.s(m.N - 1)}:e ${m.s(m.F)}:e ${m.s(m.T)}:q`,
    name: d => `${d(0)}から上の根音へ跳んで、のばしてから降りる`,
    idea: d => `${d(0)} から、上の根音へ大きく跳んで、のばす。後半は ${d(2)}・${d(3)} と降りて、はじめの ${d(4)} に戻る。` },
  { key: 'A5', fam: 'leap', lvl: 2, tags: ['leap', 'zigzag'],
    notes: m => `${m.s(m.V - 2)} ${m.s(0)} ${m.s(m.V - 1)} ${m.s(0)} / ${m.s(m.V)} ${m.s(0)} ${m.s(m.N)}:q`,
    name: () => `根音を足場に、上の音が広がっていく`,
    idea: d => `低い根音と行き来しながら、上の音が ${d(0)}・${d(2)}・${d(4)} と1つずつ上がり、最後は1オクターブ上の根音へ。跳ぶ幅がだんだん広がる。` },
  { key: 'A6', fam: 'leap', lvl: 2, tags: ['leap', 'zigzag', 'arp'],
    notes: m => `${m.s(0)} ${m.s(m.F)} ${m.s(m.T)} ${m.s(m.V)} / ${m.s(m.F)} ${m.s(m.N + 1)} ${m.s(m.V)}:q`,
    name: () => `大きく上がって少し戻る、を重ねて登る`,
    idea: d => `${d(0)}→${d(1)}、${d(2)}→${d(3)}、${d(4)}→${d(5)} と、大きく上がっては少し戻る。コードの音を1つとばしで登っていく、幅の広いジグザグ。` },
  { key: 'A7', fam: 'leap', lvl: 2, tags: ['leap', 'zigzag'],
    notes: m => `${m.s(0)} ${m.s(m.N)} ${m.s(m.F)} ${m.s(m.N)} / ${m.s(m.T)} ${m.s(m.N)} ${m.s(0)}:q`,
    name: () => `上の根音を足場に、下の音が降りていく`,
    idea: d => `根音から1オクターブ上へ跳び、その高い根音と行き来しながら、下の音が ${d(2)}・${d(4)}・根音と降りていく。同じ高い音にくり返し戻るのが、耳に残る。` },
  { key: 'A8', fam: 'leap', lvl: 1, tags: ['leap', 'syncopation'],
    notes: m => `${m.s(0)}:e ${m.s(m.F)}:q. / ${m.s(0)}:e ${m.s(m.N)}:q.`,
    name: d => `${d(0)}→${d(1)}、${d(0)}→オクターブ上と、跳ぶ幅を広げる`,
    idea: d => `根音から ${d(1)} へ跳んでのばし、もう一度根音から、こんどは1オクターブ上へ跳ぶ。2音だけのモチーフを、幅を広げてくり返す。` },
  { key: 'A9', fam: 'leap', lvl: 3, tags: ['leap', 'arp', 'sixteenth'],
    notes: m => `@s ${m.s(0)} ${m.s(m.F)} ${m.s(m.N)} ${m.s(m.F)} ${m.s(m.T)} ${m.s(m.F)} ${m.s(m.N)} ${m.s(m.F)} / @e ${m.s(m.V)} ${m.s(m.F)} ${m.s(m.T)}:q`,
    name: () => `和音の音を跳びまわる（16分）`,
    idea: d => `根音・${d(1)}・上の根音と跳び、${d(4)} からも同じ ${d(1)} と上の根音へ。16分音符で和音の音を跳びまわってから、後半は8分音符で ${d(8)}・${d(9)} と降りて、${d(10)} で止まる。` },
  { key: 'A10', fam: 'leap', lvl: 1, tags: ['leap'],
    notes: m => `r:q ${m.s(0)}:e ${m.s(m.F)}:e / ${m.s(m.N)}:q r:q`,
    name: d => `1拍待ってから、${d(0)}→${d(1)}→オクターブ上へ跳ぶ`,
    idea: d => `1拍目は休んで、2拍目から根音・${d(1)}・1オクターブ上の根音へ、8分音符で跳ぶ。最後の音のあとも1拍休む。前後の間（ま）も、フレーズのうち。` },
  /* ---------- ジグザグ・戻る ---------- */
  { key: 'B1', fam: 'zig', lvl: 1, tags: ['zigzag', 'scale'],
    notes: m => `${m.s(0)} ${m.s(2)} ${m.s(1)} ${m.s(3)} ${m.s(2)} ${m.s(4)} ${m.s(6)}:q`,
    name: (d, m) => `${m.zn}で上がる`,
    idea: (d, m) => `${d(0)}-${d(1)}、${d(2)}-${d(3)}、${d(4)}-${d(5)} と、${m.zu}。スケールを、階段ではなくジグザグに登って、${d(6)} で止まる。` },
  { key: 'B2', fam: 'zig', lvl: 1, tags: ['zigzag', 'scale'],
    notes: m => `${m.s(m.N)} ${m.s(m.N - 2)} ${m.s(m.N - 1)} ${m.s(m.N - 3)} / ${m.s(m.N - 2)} ${m.s(m.N - 4)} ${m.s(m.N - 3)} ${m.s(m.N - 5)}`,
    name: (d, m) => `${m.zn}で降りる`,
    idea: (d, m) => `${d(0)}-${d(1)}、${d(2)}-${d(3)}…と、${m.zd}。スケールをジグザグに降りて、${d(7)} で止まる。` },
  { key: 'B3', fam: 'zig', lvl: 2, tags: ['zigzag', 'scale', 'triplet'],
    notes: m => `${m.s(m.V - m.N)}:t ${m.s(0)}:t ${m.s(1)}:t ${m.s(0)}:t ${m.s(1)}:t ${m.s(2)}:t / ${m.s(1)}:t ${m.s(2)}:t ${m.s(3)}:t ${m.s(m.F)}:q`,
    name: () => `3音ずつ、1歩もどりながら上がる（3連符）`,
    idea: d => `3連符のかたまり（3音）を、1音ずつずらして上へ。2歩進んで1歩もどる動きで、${d(9)} に着く。` },
  { key: 'B4', fam: 'zig', lvl: 3, tags: ['zigzag', 'scale', 'sixteenth'],
    notes: m => `@s ${m.s(m.N + 1)} ${m.s(m.N)} ${m.s(m.N - 1)} ${m.s(m.N - 2)} ${m.s(m.N)} ${m.s(m.N - 1)} ${m.s(m.N - 2)} ${m.s(m.N - 3)} / ${m.s(m.N - 1)} ${m.s(m.N - 2)} ${m.s(m.N - 3)} ${m.s(m.N - 4)} ${m.s(m.N - 5)}:q`,
    name: () => `4音のかたまりを、1つずつずらして降りる（16分）`,
    idea: d => `スケールを4音ずつ降りるかたまりを、頭を1音ずつ下げて3回。かたまりの頭が ${d(0)}・${d(4)}・${d(8)} と順に降りて、${d(12)} に着地する。` },
  { key: 'B5', fam: 'zig', lvl: 1, tags: ['zigzag', 'scale'],
    notes: m => `${m.s(0)} ${m.s(1)} ${m.s(2)} ${m.s(4)} / ${m.s(2)} ${m.s(1)} ${m.s(0)}:q`,
    name: d => `${d(0)}-${d(1)}-${d(2)}-${d(3)} と上がって、同じ道を戻る`,
    idea: () => `上がったら、来た道をそのまま戻って、根音で止まる。行って帰るだけなのに、ひとまとまりのフレーズに聞こえる。` },
  { key: 'B6', fam: 'zig', lvl: 1, tags: ['zigzag', 'scale'],
    notes: m => `${m.s(4)} ${m.s(5)} ${m.s(3)} ${m.s(4)} / ${m.s(2)} ${m.s(3)} ${m.s(1)} ${m.s(2)}`,
    name: () => `1つ上がって3度下がる、で降りる`,
    idea: d => `${d(0)}-${d(1)}、${d(2)}-${d(3)}…と、1つ上がっては3度下がる。上がりながら降りていく、逆向きのジグザグ。${d(7)} で止まる。` },
  { key: 'B7', fam: 'zig', lvl: 2, tags: ['zigzag', 'scale', 'triplet'],
    notes: m => `${m.s(0)}:t ${m.s(1)}:t ${m.s(0)}:t ${m.s(1)}:t ${m.s(2)}:t ${m.s(1)}:t ${m.s(2)}:t ${m.s(3)}:t ${m.s(2)}:t ${m.s(m.F)}:q`,
    name: () => `となりの音にゆれながら、1つずつ上がる（3連符）`,
    idea: d => `上のとなりの音に行って戻る3音のかたまりを、1つずつ上げていく。小さくゆれながら登って、${d(9)} に着く。` },
  { key: 'B8', fam: 'zig', lvl: 3, tags: ['zigzag', 'scale', 'sixteenth'],
    notes: m => `@s ${m.s(m.N)} ${m.s(m.N - 2)} ${m.s(m.N - 1)} ${m.s(m.N - 3)} ${m.s(m.N - 2)} ${m.s(m.N - 4)} ${m.s(m.N - 3)} ${m.s(m.N - 5)} / ${m.s(m.N - 4)} ${m.s(m.N - 6)} ${m.s(m.N - 5)} ${m.s(m.N - 7)} ${m.s(m.T)}:q`,
    name: (d, m) => `${m.zn}を16分で、1オクターブ降りる`,
    idea: (d, m) => `上の根音から、${m.zd}動きを、16分音符で1オクターブぶん続ける。最後は ${d(12)} に上がって止まる。` },
  { key: 'B9', fam: 'zig', lvl: 2, tags: ['zigzag', 'scale', 'triplet'],
    notes: m => `${m.s(0)}:t ${m.s(2)}:t ${m.s(1)}:t ${m.s(3)}:t ${m.s(2)}:t ${m.s(4)}:t / ${m.s(3)}:t ${m.s(5)}:t ${m.s(4)}:t ${m.s(6)}:q`,
    name: (d, m) => `${m.zn}を3連符で上がる`,
    idea: (d, m) => `${d(0)}-${d(1)}、${d(2)}-${d(3)}…と、${m.zu}形を、3連符で。2音ずつの形と3つ割りのリズムがずれて、強く聞こえる音が入れかわっていく。${d(9)} で止まる。` },
  /* ---------- 跳ぶ＋ジグザグ（まぜる） ---------- */
  { key: 'C1', fam: 'mix', lvl: 2, tags: ['leap', 'zigzag'],
    notes: m => `${m.s(0)} ${m.s(m.N)} ${m.s(m.N - 2)} ${m.s(m.N - 1)} / ${m.s(m.N - 3)} ${m.s(m.N - 2)} ${m.s(m.N - 4)} ${m.s(m.N - 3)}`,
    name: (d, m) => `オクターブ跳んでから、${m.zn}で降りる`,
    idea: (d, m) => `根音から1オクターブ上へ跳び、そこから、${m.zd}ジグザグで降りてくる。跳躍とジグザグの合わせ技。${d(7)} で止まる。` },
  { key: 'C2', fam: 'mix', lvl: 1, tags: ['leap', 'scale'],
    notes: m => `${m.s(0)} ${m.s(4)} ${m.s(3)} ${m.s(2)} / ${m.s(2)} ${m.s(6)} ${m.s(5)} ${m.s(4)}`,
    name: d => `${d(0)}→${d(1)} と跳んで順に戻る、を2回`,
    idea: d => `${d(0)} から ${d(1)} へ跳んで、順に降りて戻る。つづけて ${d(4)} から ${d(5)} へ、同じ形をもう一度。跳んだあとに階段で戻ると、跳躍が歌になる。` },
  { key: 'C3', fam: 'mix', lvl: 2, tags: ['zigzag', 'leap'],
    notes: m => `${m.s(2)} ${m.s(4)} ${m.s(3)} ${m.s(5)} / ${m.s(4)} ${m.s(6)} ${m.s(m.N)} ${m.s(0)}`,
    name: (d, m) => `${m.zn}で上がり、てっぺんから1オクターブ落ちる`,
    idea: d => `${d(0)}-${d(1)}、${d(2)}-${d(3)}、${d(4)}-${d(5)} とジグザグで上がって上の根音に届き、そこから1オクターブ下の根音へ落ちる。` },
  { key: 'C4', fam: 'mix', lvl: 1, tags: ['leap', 'zigzag', 'rhythm'],
    notes: m => `${m.s(0)}:e ${m.s(m.F)}:e ${m.s(m.N)}:q / r:e ${m.s(m.N - 2)}:e ${m.s(m.N - 1)}:e ${m.s(m.F)}:e`,
    name: () => `跳んで問いかけ、間のあと、ジグザグで答える`,
    idea: d => `${d(0)}→${d(1)}→オクターブ上の根音と跳んで問いかけ、8分休符のあと、${d(3)}-${d(4)}-${d(5)} と小さなジグザグで答える。` },
  { key: 'C5', fam: 'mix', lvl: 2, tags: ['zigzag', 'leap'],
    notes: m => `${m.s(m.N)} ${m.s(m.N - 2)} ${m.s(m.N - 1)} ${m.s(m.N - 3)} / ${m.s(m.T)}:e ${m.s(0)}:e ${m.s(m.F)}:q`,
    name: (d, m) => `${m.zn}で降りて、最後に上へ跳ぶ`,
    idea: d => `上の根音からジグザグで降り、${d(4)}・根音と下がりきったところで、${d(6)} へ跳んで終わる。下がったあとの跳躍が、次のフレーズを呼ぶ。` },
  { key: 'C6', fam: 'mix', lvl: 2, tags: ['leap', 'scale', 'triplet'],
    notes: m => `${m.s(0)}:t ${m.s(4)}:t ${m.s(3)}:t ${m.s(2)}:t ${m.s(1)}:t ${m.s(0)}:t / ${m.s(2)}:t ${m.s(6)}:t ${m.s(5)}:t ${m.s(4)}:q`,
    name: d => `${d(0)}→${d(1)} と跳んで、3連符で順に降りる（2回）`,
    idea: d => `${d(0)} から ${d(1)} へ跳んで、3連符で根音まで順に降りる。つづけて ${d(6)} から ${d(7)} へ跳んで、もう一度。2回目は、途中の ${d(9)} で止まる。` },
  /* ---------- ペンタトニック ---------- */
  { key: 'P1', fam: 'pent', lvl: 2, tags: ['pent', 'zigzag'], pent: true,
    notes: m => `${m.p(0)} ${m.p(2)} ${m.p(1)} ${m.p(3)} / ${m.p(2)} ${m.p(4)} ${m.p(3)} ${m.p(5)}`,
    name: () => `ペンタトニックを1つとばしで上がる`,
    idea: (d, m) => `${m.pjp}の音を、1つとばしで上がっては1つ戻る。となりどうしが離れているので、ジグザグがそのまま4度前後の跳躍になる。` },
  { key: 'P2', fam: 'pent', lvl: 2, tags: ['pent', 'zigzag'], pent: true,
    notes: m => `${m.p(5)} ${m.p(3)} ${m.p(4)} ${m.p(2)} / ${m.p(3)} ${m.p(1)} ${m.p(2)} ${m.p(0)}`,
    name: () => `ペンタトニックを1つとばしで降りる`,
    idea: (d, m) => `${m.pjp}の音を、1つとばしで下がっては1つ戻る。${d(7)} で止まる。` },
  { key: 'P3', fam: 'pent', lvl: 2, tags: ['pent', 'leap', 'syncopation'], pent: true,
    notes: m => `${m.p(0)} ${m.p(3)} ${m.p(1)} ${m.p(4)} / ${m.p(2)}:e ${m.p(5)}:q.`,
    name: () => `ペンタトニックを2つとばしで跳ぶ`,
    idea: (d, m) => `${m.pjp}の音を、2つとばして上へ跳び、1つ下から、また跳ぶ。5度前後の跳躍が続く、ひらけた響き。最後の音は、裏拍からのばす。` },
];

/* ---- 道具 ---- */
const pretty = s => String(s).replace(/b/g, '♭').replace(/#/g, '♯');
const esc = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const degName = (ctx, deg) => { const p = pretty(deg); return ctx === 'blues7' && p === '♯9' ? '♭3' : p; };
function material(ctx) {
  const c = CTX[ctx], S = c.S.split(' '), P = c.P ? c.P.split(' ') : null;
  const at = (arr, i) => { const n = arr.length, k = ((i % n) + n) % n; return arr[k] + (4 + Math.floor(i / n)); };
  return { S, P, N: S.length, T: c.T, F: c.F, V: c.V, pjp: c.pjp, s: i => at(S, i), p: i => at(P, i),
    zn: c.zn || '3度のジグザグ', zu: c.zu || '3度上がっては1つ戻る', zd: c.zd || '3度下がっては1つ戻る' };
}
function tryLick(ctx, notes, tags) {
  const errBefore = L.errors.length;
  const l = L.add({ ctx, ref: CTX[ctx].ref, segs: [4], name: 'tmp', notes, desc: 'tmp', tags: tags.slice(), lvl: 1 });
  const errs = L.errors.slice(errBefore);
  if (!l) return { errs };
  L.all.pop(); delete L.byId[l.id]; L.byCtx[ctx].pop();
  // counters を戻す（番号がずれないように）
  return { l, lint: L.lint(l), errs };
}
const seq = l => l.events.filter(e => !e.rest).map(e => e.midi);
const lcs = (a, b) => { let best = 0; const dp = Array.from({ length: a.length + 1 }, () => new Int16Array(b.length + 1)); for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) if (a[i - 1] === b[j - 1]) { dp[i][j] = dp[i - 1][j - 1] + 1; if (dp[i][j] > best) best = dp[i][j]; } return best; };

// コードの音か、その色（テンション）の音か（licks.js の検査と同じ決まり）
const chordish = (l, e) => {
  const ref = l.ref[e.seg], pc = T.mod(e.midi, 12), rel = T.mod(pc - ref.rootPc, 12);
  if (ref.pcs.indexOf(pc) >= 0) return true;
  if (ref.cls === 'dom' || ref.cls === 'sus') return [2, 9, 6, 3, 8, 1].indexOf(rel) >= 0;
  if (ref.cls === 'maj') return [2, 6, 9].indexOf(rel) >= 0;
  if (ref.cls === 'min') return [2, 5, 9].indexOf(rel) >= 0;
  return rel === 2;
};
const cutOK = l => l.cuts.every(c => { const before = l.events.filter(e => !e.rest && e.t12 < c * 12 - 1e-6).pop(); return before && chordish(l, before); });

/* ---- 全候補を作って検査 ---- */
const cand = {};   // ctx → [{tpl, notes, l, ok, why, degs, dupLen, dupId}]
for (const ctx of ORDER) {
  const m = material(ctx), existing = (L.byCtx[ctx] || []).slice();
  cand[ctx] = [];
  for (const tp of TPL) {
    if (tp.pent && !m.P) continue;
    const tags = tp.tags.concat((CTX[ctx].tags || []).filter(t => tp.tags.indexOf(t) < 0));
    let notes;
    try { notes = tp.notes(m); } catch (e) { continue; }
    let r = tryLick(ctx, notes, tags);
    if (r.l && !cutOK(r.l)) { notes = notes.replace(/\s*\/\s*/g, ' '); r = tryLick(ctx, notes, tags); }   // 切れ目の手前が落ち着かない音なら、切れ目を外す
    const c = { tpl: tp, notes, tags, ok: true, why: [] };
    if (!r.l) { c.ok = false; c.why.push('登録できない：' + r.errs.join(' / ')); cand[ctx].push(c); continue; }
    c.l = r.l;
    if (r.lint.errors.length) { c.ok = false; c.why.push('検査エラー：' + r.lint.errors.join(' / ')); }
    c.warns = r.lint.warns.filter(w => !/大きなとび/.test(w));
    if (c.warns.some(w => /終わりの音がコードの音/.test(w))) { c.ok = false; c.why.push('終わりの音がコードの音でない'); }
    if (c.warns.some(w => /拍頭のコードトーンが少ない/.test(w))) { c.ok = false; c.why.push('拍の頭にコードの音が少ない'); }
    if (c.warns.some(w => /はじまりの音がコードの音/.test(w))) { c.ok = false; c.why.push('はじまりの音がコードの音でない'); }
    c.degs = r.l.events.filter(e => !e.rest).map(e => degName(ctx, e.deg));
    // 既存のリックと、同じ音が何音つづくか
    let dup = 0, dupId = '';
    for (const o of existing) { const n = lcs(seq(r.l), seq(o)); if (n > dup) { dup = n; dupId = o.id; } }
    c.dupLen = dup; c.dupId = dupId;
    const total = seq(r.l).length;
    if (dup >= Math.min(7, total)) { c.ok = false; c.why.push(`既存の ${dupId} と ${dup} 音つづけて同じ`); }
    cand[ctx].push(c);
  }
}

/* ---- ctx ごとに10本えらぶ：跳ぶ4・ジグザグ3・まぜる2・ペンタ1 を目安に、ctx ごとに順番をずらして ---- */
const WANT = { leap: 4, zig: 3, mix: 2, pent: 1 };
const chosen = {};
ORDER.forEach((ctx, ci) => {
  const forced = OV[ctx] && OV[ctx].use;   // 手で決めた並び（型のキーの配列）
  if (forced) {
    chosen[ctx] = forced.map(k => { const c = cand[ctx].find(x => x.tpl.key === k); if (!c) throw new Error(ctx + '：型がない ' + k); if (!c.ok) throw new Error(`${ctx} ${k} は検査に通っていない：${c.why.join('；')}`); return c; });
    return;
  }
  const out = [];
  const pool = fam => { const a = cand[ctx].filter(c => c.ok && c.tpl.fam === fam); const k = a.length ? ci % a.length : 0; return a.slice(k).concat(a.slice(0, k)); };
  const pools = { leap: pool('leap'), zig: pool('zig'), mix: pool('mix'), pent: pool('pent') };
  for (const fam of ['leap', 'zig', 'mix', 'pent']) for (let k = 0; k < WANT[fam] && pools[fam].length; k++) out.push(pools[fam].shift());
  // 足りないぶんは、残りから（跳ぶ → まぜる → ジグザグ → ペンタ の順に1本ずつ）
  let guard = 0;
  while (out.length < 10 && guard++ < 40) { const fam = ['leap', 'mix', 'zig', 'pent'][guard % 4]; if (pools[fam].length) out.push(pools[fam].shift()); }
  // 型の順（跳ぶ → ジグザグ → まぜる → ペンタ）にならべる
  out.sort((a, b) => TPL.indexOf(a.tpl) - TPL.indexOf(b.tpl));
  chosen[ctx] = out;
});

/* ---- 一覧 ---- */
for (const ctx of ORDER) {
  log(`\n==== ${ctx}（${CTX[ctx].title}） 候補 ${cand[ctx].length}／使える ${cand[ctx].filter(c => c.ok).length}／選んだ ${chosen[ctx].length}`);
  for (const c of cand[ctx]) {
    const pick = chosen[ctx].includes(c) ? '●' : c.ok ? '○' : '×';
    log(` ${pick} ${c.tpl.key} ${c.notes}${c.ok ? '' : '   ← ' + c.why.join('；')}${c.ok && c.warns && c.warns.length ? '   △ ' + c.warns.join(' / ') : ''}${c.ok && c.dupLen >= 5 ? `   （${c.dupId} と ${c.dupLen} 音同じ）` : ''}`);
  }
}
const totalChosen = ORDER.reduce((a, c) => a + chosen[c].length, 0);
log('\n選んだ本数：' + ORDER.map(c => c + ':' + chosen[c].length).join('  ') + '  合計 ' + totalChosen);
if (mode === 'list') process.exit(0);

/* ---- 書き出し ---- */
let out = `/* リック辞典：跳ぶ・ジグザグ・戻る・まぜる（音の動きの形で聞かせるリック）。
   コード・スケールごとに10本。音は C の調で書いてある（書き方は licks.js の冒頭）。
   「1度→5度→オクターブと跳ぶ」「3度のジグザグ」「2歩進んで1歩もどる」「跳んでからジグザグで降りる」などの型を、
   それぞれのスケールの音に当てはめたもの（階段のように順に上がり下がりするだけのリックばかりにならないように）。
   名前と解説の度数は、実際の音から数えて入れてある。
   このファイルは tools/gen-contour.js が書き出す（手で直さない。型や言いまわしを直すときは、そちらを直して作りなおす）。
   リックの番号（ id ）が変わらないよう、ほかの licks-*.js のあとに読みこむ（ファイル名で最後になるようにしてある）。 */
(function () {
  'use strict';
  const L = (typeof window !== 'undefined' ? window : globalThis).AL.L;
`;
let nOut = 0;
for (const ctx of ORDER) {
  const m = material(ctx), names = new Set((L.byCtx[ctx] || []).map(l => l.name));
  out += `\n  /* ================= ${ctx}：${CTX[ctx].title} ================= */\n`;
  out += `  L.pack({ ctx: '${ctx}', ref: '${CTX[ctx].ref}', segs: [4], lvl: 1 }, [\n`;
  for (const c of chosen[ctx]) {
    const d = k => c.degs[k];
    let name = c.tpl.name(d, m), idea = c.tpl.idea(d, m);
    if (/拍の頭/.test(idea)) throw new Error(`${ctx} ${c.tpl.key}：解説に「拍の頭」を手で書かない（末尾に自動で入る）`);
    const lastEv = c.l.events.filter(e => !e.rest).pop();
    idea = idea.replace(/(^|[^0-9♭♯])1 で止まる/g, (_, a) => a + (lastEv.midi >= 72 ? '上の根音' : '根音') + 'で止まる');
    const ov = OV[ctx] && OV[ctx][c.tpl.key];
    if (ov) { if (ov.name) name = ov.name; if (ov.idea) idea = ov.idea; }
    if (names.has(name)) throw new Error(`${ctx} ${c.tpl.key}：名前がかぶる「${name}」`);
    names.add(name);
    // 拍の頭の度数（音から数える）
    const heads = [0, 1, 2, 3].map(b => { const e = c.l.events.find(x => !x.rest && Math.abs(x.t12 - b * 12) < 1); return e ? degName(ctx, e.deg) : null; });
    const tail = heads.every(Boolean) ? `拍の頭は ${heads.join('・')}。` : (() => { const part = heads.map((h, i) => (h ? `${i + 1}拍目の ${h}` : null)).filter(Boolean); return part.length ? `拍の頭に音が来るのは ${part.join('、')}。` : ''; })();
    out += `    ['${esc(name)}', '${esc(c.notes)}', '${esc(idea + tail)}', { tags: [${c.tags.map(t => `'${t}'`).join(', ')}], lvl: ${c.tpl.lvl} }],\n`;
    nOut++;
  }
  out += `  ]);\n`;
}
out += `})();\n`;
if (mode === 'check') {
  const cur = fs.readFileSync(path.join(dir, OUT), 'utf8');
  if (cur !== out) { console.log(`✗ js/${OUT} が、tools/gen-contour.js の出力とちがう（手で直した？ node tools/gen-contour.js で作りなおす）`); process.exit(1); }
  console.log(`gen-contour: OK（${nOut} 本、js/${OUT} と一致）`);
} else {
  fs.writeFileSync(path.join(dir, OUT), out);
  console.log(`書き出した：js/${OUT}  ${nOut} 本`);
}
