// 使い方: node check_e1.mjs out/<担当名>.json [--lessons=kazu10-01,...]
// 構造・件数・書き方を機械で確かめる（正解の正しさは、別に計算で確かめる）。エラー 0 なら終了コード 0。
import fs from 'node:fs';
const file = process.argv[2];
const lessonsArg = (process.argv.find(a => a.startsWith('--lessons=')) || '').slice(10);
const idx = Object.fromEntries(JSON.parse(fs.readFileSync(new URL('./in/index.json', import.meta.url), 'utf8')).map(t => [t.id, t]));
let items; try { items = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { console.error('JSON が読めません:', e.message); process.exit(1); }
if (!Array.isArray(items)) { console.error('配列ではありません'); process.exit(1); }
const errs = [], warns = []; const E = (id, m) => errs.push(`${id}: ${m}`), W = (id, m) => warns.push(`${id}: ${m}`);
const norm = s => String(s).replace(/[\s　]/g, '').replace(/＝/g, '=').replace(/－|−/g, '-').replace(/＋/g, '+');
const KANJI = new Set('偶奇称頻胃異遺域宇映延沿恩我灰拡革閣割株干巻看簡危机揮貴疑吸供胸郷勤筋系敬警劇激穴券絹権憲源厳己呼誤后孝皇紅降鋼刻穀骨困砂座済裁策冊蚕至私姿視詞誌磁射捨尺若樹収宗就衆従縦縮熟純処署諸除承将傷障蒸針仁垂推寸盛聖誠舌宣専泉洗染銭善奏窓創装層操蔵臓存尊退宅担探誕段暖値宙忠著庁頂腸潮賃痛敵展討党糖届難乳認納脳派拝背肺俳班晩否批秘俵腹奮並陛閉片補暮宝訪亡忘棒枚幕密盟模訳郵優預幼欲翌乱卵覧裏律臨朗論圧囲移因永営衛易益液演応往桜可仮価河過快解格確額刊幹慣眼紀基寄規喜技義逆久旧救居許境均禁句型経潔件険検限現減故個護効厚耕航鉱構興講告混査再災妻採際在財罪殺雑酸賛士支史志枝師資飼示似識質舎謝授修述術準序招証象賞条状常情織職制性政勢精製税責績接設絶祖素総造像増則測属率損貸態団断築貯張停提程適統堂銅導得毒独任燃能破犯判版比肥非費備評貧布婦武復複仏粉編弁保墓報豊防貿暴脈務夢迷綿輸余容略留領歴悪安暗医委意育員院飲運泳駅央横屋温化荷界開階寒感漢館岸起期客究急級宮球去橋業曲局銀区苦具君係軽血決研県庫湖向幸港号根祭皿仕死使始指歯詩次事持式実写者主守取酒受州拾終習集住重宿所暑助昭消商章勝乗植申身神真深進世整昔全相送想息速族他打対待代第題炭短談着注柱丁帳調追定庭笛鉄転都度投豆島湯登等動童農波配倍箱畑発反坂板皮悲美鼻筆氷表秒病品負部服福物平返勉放味命面問役薬由油有遊予羊洋葉陽様落流旅両緑礼列練路和愛案以衣位茨印英栄媛塩岡億加果貨課芽賀改械害街各覚潟完官管関観願岐希季旗器機議求泣給挙漁共協鏡競極熊訓軍郡群径景芸欠結建健験固功好香候康佐差菜最埼材崎昨札刷察参産散残氏司試児治滋辞鹿失借種周祝順初松笑唱焼照城縄臣信井成省清静席積折節説浅戦選然争倉巣束側続卒孫帯隊達単置仲沖兆低底的典伝徒努灯働特徳栃奈梨熱念敗梅博阪飯飛必票標不夫付府阜富副兵別辺変便包法望牧末満未民無約勇要養浴利陸良料量輪類令冷例連老労録一右雨円王音下火花貝学気九休玉金空月犬見五口校左三山子四糸字耳七車手十出女小上森人水正生青夕石赤千川先早草足村大男竹中虫町天田土二日入年白八百文木本名目立力林六引羽雲園遠何科夏家歌画回会海絵外角楽活間丸岩顔汽記帰弓牛魚京強教近兄形計元言原戸古午後語工公広交光考行高黄合谷国黒今才細作算止市矢姉思紙寺自時室社弱首秋週春書少場色食心新親図数西声星晴切雪船線前組走多太体台地池知茶昼長鳥朝直通弟店点電刀冬当東答頭同道読内南肉馬売買麦半番父風分聞米歩母方北毎妹万明鳴毛門夜野友用曜来里理話');
const seenId = new Set(), seenQ = new Map(), perLesson = {};
for (const it of items) {
  const id = it && it.id || '(idなし)';
  const m = /^([a-z0-9]+-\d\d)-L([1-4])-0([1-5])$/.exec(id);
  if (!m) { E(id, 'id の形がちがう（例 kake-03-L2-04）'); continue; }
  const [, l, dd] = m; const t = idx[l];
  if (!t) { E(id, `授業 ${l} は 小6の一覧に ない`); continue; }
  if (seenId.has(id)) E(id, 'id が重なっている'); seenId.add(id);
  const no = String(t.no).padStart(2, '0');
  if (it.u !== `E6-T${t.code}`) E(id, `u は E6-T${t.code}`);
  if (it.s !== `E6-T${t.code}-${no}`) E(id, `s は E6-T${t.code}-${no}`);
  if (it.l !== l) E(id, `l は ${l}`);
  if (it.d !== Number(dd)) E(id, `d は ${dd}（数）`);
  for (const k of ['q', 'e', 'h']) if (typeof it[k] !== 'string' || !it[k].trim()) E(id, `${k} が空`);
  const extra = Object.keys(it).filter(k => !['id', 'u', 's', 'l', 'd', 'q', 'c', 'e', 'h', 'f'].includes(k)); if (extra.length) E(id, `余分な項目: ${extra}`);
  if (it.f !== undefined && !(typeof it.f === 'string' && /^<svg class="fig" viewBox="0 0 \d+(\.\d+)? \d+(\.\d+)?"[^>]*>[\s\S]*<\/svg>$/.test(it.f))) E(id, 'f は figs.py で作った <svg class="fig" …>…</svg> だけ');
  if (it.f && /<script|on[a-z]+=|href=/i.test(it.f)) E(id, 'f に script・イベント・リンクを入れない');
  (perLesson[l] ||= { 1: 0, 2: 0, 3: 0, 4: 0, pos: [0, 0, 0, 0] })[it.d]++;
  if (!Array.isArray(it.c) || it.c.length !== 4) { E(id, '選択肢は4つ'); continue; }
  const ks = it.c.filter(x => x && x.k === 1); if (ks.length !== 1) E(id, `正解（k:1）が ${ks.length} つ`);
  const ci = it.c.findIndex(x => x && x.k === 1); if (ci >= 0) perLesson[l].pos[ci]++;
  const texts = it.c.map(x => norm(x && x.t)); if (new Set(texts).size !== 4) E(id, '選択肢が重なっている');
  for (const x of it.c) {
    if (!x || typeof x.t !== 'string' || !x.t.trim()) E(id, '選択肢の t が空');
    const bad = Object.keys(x || {}).filter(k => !['t', 'k', 'w'].includes(k)); if (bad.length) E(id, `選択肢の余分な項目: ${bad}`);
    if (x && x.k === 1 && x.w) E(id, '正解に w が付いている');
    if (x && x.k !== undefined && x.k !== 1) E(id, 'k は 1 だけ');
  }
  if (it.c.filter(x => x && x.k !== 1 && x.w).length < 2) W(id, 'w（まちがえ方）が 2つ未満');
  const shown = [it.q, it.e, it.h, ...it.c.map(x => x.t), ...it.c.map(x => x.w || '')].join('');
  if (/\$|\\frac|\\times/.test(shown)) E(id, 'TeX（$ や \\frac）は つかわない（小1は ふつうの 文字で）');
  const kanji = [...new Set(shown.match(/[一-龯]/g) || [])].filter(k => !KANJI.has(k)); if (kanji.length) E(id, `6年までに ならわない 漢字: ${kanji.join('')}`);
  if (/(?<!展開|見取|拡大|縮|樹形)図(の|に|で|を)|右の図|下の図|上の図/.test(it.q) && !it.f) E(id, '図を指しているのに f が無い');
  const ans = it.c[ci] && it.c[ci].t; const an = norm(ans || '');
  if (an.length >= 2 && norm(it.h).includes(an) && !/^\d$/.test(an)) W(id, 'ヒントに正解がそのまま出ている');
  if (String(it.q).length > 240) W(id, '問題文が長い（小6は 240字まで）');
  const lines = String(it.e || '').split('\n').filter(Boolean); if (lines.length > 5) W(id, 'e が長い（5行まで）');
  const qk = norm(it.q) + '|' + (it.f || '') + '|' + texts.slice().sort().join('|'); if (seenQ.has(qk)) E(id, `${seenQ.get(qk)} と同じ問題・同じ選択肢`); seenQ.set(qk, id);
}
const want = lessonsArg ? lessonsArg.split(',').filter(Boolean) : null;
if (want) { for (const l of want) if (!perLesson[l]) E(l, '問題が1つも無い'); for (const l of Object.keys(perLesson)) if (!want.includes(l)) E(l, '担当外の授業が入っている'); }
for (const [l, c] of Object.entries(perLesson)) {
  for (const d of [1, 2, 3, 4]) if (c[d] !== 5) E(l, `段階${d}が ${c[d]} 問（5問ずつ）`);
  const tot = c.pos.reduce((a, b) => a + b, 0); if (tot && Math.max(...c.pos) > Math.ceil(tot * 0.4)) W(l, `正解の位置が偏っている ${c.pos}`);
}
console.log(`授業 ${Object.keys(perLesson).length} 本・問題 ${items.length} 問`);
for (const [l, c] of Object.entries(perLesson).sort()) console.log(`  ${l}: ${c[1]}/${c[2]}/${c[3]}/${c[4]}  正解位置 ${c.pos}`);
if (warns.length) { console.log(`\n警告 ${warns.length} 件`); warns.slice(0, 60).forEach(w => console.log('  △ ' + w)); }
if (errs.length) { console.log(`\nエラー ${errs.length} 件`); errs.slice(0, 80).forEach(e => console.log('  ✗ ' + e)); process.exit(1); }
console.log('\nエラー 0');
