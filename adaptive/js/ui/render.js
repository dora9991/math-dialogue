// ============================================================
// render.js — 1 問の表示（問題文・図・答える欄・キーパッド）と、答え合わせの表示
//
//  ItemView … makeItem() の結果を受け取り、答える欄を作る。getResponse() が judge() に渡す形を返す。
//  答える欄は num / choice / fields の 3 種類。fields は layout（inline・lines・frac・mixed・sqrt・sqrtfrac）ごとに並べ方が違う。
// ============================================================
import { h, mk, markup, texHtml } from "./dom.js";
import { tq } from "../core/tex.js";
import { MISCONCEPTIONS } from "../data/misconceptions.js";

const LETTERS = "ABCDE";
const isTouch = () => !!globalThis.matchMedia?.("(pointer: coarse)").matches;

/** √ の TeX（a=1 のとき a を省き、b=1 のとき根号を省く） */
function sqrtTex(a, b) {
  const A = a.n / a.d;
  const B = b.n / b.d;
  if (A === 0) return "0";
  if (B === 1) return tq(a);
  const root = `\\sqrt{${tq(b)}}`;
  if (A === 1) return root;
  if (A === -1) return `-${root}`;
  return `${tq(a)}${root}`;
}

/** 正しい答えを「文章＋$TeX$」で */
export function answerMarkup(item) {
  if (item.kind === "choice") {
    const i = item.choices.findIndex((c) => c.correct);
    return `${LETTERS[i]}　${item.choices[i].label}`;
  }
  if (item.kind === "num") return `$${tq(item.ans)}$${item.post ? ` ${item.post}` : ""}`;
  const F = Object.fromEntries(item.fields.map((f) => [f.id, f.value]));
  const tail = item.orderFree ? "（順不同）" : "";
  switch (item.layout) {
    case "sqrt":
      return `$${sqrtTex(F.a, F.b)}$`;
    case "sqrtfrac":
      return F.c.n / F.c.d === 1 ? `$${sqrtTex(F.a, F.b)}$` : `$\\dfrac{${sqrtTex(F.a, F.b)}}{${tq(F.c)}}$`;
    case "mixed": {
      const w = F.w.n / F.w.d;
      return w === 0 ? `$\\dfrac{${tq(F.n)}}{${tq(F.d)}}$` : `$${tq(F.w)}\\dfrac{${tq(F.n)}}{${tq(F.d)}}$`;
    }
    case "frac":
      return `$\\dfrac{${tq(item.fields[0].value)}}{${tq(item.fields[1].value)}}$`;
    default:
      return item.fields.map((f) => `${f.pre ? `${f.pre} ` : ""}$${tq(f.value)}$${f.post ? ` ${f.post}` : ""}`).join("、") + tail;
  }
}

/** 答える欄つきの 1 問 */
export class ItemView {
  /**
   * @param item  makeItem の結果
   * @param opts  { onChange(), onSubmit() }
   */
  constructor(item, opts = {}) {
    this.item = item;
    this.opts = opts;
    this.inputs = []; // <input>（num は 1 つ、fields は欄の数）
    this.choiceIndex = null;
    this.choiceEls = [];
    this.locked = false;
    this.active = null;
    this.el = h("div", { class: "item" });
    this._build();
  }

  _build() {
    const it = this.item;
    this.el.append(h("div", { class: "q" }, markup(it.q)));
    if (it.fig) this.el.append(h("div", { class: "fig", html: it.fig, role: "img", "aria-label": "問題の図" }));
    this.el.append(it.kind === "choice" ? this._choices() : it.kind === "num" ? this._num() : this._fields());
    if (it.hint) this.el.append(h("p", { class: "hint" }, markup(it.hint)));
  }

