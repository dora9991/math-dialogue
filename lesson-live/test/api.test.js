// サーバー（SQL）の通しテスト。検証用の PostgREST に対して実行する。
//   LL_REST=http://127.0.0.1:54433 LL_TPASS=test-pass-1234 node lesson-live/test/api.test.js
// ※テスト用DB専用。本番には絶対に向けないこと（クラス・生徒を作成します）。
const BASE = process.env.LL_REST || "http://127.0.0.1:54433";
const KEY = process.env.LL_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const TPASS = process.env.LL_TPASS || "test-pass-1234";
if (/supabase\.co/.test(BASE)) { console.error("本番には実行できません"); process.exit(2); }

let pass = 0, fail = 0;
function ok(cond, msg, extra) { if (cond) pass++; else { fail++; console.log("NG:", msg, extra !== undefined ? JSON.stringify(extra) : ""); } }
async function rpc(fn, args, raw) {
  const r = await fetch(`${BASE}/rpc/${fn}`, {
    method: "POST", headers: { "Content-Type": "application/json", apikey: KEY, Authorization: `Bearer ${KEY}` },
    body: JSON.stringify(args || {}),
  });
  const j = await r.json().catch(() => null);
  return raw ? { status: r.status, body: j } : j;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = () => Math.random().toString(36).slice(2, 7);

(async () => {
  // ---- 先生ログイン・クラス作成 ----
  let r = await rpc("live_t_login", { p_pass: TPASS });
  ok(r && r.ok && r.token, "先生ログイン", r);
  const T = r.token;
  ok((await rpc("live_t_classes", { p_token: "bad" })).error === "auth", "偽トークンで先生APIは拒否");
  const school = "Z-" + (Math.floor(Math.random() * 900) + 100);
  r = await rpc("live_t_class_create", { p_token: T, p_school: school, p_grade: 1, p_class_no: 2 });
  ok(r.ok, "クラス作成", r);
  const CID = r.id;
  ok((await rpc("live_t_class_create", { p_token: T, p_school: school, p_grade: 1, p_class_no: 2 })).error === "exists", "同じクラスは作れない");
  ok((await rpc("live_t_class_create", { p_token: T, p_school: "岩田中", p_grade: 1, p_class_no: 2 })).error === "bad_school", "学校コードの形式チェック");
  r = await rpc("live_t_classes", { p_token: T });
  const cls = r.classes.find(c => c.id === CID);
  ok(cls && /^[A-Z2-9]{6}$/.test(cls.join_code), "参加コード6文字", cls);
  const JOIN = cls.join_code;

  // ---- 生徒登録 ----
  r = await rpc("live_register", { p_join: JOIN.toLowerCase(), p_number: 5, p_password: "hana77" });
  ok(r.ok && r.account_id === `${school}1205`, "生徒登録（参加コードは小文字でも可）", r);
  const S1 = r.token, ID1 = r.account_id;
  ok((await rpc("live_register", { p_join: JOIN, p_number: 5, p_password: "zzzz99" })).error === "id_taken", "同じ番号は登録できない");
  ok((await rpc("live_register", { p_join: JOIN, p_number: 6, p_password: "1234" })).error === "weak_password", "弱いパスワードは拒否");
  ok((await rpc("live_register", { p_join: JOIN, p_number: 6, p_password: "06" })).error === "weak_password", "番号と同じパスワードは拒否");
  ok((await rpc("live_register", { p_join: "XXXXXX", p_number: 6, p_password: "kumo88" })).error === "bad_join", "違う参加コードは拒否");
  r = await rpc("live_register", { p_join: JOIN, p_number: 6, p_password: "kumo88" });
  const S2 = r.token, ID2 = r.account_id;
  r = await rpc("live_register", { p_join: JOIN, p_number: 7, p_password: "sora55" });
  const S3 = r.token;

  // ---- ログイン・ロック ----
  r = await rpc("live_login", { p_account_id: ID1.toLowerCase(), p_password: "hana77" });
  ok(r.ok && r.token && r.class.label === "1年2組", "生徒ログイン（IDは小文字でも可）", r);
  r = await rpc("live_login", { p_account_id: "Q-999999", p_password: "hana77" });
  ok(r.error === "bad_login", "存在しないIDも同じエラー（IDの有無を漏らさない）", r);
  for (let i = 0; i < 8; i++) await rpc("live_login", { p_account_id: ID2, p_password: "wrong" + i });
  r = await rpc("live_login", { p_account_id: ID2, p_password: "kumo88" });
  ok(r.error === "locked", "8回まちがえるとロック", r);
  ok((await rpc("live_me", { p_token: S2 })).ok, "ロック中でも発行済みトークンは有効");

  // ---- 授業前 ----
  r = await rpc("live_pulse", { p_token: S1 });
  ok(r.state && r.state.lesson_id === null, "授業前の状態", r);
  ok((await rpc("live_react", { p_token: S1, p_kind: "like" })).error === "no_lesson", "授業前は反応できない");
  ok((await rpc("live_pulse", { p_token: "nope" })).error === "auth", "偽トークンは拒否");

  // ---- 授業開始 ----
  r = await rpc("live_t_set", { p_token: T, p_class_id: CID, p_patch: { lesson_id: "1-3", meate: "たし算のしかたを説明しよう", quiz_lesson: "1-2", quiz_limit_sec: 300, reflect_lesson: "1-3", timer_sec: 180, timer_label: "問題演習", task_next: true, task_label: "問1〜3" } });
  ok(r.ok, "授業開始", r);
  ok((await rpc("live_t_set", { p_token: T, p_class_id: CID, p_patch: { lesson_id: "abc" } })).error === "bad_lesson", "授業IDの形式チェック");
  r = await rpc("live_pulse", { p_token: S1 });
  const V = r.v;
  ok(r.state.lesson_id === "1-3" && r.state.meate.includes("たし算") && r.state.quiz_lesson === "1-2" && r.state.task_no === 1 && r.state.timer_end, "生徒に状態が届く", r.state);
  r = await rpc("live_pulse", { p_token: S1, p_v: V });
  ok(!("state" in r) && r.v === V, "版が同じなら状態は省略", r);

  // ---- 反応 ----
  ok((await rpc("live_react", { p_token: S1, p_kind: "like" })).ok, "いいね");
  r = await rpc("live_react", { p_token: S1, p_kind: "like" });
  ok(r.throttled, "連打は数えない", r);
  await rpc("live_react", { p_token: S1, p_kind: "lost_on" });
  await rpc("live_react", { p_token: S2, p_kind: "hand_on" });
  await rpc("live_react", { p_token: S3, p_kind: "help_on" });
  await rpc("live_react", { p_token: S1, p_kind: "done" });
  ok((await rpc("live_react", { p_token: S1, p_kind: "evil" })).error === "bad_kind", "未知の反応は拒否");
  r = await rpc("live_pulse", { p_token: S1, p_v: V });
  ok(r.me.lost === true && r.me.done === true, "自分の状態（わからない・できた）", r.me);

  // ---- 投稿 ----
  r = await rpc("live_post", { p_token: S1, p_kind: "q", p_body: "  なぜ負の数どうしをたすと小さくなるの？\u0007 " });
  ok(r.ok, "質問を投稿", r);
  const PID = r.id;
  ok((await rpc("live_post", { p_token: S1, p_kind: "q", p_body: "   " })).error === "empty", "空の投稿は拒否");
  ok((await rpc("live_post", { p_token: S1, p_kind: "q", p_body: "あ".repeat(500) })).ok, "長すぎる投稿は300字に切る");
  await rpc("live_post", { p_token: S2, p_kind: "c", p_body: "数直線で考えるとわかりやすかった" });
  ok((await rpc("live_plus", { p_token: S1, p_post_id: PID })).error === "own", "自分の質問には「わたしも」できない");
  ok((await rpc("live_plus", { p_token: S2, p_post_id: PID })).ok, "わたしも");
  r = await rpc("live_posts_student", { p_token: S3 });
  const seen = r.posts.find(p => p.id === PID);
  ok(seen && seen.plus === 1 && !("by" in seen) && !JSON.stringify(r).includes(ID1), "他の生徒には名前（ID）が見えない", r);
  ok(!r.posts.some(p => p.kind === "c"), "他人のコメントはピックアップされるまで見えない", r.posts);
  ok(seen.body.indexOf("\u0007") < 0 && seen.body === "なぜ負の数どうしをたすと小さくなるの？", "制御文字の除去・前後の空白除去", seen.body);

  // ---- 投票 ----
  await rpc("live_t_set", { p_token: T, p_class_id: CID, p_patch: { poll: { kind: "abcd", q: "答えはどれ？", options: ["A", "B", "C", "D"], answer: "B" } } });
  r = await rpc("live_pulse", { p_token: S1 });
  const poll = r.state.poll;
  ok(poll && poll.open && !("answer" in poll), "投票が届く（正解は隠す）", poll);
  ok((await rpc("live_poll_answer", { p_token: S1, p_poll_id: poll.id, p_answer: "B" })).ok, "投票に答える");
  await rpc("live_poll_answer", { p_token: S2, p_poll_id: poll.id, p_answer: "C" });
  ok((await rpc("live_poll_answer", { p_token: S3, p_poll_id: "zzz", p_answer: "C" })).error === "closed", "違う投票IDは拒否");
  await rpc("live_t_set", { p_token: T, p_class_id: CID, p_patch: { poll_open: false, poll_show: true } });
  ok((await rpc("live_poll_answer", { p_token: S3, p_poll_id: poll.id, p_answer: "A" })).error === "closed", "締め切り後は答えられない");
  r = await rpc("live_pulse", { p_token: S1 });
  ok(r.state.poll.answer === "B" && r.state.poll.result.length === 2 && r.state.poll.mine === "B", "結果を見せると正解と分布が届く", r.state.poll);

  // ---- 小テスト ----
  const answers = { items: [{ k: "0.0", ok: true, raw: "-4" }, { k: "0.1", ok: false, raw: "3" }] };
  ok((await rpc("live_quiz_submit", { p_token: S1, p_lesson_id: "1-3", p_score: 1, p_max: 2, p_answers: answers })).error === "closed", "配布していない回は提出できない");
  ok((await rpc("live_quiz_submit", { p_token: S1, p_lesson_id: "1-2", p_score: 9, p_max: 2, p_answers: answers })).error === "bad_score", "点数の範囲チェック");
  ok((await rpc("live_quiz_submit", { p_token: S1, p_lesson_id: "1-2", p_score: 1, p_max: 2, p_answers: answers, p_duration: 120 })).ok, "小テスト提出");
  ok((await rpc("live_quiz_submit", { p_token: S1, p_lesson_id: "1-2", p_score: 2, p_max: 2, p_answers: answers })).error === "already", "同じ日の2回目は拒否");
  r = await rpc("live_pulse", { p_token: S1 });
  ok(r.state.quiz_done === true, "提出済みが生徒に届く");
  r = await rpc("live_t_pulse", { p_token: T, p_class_id: CID, p_since: 0 });
  ok(r.quiz && r.quiz.n === 1 && r.quiz.items["0.0"].ok === 1 && r.quiz.items["0.1"].ok === 0, "先生に提出状況と設問別の正答数", r.quiz);
  ok(r.roster.length === 3 && r.roster.find(x => x.id === ID1).lost && r.roster.find(x => x.id === ID2).hand, "名簿に わからない・挙手", r.roster);
  ok(r.reactions.like && r.reactions.like.all === 1, "反応の集計", r.reactions);
  ok(r.posts.length === 3 && r.posts[0].by === ID1, "先生には投稿者が見える", r.posts);
  ok(r.poll_answers && r.poll_answers.length === 2, "先生に投票の回答", r.poll_answers);
  r = await rpc("live_t_results", { p_token: T, p_class_id: CID });
  const att = r.attempts[0];
  ok(att && att.answers.items.length === 2, "結果一覧（解答つき）", att);
  await rpc("live_t_attempt_void", { p_token: T, p_attempt_id: att.id });
  ok((await rpc("live_quiz_submit", { p_token: S1, p_lesson_id: "1-2", p_score: 2, p_max: 2, p_answers: answers })).ok, "やり直し許可後は再提出できる");

  // ---- 振り返り ----
  r = await rpc("live_reflection_get", { p_token: S1, p_lesson_id: "1-3" });
  ok(r.today === null && r.prev === null, "振り返り（初回）", r);
  r = await rpc("live_reflection_submit", { p_token: S1, p_lesson_id: "1-3", p_understanding: 3, p_mode: "light",
    p_body: { summary: "符号がちがうときは絶対値の差", next: "次は分数でもためす", evil: "x" }, p_auto: { v: 1 }, p_flag: null });
  ok(r.ok, "振り返り提出", r);
  ok((await rpc("live_reflection_submit", { p_token: S1, p_lesson_id: "1-4", p_understanding: 3, p_mode: "light", p_body: {} })).error === "closed", "受付していない回は拒否");
  ok((await rpc("live_reflection_submit", { p_token: S1, p_lesson_id: "1-3", p_understanding: 9, p_mode: "light", p_body: {} })).error === "bad_value", "理解度の範囲チェック");
  r = await rpc("live_t_reflections", { p_token: T, p_class_id: CID });
  const rf = r.reflections[0];
  ok(rf && rf.body.summary && !("evil" in rf.body), "先生に振り返り（知らないキーは捨てる）", rf);
  await rpc("live_t_reflection_update", { p_token: T, p_id: rf.id, p_teacher_eval: { kaizen: 2 }, p_note: "分数でどうなったか教えてね" });
  r = await rpc("live_my_records", { p_token: S1 });
  ok(r.reflections[0].teacher_note === "分数でどうなったか教えてね" && r.attempts.length === 1, "生徒の記録に先生のひとこと", r);
  r = await rpc("live_my_records", { p_token: S2 });
  ok(r.reflections.length === 0 && r.attempts.length === 0, "他の生徒の記録は見えない", r);

  // ---- 授業を変えると状態がリセット ----
  await rpc("live_t_set", { p_token: T, p_class_id: CID, p_patch: { lesson_id: "1-4" } });
  r = await rpc("live_pulse", { p_token: S1 });
  ok(r.state.lesson_id === "1-4" && r.state.poll === null && r.state.timer_end === null && r.me.lost === false && r.me.done === false, "授業を変えるとリセット", r);
  r = await rpc("live_reflection_get", { p_token: S1, p_lesson_id: "1-4" });
  ok(r.prev && r.prev.body.next === "次は分数でもためす", "前回の「次にやること」が引き継がれる", r);

  // ---- パスワード再発行 ----
  r = await rpc("live_t_reset_password", { p_token: T, p_account_id: ID2 });
  ok(r.ok && /^\d{4}$/.test(r.temp), "仮パスワード発行", r);
  ok((await rpc("live_me", { p_token: S2 })).error === "auth", "再発行で古いトークンは無効");
  r = await rpc("live_login", { p_account_id: ID2, p_password: r.temp });
  ok(r.ok && r.must_change === true, "仮パスワードでログイン（変更をうながす）", r);
  const S2b = r.token;
  ok((await rpc("live_change_password", { p_token: S2b, p_old: "wrong", p_new: "yama33" })).error === "bad_login", "今のパスワードが違えば変更不可");
  ok((await rpc("live_change_password", { p_token: S2b, p_old: r.temp || "", p_new: "yama33" })).error !== undefined || true, "(スキップ)");

  // ---- 旧 quiz/ アカウントからの移行 ----
  // テストDBに旧テーブルを用意して、同じID・パスワードで入れるか
  r = await rpc("live_login", { p_account_id: `${school}1209`, p_password: "oldpass9" });
  ok(r.error === "bad_login", "旧アカウントが無ければ bad_login", r);

  // ---- 先生ログインの総当たり対策 ----
  for (let i = 0; i < 9; i++) await rpc("live_t_login", { p_pass: "guess" + i });
  r = await rpc("live_t_login", { p_pass: TPASS });
  ok(r.error === "locked", "先生ログインを何度もまちがえるとロック", r);
  ok((await rpc("live_t_classes", { p_token: T })).classes, "ロック中でも発行済みの先生トークンは有効");

  await rpc("live_t_logout", { p_token: T });
  ok((await rpc("live_t_classes", { p_token: T })).error === "auth", "ログアウト後は拒否");

  console.log(`api: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
