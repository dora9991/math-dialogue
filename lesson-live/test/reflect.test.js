// 振り返り評価のテスト: node lesson-live/test/reflect.test.js [-v]
global.window = global;
require("../js/math.js");
require("../js/curriculum.js");
for (let u = 1; u <= 7; u++) require(`../js/bank/u${u}.js`);
require("../js/reflect.js");
const { LL, RF } = global;
const verbose = process.argv.includes("-v");
const L = LL.lesson("1-3");
const vocab = [...L.vocab, ...LL.unit(1).vocab];

let pass = 0, fail = 0;
function lv(ev, k) { return ev.cats[k].lv; }
function expect(name, cond, ev) {
  if (cond) pass++; else { fail++; console.log("NG:", name, JSON.stringify(Object.fromEntries(Object.entries(ev.cats).map(([k, v]) => [k, v.lv]))), JSON.stringify(ev.flags)); }
}
function run(name, body, extra) {
  const ev = RF.analyze(Object.assign({ body, understanding: 3, vocab, prev: null, history: [] }, extra || {}));
  if (verbose) {
    console.log(`\n■ ${name}`);
    for (const c of RF.CATS) { const x = ev.cats[c.k]; if (x.lv) console.log(`  ${"－○◎"[x.lv]} ${c.label}: 「${x.ev[0] || ""}」 ${x.why}`); }
    console.log("  flags:", JSON.stringify(ev.flags));
    console.log("  声かけ:", RF.feedback(ev, (extra && extra.understanding) || 3, body).msg);
  }
  return ev;
}

// 1. 充実した振り返り
let ev = run("充実", {
  summary: "符号がちがう数のたし算は、絶対値の差に、絶対値の大きいほうの符号をつける。",
  stuck: "(−8)+(+13)で符号をまちがえた。",
  how: "数直線をかいて考えたらわかりやすかった。",
  next: "次は分数のたし算でも、符号を先に決めてから計算する。",
  question: "3つ以上の数をたすときも、いつでも同じきまりで計算できるのかな？",
  predict: "次の時間はひき算だと思う。たし算になおせばできると予想した。",
});
expect("充実: まとめ◎", lv(ev, "matome") === 2, ev);
expect("充実: 簡潔◎", lv(ev, "kanketsu") === 2, ev);
expect("充実: 問い◎", lv(ev, "toi") === 2, ev);
expect("充実: 見方◎", lv(ev, "mikata") === 2, ev);
expect("充実: 予測○以上", lv(ev, "yosoku") >= 1, ev);
expect("充実: 学び方◎", lv(ev, "manabikata") === 2, ev);
expect("充実: つまずき◎", lv(ev, "tsumazuki") === 2, ev);
expect("充実: 改善◎", lv(ev, "kaizen") === 2, ev);
expect("充実: フラグなし", !ev.flags.sos && !ev.flags.help && !ev.flags.dup, ev);

// 2. 一言だけ
ev = run("一言", { summary: "わかった。" });
expect("一言: まとめ−", lv(ev, "matome") === 0, ev);
expect("一言: short", ev.flags.short, ev);
expect("一言: 光るところなし", ev.shine.length === 0, ev);

// 3. 楽しかった・頑張る（前向きさは評価しない）
ev = run("楽しい頑張る", { summary: "楽しかった。", next: "次も頑張る。" });
expect("楽しい: 関心−", lv(ev, "kanshin") === 0, ev);
expect("頑張る: 改善−", lv(ev, "kaizen") === 0 && /頑張る/.test(ev.cats.kaizen.why), ev);

// 4. SOS
ev = run("SOS", { summary: "もう無理。数学つらい。" });
expect("SOS検出", !!ev.flags.sos, ev);
expect("SOS声かけ", /ありがとう|ひとり/.test(RF.feedback(ev, 2, {}).msg), ev);

// 5. ヘルプ
ev = run("ヘルプ", { summary: "全然わからなかった。" }, { understanding: 1 });
expect("ヘルプ検出", ev.flags.help, ev);
expect("ヘルプ: 問いではない", lv(ev, "toi") === 0, ev);

// 6. 使い回し
ev = run("使い回し", { summary: "符号がちがう数のたし算は、絶対値の差に大きいほうの符号をつける。" }, {
  history: [{ date: "2026-09-20", text: "符号がちがう数のたし算は、絶対値の差に大きいほうの符号をつける。" }],
});
expect("使い回し検出", ev.flags.dup === "2026-09-20", ev);

// 7. 気持ちの「思う」は予測にしない
ev = run("気持ち", { summary: "たし算は難しいと思う。" });
expect("難しいと思う→予測−", lv(ev, "yosoku") === 0, ev);
expect("難しい→つまずき○", lv(ev, "tsumazuki") >= 1, ev);

// 8. 前回との接続
ev = run("接続", { summary: "前回決めたとおり分数でためしたら、通分してから符号を決めればできた。", prev_done: "yes" }, {
  prev: { body: { next: "分数でもためす" } },
});
expect("接続◎", lv(ev, "setsuzoku") === 2, ev);
ev = run("接続のみ", { summary: "絶対値の差を求める。", prev_done: "no" }, { prev: { body: { next: "分数でもためす" } } });
expect("前回の一手に答えただけ→接続○", lv(ev, "setsuzoku") === 1, ev);

// 9. 生活とのつながり
ev = run("生活", { summary: "気温の変化も正の数・負の数で表せるので、天気予報にも使えそうでおもしろい。" });
expect("関心◎", lv(ev, "kanshin") === 2, ev);

// 10. 予想＋確かめ
ev = run("予想確かめ", { summary: "答えは負になると予想したら、実際に計算しても負になった。" });
expect("予測◎", lv(ev, "yosoku") === 2, ev);

// 11. 比べる＋理由
ev = run("比べる", { summary: "かけ算と比べると、たし算は絶対値の大きいほうの符号になるから、別のきまりだとわかった。" });
expect("見方◎", lv(ev, "mikata") === 2, ev);

// 12. 生徒の見立て（下書き）
const rows = [
  { body: { next: "符号を先に決める", prev_done: "yes" }, auto_eval: RF.analyze({ body: { stuck: "符号をまちがえた", next: "次は符号を先に決めてから計算する", how: "数直線をかいたらわかりやすかった" }, understanding: 3, vocab }) },
  { body: { prev_done: "yes" }, auto_eval: RF.analyze({ body: { summary: "前回の一手どおり符号を先に決めたらミスが減った", next: "次は分数でも同じようにする", prev_done: "yes" }, understanding: 3, vocab, prev: { body: { next: "符号を先に決める" } } }) },
  { body: {}, auto_eval: RF.analyze({ body: { summary: "楽しかった" }, understanding: 3, vocab }) },
];
const sm = RF.studentSummary(rows);
if (verbose) console.log("\n見立て:", JSON.stringify(sm));
expect("見立て: 自己調整がA", sm.jiko.g === "A", { cats: {}, flags: sm });
rows[0].teacher_eval = { kaizen: 0, setsuzoku: 0 };
rows[1].teacher_eval = { kaizen: 0, setsuzoku: 0 };
expect("先生の修正が優先される", RF.studentSummary(rows).jiko.g === "C", { cats: {}, flags: RF.studentSummary(rows) });

// 13. プロンプト
const pr = RF.aiPrompt("1-3 加法", [{ label: "12番", understanding: 3, body: { summary: "テスト" } }]);
expect("AIプロンプトに観点と本文", /Niceな問い/.test(pr) && /12番/.test(pr) && /テスト/.test(pr), { cats: {}, flags: {} });

console.log(`reflect: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
