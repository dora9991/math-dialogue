// 数式エンジンのテスト: node lesson-live/test/math.test.js
const LM = require("../js/math.js");
let pass = 0, fail = 0;
function t(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else { fail++; console.log("NG:", name, "got", JSON.stringify(got), "want", JSON.stringify(want)); }
}
const ok = r => r.ok;
const why = r => (r.ok ? "ok" : r.why || "wrong");

// ---- 数の答え ----
t("num basic", ok(LM.gradeNum("-3", -3)), true);
t("num fullwidth", ok(LM.gradeNum("－３", -3)), true);
t("num IME minus", ok(LM.gradeNum("ー3", -3)), true);
t("num plus sign", ok(LM.gradeNum("+15", 15)), true);
t("num x=", ok(LM.gradeNum("x=-5", -5)), true);
t("num unit", ok(LM.gradeNum("12cm", 12)), true);
t("num unit2", ok(LM.gradeNum("4年後", 4)), true);
t("num unit3", ok(LM.gradeNum("21点", 21)), true);
t("num wrong", ok(LM.gradeNum("3", -3)), false);
t("num expr loophole", why(LM.gradeNum("(+5)+(-8)", -3)), "notLiteral");
t("num expr loophole2", why(LM.gradeNum("5-8", -3)), "notLiteral");
t("num frac", ok(LM.gradeNum("-5/6", "-5/6")), true);
t("num frac paren", ok(LM.gradeNum("-(5/6)", "-5/6")), true);
t("num frac unreduced", why(LM.gradeNum("-10/12", "-5/6")), "unreduced");
t("num frac den1", why(LM.gradeNum("4/1", 4)), "den1");
t("num decimal eq", ok(LM.gradeNum("0.6", "3/5")), true);
t("num decimal not exact", ok(LM.gradeNum("0.33", "1/3")), false);
t("num pi", ok(LM.gradeNum("12π", "12π")), true);
t("num pi cm2", ok(LM.gradeNum("12πcm²", "12π")), true);
t("num pi frac", ok(LM.gradeNum("500/3π", "500/3π")), true);
t("num pi frac2", ok(LM.gradeNum("(500/3)π", "500/3π")), true);
t("num pi decimal", ok(LM.gradeNum("37.68", "12π")), false);
t("num pi unreduced", why(LM.gradeNum("6/2π", "3π")), "unreduced");
t("num neg den", why(LM.gradeNum("5/-6", "-5/6")), "negDen");
t("num mixed garbage", why(LM.gradeNum("abc", 3)), "wrong");
t("num empty", why(LM.gradeNum("  ", 3)), "empty");
t("num percent", ok(LM.gradeNum("36%", 36)), true);
t("num degrees", ok(LM.gradeNum("80°", 80)), true);
t("num 0", ok(LM.gradeNum("0", 0)), true);
t("num -0.8", ok(LM.gradeNum("-0.8", -0.8)), true);
t("num .5", ok(LM.gradeNum("-.5", -0.5)), true);

