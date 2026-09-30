// ============================================================
// map.js — つまずきマップ（列＝学年、行＝領域。1 マス＝1 つの単元。色で状態を表す）
// ============================================================
import { h, mk, button, mount } from "./dom.js";
import { SKILLS, ALL_IDS, ORDER, STRANDS, STAGE_LABEL, COURSES, stageCourseLabel } from "../data/graph.js";
import { nameEl, namePlain } from "./names.js";

export const STATE_INFO = {
  mastered: { label: "できている", sym: "●", note: "直接測って、標準の問題をほぼ解けていた" },
  infOk: { label: "できていそう（推定）", sym: "○", note: "まだ出していないが、他の結果からできていそう" },
  shaky: { label: "あやしい", sym: "◐", note: "測ったが、できているとも言い切れない" },
  gap: { label: "つまずき", sym: "▲", note: "測って、標準の問題を解けていなかった" },
  infGap: { label: "つまずきかも（推定）", sym: "△", note: "まだ出していないが、前提のつまずきから苦手かもしれない" },
  unknown: { label: "まだ分からない", sym: "？", note: "見立てるだけの情報がまだない" },
  future: { label: "これから習う", sym: "◇", note: "学年より先の単元、または履修していない科目の単元（まだ問題を出していない）" },
};
const ORDER_STATES = ["mastered", "infOk", "shaky", "gap", "infGap", "unknown", "future"];

export function mapScreen(app) {
  const L = app.learner;
  const grade = app.store.profile?.grade ?? 8;
  const stages = [...new Set(ALL_IDS.map((id) => SKILLS[id].stage))].sort((a, b) => a - b);
  const rank = Object.fromEntries(ORDER.map((id, i) => [id, i]));
  const wrap = h("div", { class: "stack" });
  const detail = h("section", { class: "card detail", "aria-live": "polite" });
  let selected = null;

  const counts = Object.fromEntries(ORDER_STATES.map((s) => [s, 0]));
  for (const id of ALL_IDS) counts[L.state(id)]++;

  const legend = h(
    "div",
    { class: "legend", role: "list" },
    ORDER_STATES.map((s) => h("span", { class: `legend-item st-${s}`, role: "listitem", title: STATE_INFO[s].note }, h("span", { class: "sym", "aria-hidden": "true" }, STATE_INFO[s].sym), `${STATE_INFO[s].label} ${counts[s]}`)),
  );

  const grid = h("div", { class: "map-grid", style: { "--cols": stages.length } });
  grid.append(h("div", { class: "map-corner" }));
  for (const st of stages) grid.append(h("div", { class: `map-colhead${st === grade ? " now" : ""}` }, STAGE_LABEL[st], st === grade ? h("span", { class: "now-tag" }, "いま") : null));

  const chipFor = (id) => {
    const s = L.state(id);
    const sk = SKILLS[id];
    const untaken = !L.takes(id); // 履修していない科目の単元
    const where = `${stageCourseLabel(id)}${untaken ? "、履修していない科目" : ""}`;
    const b = h(
      "button",
      {
        type: "button",
        class: `chip-skill st-${s}${sk.stage > grade ? " above" : ""}${untaken ? " untaken" : ""}`,
        dataset: { id },
        title: `${namePlain(id)}（${where}）— ${STATE_INFO[s].label}`,
        "aria-label": `${namePlain(id)}、${where}、${STATE_INFO[s].label}`,
        onclick: () => select(id),
      },
      h("span", { class: "sym", "aria-hidden": "true" }, STATE_INFO[s].sym),
      h("span", { class: "nm" }, nameEl(id, true)),
      sk.course ? h("span", { class: "crs", "aria-hidden": "true" }, COURSES[sk.course].short) : null,
    );
    return b;
  };
  const nUntaken = ALL_IDS.filter((id) => !L.takes(id)).length;

  for (const [key, strand] of Object.entries(STRANDS)) {
    grid.append(h("div", { class: "map-rowhead", style: { "--chip": strand.color } }, strand.name));
    for (const st of stages) {
      const ids = ALL_IDS.filter((id) => SKILLS[id].strand === key && SKILLS[id].stage === st).sort((a, b) => rank[a] - rank[b]);
      grid.append(h("div", { class: `map-cell${st === grade ? " now" : ""}` }, ids.map(chipFor)));
    }
  }

  function select(id) {
    selected = id;
    grid.querySelectorAll(".chip-skill").forEach((b) => b.classList.toggle("selected", b.dataset.id === id));
    mount(detail, detailBody(app, id, select));
    detail.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }

  const scroller = h("div", { class: "map-scroll", tabindex: "0", role: "region", "aria-label": "つまずきマップ（横にスクロールできます）" }, grid);
  // 表示したとき、いまの学年の列が見えるようにスクロールする
  requestAnimationFrame(() => {
    const now = grid.querySelector(".map-colhead.now");
    if (now && scroller.scrollWidth > scroller.clientWidth) scroller.scrollLeft = Math.max(0, now.offsetLeft - (scroller.clientWidth - now.offsetWidth) / 2);
  });

  wrap.append(
    h(
      "section",
      { class: "card" },
      h("h2", null, "つまずきマップ"),
      h("p", { class: "muted" }, "1 つの四角が 1 つの単元です。左（小さい学年）ほど土台になる単元で、右へ進むほどそれを使う単元です。色は「いまの見立て」を表します。単元をクリックすると、くわしく見られます。表は横にスクロールできます（左に小学校の単元があります）。"),
      legend,
      nUntaken ? h("p", { class: "muted small" }, `高校の単元には科目（Ⅰ・A・Ⅱ・B・C・Ⅲ）を小さく書いています。点線で薄い単元（${nUntaken}）は、履修していない科目の単元です（「データ」で変えられます）。`) : null,
      scroller,
    ),
    detail,
  );
  mount(detail, h("p", { class: "muted" }, "単元をクリックすると、ここに詳細が出ます。"));
  return wrap;
}

