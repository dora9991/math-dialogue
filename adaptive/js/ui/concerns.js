// ============================================================
// concerns.js — 「気になる」の記録（その場で残す → 一覧 → 書き出し）
//
//  問題の uid（単元/テンプレ/難易度/種）から、同じ問題をいつでも作り直せる。
//  書き出した Markdown や JSON を、docs の「気になる点」に貼りつけて直す材料にする。
// ============================================================
import { h, mk, markup, button, mount, fmtDate, copyText } from "./dom.js";
import { confirmDialog, saveText } from "./dialogs.js";
import { SKILLS, stageLabel } from "../data/graph.js";
import { makeItem, answerText, LEVEL_LABEL, parseUid } from "../core/items.js";
import { plainText } from "../core/markup.js";
import { answerMarkup } from "./render.js";
import { namePlain, nameEl } from "./names.js";

export const REASONS = [
  ["question", "問題文がわかりにくい・おかしい"],
  ["answer", "答え（正解）がおかしい"],
  ["figure", "図がおかしい・見にくい"],
  ["explain", "解説がわかりにくい・まちがっている"],
  ["level", "難しさが合っていない（易しすぎる／難しすぎる）"],
  ["input", "答えの入力がしにくい"],
  ["repeat", "同じような問題ばかり出る"],
  ["copyright", "既存の教材に似ているかもしれない"],
  ["other", "その他"],
];
const REASON_LABEL = Object.fromEntries(REASONS);

/** 「気になる」ダイアログ。ctx = { item, mode, given, result } または { general: true }。保存したあとに onSaved() を呼ぶ（一覧の再描画用） */
export function openConcernDialog(app, ctx = {}) {
  const item = ctx.item || null;
  const checks = REASONS.map(([key, label]) => {
    const id = `rs-${key}`;
    return h("label", { class: "check", for: id }, h("input", { type: "checkbox", id, value: key }), label);
  });
  const memo = h("textarea", { class: "in-text", rows: "4", placeholder: "どこが、どうなっていたか。こうだったらいい、など（省略できます）", "aria-label": "くわしく" });
  const dlg = h("dialog", { class: "dlg", "aria-labelledby": "dlg-title" });
  const close = () => {
    dlg.close?.();
    dlg.remove();
  };
  const save = () => {
    const reasons = checks.map((c) => c.querySelector("input")).filter((i) => i.checked).map((i) => i.value);
    if (!reasons.length && !memo.value.trim()) {
      app.toast("気になる点を選ぶか、メモを書いてください");
      return;
    }
    const base = { kind: item ? "item" : "general", reasons, memo: memo.value.trim(), mode: ctx.mode || null };
    if (item) {
      Object.assign(base, {
        uid: item.uid,
        skillId: item.skillId,
        tplId: item.tplId,
        level: item.level,
        seed: item.seed,
        given: ctx.given || "",
        correct: answerText(item),
        question: plainText(item.q),
        result: ctx.result ? (ctx.result.skipped ? "skip" : ctx.result.ok ? "ok" : "ng") : null,
      });
    }
    app.store.addConcern(base);
    app.toast("「気になる」に記録しました");
    close();
    ctx.onSaved?.();
  };
  dlg.append(
    h(
      "form",
      { onsubmit: (e) => (e.preventDefault(), save()) },
      h("h2", { id: "dlg-title" }, item ? "この問題で気になる点" : "気になることをメモする"),
      item ? h("p", { class: "muted small" }, `${namePlain(item.skillId)}（${stageLabel(SKILLS[item.skillId].stage)}・${LEVEL_LABEL[item.level]}）　問題ID：${item.uid}`) : null,
      h("fieldset", { class: "checks" }, h("legend", null, "あてはまるものを選んでください（複数可）"), checks),
      h("label", { class: "block" }, "くわしく", memo),
      h("div", { class: "actions" }, button("やめる", close, "btn ghost"), h("button", { type: "submit", class: "btn primary" }, "保存する")),
    ),
  );
  dlg.addEventListener("cancel", () => dlg.remove());
  document.body.append(dlg);
  if (dlg.showModal) dlg.showModal();
  else dlg.setAttribute("open", "");
  checks[0].querySelector("input").focus();
}

