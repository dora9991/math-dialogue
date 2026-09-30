// ============================================================
// report.js — つまずきレポート（源流・領域ごとの到達・よくあるまちがい・学習プラン）
// ============================================================
import { h, mk, button, download, fmtDate } from "./dom.js";
import { rootCauses, strandSummary, misconceptionSummary, overview } from "../core/report.js";
import { studyPlan } from "../core/practice.js";
import { uncertainty } from "../core/diagnose.js";
import { SKILLS, ALL_IDS, ORDER, STRANDS, stageLabel, STAGE_LABEL } from "../data/graph.js";
import { STATE_INFO } from "./map.js";
import { nameEl, namePlain } from "./names.js";

const STATES = ["mastered", "infOk", "shaky", "gap", "infGap", "unknown"];

/** 状態ごとの割合を積み上げた横棒 */
function stackBar(counts, total) {
  return h(
    "div",
    { class: "stackbar", role: "img", "aria-label": STATES.map((s) => `${STATE_INFO[s].label} ${counts[s]}`).join("、") },
    STATES.map((s) => (counts[s] ? h("span", { class: `seg st-${s}`, style: { width: `${(100 * counts[s]) / total}%` }, title: `${STATE_INFO[s].label} ${counts[s]}` }) : null)),
  );
}

export function reportScreen(app) {
  const { store } = app;
  const L = app.learner;
  const p = store.profile;
  const answers = store.log.filter((e) => e.type === "answer");
  if (!p || !answers.length) {
    return h("section", { class: "card" }, h("h2", null, "レポートはまだありません"), h("p", null, "診断で問題を解くと、ここにつまずきの見立てが出ます。"), h("div", { class: "actions" }, button("診断をはじめる", () => app.go("diag"), "btn primary")));
  }
  const wrap = h("div", { class: "stack" });
  const ov = overview(L);
  const u = uncertainty(L);
  const reliability = L.n < 12 ? { cls: "warn", text: "答えた問題がまだ少ないので、見立ては不確かです。もう少し解くとはっきりします。" } : u < 0.35 ? { cls: "good", text: "見立ては比較的安定しています。" } : { cls: "mid", text: "見立てはおおよそ。練習で解くほど、はっきりしていきます。" };

  wrap.append(
    h(
      "section",
      { class: "card" },
      h("h2", null, `${p.name ? `${p.name}さん` : "あなた"}のつまずきレポート`),
      h("p", { class: "muted" }, `${STAGE_LABEL[p.grade]}　／　解いた問題 ${answers.length} 問　／　${fmtDate(answers[answers.length - 1].t)} 時点`),
      h("div", { class: `note ${reliability.cls}` }, reliability.text),
      h("h3", null, `${STAGE_LABEL[p.grade]}までの単元（${ov.relevantTotal}）のようす`),
      stackBar({ mastered: ov.mastered, infOk: ov.infOk, shaky: ov.shaky, gap: ov.gap, infGap: ov.infGap, unknown: ov.unknown }, Math.max(1, ov.relevantTotal)),
      h("div", { class: "legend" }, STATES.map((s) => h("span", { class: `legend-item st-${s}` }, h("span", { class: "sym", "aria-hidden": "true" }, STATE_INFO[s].sym), `${STATE_INFO[s].label} ${ov[s]}`))),
    ),
  );

  // ── つまずきの源流
  const causes = rootCauses(L).slice(0, 5);
  wrap.append(
    h(
      "section",
      { class: "card" },
      h("h2", null, "つまずきの源流"),
      h("p", { class: "muted small" }, "苦手と見立てた単元のうち、その前提がまだ怪しくないもの（＝川をさかのぼった一番上流）を、影響の大きい順に並べています。ここから取り組むと、下流の単元が一緒に進みやすくなります。"),
      causes.length
        ? h("div", { class: "causes" }, causes.map((c, i) => causeCard(app, c, i + 1)))
        : h("div", { class: "note good" }, "はっきりした「つまずきの源流」は見つかっていません。この調子で、練習で確かめていきましょう。"),
    ),
  );

  // ── 領域ごと
  const ss = strandSummary(L);
  wrap.append(
    h(
      "section",
      { class: "card" },
      h("h2", null, "領域ごとの到達"),
      h("p", { class: "muted small" }, "「到達」は、その学年までの単元の 8 割以上が「できていそう」な、いちばん高い学年です。"),
      h(
        "div",
        { class: "strands" },
        Object.entries(STRANDS).map(([key, st]) => {
          const s = ss[key];
          return h(
            "div",
            { class: "strand-row" },
            h("div", { class: "strand-name" }, h("span", { class: "chip", style: { "--chip": st.color } }, st.name)),
            stackBar(s, s.total),
            h("div", { class: "strand-reach" }, s.reach === null ? "小学校の入口から確認" : `${stageLabel(s.reach)}の単元まで到達`),
          );
        }),
      ),
    ),
  );

  // ── まちがいパターン
  const mcs = misconceptionSummary(L, store.log).filter((m) => m.id !== "MC-SLIP").slice(0, 5);
  wrap.append(
    h(
      "section",
      { class: "card" },
      h("h2", null, "よく出たまちがい方"),
      mcs.length
        ? h(
            "ul",
            { class: "mcs" },
            mcs.map((m) =>
              h(
                "li",
                null,
                h("div", { class: "mc-name" }, h("b", null, m.name), h("span", { class: "muted small" }, `　${m.count} 回`)),
                m.tip ? h("div", { class: "muted" }, `声かけ・復習のヒント：${m.tip}`) : null,
                m.skills.length ? h("div", { class: "muted small" }, "出た単元：", m.skills.slice(0, 4).map((id, i) => [i ? "、" : "", nameEl(id, true)])) : null,
              ),
            ),
          )
        : h("p", { class: "muted" }, "パターンとして目立つまちがいは、まだ見つかっていません。"),
      h("p", { class: "muted small" }, "「うっかり（計算まちがい）」は、原因ではなく見直しの習慣の問題なので、ここには含めていません。"),
    ),
  );

  // ── 学習プラン
  const plan = studyPlan(L, { limit: 8 });
  wrap.append(
    h(
      "section",
      { class: "card" },
      h("h2", null, "これからの学習プラン"),
      plan.length
        ? h(
            "ol",
            { class: "plan" },
            plan.map((id) => h("li", null, h("span", { class: "plan-name" }, nameEl(id), h("span", { class: "muted small" }, `　${stageLabel(SKILLS[id].stage)}`)), button("練習", () => ((app.session = null), app.go(`practice?focus=${id}`)), "btn small"))),
          )
        : h("p", { class: "muted" }, "いまのところ、優先して取り組む単元はありません。"),
      h("div", { class: "actions" }, button("この順で練習をはじめる", () => ((app.session = null), app.go("practice")), "btn primary"), button("マップで全体を見る", () => app.go("map"), "btn")),
    ),
  );

  // ── 先生・保護者向け
  const direct = ALL_IDS.filter((id) => L.stat[id].n > 0).length;
  wrap.append(
    h(
      "section",
      { class: "card soft" },
      h("h2", null, "先生・保護者の方へ"),
      h("ul", { class: "plain" }, h("li", null, `直接測った単元：${direct} / ${ALL_IDS.length}。残りは、前提のつながりと学年から推定した値です。`), h("li", null, `診断で ${answers.filter((e) => e.mode === "diag").length} 問、練習で ${answers.filter((e) => e.mode === "practice").length} 問に答えています。`), h("li", null, "選択式は当てずっぽうでも当たることがあるため、モデルは正解の価値を割り引いて見立てています。「わからない」は不正解として数えます。"), h("li", null, "見立ては統計モデルの推定です。実際の理解は、口頭で説明してもらう・別の問題を解いてもらうなどで確かめてください。")),
      h(
        "div",
        { class: "actions" },
        button(
          "単元ごとの見立てを CSV で保存",
          () => {
            const rows = [["単元ID", "単元名", "学年", "領域", "状態", "標準以上の確率", "解答数", "正解数"]];
            for (const id of ORDER) {
              const st = L.stat[id];
              rows.push([id, namePlain(id), stageLabel(SKILLS[id].stage), STRANDS[SKILLS[id].strand].name, STATE_INFO[L.state(id)].label, L.pMaster(id).toFixed(3), st.n, st.c]);
            }
            const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
            download(`tsumazuki-report-${new Date().toISOString().slice(0, 10)}.csv`, `﻿${csv}`, "text/csv");
          },
          "btn",
        ),
        button("印刷する", () => window.print(), "btn ghost"),
      ),
    ),
  );
  return wrap;
}

