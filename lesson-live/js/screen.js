/* ============================================================
   授業ライブ — 投影画面（プロジェクター・大型テレビ用）
   ・名前や番号は出さない（集計と匿名の質問だけ）
   ・キー：F＝全画面　Q＝参加QRの表示切りかえ　D＝明るさ
   ============================================================ */
(function () {
  "use strict";
  const { $, esc, Store, mmss, Clock, qrSVG } = UI;
  const ic = n => IC.svg(n);
  const head = (icon, eyebrow, title, right) => `<div class="p-head">${ic(icon)}<div class="grow"><span class="eyebrow">${eyebrow}</span><h2>${title}</h2></div>${right || ""}</div>`;
  const root = $("#scr");
  const params = new URLSearchParams(location.search);
  const classId = params.get("c");
  const tok = (Store.get("ll:t:token") || {});
  const token = tok.exp > Date.now() ? tok.v : null;
  let P = null, cls = null, lastHTML = "", showQR = Store.get("ll:scr:qr", true), timerIv = null;

  if (!token || !classId) {
    root.innerHTML = `<div class="panel" style="margin:auto;max-width:560px">${head("screen", "Projector", "投影画面")}<p style="font-size:18px">先生の画面でログインしてから、「投影画面」ボタンで開いてください。</p></div>`;
    return;
  }
  const call = (fn, args) => API.rpc(fn, Object.assign({ p_token: token }, args || {}));

  async function loadClass() {
    try { const r = await call("live_t_classes"); cls = (r.classes || []).find(c => c.id === classId) || null; } catch (e) { cls = null; }
  }
  async function tick() {
    try {
      const r = await call("live_t_pulse", { p_class_id: classId, p_since: 0 });
      if (r.error === "auth") { root.innerHTML = `<div class="panel" style="margin:auto;max-width:560px">${head("lock", "Session", "ログインの期限が切れました")}<p style="font-size:18px">先生の画面でログインし直してください。</p></div>`; return; }
      if (!r.error) { Clock.sync(r.now); P = r; draw(); }
    } catch (e) { /* 次でやり直す */ }
    setTimeout(tick, document.hidden ? 8000 : 2500);
  }

  function studentURL() { return location.href.replace(/[^/]*(\?.*)?$/, "") + "index.html?join=" + encodeURIComponent(cls ? cls.join_code : ""); }

  function draw() {
    const s = P.state, R = P.roster;
    const L = s.lesson_id ? LL.lesson(s.lesson_id) : null;
    const u = L ? LL.unit(L.unit) : null;
    const lost = R.filter(x => x.lost).length, online = R.filter(x => x.online).length;
    const done = R.filter(x => x.done).length;
    const rx = P.reactions || {};
    const m5 = k => (rx[k] ? rx[k].m5 : 0);
    const posts = (P.posts || []).filter(p => p.status !== "hidden");
    const qs = posts.filter(p => p.kind === "q").sort((a, b) => (a.status === "done") - (b.status === "done") || b.pinned - a.pinned || b.plus - a.plus || b.id - a.id).slice(0, 6);
    const pins = posts.filter(p => p.kind === "c" && p.pinned).slice(-3);
    const side = [], main = [];
    const pct = n => (R.length ? Math.min(100, Math.round(n / R.length * 100)) : 0);
    const bar = (icon, label, n, cls) => `<div class="pbar"><span>${ic(icon)} ${label}</span><div class="bar ${cls || ""}"><i style="width:${pct(n)}%"></i></div><span>${n}/${R.length}</span></div>`;
    const bars = [];
    if (s.task_no) bars.push(bar("task", "できた", done, "good"));
    if (s.quiz_lesson) bars.push(bar("quiz", "小テスト", P.quiz ? P.quiz.n : 0));
    if (s.reflect_lesson) bars.push(bar("quill", "振り返り", P.reflect ? P.reflect.n : 0, "good"));

    // 教室のようす
    side.push(`<div class="panel room">${head("orbit", "Classroom", "いまの教室", `<span class="conn">${ic("wave")} ${online}/${R.length}</span>`)}
      <div class="stat-row">
        <div class="stat ${lost ? "hot" : ""}" style="--sc:var(--rose)"><div class="huge">${lost}</div><div class="lb">🤔 わからない</div></div>
        <div class="stat" style="--sc:var(--amber)"><div class="huge mid">${m5("aha")}</div><div class="lb">💡 なるほど<small>5分</small></div></div>
        <div class="stat" style="--sc:var(--cyan)"><div class="huge mid">${m5("like")}</div><div class="lb">👍 いいね<small>5分</small></div></div>
      </div>
      ${m5("slow") >= 3 ? `<p class="slow-note">🐢 「ゆっくり」が ${m5("slow")} 件</p>` : ""}
      ${bars.length ? `<div class="bars">${bars.join("")}</div>` : ""}</div>`);

    // 投票
    if (s.poll) {
      const poll = s.poll, ans = P.poll_answers || [];
      const reveal = poll.show || !poll.open;
      let body = `<div class="huge">${ans.length}<span style="font-size:.35em;color:var(--ink-3)"> / ${R.length} 人</span></div><p style="font-size:22px">回答中…</p>`;
      if (reveal && poll.kind !== "text") {
        const order = poll.kind === "scale" ? [["4", "😄 バッチリ"], ["3", "🙂 だいたい"], ["2", "😐 すこし"], ["1", "😣 わからない"]]
          : poll.kind === "abcd" ? "ABCD".split("").map((c, i) => [c, c + ((poll.options || [])[i] && poll.options[i] !== c ? " " + poll.options[i] : "")])
          : poll.kind === "tf" ? [["○", "○"], ["×", "×"]] : null;
        const count = {};
        const norm = a => (poll.kind === "num" ? LM.normalize(a) : a);
        const shown = {};
        ans.forEach(x => { const k = norm(x.a); count[k] = (count[k] || 0) + 1; shown[k] = shown[k] || x.a; });
        const rows = order ? order.map(([k, t]) => [k, t, count[k] || 0]) : Object.keys(count).sort((a, b) => count[b] - count[a]).slice(0, 6).map(k => [k, LM.preview(shown[k], poll.mode || "num").html || esc(shown[k]), count[k]]);
        const right = k => poll.show && poll.answer != null && poll.answer !== "" && (poll.kind === "num" ? LM.gradeSub({ mode: poll.mode || "num", a: poll.answer }, shown[k] || k).ok : k === String(poll.answer));
        body = rows.map(([k, t, n]) => `<div class="pbar"><span>${t}${right(k) ? " ✅" : ""}</span><div class="bar ${right(k) ? "good" : ""}"><i style="width:${ans.length ? Math.round(n / ans.length * 100) : 0}%"></i></div><span>${n}</span></div>`).join("");
      } else if (reveal && poll.kind === "text") {
        body = `<div style="font-size:24px;line-height:1.8">${ans.slice(-12).map(x => `<span class="chip" style="font-size:20px;margin:4px">${esc(x.a)}</span>`).join("")}</div>`;
      }
      main.push(`<div class="panel poll">${head("poll", poll.open ? "Live Poll" : "Poll Closed", poll.q ? LM.richText(poll.q) : { scale: "今の理解度は？", abcd: "どれだと思う？", tf: "○か×か？", num: "答えは？", text: "ひとこと" }[poll.kind])}${body}</div>`);
    }

    // 質問
    if (qs.length || pins.length) {
      main.push(`<div class="panel qs">${head("question", "Questions", "みんなの質問")}
        ${qs.map(p => `<div class="q ${p.pinned ? "pinned" : ""} ${p.status === "done" ? "done" : ""}"><span class="pl">${ic("hand")}${p.plus}</span><span>${esc(p.body)}${p.status === "done" ? ` <span class="ok">${ic("check")}</span>` : ""}</span></div>`).join("")}
        ${pins.map(p => `<div class="q"><span class="pl">${ic("chat")}</span><span>${esc(p.body)}</span></div>`).join("")}</div>`);
    }

    const qr = showQR && cls && cls.join_open ? `<div class="center join"><div class="qr joinqr">${qrSVG(studentURL())}</div><div class="eyebrow gold" style="margin-top:6px">Join Code</div><div class="code-big" style="font-size:28px">${esc(cls.join_code)}</div></div>` : "";
    const html = `
      <div class="top">
        <div class="grow scr-title" style="${u ? `--uc:${u.color}` : ""}">
          ${u ? `<div class="scr-crest">${IC.unit(u.no)}</div>` : ""}
          <div class="scr-sub">${IC.emblem()}<span class="eyebrow gold">Live Classroom</span><span>${cls ? esc(cls.label) : ""}${L ? `　<span class="lesson-no" style="font-size:inherit">${esc(L.id)}</span> ${esc(L.title)}` : "　授業前"}</span></div>
          ${L ? `<div class="meate" style="margin-top:8px">${esc(s.meate || L.goal)}</div>` : `<div class="meate" style="margin-top:8px">授業が始まるまで待っています</div>`}
          ${s.notice ? `<div class="scr-notice">${ic("megaphone")} ${esc(s.notice)}</div>` : ""}
        </div>
        <div id="tmr" class="center"></div>
        ${qr}
      </div>
      ${main.length ? `<div class="panels split" style="--m:${main.length}"><div class="side">${side.join("")}</div>${main.join("")}</div>` : `<div class="panels">${side.join("")}</div>`}`;
    if (html !== lastHTML) { lastHTML = html; root.innerHTML = html; }
    drawTimer();
  }
  function drawTimer() {
    const el = $("#tmr");
    if (!el || !P) return;
    const s = P.state;
    if (!s.timer_end) { el.innerHTML = ""; return; }
    const left = (new Date(s.timer_end).getTime() - Clock.now()) / 1000;
    el.innerHTML = `<div class="eyebrow" style="font-size:14px">${ic("clock")} ${esc(s.timer_label || "タイマー")}</div><div class="tm" style="color:${left <= 0 ? "var(--bad)" : left < 30 ? "var(--warn)" : "var(--ink)"}">${left > 0 ? mmss(left) : "0:00"}</div>`;
  }
  document.addEventListener("keydown", e => {
    if (e.key === "f" || e.key === "F") { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {}); else document.exitFullscreen(); }
    if (e.key === "q" || e.key === "Q") { showQR = !showQR; Store.set("ll:scr:qr", showQR); if (P) draw(); }
    if (e.key === "d" || e.key === "D") { if (document.documentElement.getAttribute("data-theme") === "day") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", "day"); }
  });
  const th = Store.get("ll:theme", "night");
  if (th === "day" || th === "light") document.documentElement.setAttribute("data-theme", "day");
  timerIv = setInterval(drawTimer, 500);
  loadClass().then(tick);
})();
