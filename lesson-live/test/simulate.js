// 授業のシミュレーション（検証用DB専用）: 生徒 N 人が登録→反応→質問→投票→小テスト→振り返り をする
//   LL_JOIN=参加コード node lesson-live/test/simulate.js [人数]
// ※本番には向けないこと（生徒アカウントを作成します）
global.window = global;
const LM = require("../js/math.js");
require("../js/curriculum.js");
for (let u = 1; u <= 7; u++) require(`../js/bank/u${u}.js`);
require("../js/quizcore.js");
require("../js/reflect.js");
const { LL, QC, RF } = global;

const BASE = process.env.LL_REST || "http://127.0.0.1:54433";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
if (/supabase\.co/.test(BASE)) { console.error("本番には実行できません"); process.exit(2); }
const JOIN = process.env.LL_JOIN;
const N = +(process.argv[2] || 30);
const rpc = async (fn, args) => (await fetch(`${BASE}/rpc/${fn}`, { method: "POST", headers: { "Content-Type": "application/json", apikey: KEY, Authorization: `Bearer ${KEY}` }, body: JSON.stringify(args) })).json();
const pick = a => a[Math.floor(Math.random() * a.length)];

const QUESTIONS = ["なぜ負の数どうしをたすと、もっと小さくなるの？", "3つ以上の数でも同じきまりで計算できる？", "絶対値が同じで符号がちがうとき、答えはいつも0？", "小数や分数でも同じやり方でいいの？", "ひき算とどうちがうの？"];
const COMMENTS = ["数直線で考えるとわかりやすかった", "符号を先に決めると楽", "友だちの説明でわかった", "最初は混乱したけど慣れてきた"];
const REFLS = [
  { summary: "符号がちがう数のたし算は、絶対値の差に大きいほうの符号をつける。", next: "次は分数でもためす", u: 3 },
  { summary: "たし算は数直線で右に進むこと。", how: "数直線をかいたらわかりやすかった", u: 4 },
  { summary: "わからなかった。", u: 1 },
  { summary: "楽しかった。", next: "次も頑張る", u: 3 },
  { summary: "負の数どうしの和は負になる。", question: "もし3つの負の数ならどうなるんだろう？", u: 3 },
  { summary: "かけ算とくらべると、たし算は符号のきまりがちがうから注意する。", stuck: "(−8)+(+13)で符号をまちがえた", next: "次は符号を先に決めてから計算する", u: 2 },
  { summary: "同じ符号なら絶対値の和、ちがう符号なら差。つまり符号を見るのが大事。", predict: "次はひき算をやると思う。たし算になおせると予想した", u: 4 },
  { summary: "計算はできたけど、なぜそうなるかはまだあやふや", u: 2 },
  { summary: "気温の変化も正負の数で表せるから、天気予報でも使えそうでおもしろい", u: 4 },
];