function causeCard(app, c, no) {
  const L = app.learner;
  const sk = SKILLS[c.id];
  const pm = Math.round(c.pMaster * 100);
  const blocked = c.blocked.slice(0, 3);
  return h(
    "div",
    { class: "cause" },
    h("div", { class: "cause-no", "aria-hidden": "true" }, no),
    h(
      "div",
      { class: "cause-body" },
      h("div", { class: "cause-head" }, h("b", null, nameEl(c.id)), h("span", { class: "muted" }, `　${stageLabel(sk.stage)}`), h("span", { class: `state-badge st-${L.state(c.id)}` }, h("span", { class: "sym", "aria-hidden": "true" }, STATE_INFO[L.state(c.id)].sym), STATE_INFO[L.state(c.id)].label)),
      h("div", { class: "prog-bar slim", "aria-hidden": "true" }, h("div", { class: "prog-fill mastery", style: { width: `${pm}%` } })),
      h(
        "p",
        { class: "small" },
        c.direct ? `この単元を直接測って、標準以上の確からしさは ${pm}％ でした。` : `この単元はまだ出していませんが、前後の単元の結果から、標準以上の確からしさは ${pm}％ と見立てました。`,
        c.blocked.length ? ["　ここが弱いことで、", blocked.map((id, i) => [i ? "、" : "", nameEl(id, true)]), c.blocked.length > blocked.length ? ` など ${c.blocked.length} 個` : "", "の単元に影響していそうです。"] : null,
      ),
      sk.point ? h("p", { class: "muted small" }, h("b", null, "ポイント　"), mk(sk.point)) : null,
      h("div", { class: "actions" }, button("この単元から練習", () => ((app.session = null), app.go(`practice?focus=${c.id}`)), "btn small primary")),
    ),
  );
}