// ── 一覧 ─────────────────────────────────
export function concernsScreen(app) {
  const wrap = h("div", { class: "stack" });
  let filter = "open";
  const listBox = h("div", { class: "stack tight" });
  const head = h("section", { class: "card" });

  const draw = () => {
    const all = app.store.concerns;
    const shown = all.filter((c) => filter === "all" || c.status === (filter === "done" ? "done" : "open"));
    mount(
      head,
      h("h2", null, "気になる"),
      h("p", { class: "muted" }, "問題の画面の「気になる」ボタンで残した記録です。問題IDから、同じ問題をいつでも再現できます。"),
      h(
        "div",
        { class: "actions" },
        button("メモを追加", () => openConcernDialog(app, { general: true, mode: null, onSaved: draw }), "btn"),
        button("Markdown でコピー", async () => app.toast((await copyText(toMarkdown(shown))) ? "コピーしました" : "コピーできませんでした"), "btn", { disabled: !shown.length }),
        button("JSON で書き出し", () => saveText(`tsumazuki-concerns-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(shown, null, 2)), "btn", { disabled: !shown.length }),
      ),
      h(
        "div",
        { class: "tabs", role: "tablist" },
        [
          ["open", `未対応 ${all.filter((c) => c.status !== "done").length}`],
          ["done", `対応ずみ ${all.filter((c) => c.status === "done").length}`],
          ["all", `すべて ${all.length}`],
        ].map(([k, label]) => h("button", { type: "button", role: "tab", class: `tab${filter === k ? " active" : ""}`, "aria-selected": filter === k ? "true" : "false", onclick: () => ((filter = k), draw()) }, label)),
      ),
    );
    mount(listBox, shown.length ? shown.map((c) => concernCard(app, c, draw)) : h("div", { class: "card soft" }, h("p", { class: "muted" }, all.length ? "この分類の記録はありません。" : "まだ記録はありません。問題を解いていて「あれ？」と思ったら、「気になる」を押してください。")));
  };
  draw();
  wrap.append(head, listBox);
  return wrap;
}

function concernCard(app, c, redraw) {
  const detail = h("div", { class: "repro", hidden: true });
  let loaded = false;
  const sk = c.skillId ? SKILLS[c.skillId] : null;
  return h(
    "article",
    { class: `card concern${c.status === "done" ? " done" : ""}` },
    h(
      "div",
      { class: "concern-head" },
      h("span", { class: "muted small" }, fmtDate(c.at)),
      sk ? h("b", null, nameEl(c.skillId)) : h("b", null, "全体へのメモ"),
      sk ? h("span", { class: "muted small" }, `${stageLabel(sk.stage)}・${LEVEL_LABEL[c.level] || ""}`) : null,
      c.status === "done" ? h("span", { class: "chip ok" }, "対応ずみ") : null,
    ),
    c.uid ? h("div", { class: "muted small uid" }, `問題ID ${c.uid}`) : null,
    c.reasons?.length ? h("div", { class: "pills" }, c.reasons.map((r) => h("span", { class: "pill flat" }, REASON_LABEL[r] || r))) : null,
    c.memo ? h("p", { class: "memo" }, c.memo) : null,
    c.given ? h("p", { class: "muted small" }, `そのときの入力：${c.given}　／　正解：${c.correct ?? ""}`) : null,
    detail,
    h(
      "div",
      { class: "actions" },
      c.uid
        ? button("問題を再現して見る", () => {
            if (!loaded) {
              loaded = true;
              detail.append(reproduce(c));
            }
            detail.hidden = !detail.hidden;
          }, "btn small")
        : null,
      button(c.status === "done" ? "未対応にもどす" : "対応ずみにする", () => (app.store.updateConcern(c.id, { status: c.status === "done" ? "open" : "done" }), redraw()), "btn small"),
      button("削除", async () => {
        if (await confirmDialog("この記録を削除します。元にもどせません。", { title: "記録の削除", okLabel: "削除する", danger: true })) {
          app.store.removeConcern(c.id);
          redraw();
        }
      }, "btn small ghost"),
    ),
  );
}

/** uid から同じ問題を作り直して、問題文・図・正解・解説を並べて見せる */
function reproduce(c) {
  try {
    const { skillId, tplId, level, seed } = parseUid(c.uid);
    const item = makeItem(SKILLS[skillId], level, seed, tplId);
    return h(
      "div",
      { class: "repro-body" },
      h("div", { class: "q" }, markup(item.q)),
      item.fig ? h("div", { class: "fig", html: item.fig }) : null,
      item.kind === "choice" ? h("ol", { class: "choices-static", type: "A" }, item.choices.map((ch) => h("li", { class: ch.correct ? "right" : "" }, markup(ch.label), ch.mc ? h("span", { class: "muted small" }, `　［${ch.mc}］`) : null))) : null,
      h("p", null, h("b", null, "正しい答え　"), mk(answerMarkup(item))),
      h("p", null, h("b", null, "解説　"), mk(item.explain)),
    );
  } catch (e) {
    return h("p", { class: "muted" }, `この問題は再現できませんでした（${e.message}）。テンプレートが変わった可能性があります。`);
  }
}

function toMarkdown(list) {
  const today = new Date().toISOString().slice(0, 10);
  const lines = [`### 気になる点（${today} 書き出し）`, ""];
  list.forEach((c, i) => {
    const sk = c.skillId ? SKILLS[c.skillId] : null;
    lines.push(`${i + 1}. [${c.status === "done" ? "x" : " "}] ${fmtDate(c.at)} — ${sk ? `${stageLabel(sk.stage)}「${namePlain(c.skillId)}」／${LEVEL_LABEL[c.level] || ""}` : "全体へのメモ"}${c.uid ? ` — \`${c.uid}\`` : ""}`);
    if (c.reasons?.length) lines.push(`   - 気になる点: ${c.reasons.map((r) => REASON_LABEL[r] || r).join("、")}`);
    if (c.memo) lines.push(`   - メモ: ${c.memo.replace(/\n/g, " ")}`);
    if (c.question) lines.push(`   - 問題: ${c.question.replace(/\n/g, " ")}`);
    if (c.correct) lines.push(`   - 正解: ${c.correct}${c.given ? `／入力: ${c.given}` : ""}`);
  });
  return lines.join("\n");
}