  // ── 入力欄 ──────────────────────────────
  _input(id, expected) {
    const len = expected ? String(expected).length : 3;
    const inp = h("input", {
      class: "in",
      type: "text",
      inputmode: isTouch() ? "none" : "text",
      autocomplete: "off",
      autocapitalize: "off",
      spellcheck: "false",
      enterkeyhint: "done",
      size: Math.max(3, Math.min(9, len + 1)),
      "aria-label": id ? `答えの欄 ${id}` : "答えの欄",
      dataset: { fid: id || "" },
    });
    inp.addEventListener("input", () => this.opts.onChange?.());
    inp.addEventListener("focus", () => (this.active = inp));
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.focusNext(inp, true);
      }
    });
    this.inputs.push(inp);
    return inp;
  }

  _num() {
    const it = this.item;
    const s = it.ans.d === 1 ? String(it.ans.n) : `${it.ans.n}/${it.ans.d}`;
    const box = h(
      "div",
      { class: "ans ans-num" },
      it.pre ? mk(it.pre, "span", "pre") : null,
      this._input("", s),
      it.post ? mk(it.post, "span", "post") : null,
    );
    const tips = ["整数・小数・分数（3/4）で入力"];
    if (it.reduced) tips.push("分数は約分して答える");
    if (it.mixed) tips.push("帯分数は「2 1/3」のように空白をあける");
    return h("div", { class: "ans-wrap" }, box, h("p", { class: "muted small" }, tips.join("　／　")));
  }

  _fields() {
    const it = this.item;
    const F = it.fields;
    const field = (f) => this._input(f.id, f.value.d === 1 ? String(f.value.n) : `${f.value.n}/${f.value.d}`);
    const wrapPP = (f, inp) => h("span", { class: "fld" }, f.pre ? mk(f.pre, "span", "pre") : null, inp, f.post ? mk(f.post, "span", "post") : null);
    let body;
    const byId = Object.fromEntries(F.map((f) => [f.id, f]));
    switch (it.layout) {
      case "sqrt":
        body = h("div", { class: "fields lay-sqrt" }, field(byId.a), h("span", { class: "rad" }, h("span", { class: "rad-sign" }, "√"), h("span", { class: "rad-body" }, field(byId.b))));
        break;
      case "sqrtfrac":
        body = h(
          "div",
          { class: "fields lay-frac" },
          h("span", { class: "frac" }, h("span", { class: "num" }, field(byId.a), h("span", { class: "rad" }, h("span", { class: "rad-sign" }, "√"), h("span", { class: "rad-body" }, field(byId.b)))), h("span", { class: "bar" }), h("span", { class: "den" }, field(byId.c))),
        );
        break;
      case "mixed":
        body = h("div", { class: "fields lay-frac" }, field(byId.w), h("span", { class: "frac" }, h("span", { class: "num" }, field(byId.n)), h("span", { class: "bar" }), h("span", { class: "den" }, field(byId.d))));
        break;
      case "frac":
        body = h("div", { class: "fields lay-frac" }, h("span", { class: "frac" }, h("span", { class: "num" }, field(F[0])), h("span", { class: "bar" }), h("span", { class: "den" }, field(F[1]))));
        break;
      case "lines":
        body = h("div", { class: "fields lay-lines" }, F.map((f) => h("div", { class: "line" }, wrapPP(f, field(f)))));
        break;
      default:
        body = h("div", { class: "fields lay-inline" }, F.map((f) => wrapPP(f, field(f))));
    }
    const tips = ["整数・小数・分数（3/4）で入力"];
    if (it.orderFree) tips.push("答えの順番は問いません");
    return h("div", { class: "ans-wrap" }, body, h("p", { class: "muted small" }, tips.join("　／　")));
  }

  _choices() {
    const list = h("div", { class: "choices", role: "radiogroup", "aria-label": "選択肢" });
    this.item.choices.forEach((c, i) => {
      const b = h(
        "button",
        {
          type: "button",
          class: "choice",
          role: "radio",
          "aria-checked": "false",
          onclick: () => this._pick(i),
        },
        h("span", { class: "letter" }, LETTERS[i]),
        mk(c.label, "span", "label"),
      );
      this.choiceEls.push(b);
      list.append(b);
    });
    return list;
  }

  _pick(i) {
    if (this.locked) return;
    this.choiceIndex = i;
    this.choiceEls.forEach((b, j) => {
      b.classList.toggle("selected", j === i);
      b.setAttribute("aria-checked", j === i ? "true" : "false");
    });
    this.opts.onChange?.();
  }

  // ── 操作 ──────────────────────────────
  /** キーパッドや Enter で次の欄へ。最後の欄なら onSubmit */
  focusNext(from, submitOnLast = false) {
    const i = this.inputs.indexOf(from || this.active);
    if (i >= 0 && i < this.inputs.length - 1) this.inputs[i + 1].focus();
    else if (submitOnLast || i === this.inputs.length - 1) this.opts.onSubmit?.();
  }
  activeInput() {
    return this.active && this.inputs.includes(this.active) ? this.active : this.inputs[0];
  }
  focusFirst() {
    if (this.inputs.length) this.inputs[0].focus({ preventScroll: true });
    else this.choiceEls[0]?.focus({ preventScroll: true });
  }

  /** judge() に渡す形 */
  getResponse() {
    const it = this.item;
    if (it.kind === "choice") return { type: "choice", index: this.choiceIndex };
    if (it.kind === "num") return { type: "num", text: this.inputs[0].value };
    return { type: "fields", values: Object.fromEntries(this.inputs.map((inp) => [inp.dataset.fid, inp.value])) };
  }
  isFilled() {
    if (this.item.kind === "choice") return this.choiceIndex !== null;
    return this.inputs.every((i) => i.value.trim() !== "");
  }
  /** 答えの文字列（ログ用） */
  givenText() {
    const it = this.item;
    if (it.kind === "choice") return this.choiceIndex === null ? "" : LETTERS[this.choiceIndex];
    if (it.kind === "num") return this.inputs[0].value.trim();
    return this.inputs.map((i) => i.value.trim()).join(",");
  }

  /** 前に入力した答え（getResponse の形）を欄にもどす。答え合わせの画面で使う */
  restore(resp) {
    if (!resp) return;
    if (this.item.kind === "choice") {
      if (resp.index !== null && resp.index !== undefined) this._pick(resp.index);
    } else if (this.item.kind === "num") this.inputs[0].value = resp.text || "";
    else this.inputs.forEach((i) => (i.value = resp.values?.[i.dataset.fid] ?? ""));
  }

  lock() {
    this.locked = true;
    this.inputs.forEach((i) => (i.readOnly = true));
    this.choiceEls.forEach((b) => (b.disabled = true));
  }

  /** 答え合わせの色をつける */
  mark(result) {
    const it = this.item;
    const cls = result.ok ? "ok" : "ng";
    if (it.kind === "choice") {
      this.choiceEls.forEach((b, j) => {
        if (it.choices[j].correct) b.classList.add("right");
        else if (j === this.choiceIndex) b.classList.add("wrong");
      });
    } else {
      this.el.querySelector(".ans-wrap")?.classList.add(cls);
    }
  }
}