// ---- 文字式（まとめた形） ----
t("lin 6x", ok(LM.gradeLin("6x", "6x")), true);
t("lin 1000-a", ok(LM.gradeLin("-a+1000", "1000-a")), true);
t("lin times", why(LM.gradeLin("6×x", "6x")), "timesSign");
t("lin unsimplified", why(LM.gradeLin("2(x+3)-x", "x+6")), "notMono");
t("lin like terms", why(LM.gradeLin("3x+2x", "5x")), "likeTerms");
t("lin const like", why(LM.gradeLin("x+2+4", "x+6")), "likeTerms");
t("lin coef1", why(LM.gradeLin("1x", "x")), "coef1");
t("lin -x", ok(LM.gradeLin("-x", "-x")), true);
t("lin -1x", why(LM.gradeLin("-1x", "-x")), "coef1");
t("lin frac coef", ok(LM.gradeLin("5/6y+1", "5/6y+1")), true);
t("lin frac coef2", ok(LM.gradeLin("(5/6)y+1", "5y/6+1")), true);
t("lin frac coef3", ok(LM.gradeLin("5y/6+1", "5/6y+1")), true);
t("lin frac unreduced", why(LM.gradeLin("2x/4", "x/2")), "unreduced");
t("lin y=", ok(LM.gradeLin("y=-5/2x", "y=-5/2x")), true);
t("lin y= omitted", ok(LM.gradeLin("-5/2x", "y=-5/2x")), true);
t("lin y=-2.5x", ok(LM.gradeLin("y=-2.5x", "y=-5/2x")), true);
t("lin inverse", ok(LM.gradeLin("y=-24/x", "y=-24/x")), true);
t("lin inverse wrong", ok(LM.gradeLin("y=24/x", "y=-24/x")), false);
t("lin x vs y lhs", ok(LM.gradeLin("x=3y", "y=3x")), false);
t("lin a^3b", ok(LM.gradeLin("a^3b", "a^3b")), true);
t("lin a³b", ok(LM.gradeLin("a³b", "a^3b")), true);
t("lin repeat", why(LM.gradeLin("aaab", "a^3b")), "repeatVar");
t("lin num after var", why(LM.gradeLin("ab5", "5ab")), "numAfterVar");
t("lin div sign", why(LM.gradeLin("y÷6", "y/6")), "divSign");
t("lin 3π+12", ok(LM.gradeLin("3π+12", "3π+12")), true);
t("lin 12+3π", ok(LM.gradeLin("12+3π", "3π+12")), true);
t("lin 3n+1", ok(LM.gradeLin("3n+1", "3n+1")), true);
t("lin 300x+y", ok(LM.gradeLin("y+300x", "300x+y")), true);
t("lin unit yen", ok(LM.gradeLin("300x+y円", "300x+y")), true);
t("lin unit cm", ok(LM.gradeLin("4a cm", "4a")), true);
t("lin 0.8a", ok(LM.gradeLin("0.8a", "4/5a")), true);
t("lin -3x+2", ok(LM.gradeLin("-3x+2", "-3x+2")), true);
t("lin 2-3x", ok(LM.gradeLin("2-3x", "-3x+2")), true);
t("lin wrong", ok(LM.gradeLin("3x+2", "-3x+2")), false);
t("lin 2n+1", ok(LM.gradeLin("2n+1", "2n+1")), true);
t("lin powNum", why(LM.gradeLin("2^2x", "4x")), "powNum");
t("expr lenient", ok(LM.gradeSub({ mode: "expr", a: "x+6" }, "2(x+3)-x")), true);

// ---- 表し方 ----
t("form 5ab", ok(LM.gradeForm("5ab", ["5ab"])), true);
t("form ba5", why(LM.gradeForm("5ba", ["5ab"])), "form");
t("form y/6", ok(LM.gradeForm("y/6", ["y/6", "1/6y", "(1/6)y"])), true);
t("form 1/6y", ok(LM.gradeForm("1/6y", ["y/6", "1/6y", "(1/6)y"])), true);
t("form times", ok(LM.gradeForm("3×x÷y", ["3×x÷y"])), true);
t("form times star", ok(LM.gradeForm("3*x÷y", ["3×x÷y"])), true);
t("form a²", ok(LM.gradeForm("a^2", ["a²"])), true);

