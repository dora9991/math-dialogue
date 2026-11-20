// texplain.mjs — ikkan の問題の数式（TeX）を、コツコツくんの固定問題と同じ「平文」（²・³・π・÷・×）に直す。
// コツコツくんの固定問題（J1 の DB 問題）は、$ や \ を使わず、² ³ π で書かれている。
const wrap = (a) => (/[+\-−×÷ ]/.test(a.trim()) ? `(${a.trim()})` : a.trim());

function mathPlain(m) {
  let x = m;
  for (let i = 0; i < 4; i++) x = x.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, a, b) => `${wrap(a)}/${wrap(b)}`);
  x = x.replace(/\\times/g, "×").replace(/\\div/g, "÷").replace(/\\pi/g, "π").replace(/\\ell/g, "ℓ")
    .replace(/\^2/g, "²").replace(/\^3/g, "³").replace(/\\[,;! ]/g, " ").replace(/[{}]/g, "")
    .replace(/\s*([×÷])\s*/g, " $1 ").replace(/ {2,}/g, " ").trim();   // × ÷ の前後は、半角あき1つにそろえる
  return x;
}

/** 文の中の $...$ を平文にする（それ以外はそのまま） */
export function plain(s) {
  return String(s).replace(/\$([^$]*)\$/g, (_, m) => mathPlain(m));
}

/** 平文に直したあとに、TeX の残りが無いか（無ければ null、あれば残りの断片） */
export function leftover(s) {
  const m = String(s).match(/[$\\^{}]/);
  return m ? String(s).slice(Math.max(0, m.index - 12), m.index + 12) : null;
}
