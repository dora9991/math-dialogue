// ============================================================
// MathText.jsx — 数学テキストの表示（分数を上下に重ねて表示する）
//
//  問題文・選択肢・答えに含まれる「a/b」を、横棒つきの縦書き分数で表示する。
//  例： "x=2, y=−1/2" → 「x=2, y=−」＋（1 を 2 の上に重ねた分数）
//       "x/3+y/2=1"   → 分数(x/3) + "+" + 分数(y/2) + "=1"
//
//  分子・分母は「数字／かっこの式／1文字の英字・π・√」を対象にする。
//  （km/h のような単位や英単語の / は中学数学の問題文には出ないため、実害なし）
//
//  breakable … 選択肢の式用。長くて1行に入らないとき、演算子（+ − = ± × ÷）の手前で
//              2行に折り返せるようにする（ゼロ幅スペースを入れるだけで、見た目は変わらない）。
//              数・文字・かっこの直後の演算子だけが対象で、「−5」のような符号の手前では折り返さない。
// ============================================================

// 分子・分母になれるトークン：数字 / (かっこの式) / 1文字（英字・π・√）
const TOKEN = "(?:\\d+|\\([^()]+\\)|[A-Za-zπ√])";
// 符号(任意) + 分子 + "/" + 分母
const FRAC_RE = new RegExp(`([-−])?(${TOKEN})\\/(${TOKEN})`, "g");

// 折り返してよい位置：数・文字・かっこ・累乗の直後で、次が演算子のところ
const BREAK_RE = /([0-9A-Za-zπ√²³⁴⁵⁶)）])(?=[+−=±×÷])/g;
const brk = (t) => t.replace(BREAK_RE, "$1\u200b");

function Frac({ num, den }) {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", verticalAlign: "middle", margin: "0 .12em", lineHeight: 1.05 }}>
      <span style={{ padding: "0 .2em", fontSize: ".82em" }}>{num}</span>
      <span style={{ borderTop: "1.5px solid currentColor", padding: "0 .2em", fontSize: ".82em", width: "100%", textAlign: "center" }}>{den}</span>
    </span>
  );
}

/** 文字列を、分数だけ縦書きにしたReact要素に変換して表示する。 */
export default function MathText({ children, style, breakable = false }) {
  const s = children == null ? "" : String(children);
  if (!s) return <span style={style} />;

  const parts = [];
  let last = 0;
  let m;
  FRAC_RE.lastIndex = 0;
  let key = 0;
  while ((m = FRAC_RE.exec(s)) !== null) {
    const [whole, sign, num, den] = m;
    if (m.index > last) parts.push(breakable ? brk(s.slice(last, m.index)) : s.slice(last, m.index));
    if (sign) parts.push(sign);
    parts.push(<Frac key={key++} num={num} den={den} />);
    last = m.index + whole.length;
  }
  if (last < s.length) parts.push(breakable ? brk(s.slice(last)) : s.slice(last));

  return <span style={style}>{parts}</span>;
}
