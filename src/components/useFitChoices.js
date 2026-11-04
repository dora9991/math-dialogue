// ============================================================
// useFitChoices.js — 4択の選択肢が長いとき、見やすい並べ方を自動で選ぶ
//
//  式の選択肢（中2「式の計算」・中3「展開と因数分解」「二次方程式」など）は、
//  2列に並べると、ボタンの幅に入りきらずに、はみ出したり崩れたりする。
//  そこで、実際の画面幅と文字の幅を測って、次の順に「1行に収まる並べ方」を探す：
//
//    ① 2列・ふつうの文字  ② 2列・少し小さい文字
//    ③ 1列・ふつうの文字  ④ 1列・少し小さい文字  ⑤ 1列・小さい文字
//    ⑥ それでも入らないときだけ、1列で、演算子の手前で2行に折り返す
//
//  使い方：  const gridRef = useFitChoices(choices);
//            <div className="choices-grid" ref={gridRef}> …<button>…</button>… </div>
//  結果は CSS 変数（--cg-cols / --cg-scale）と data 属性（data-wrap）に入れる。
//  （React が管理する className や style とぶつからないようにするため）
//  ボタン側は theme.css の .choice-btn のように、文字サイズを calc(基準 * var(--cg-scale, 1)) にしておく。
// ============================================================
import { useCallback, useLayoutEffect, useRef } from "react";

const STEPS = [
  { cols: 2, scale: 1 },
  { cols: 2, scale: 0.9 },
  { cols: 1, scale: 1 },
  { cols: 1, scale: 0.9 },
  { cols: 1, scale: 0.8 },
];
const LAST = { cols: 1, scale: 0.9, wrap: true };

function apply(el, s) {
  el.style.setProperty("--cg-cols", s.cols === 2 ? "1fr 1fr" : "1fr");
  el.style.setProperty("--cg-scale", String(s.scale));
}

// すべてのボタンが、1行のまま、はみ出さずに入っているか
function fits(el, btns) {
  if (el.scrollWidth > el.clientWidth + 0.5) return false; // 列が広がって外にはみ出した
  for (const b of btns) if (b.scrollWidth > b.clientWidth + 0.5) return false;
  return true;
}

export function fitChoices(el) {
  if (!el || el.clientWidth === 0) return; // 見えていないときは測れない
  const btns = Array.from(el.children).filter((c) => c.tagName === "BUTTON");
  if (!btns.length) return;
  el.setAttribute("data-measure", "1"); // 測るあいだだけ、折り返しを止める（CSS：white-space: nowrap）
  el.removeAttribute("data-wrap");
  let chosen = LAST;
  for (const s of STEPS) {
    apply(el, s);
    if (fits(el, btns)) { chosen = s; break; }
  }
  apply(el, chosen);
  el.removeAttribute("data-measure");
  if (chosen.wrap) el.setAttribute("data-wrap", "1");
}

/**
 * 選択肢の入れ物（<div className="choices-grid">）に付ける、コールバック ref を返す。
 *   const gridRef = useFitChoices(choices);   →   <div className="choices-grid" ref={gridRef}>
 * 入れ物が画面に出たとき・choices が変わったとき（新しい問題）・画面の幅やフォントが変わったときに、並べ方を決め直す。
 */
export function useFitChoices(choices) {
  const key = Array.isArray(choices) ? choices.join("\u0001") : "";
  const elRef = useRef(null);
  const cleanupRef = useRef(null);

  const setRef = useCallback((el) => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    elRef.current = el;
    if (!el) return;
    let lastW = el.clientWidth;
    fitChoices(el);
    const ro = typeof ResizeObserver === "function"
      ? new ResizeObserver(() => { if (el.clientWidth !== lastW) { lastW = el.clientWidth; fitChoices(el); } })
      : null;
    ro?.observe(el);
    const again = () => fitChoices(el);
    document.fonts?.ready?.then(again);                 // Web フォントが読み込まれたあと
    document.fonts?.addEventListener?.("loadingdone", again);
    cleanupRef.current = () => { ro?.disconnect(); document.fonts?.removeEventListener?.("loadingdone", again); };
  }, []);

  // 同じ入れ物のまま、問題（選択肢）だけが入れ替わったとき
  useLayoutEffect(() => { if (elRef.current) fitChoices(elRef.current); }, [key]);

  return setRef;
}