/** 数字キーパッド。view の「いま入力中の欄」に打ち込む */
export function buildKeypad(view, { mixed = false } = {}) {
  const rows = [
    ["7", "8", "9", "back"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "/"],
    ["0", ".", mixed ? " " : null, "next"],
  ];
  const label = { back: "⌫", "-": "−", "/": "／", " ": "␣", next: "次へ" };
  const insert = (inp, s) => {
    const a = inp.selectionStart ?? inp.value.length;
    const b = inp.selectionEnd ?? inp.value.length;
    inp.setRangeText(s, a, b, "end");
    inp.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const press = (key) => {
    if (view.locked) return;
    const inp = view.activeInput();
    if (!inp) return;
    inp.focus({ preventScroll: true });
    if (key === "back") {
      const a = inp.selectionStart ?? inp.value.length;
      const b = inp.selectionEnd ?? inp.value.length;
      if (a !== b) inp.setRangeText("", a, b, "end");
      else if (a > 0) inp.setRangeText("", a - 1, a, "end");
      inp.dispatchEvent(new Event("input", { bubbles: true }));
    } else if (key === "next") view.focusNext(inp, true);
    else insert(inp, key);
  };
  const pad = h("div", { class: "keypad", role: "group", "aria-label": "数字キー" });
  for (const row of rows) {
    for (const k of row) {
      if (k === null) {
        pad.append(h("span", { class: "key gap" }));
        continue;
      }
      pad.append(
        h(
          "button",
          {
            type: "button",
            class: `key${k === "next" ? " key-next" : ""}${k === "back" ? " key-back" : ""}`,
            "aria-label": k === "back" ? "1文字消す" : k === "next" ? "次の欄へ" : k === " " ? "空白" : undefined,
            onpointerdown: (e) => e.preventDefault(), // 入力欄からフォーカスを奪わない
            onclick: () => press(k),
          },
          label[k] || k,
        ),
      );
    }
  }
  return pad;
}

/** 答え合わせの結果を表示する要素 */
export function feedbackView(item, result, { showAnswer = true } = {}) {
  const box = h("div", { class: `feedback ${result.skipped ? "skip" : result.ok ? "ok" : "ng"}`, role: "status", "aria-live": "polite" });
  const title = result.skipped ? "「わからない」を選びました" : result.ok ? "正解です" : result.mc === "MC-NOT-REDUCED" ? "あと一歩：約分しましょう" : "ちがいました";
  box.append(h("div", { class: "fb-title" }, h("span", { class: "fb-mark", "aria-hidden": "true" }, result.skipped ? "？" : result.ok ? "○" : "×"), title));
  if (result.note) box.append(h("p", { class: "fb-note" }, result.note));
  if (!result.ok && showAnswer) box.append(h("p", { class: "fb-answer" }, "正しい答え：", mk(answerMarkup(item), "span", "fb-answer-val")));
  const mc = result.mc && MISCONCEPTIONS[result.mc];
  if (!result.ok && mc && result.mc !== "MC-SLIP" && result.mc !== "MC-NOT-REDUCED") {
    box.append(h("p", { class: "fb-mc" }, h("b", null, "もしかして："), mc.name, mc.tip ? h("span", { class: "fb-tip" }, `　→ ${mc.tip}`) : null));
  } else if (!result.ok && result.mc === "MC-SLIP") {
    box.append(h("p", { class: "fb-mc" }, h("b", null, "もしかして："), "計算のうっかり。考え方は合っているかもしれません。見直してみましょう。"));
  }
  const ex = h("div", { class: "fb-explain" }, h("b", null, "解説　"), mk(item.explain, "span"));
  if (result.ok) box.append(h("details", { class: "fb-details" }, h("summary", null, "解説を見る"), ex));
  else box.append(ex);
  return box;
}

export { texHtml };
