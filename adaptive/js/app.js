// ============================================================
// app.js — つまずきナビ：画面の切りかえ（ハッシュルーター）と、全体で共有する状態
//
//  app.store    … 保存（localStorage）。解答ログ・気になる・プロフィール
//  app.learner  … 学習者モデル。解答ログから作り直す（rebuild）
//  app.rng      … 出題用の乱数。URL に ?seed=数字 をつけると同じ順で出題される（動作確認用）
// ============================================================
import { Store, rebuildLearner, DISCOUNT } from "./core/store.js";
import { makeRng, newSeed } from "./core/rng.js";
import { SKILLS } from "./data/graph.js";
import { makeItem } from "./core/items.js";
import { h, mount } from "./ui/dom.js";
import { homeScreen } from "./ui/home.js";
import { sessionScreen } from "./ui/session.js";
import { mapScreen } from "./ui/map.js";
import { reportScreen } from "./ui/report.js";
import { concernsScreen, openConcernDialog } from "./ui/concerns.js";
import { dataScreen } from "./ui/data.js";

const NAV = [
  ["home", "ホーム"],
  ["diag", "診断"],
  ["practice", "練習"],
  ["map", "マップ"],
  ["report", "レポート"],
  ["concerns", "気になる"],
];

const SCREENS = {
  home: homeScreen,
  diag: (app) => sessionScreen(app, "diag"),
  practice: (app, params) => sessionScreen(app, "practice", params),
  map: mapScreen,
  report: reportScreen,
  concerns: concernsScreen,
  data: dataScreen,
};

export const app = {
  store: new Store(),
  learner: null,
  rng: null,
  session: null, // 進行中の診断・演習（画面を離れても残す）
  view: null,
  toastEl: null,

  /** 保存された解答ログからモデルを作り直す */
  rebuild() {
    const grade = this.store.profile?.grade ?? 8;
    this.learner = rebuildLearner(this.store.log, grade);
    this.learner.decayTo(Date.now());
  },

  /** 解答を 1 件記録する（保存とモデルへの反映を一緒に行う） */
  record(ev) {
    this.store.append(ev);
    if (ev.type !== "answer") return;
    this.learner.P.discount = DISCOUNT[ev.mode] ?? 1;
    this.learner.observe({ skillId: ev.skillId, level: ev.level, ok: !!ev.ok, skipped: !!ev.skipped, kind: ev.kind, mc: ev.mc || null, t: ev.t });
    this.learner.P.discount = DISCOUNT.practice;
  },

  /** 問題を 1 つ作る。テンプレが例外を出したら別の種で作り直す。shown に同じ見た目の問題があれば避ける */
  generate(skillId, level, shown = new Set()) {
    const sk = SKILLS[skillId];
    let fallback = null;
    for (let i = 0; i < 10; i++) {
      const seed = this.rng.int(1, 1 << 30);
      try {
        const it = makeItem(sk, level, seed);
        const sig = `${it.skillId}|${it.q}|${it.fig ? it.fig.length : 0}|${it.choices ? it.choices.map((c) => c.label).join(",") : ""}`;
        if (shown.has(sig)) {
          fallback = fallback || { it, sig };
          continue;
        }
        shown.add(sig);
        return it;
      } catch (e) {
        console.warn(`問題の生成に失敗しました（別の種で作り直します）: ${skillId} L${level} seed=${seed}`, e);
      }
    }
    if (fallback) return fallback.it;
    throw new Error(`問題を作れませんでした: ${skillId}`);
  },

  go(path) {
    const target = `#/${path}`;
    if (location.hash === target) render(); // ハッシュが同じだと hashchange が起きないので、直接描きなおす
    else location.hash = target;
  },

  toast(msg, ms = 2600) {
    if (!this.toastEl) return;
    this.toastEl.textContent = msg;
    this.toastEl.classList.add("show");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => this.toastEl.classList.remove("show"), ms);
  },

  openConcern(ctx) {
    openConcernDialog(this, ctx);
  },
};

function parseRoute() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [path, query = ""] = raw.split("?");
  const name = path || "home";
  const params = Object.fromEntries(new URLSearchParams(query));
  return { name: SCREENS[name] ? name : "home", params };
}

function renderNav(active) {
  return h(
    "nav",
    { class: "nav", "aria-label": "メニュー" },
    NAV.map(([key, label]) => h("a", { href: `#/${key}`, class: key === active ? "active" : "", "aria-current": key === active ? "page" : undefined }, label)),
    h("a", { href: "#/data", class: `nav-sub${active === "data" ? " active" : ""}` }, "データ"),
  );
}

function render() {
  const { name, params } = parseRoute();
  const nav = document.querySelector(".nav");
  nav?.replaceWith(renderNav(name));
  let node;
  try {
    node = SCREENS[name](app, params);
  } catch (e) {
    console.error(e);
    node = h("section", { class: "card" }, h("h2", null, "画面を表示できませんでした"), h("p", { class: "muted" }, String(e.message || e)), h("p", null, h("a", { href: "#/home" }, "ホームにもどる")));
  }
  mount(app.view, node);
  document.body.dataset.screen = name;
  window.scrollTo({ top: 0 });
  app.view.focus({ preventScroll: true });
}

function boot() {
  const seedParam = new URLSearchParams(location.search).get("seed");
  app.rng = makeRng(seedParam ? Number(seedParam) || 1 : newSeed());
  app.rebuild();

  const root = document.getElementById("app");
  app.view = h("main", { id: "view", tabindex: "-1" });
  app.toastEl = h("div", { class: "toast", role: "status", "aria-live": "polite" });
  mount(
    root,
    h("header", { class: "top" }, h("a", { class: "brand", href: "#/home" }, h("span", { class: "brand-mark", "aria-hidden": "true" }, "◇"), "つまずきナビ", h("span", { class: "brand-tag" }, "仮")), renderNav("home")),
    app.view,
    h(
      "footer",
      { class: "foot" },
      "記録はこの端末のブラウザの中だけに保存されます（サーバーには送りません）。問題はすべて、プログラムで自動生成したオリジナルです。",
    ),
    app.toastEl,
  );
  if (!app.store.available) app.toast("この環境では記録を保存できません。「データ」から書き出しておくと安心です。", 6000);
  window.addEventListener("hashchange", render);
  render();
}

boot();
// 動作確認用（tools/e2e.mjs が使う）。画面の状態を読むだけで、通常の利用には影響しない
globalThis.tsumazukiApp = app;
