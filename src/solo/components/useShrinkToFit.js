// ============================================================
// useShrinkToFit.js — 1行に収まらない数式の問題文を、はみ出さないよう、少し小さくする
//
//  根号や分数の中に長い式が入った数式は、途中で折り返せない。
//  そのままだと画面からはみ出すので、実際の幅を測って、文字サイズを少しずつ小さくする（最小で7割）。
//  それでも収まらないときは、CSS（.qtext の overflow-x: auto）で、枠の中を横にスクロールできる。
//
//  使い方：  const ref = useShrinkToFit(p.key);   <div className="qtext" ref={ref}> … </div>
//  key（問題が変わるたびに変わる値）が変わったとき、画面の幅が変わったとき、フォントが読み込まれたときに測り直す。
// ============================================================
import { useCallback, useLayoutEffect, useRef } from "react";

const MIN = 0.7;
const STEP = 0.04;

export function shrinkToFit(el) {
  if (!el || el.clientWidth === 0) return;
  el.style.fontSize = ""; // いったんもとの大きさに戻して測る
  const base = parseFloat(getComputedStyle(el).fontSize);
  let scale = 1;
  while (el.scrollWidth > el.clientWidth + 1 && scale > MIN) {
    scale = Math.max(MIN, scale - STEP);
    el.style.fontSize = `${(base * scale).toFixed(2)}px`;
  }
}

export function useShrinkToFit(key) {
  const elRef = useRef(null);
  const cleanupRef = useRef(null);

  const setRef = useCallback((el) => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    elRef.current = el;
    if (!el) return;
    let lastW = el.clientWidth;
    shrinkToFit(el);
    const ro = typeof ResizeObserver === "function"
      ? new ResizeObserver(() => { if (el.clientWidth !== lastW) { lastW = el.clientWidth; shrinkToFit(el); } })
      : null;
    ro?.observe(el);
    const again = () => shrinkToFit(el);
    document.fonts?.ready?.then(again);
    document.fonts?.addEventListener?.("loadingdone", again);
    cleanupRef.current = () => { ro?.disconnect(); document.fonts?.removeEventListener?.("loadingdone", again); };
  }, []);

  useLayoutEffect(() => { if (elRef.current) shrinkToFit(elRef.current); }, [key]);
  return setRef;
}
