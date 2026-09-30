// ============================================================
// home.js — ホーム画面（はじめての設定・次にやること・しくみの説明）
// ============================================================
import { h, button, fmtDate } from "./dom.js";
import { STAGE_LABEL, PLAYABLE_IDS, COURSES, COURSE_KEYS, defaultCourses, coursesLabel } from "../data/graph.js";
import { currentRound } from "../core/store.js";
import { overview } from "../core/report.js";

const GRADES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function gradeSelect(value, id = "grade") {
  return h(
    "select",
    { id, class: "in-select" },
    GRADES.map((g) => h("option", { value: g, selected: g === value }, STAGE_LABEL[g])),
  );
}

/**
 * 高校で習っている（履修している）科目のチェックボックス。高校生の学年のときだけ見せる。
 *  学年を変えたら setGrade で、その学年のふつうの履修に選び直す。
 */
export function courseChooser(grade, selected) {
  const init = Array.isArray(selected) ? selected : defaultCourses(grade);
  const boxes = {};
  const opts = COURSE_KEYS.map((k) => {
    const cb = h("input", { type: "checkbox", id: `crs-${k}`, value: k, checked: init.includes(k) });
    boxes[k] = cb;
    return h("label", { class: "course-opt", for: `crs-${k}` }, cb, COURSES[k].name);
  });
  const el = h(
    "fieldset",
    { class: "courses" },
    h("legend", null, "習っている（履修している）科目"),
    h("div", { class: "course-list" }, opts),
    h("p", { class: "muted small" }, "チェックした科目の単元を、診断と練習で出します。ほかの科目の単元は「まだ習わない単元」として扱い、つまずきマップでは薄く表示します。"),
  );
  const show = (g) => (el.hidden = g < 10);
  show(grade);
  return {
    el,
    setGrade(g) {
      const d = defaultCourses(g);
      for (const k of COURSE_KEYS) boxes[k].checked = d.includes(k);
      show(g);
    },
    value: () => COURSE_KEYS.filter((k) => boxes[k].checked),
  };
}

