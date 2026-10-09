// ============================================================
// session.js — 診断と練習の進行（1 問ずつ出題 → 答える → 答え合わせ → 次へ）
//
//  診断 … chooseDiagnostic が「いちばん多くのことが分かる問題」を選び、shouldStop で終わりを決める。
//  練習 … nextPractice が「いま取り組む単元」と難しさを決める（前提がそろった未習熟の単元から。続けて間違えたら前提へ）。
//  どちらも、答えるたびに app.record() で解答ログへ保存し、学習者モデルを更新する。
// ============================================================
import { h, mount, button, mk } from "./dom.js";
import { ItemView, buildKeypad, feedbackView } from "./render.js";
import { judge, LEVEL_LABEL } from "../core/items.js";
import { SKILLS, STRANDS, stageLabel, PLAYABLE_IDS } from "../data/graph.js";
import { chooseDiagnostic, shouldStop, uncertainty } from "../core/diagnose.js";
import { nextPractice, isCleared } from "../core/practice.js";
import { currentRound } from "../core/store.js";
import { nameEl, namePlain } from "./names.js";

const DIAG = { min: 12, max: 30 };

class Session {
  constructor(app, mode, opts = {}) {
    this.app = app;
    this.mode = mode;
    this.shown = new Set();
    this.history = [];
    this.stuck = new Set();
    this.cleared = new Set();
    this.focus = opts.focus || null;
    this.current = null;
    this.phase = "ask"; // ask | feedback | done | ready
    this.lastResult = null;
    this.banner = null;
    this.asked = [];
    this.n = 0;
    this.correct = 0;
    this.u0 = uncertainty(app.learner);
    this.ctx = { current: null, focus: this.focus, history: this.history, rng: app.rng, stuck: this.stuck };

    if (mode === "diag") {
      const round = currentRound(app.store.log, "diag");
      const finished = round.length >= DIAG.min && shouldStop(app.learner, round.length, DIAG);
      if (round.length && !finished) {
        this.asked = round.map((e) => e.skillId);
        this.n = round.length;
        this.correct = round.filter((e) => e.ok).length;
        this.resumed = true;
      } else if (round.length && finished) {
        this.phase = "ready"; // 前回の診断は終わっている
        this.n = round.length;
      }
    }
  }

  /** 診断を新しく始める（開始の印をログに残す） */
  begin() {
    if (this.mode === "diag" && this.phase === "ready") {
      this.app.record({ type: "start", mode: "diag", t: Date.now() });
      this.asked = [];
      this.n = 0;
      this.correct = 0;
      this.u0 = uncertainty(this.app.learner);
      this.phase = "ask";
    } else if (this.mode === "diag" && !this.resumed && this.n === 0) {
      this.app.record({ type: "start", mode: "diag", t: Date.now() });
    }
  }

  /** 次の問題を用意する。終わりなら phase="done" にして null */
  pickNext() {
    const { app } = this;
    const L = app.learner;
    this.banner = null;
    let pick = null;
    if (this.mode === "diag") {
      if (this.n > 0 && shouldStop(L, this.n, DIAG)) {
        this.phase = "done";
        return null;
      }
      pick = chooseDiagnostic(L, { asked: this.asked, rng: app.rng });
    } else {
      const before = this.stuck.size;
      pick = nextPractice(L, this.ctx);
      if (pick) {
        const name = namePlain(pick.skillId);
        if (pick.reason === "new" || pick.reason === "focus") this.banner = { kind: "new", text: `${pick.reason === "focus" ? "選んだ単元" : "新しい単元"}：${name}` };
        else if (pick.reason === "backtrack" || pick.reason === "review") this.banner = { kind: pick.reason, text: pick.note };
      }
      if (this.stuck.size > before) this.stuckNote = "何度やっても進まない単元は、今回は保留にしました。先生や保護者に相談してみましょう。";
    }
    if (!pick) {
      this.phase = "done";
      return null;
    }
    const item = app.generate(pick.skillId, pick.level, this.shown);
    this.current = { pick, item, t0: Date.now(), view: null };
    this.phase = "ask";
    return this.current;
  }