(async () => {
  if (!JOIN) { console.error("LL_JOIN が必要です"); process.exit(2); }
  const students = [];
  const t0 = Date.now();
  for (let i = 1; i <= N; i++) {
    const pw = "pw" + Math.random().toString(36).slice(2, 8);
    let r = await rpc("live_register", { p_join: JOIN, p_number: i + 10, p_password: pw });
    if (r.error === "id_taken") continue;
    if (!r.ok) { console.log("登録失敗", i, r); continue; }
    students.push({ no: i + 10, token: r.token, id: r.account_id });
  }
  console.log(`登録 ${students.length} 人 (${Date.now() - t0}ms)`);
  // いっせいに数秒ごとの確認をしたときの応答時間
  const t1 = Date.now();
  const pulses = await Promise.all(students.map(s => rpc("live_pulse", { p_token: s.token })));
  console.log(`同時 pulse ${students.length} 件: ${Date.now() - t1}ms`);
  const st = pulses[0].state || {};
  // 反応
  await Promise.all(students.map(async s => {
    const kinds = ["like", "aha", "like", "slow"];
    await rpc("live_react", { p_token: s.token, p_kind: pick(kinds) });
    if (Math.random() < 0.3) await rpc("live_react", { p_token: s.token, p_kind: "lost_on" });
    if (Math.random() < 0.1) await rpc("live_react", { p_token: s.token, p_kind: "hand_on" });
    if (Math.random() < 0.08) await rpc("live_react", { p_token: s.token, p_kind: "help_on" });
    if (Math.random() < 0.6) await rpc("live_react", { p_token: s.token, p_kind: "done" });
  }));
  // 質問・コメント
  const qids = [];
  for (const s of students.slice(0, 5)) { const r = await rpc("live_post", { p_token: s.token, p_kind: "q", p_body: pick(QUESTIONS) }); if (r.id) qids.push(r.id); }
  for (const s of students.slice(5, 9)) await rpc("live_post", { p_token: s.token, p_kind: "c", p_body: pick(COMMENTS) });
  await Promise.all(students.slice(5).map(s => (Math.random() < 0.5 ? rpc("live_plus", { p_token: s.token, p_post_id: pick(qids) }) : null)));
  // 投票
  if (st.poll && st.poll.open) {
    await Promise.all(students.map(s => rpc("live_poll_answer", { p_token: s.token, p_poll_id: st.poll.id, p_answer: st.poll.kind === "scale" ? pick(["1", "2", "3", "3", "4", "4"]) : st.poll.kind === "abcd" ? pick(["A", "B", "B", "C"]) : st.poll.kind === "tf" ? pick(["○", "×"]) : pick(["-3", "-3", "3", "-2", "(-5)+2"]) })));
    console.log("投票に回答");
  }
  // 小テスト（正答率をばらつかせる）
  if (st.quiz_lesson) {
    const L = LL.lesson(st.quiz_lesson);
    const its = QC.items(L);
    await Promise.all(students.map(async s => {
      const skill = Math.random();
      const ans = {};
      for (const it of its) {
        const right = Math.random() < 0.35 + skill * 0.6;
        const mode = QC.modeOf(it);
        if (it.type === "choice") ans[it.k] = right ? it.sub.a : (it.sub.a + 1) % it.q.choices.length;
        else if (it.type === "multi") ans[it.k] = right ? it.q.a : [0];
        else if (it.type === "input") {
          const miss = it.sub.miss ? Object.keys(it.sub.miss) : [];
          ans[it.k] = right ? (mode === "coord" ? `(${it.sub.a})` : mode === "list" || mode === "set" ? it.sub.a.join(",") : Array.isArray(it.sub.a) ? it.sub.a[0] : String(it.sub.a)) : miss.length ? pick(miss) : "0";
        }
      }
      const g = QC.grade(L, ans);
      return rpc("live_quiz_submit", { p_token: s.token, p_lesson_id: L.id, p_score: g.score, p_max: g.max, p_answers: QC.payload(g), p_duration: 200 + Math.floor(Math.random() * 200) });
    }));
    console.log("小テスト提出");
  }
  // 振り返り
  if (st.reflect_lesson) {
    const L = LL.lesson(st.reflect_lesson);
    const vocab = L.vocab.concat(LL.unit(L.unit).vocab);
    await Promise.all(students.slice(0, Math.floor(students.length * 0.8)).map(s => {
      const x = pick(REFLS);
      const body = Object.assign({}, x); delete body.u;
      const ev = RF.analyze({ body, understanding: x.u, vocab, prev: null, history: [] });
      return rpc("live_reflection_submit", { p_token: s.token, p_lesson_id: L.id, p_understanding: x.u, p_mode: "light", p_body: body, p_auto: ev, p_flag: ev.flags.sos ? "sos" : ev.flags.help ? "help" : null });
    }));
    console.log("振り返り提出");
  }
  console.log(`完了 (${Date.now() - t0}ms)`);
})();