export function homeScreen(app) {
  const { store } = app;
  const p = store.profile;
  const answers = store.log.filter((e) => e.type === "answer");
  const wrap = h("div", { class: "stack" });

  wrap.append(
    h(
      "section",
      { class: "card hero" },
      h("h1", null, "つまずきを、源流までさかのぼる"),
      h("p", null, "問題を解いていくと、小学校から高校までの単元のうち、どこでつまずいているのかを推定します。そのうえで、その人に合った難しさの問題を出します。"),
      h("p", { class: "muted small" }, "「今日の単元ができない」の原因は、じつは 1 年前・3 年前の単元にあることがあります。川の上流から確かめていきます。"),
    ),
  );

  if (!p) {
    const nameIn = h("input", { id: "nick", class: "in-text", type: "text", maxlength: "20", placeholder: "例：ゆうき", autocomplete: "off" });
    const gradeIn = gradeSelect(8);
    const crs = courseChooser(8);
    gradeIn.addEventListener("change", () => crs.setGrade(Number(gradeIn.value)));
    wrap.append(
      h(
        "section",
        { class: "card" },
        h("h2", null, "はじめに"),
        h("div", { class: "form" }, h("label", { for: "nick" }, "ニックネーム（省略できます）"), nameIn, h("label", { for: "grade" }, "いま習っている学年"), gradeIn),
        crs.el,
        h("p", { class: "muted small" }, "学年は、最初の見立て（この学年ならここまで習っているはず）に使います。あとから「データ」で変えられます。"),
        h(
          "div",
          { class: "actions" },
          button(
            "診断をはじめる",
            () => {
              store.setProfile({ name: nameIn.value.trim(), grade: Number(gradeIn.value), courses: crs.value() });
              app.rebuild();
              app.session = null;
              app.go("diag");
            },
            "btn primary",
          ),
        ),
      ),
    );
  } else {
    const L = app.learner;
    const ov = overview(L);
    const round = currentRound(store.log, "diag");
    const last = answers.length ? answers[answers.length - 1].t : null;
    const doneDiag = answers.some((e) => e.mode === "diag") && round.length >= 12;
    const rec = !answers.length ? "diag" : !doneDiag ? "diag" : "practice";
    const stat = (label, value) => h("div", { class: "stat" }, h("div", { class: "stat-v" }, value), h("div", { class: "stat-l" }, label));
    wrap.append(
      h(
        "section",
        { class: "card" },
        h("h2", null, `${p.name ? `${p.name}さん` : "あなた"}の学習`),
        h("div", { class: "stats" }, stat("学年", STAGE_LABEL[p.grade]), stat("解いた問題", `${answers.length} 問`), stat("できていそう", ov.relevantTotal ? `${ov.mastered + ov.infOk} / ${ov.relevantTotal}` : "―"), stat("最後に解いた日", last ? fmtDate(last).slice(0, 10) : "―")),
        p.grade >= 10 ? h("p", { class: "muted small" }, `習っている科目：数学${coursesLabel(p.courses)}（「データ」で変えられます）`) : null,
        h(
          "div",
          { class: "actions" },
          button(!answers.length ? "診断をはじめる" : !doneDiag ? "診断をつづける" : "診断をやりなおす", () => app.go("diag"), rec === "diag" ? "btn primary" : "btn"),
          button("練習をはじめる", () => app.go("practice"), rec === "practice" ? "btn primary" : "btn", { disabled: !answers.length }),
          button("つまずきマップ", () => app.go("map"), "btn", { disabled: !answers.length }),
          button("レポート", () => app.go("report"), "btn", { disabled: !answers.length }),
        ),
        !answers.length ? null : !doneDiag ? h("p", { class: "muted small" }, "診断は 12〜30 問ほどです。答えるほど、見立てがはっきりします。") : h("p", { class: "muted small" }, "診断のあとは「練習」で、つまずきの源流から順に取り組めます。"),
      ),
    );
  }

  wrap.append(
    h(
      "section",
      { class: "card" },
      h("h2", null, "しくみ"),
      h(
        "ol",
        { class: "steps" },
        h("li", null, h("b", null, "診断："), "単元どうしの「前提のつながり」を使い、1 問ごとに“いちばん多くのことが分かる問題”を選びます。上流の単元を確かめたり、下流の単元を試したりします。"),
        h("li", null, h("b", null, "見立て："), `${PLAYABLE_IDS.length} の単元それぞれについて、「標準の問題をほぼ解ける」確からしさを推定します。間違えたとき、原因がその単元か、前提のどれかかを、ほかの答えと合わせて切り分けます。`),
        h("li", null, h("b", null, "練習："), "前提がそろっていて、まだ習熟していない単元から出します。正答率が 75％ くらいになる難しさに合わせ、続けて間違えたら前提へさかのぼります。"),
      ),
      h("p", { class: "muted small" }, "見立ては統計モデルによる“目安”です。答えた問題が少ないうちは不確かです。先生や保護者と相談する材料としてお使いください。"),
      h("details", { class: "fine" }, h("summary", null, "問題と著作権について"), h("p", null, "問題文・数値・図・解説はすべて、このアプリのプログラムが自動で作るオリジナルです。市販の教材、入試問題、他社サービスの問題は使っていません。単元の分け方と前提のつながりも、学習指導要領（公開情報）と授業の経験から自作しました。")),
    ),
  );

  wrap.append(h("section", { class: "card soft" }, h("h2", null, "試作品です"), h("p", null, "「ここがおかしい」「こうだったら使いやすい」と思ったら、問題の画面の「気になる」ボタンで記録できます。あとで一覧にして、直す材料にします。"), h("div", { class: "actions" }, button("気になる一覧を見る", () => app.go("concerns"), "btn"))));
  return wrap;
}