  /** 答えを採点して記録する。答えの形が不正なら { invalid } を返し、記録しない */
  submit(resp, given) {
    const c = this.current;
    const skipped = resp?.type === "skip";
    const res = judge(c.item, resp);
    if (res.invalid) return res;
    const ev = {
      type: "answer",
      t: Date.now(),
      mode: this.mode,
      uid: c.item.uid,
      skillId: c.item.skillId,
      level: c.item.level,
      kind: c.item.kind,
      ok: !!res.ok,
      skipped,
      mc: res.mc || null,
      given: skipped ? "わからない" : given,
      ms: Date.now() - c.t0,
    };
    this.app.record(ev);
    this.n++;
    if (res.ok) this.correct++;
    if (this.mode === "diag") this.asked.push(ev.skillId);
    else {
      this.history.push({ skillId: ev.skillId, ok: ev.ok, level: ev.level });
      this.ctx.current = ev.skillId;
      if (this.focus === ev.skillId && isCleared(this.app.learner, ev.skillId)) this.ctx.focus = null;
      if (isCleared(this.app.learner, ev.skillId) && !this.cleared.has(ev.skillId)) {
        this.cleared.add(ev.skillId);
        this.justCleared = ev.skillId;
      }
    }
    this.lastResult = res;
    this.lastResp = resp;
    this.phase = "feedback";
    return res;
  }
}

// ── 画面 ─────────────────────────────────
export function sessionScreen(app, mode, params = {}) {
  if (!app.store.profile) {
    return h("section", { class: "card" }, h("h2", null, "はじめに学年を選びましょう"), h("p", null, "ホームで学年を選ぶと、診断をはじめられます。"), h("div", { class: "actions" }, button("ホームへ", () => app.go("home"), "btn primary")));
  }
  if (mode === "practice" && !app.store.log.some((e) => e.type === "answer")) {
    return h("section", { class: "card" }, h("h2", null, "先に診断をしましょう"), h("p", null, "練習は、診断の結果（つまずきの見立て）をもとに出題します。12〜30 問ほどです。"), h("div", { class: "actions" }, button("診断をはじめる", () => app.go("diag"), "btn primary")));
  }
  let sess = app.session;
  if (!sess || sess.mode !== mode || sess.phase === "done" || (mode === "practice" && params.focus && params.focus !== sess.focus)) {
    sess = new Session(app, mode, { focus: params.focus });
    app.session = sess;
  }
  const root = h("div", { class: "stack session" });
  const draw = () => mount(root, sessionView(app, sess, draw));
  if (sess.phase === "ask" && !sess.current) {
    sess.begin();
    if (!sess.pickNext()) {
      /* done */
    }
  }
  draw();
  return root;
}

function sessionView(app, sess, redraw) {
  if (sess.phase === "ready") return readyCard(app, sess, redraw);
  if (sess.phase === "done") return sess.mode === "diag" ? diagDone(app, sess) : practiceDone(app, sess);
  return questionCard(app, sess, redraw);
}

// ── 前回の診断が終わっているとき ──────────
function readyCard(app, sess, redraw) {
  return h(
    "section",
    { class: "card" },
    h("h2", null, "前回の診断は完了しています"),
    h("p", null, `${sess.n} 問に答えました。結果は「レポート」と「マップ」で見られます。`),
    h(
      "div",
      { class: "actions" },
      button("レポートを見る", () => app.go("report"), "btn primary"),
      button("練習をはじめる", () => app.go("practice"), "btn"),
      button("もう一度、診断する", () => {
        sess.begin();
        sess.pickNext();
        redraw();
      }, "btn"),
    ),
  );
}