function bar(dist) {
  const names = ["未習", "基礎", "標準", "発展"];
  return h(
    "div",
    { class: "distbar", role: "img", "aria-label": names.map((n, i) => `${n} ${Math.round(dist[i] * 100)}％`).join("、") },
    dist.map((p, i) => h("span", { class: `seg seg${i}`, style: { width: `${Math.max(0, p * 100)}%` }, title: `${names[i]} ${Math.round(p * 100)}％` }, p >= 0.14 ? `${names[i]}` : "")),
  );
}

function detailBody(app, id, select) {
  const L = app.learner;
  const sk = SKILLS[id];
  const st = L.stat[id];
  const state = L.state(id);
  const dist = L.stateDist(id);
  const pm = L.pMaster(id);
  const strand = STRANDS[sk.strand];
  const prereqs = sk.prereqs;
  const children = sk.children;
  const link = (pid) => h("button", { type: "button", class: `pill st-${L.state(pid)}`, onclick: () => select(pid) }, h("span", { class: "sym", "aria-hidden": "true" }, STATE_INFO[L.state(pid)].sym), nameEl(pid));
  return h(
    "div",
    null,
    h("div", { class: "detail-head" }, h("span", { class: "chip", style: { "--chip": strand.color } }, strand.name), h("h3", null, nameEl(id)), h("span", { class: "muted" }, stageCourseLabel(id)), L.takes(id) ? null : h("span", { class: "muted small" }, "（履修していない科目。診断・練習では出しません）")),
    h("p", null, h("span", { class: `state-badge st-${state}` }, h("span", { class: "sym", "aria-hidden": "true" }, STATE_INFO[state].sym), STATE_INFO[state].label), h("span", { class: "muted small" }, `　「標準以上」の確からしさ ${Math.round(pm * 100)}％`)),
    bar(dist),
    h("p", { class: "muted small" }, st.n ? `この単元の解答：${st.n} 問（正解 ${st.c} 問）` : "この単元の問題は、まだ解いていません（他の単元の結果からの推定です）。"),
    h("div", { class: "point" }, h("b", null, "ポイント　"), mk(sk.point)),
    prereqs.length ? h("div", null, h("h4", null, "前提になる単元"), h("div", { class: "pills" }, prereqs.map(link))) : null,
    children.length ? h("div", null, h("h4", null, "この先につながる単元"), h("div", { class: "pills" }, children.map(link))) : null,
    h("div", { class: "actions" }, button("この単元を練習する", () => ((app.session = null), app.go(`practice?focus=${id}`)), "btn primary")),
  );
}
