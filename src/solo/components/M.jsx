// ============================================================
// M.jsx — 数式つきテキストの表示
//   "$...$" の中は KaTeX（LaTeX）で、外は既存の MathText（"3/4" を縦の分数に）で描く。
//   例 <M>{"$x^{2}-5x+6=0$ を解きなさい。"}</M>
// ============================================================
import katex from "katex";
import "katex/dist/katex.min.css";
import MathText from "../../components/MathText.jsx";

const cache = new Map();
function texHtml(src) {
  if (cache.has(src)) return cache.get(src);
  let html;
  try {
    html = katex.renderToString(src, { throwOnError: false, strict: "ignore" });
  } catch {
    html = src;
  }
  if (cache.size > 2000) cache.clear();
  cache.set(src, html);
  return html;
}

export default function M({ children, className, style }) {
  const s = children == null ? "" : String(children);
  const parts = s.split("$");
  return (
    <span className={className} style={style}>
      {parts.map((p, i) =>
        i % 2 === 1
          ? <span key={i} dangerouslySetInnerHTML={{ __html: texHtml(p) }} />
          : p ? <MathText key={i}>{p}</MathText> : null
      )}
    </span>
  );
}