// ── 1 問 ────────────────────────────────
function questionCard(app, sess, redraw) {
  const c = sess.current;
  const { item, pick } = c;
  const sk = SKILLS[item.skillId];
  const strand = STRANDS[sk.strand];
  const L = app.learner;
  const feedback = sess.phase === "feedback";

  const view = new ItemView(item, {
    onChange: () => syncSubmit(),
    onSubmit: () => doSubmit(),
  });
  c.view = view;

  const submitBtn = button("答える", () => doSubmit(), "btn primary big", { disabled: true });
  const skipBtn = button("わからない", () => doSkip(), "btn ghost");
  const nextBtn = button(sess.mode === "diag" ? "次の問題へ" : "次へ", () => goNext(), "btn primary big");
  const mixed = item.kind === "num" && !!item.mixed;

  function syncSubmit() {
    submitBtn.disabled = !view.isFilled();
  }
  function doSubmit() {
    if (sess.phase !== "ask") return;
    if (!view.isFilled()) {
      app.toast(item.kind === "choice" ? "選択肢を選んでください" : "すべての欄に答えを入れてください");
      return;
    }
    finish(sess.submit(view.getResponse(), view.givenText()));
  }
  function doSkip() {
    if (sess.phase !== "ask") return;
    finish(sess.submit({ type: "skip" }, ""));
  }
  function finish(res) {
    if (res.invalid) {
      app.toast(res.note || "答えの形を確かめてください", 3200);
      return;
    }
    redraw();
  }
  function goNext() {
    if (sess.mode === "practice") sess.justCleared = null;
    if (!sess.pickNext()) {
      redraw();
      return;
    }
    redraw();
  }

  const head = h(
    "div",
    { class: "qhead" },
    h("span", { class: "chip", style: { "--chip": strand.color } }, strand.name),
    h("span", { class: "qskill" }, nameEl(item.skillId)),
    h("span", { class: `chip lvl lvl${item.level}` }, LEVEL_LABEL[item.level]),
    h("span", { class: "qno" }, `${sess.n + (feedback ? 0 : 1)} 問目`),
  );

  const parts = [head];
  if (sess.mode === "diag") parts.push(progressBar(sess, L));
  else parts.push(masteryBar(sess, L, item.skillId));
  if (sess.mode === "diag" && sess.n === 0 && !feedback) parts.push(h("div", { class: "banner intro" }, "はじめに：わからない問題は、あてずっぽうで答えずに「わからない」を押してください。そのほうが、つまずきの見立てが正確になります。"));
  if (sess.banner && !feedback) parts.push(h("div", { class: `banner ${sess.banner.kind}` }, sess.banner.text));
  if (sess.stuckNote && !feedback) parts.push(h("div", { class: "banner stuck" }, sess.stuckNote));
  parts.push(view.el);

  if (!feedback) {
    if (item.kind !== "choice") parts.push(buildKeypad(view, { mixed }));
    parts.push(h("div", { class: "actions qactions" }, skipBtn, submitBtn));
  } else {
    const res = sess.lastResult;
    view.restore(sess.lastResp);
    view.lock();
    view.mark(res);
    parts.push(feedbackView(item, res));
    if (sess.mode === "practice" && sess.justCleared === item.skillId) parts.push(h("div", { class: "banner clear" }, `★ 「${namePlain(item.skillId)}」をクリアしました！`));
    parts.push(h("div", { class: "actions qactions" }, nextBtn));
  }
  const endBtn = sess.mode === "practice" ? button("練習を終える", () => ((sess.phase = "done"), redraw()), "btn link") : sess.n >= 8 ? button("ここまでで結果を見る", () => ((sess.phase = "done"), redraw()), "btn link") : null;
  parts.push(
    h(
      "div",
      { class: "qfoot" },
      button("気になる", () => app.openConcern({ item, mode: sess.mode, given: view.givenText(), result: feedback ? sess.lastResult : null }), "btn link", { title: "この問題について気づいたことを記録する" }),
      endBtn,
      h("span", { class: "muted small uid" }, `問題ID ${item.uid}`),
    ),
  );

  const card = h("section", { class: "card qcard" }, ...parts);
  // 画面が描かれたあとで、入力欄にフォーカス／次へボタンにフォーカス
  queueMicrotask(() => {
    if (feedback) nextBtn.focus({ preventScroll: true });
    else view.focusFirst();
    syncSubmit();
  });
  return card;
}

