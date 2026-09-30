// ============================================================
// data.js — データの管理（学年・名前の変更、書き出し・読み込み、全消去）
// ============================================================
import { h, button, download, fmtDate } from "./dom.js";
import { gradeSelect } from "./home.js";

export function dataScreen(app) {
  const { store } = app;
  const p = store.profile;
  const answers = store.log.filter((e) => e.type === "answer");
  const wrap = h("div", { class: "stack" });

  if (p) {
    const nameIn = h("input", { id: "nick", class: "in-text", type: "text", maxlength: "20", value: p.name || "", autocomplete: "off" });
    const gradeIn = gradeSelect(p.grade);
    wrap.append(
      h(
        "section",
        { class: "card" },
        h("h2", null, "プロフィール"),
        h("div", { class: "form" }, h("label", { for: "nick" }, "ニックネーム"), nameIn, h("label", { for: "grade" }, "いま習っている学年"), gradeIn),
        h("p", { class: "muted small" }, "学年を変えると、最初の見立て（この学年ならここまで習っているはず）が変わります。これまでの解答の記録は残り、新しい学年で見立てを作り直します。"),
        h(
          "div",
          { class: "actions" },
          button(
            "保存する",
            () => {
              store.setProfile({ name: nameIn.value.trim(), grade: Number(gradeIn.value) });
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

  const fileIn = h("input", { type: "file", accept: "application/json,.json", hidden: true });
  fileIn.addEventListener("change", async () => {
    const f = fileIn.files?.[0];
    if (!f) return;
    try {
      const obj = JSON.parse(await f.text());
      if (store.log.length && !confirm("いまの記録は、読み込んだ内容に置きかえられます。よろしいですか？")) return;
      store.importData(obj);
      app.rebuild();
      app.session = null;
      app.toast("読み込みました");
      app.go("home");
    } catch (e) {
      app.toast(`読み込めませんでした：${e.message}`, 5000);
    } finally {
      fileIn.value = "";
    }
  });

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
        button("書き出す（JSON）", () => download(`tsumazuki-navi-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(store.exportData(), null, 2)), "btn primary", { disabled: !store.log.length && !store.concerns.length }),
        button("読み込む", () => fileIn.click(), "btn"),
        fileIn,
      ),
      h("p", { class: "muted small" }, "書き出したファイルは、別の端末・別のブラウザに読み込めます。先生に渡して、つまずきの見立てを一緒に見ることもできます。"),
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
          () => {
            if (!confirm("本当にすべて消しますか？（元にもどせません）\n先に「書き出す」で保存しておくと安心です。")) return;
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
