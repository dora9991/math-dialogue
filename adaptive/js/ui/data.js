// ============================================================
// data.js — データの管理（学年・名前の変更、書き出し・読み込み、全消去）
// ============================================================
import { h, button, fmtDate } from "./dom.js";
import { gradeSelect, courseChooser } from "./home.js";
import { confirmDialog, saveText } from "./dialogs.js";

export function dataScreen(app) {
  const { store } = app;
  const p = store.profile;
  const answers = store.log.filter((e) => e.type === "answer");
  const wrap = h("div", { class: "stack" });

  if (p) {
    const nameIn = h("input", { id: "nick", class: "in-text", type: "text", maxlength: "20", value: p.name || "", autocomplete: "off" });
    const gradeIn = gradeSelect(p.grade);
    const crs = courseChooser(p.grade, p.courses);
    gradeIn.addEventListener("change", () => crs.setGrade(Number(gradeIn.value)));
    wrap.append(
      h(
        "section",
        { class: "card" },
        h("h2", null, "プロフィール"),
        h("div", { class: "form" }, h("label", { for: "nick" }, "ニックネーム"), nameIn, h("label", { for: "grade" }, "いま習っている学年"), gradeIn),
        crs.el,
        h("p", { class: "muted small" }, "学年や科目を変えると、最初の見立て（ここまで習っているはず）と、診断・練習で出す範囲が変わります。これまでの解答の記録は残り、新しい設定で見立てを作り直します。"),
        h(
          "div",
          { class: "actions" },
          button(
            "保存する",
            () => {
              store.setProfile({ name: nameIn.value.trim(), grade: Number(gradeIn.value), courses: crs.value() });
              app.rebuild();
              app.session = null;
              app.toast("保存しました");
            },
            "btn primary",
          ),
        ),
      ),
    );
  }

  /** 書き出した JSON の文字列を読み込む（ファイルでも貼りつけでも同じ） */
  const loadJson = async (text) => {
    try {
      let obj;
      try {
        obj = JSON.parse(text);
      } catch {
        throw new Error("JSON として読めません（途中で切れていないか、確かめてください）");
      }
      if (!obj || typeof obj !== "object" || !Array.isArray(obj.log)) throw new Error("このファイルは読み込めません（形式がちがいます）");
      if (store.log.length && !(await confirmDialog("いまの記録は、読み込んだ内容に置きかえられます。", { title: "読み込みの確認", okLabel: "置きかえて読み込む", danger: true }))) return false;
      store.importData(obj);
      app.rebuild();
      app.session = null;
      app.toast("読み込みました");
      app.go("home");
      return true;
    } catch (e) {
      app.toast(`読み込めませんでした：${e.message}`, 5000);
      return false;
    }
  };
  const fileIn = h("input", { type: "file", accept: "application/json,.json", hidden: true });
  fileIn.addEventListener("change", async () => {
    const f = fileIn.files?.[0];
    if (!f) return;
    try {
      await loadJson(await f.text());
    } finally {
      fileIn.value = "";
    }
  });
  const pasteIn = h("textarea", { id: "paste-json", class: "in-text mono", rows: "5", placeholder: "書き出したテキストをここに貼りつける", "aria-label": "書き出した JSON" });

  wrap.append(
    h(
      "section",
      { class: "card" },
      h("h2", null, "記録の書き出し・読み込み"),
      h("p", { class: "muted" }, `いま保存されているもの：解いた問題 ${answers.length} 問、気になる ${store.concerns.length} 件${answers.length ? `（最後：${fmtDate(answers[answers.length - 1].t)}）` : ""}。`),
      store.available ? null : h("div", { class: "note warn" }, "この環境ではブラウザに保存できません。画面を閉じると消えるので、こまめに書き出してください。"),
      h(
        "div",
        { class: "actions" },
        button("書き出す（JSON）", () => saveText(`tsumazuki-navi-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(store.exportData(), null, 2)), "btn primary", { disabled: !store.log.length && !store.concerns.length }),
        button("読み込む", () => fileIn.click(), "btn"),
        fileIn,
      ),
      h("p", { class: "muted small" }, "書き出したファイルは、別の端末・別のブラウザに読み込めます。先生に渡して、つまずきの見立てを一緒に見ることもできます。"),
      h("details", { class: "fine" }, h("summary", null, "貼りつけて読み込む"), pasteIn, h("div", { class: "actions" }, button("貼りつけた内容を読み込む", () => loadJson(pasteIn.value), "btn", { id: "paste-load" }))),
    ),
    h(
      "section",
      { class: "card" },
      h("h2", null, "すべて消す"),
      h("p", { class: "muted" }, "解答の記録・気になる・プロフィールをすべて消して、最初からやりなおします。元にもどせません。"),
      h(
        "div",
        { class: "actions" },
        button(
          "すべて消す",
          async () => {
            if (!(await confirmDialog("解答の記録・気になる・プロフィールをすべて消します。元にもどせません。\n先に「書き出す」で保存しておくと安心です。", { title: "すべて消しますか？", okLabel: "消す", danger: true }))) return;
            store.reset();
            app.rebuild();
            app.session = null;
            app.toast("消しました");
            app.go("home");
          },
          "btn danger",
        ),
      ),
    ),
    h("section", { class: "card soft" }, h("h2", null, "このアプリについて"), h("p", { class: "small" }, "つまずきナビ（仮称）は、算数・数学のつまずきの源流を探す実験的なツールです。問題・図・解説はすべてプログラムによる自動生成で、市販教材や他社サービスの問題は使っていません。")),
  );
  return wrap;
}