// ── 進みぐあい ───────────────────────────
function progressBar(sess, L) {
  const u = uncertainty(L);
  const target = 0.3;
  const p = sess.n < 3 ? sess.n / 30 : Math.max(0.05, Math.min(1, (sess.u0 - u) / Math.max(0.05, sess.u0 - target)));
  return h("div", { class: "prog", "aria-label": "診断の進みぐあい" }, h("div", { class: "prog-bar" }, h("div", { class: "prog-fill", style: { width: `${Math.round(p * 100)}%` } })), h("div", { class: "prog-label muted small" }, `診断の進みぐあい：${sess.n} 問に答えました（だいたい ${DIAG.min}〜${DIAG.max} 問で終わります）`));
}

function masteryBar(sess, L, skillId) {
  const pm = L.pMaster(skillId);
  return h(
    "div",
    { class: "prog", "aria-label": "この単元のできぐあい" },
    h("div", { class: "prog-bar" }, h("div", { class: "prog-fill mastery", style: { width: `${Math.round(pm * 100)}%` } })),
    h("div", { class: "prog-label muted small" }, `この単元のできぐあい（推定）：${Math.round(pm * 100)}％　／　今回 ${sess.n} 問（正解 ${sess.correct}）`),
  );
}

// ── 終わり ───────────────────────────────
function diagDone(app, sess) {
  return h(
    "section",
    { class: "card" },
    h("h2", null, "診断おつかれさまでした"),
    h("p", null, `${sess.n} 問に答えました（正解 ${sess.correct} 問）。答えの積み重ねから、単元ごとの「できているか」の見立てができました。`),
    h("p", { class: "muted small" }, "見立ては目安です。練習で問題を解くほど、さらにはっきりします。"),
    h("div", { class: "actions" }, button("レポートを見る", () => app.go("report"), "btn primary"), button("つまずきマップ", () => app.go("map"), "btn"), button("練習をはじめる", () => ((app.session = null), app.go("practice")), "btn")),
  );
}

function practiceDone(app, sess) {
  const acc = sess.n ? Math.round((100 * sess.correct) / sess.n) : 0;
  const cleared = [...sess.cleared];
  const stuck = [...sess.stuck];
  return h(
    "section",
    { class: "card" },
    h("h2", null, "今回の練習のふりかえり"),
    h("div", { class: "stats" }, statBox("解いた問題", `${sess.n} 問`), statBox("正解", `${sess.correct} 問（${acc}％）`), statBox("クリアした単元", `${cleared.length} 個`)),
    cleared.length ? h("div", null, h("h3", null, "クリアした単元"), h("ul", { class: "plain" }, cleared.map((id) => h("li", null, `★ ${namePlain(id)}（${stageLabel(SKILLS[id].stage)}）`)))) : null,
    stuck.length ? h("div", null, h("h3", null, "先生に相談してみたい単元"), h("ul", { class: "plain" }, stuck.map((id) => h("li", null, `${namePlain(id)}（${stageLabel(SKILLS[id].stage)}）`))), h("p", { class: "muted small" }, "何度やっても進まなかった単元です。説明を聞いたり、前の単元にもどると進むことがあります。")) : null,
    h("div", { class: "actions" }, button("つづけて練習", () => ((app.session = null), app.go("practice")), "btn primary"), button("レポートを見る", () => app.go("report"), "btn"), button("マップを見る", () => app.go("map"), "btn"), button("ホームへ", () => app.go("home"), "btn ghost")),
  );
}

const statBox = (label, value) => h("div", { class: "stat" }, h("div", { class: "stat-v" }, value), h("div", { class: "stat-l" }, label));

export { Session, PLAYABLE_IDS, mk };