// ---- 等式・不等式 ----
t("rel 4a=600", ok(LM.gradeRel("4a=600", "4a=600")), true);
t("rel swap", ok(LM.gradeRel("600=4a", "4a=600")), true);
t("rel y=3x+5", ok(LM.gradeRel("3x+5=y", "y=3x+5")), true);
t("rel ineq", ok(LM.gradeRel("2x+y>500", "2x+y>500")), true);
t("rel ineq flip", ok(LM.gradeRel("500<2x+y", "2x+y>500")), true);
t("rel ineq wrong dir", why(LM.gradeRel("2x+y<500", "2x+y>500")), "dir");
t("rel ineq ge", ok(LM.gradeRel("3a≦b", "3a≦b")), true);
t("rel ineq <=", ok(LM.gradeRel("3a<=b", "3a≦b")), true);
t("rel ineq strict vs non", ok(LM.gradeRel("3a<b", "3a≦b")), false);
t("rel notation", why(LM.gradeRel("a×4=600", "4a=600")), "timesSign");
t("rel scale no", ok(LM.gradeRel("8a=1200", "4a=600")), false);
t("rel scale yes", ok(LM.gradeRel("8a=1200", "4a=600", { scale: true })), true);
t("rel eq parens", ok(LM.gradeRel("120x+90(12-x)=1260", "120x+90(12-x)=1260", { scale: true, notSolved: true })), true);
t("rel eq simplified ok", ok(LM.gradeRel("30x+1080=1260", "120x+90(12-x)=1260", { scale: true, notSolved: true })), true);
t("rel eq solved", why(LM.gradeRel("x=6", "120x+90(12-x)=1260", { scale: true, notSolved: true })), "solved");
t("rel no op", why(LM.gradeRel("4a", "4a=600")), "solved");

// ---- 変域 ----
t("ineq x>3", ok(LM.gradeIneq("x>3", "x>3")), true);
t("ineq 3<x", ok(LM.gradeIneq("3<x", "x>3")), true);
t("ineq ≧", ok(LM.gradeIneq("x>=-5", "x≧-5")), true);
t("ineq two", ok(LM.gradeIneq("-2<x<=5", "-2<x≦5")), true);
t("ineq two wrong", why(LM.gradeIneq("-2≦x≦5", "-2<x≦5")), "dir");
t("ineq fullwidth", ok(LM.gradeIneq("－２＜ｘ≦５", "-2<x≦5")), true);
t("ineq wrong", ok(LM.gradeIneq("x<3", "x>3")), false);

// ---- 座標・並び ----
t("coord", ok(LM.gradeCoord("(3,-5)", [3, -5])), true);
t("coord no paren", ok(LM.gradeCoord("3,-5", [3, -5])), true);
t("coord label", ok(LM.gradeCoord("A(3，－5)", [3, -5])), true);
t("coord wrong", ok(LM.gradeCoord("(-5,3)", [3, -5])), false);
t("list", ok(LM.gradeList("-3,-1.5,0,2", [-3, -1.5, 0, 2], true)), true);
t("list order", why(LM.gradeList("2,0,-1.5,-3", [-3, -1.5, 0, 2], true)), "order");
t("set", ok(LM.gradeList("-4,4", [4, -4], false)), true);
t("set jp comma", ok(LM.gradeList("4、－4", [4, -4], false)), true);
t("set count", why(LM.gradeList("4", [4, -4], false)), "count");

// ---- ことば・素因数分解 ----
t("text", ok(LM.gradeText("ねじれの位置", ["ねじれの位置", "ねじれ"])), true);
t("text space", ok(LM.gradeText(" 直線 ", ["直線"])), true);
t("factor", ok(LM.gradeFactor("2^2×3×5", 60)), true);
t("factor sup", ok(LM.gradeFactor("2²×3×5", 60)), true);
t("factor order", ok(LM.gradeFactor("5×3×2^2", 60)), true);
t("factor noexp", why(LM.gradeFactor("2×2×3×5", 60)), "useExp");
t("factor notprime", why(LM.gradeFactor("4×3×5", 60)), "notPrime");
t("factor wrong", ok(LM.gradeFactor("2^2×3×7", 60)), false);

// ---- 表示 ----
t("toHTML frac", /class="frac"/.test(LM.toHTML("-2/3x")), true);
t("rich", LM.richText("計算しよう $(+5)+(-8)$").includes("−"), true);
t("preview err", LM.preview("(3+2", "num").err, "かっこが閉じていません");
t("preview bad char", !!LM.preview("3#", "num").err, true);
t("preview ok", LM.preview("-5/6", "num").err, null);

console.log(`math: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
