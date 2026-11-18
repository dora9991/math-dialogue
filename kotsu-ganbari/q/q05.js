// 問5：回転移動（方眼の上で、点Oを中心に、時計まわりに90°）
import { P, seg, poly, path, txt, rt, geo, polar } from "../dsl.js";

// 方眼：1マス＝30。(c, r) ＝ 左上のかどから、右へ c マス・下へ r マス の交点
const G = (c, r) => [c * 30, r * 30];
const O = G(4, 7);                                 // 回転の中心
const A = G(3, 1), B = G(1, 5), C = G(3, 5);       // △ABC（印刷物を1マスずつ数えて読みとった）
// geo.rot は「画面で反時計まわり」が正。時計まわりに 90° ＝ -90°
const turn = (p) => geo.rot(p, O, -90).map(Math.round);
const A2 = turn(A), B2 = turn(B), C2 = turn(C);    // A′ B′ C′

const f1 = (n) => Math.round(n * 100) / 100;
// 点 X を、O を中心に時計まわりに X2 まで回す円弧（X から X2 へ向かってかかれる）＋矢じるし
function swing(id, X, X2, o = {}) {
  const r = f1(geo.dist(O, X));
  const u = [X2[0] - O[0], X2[1] - O[1]], L = Math.hypot(u[0], u[1]);
  const t = [-u[1] / L, u[0] / L], nn = [u[0] / L, u[1] / L];             // 時計まわりの向き／外向き
  const bx = X2[0] - t[0] * 11, by = X2[1] - t[1] * 11;
  return [
    path(`M${X[0]} ${X[1]}A${r} ${r} 0 0 1 ${X2[0]} ${X2[1]}`, { id, c: "p", w: 2.2, ...o }),
    path(`M${f1(bx + nn[0] * 5)} ${f1(by + nn[1] * 5)}L${X2[0]} ${X2[1]}L${f1(bx - nn[0] * 5)} ${f1(by - nn[1] * 5)}`, { id: id + "h", c: "p", w: 2.2, ...o }),
  ];
}
// O のまわりの「時計まわり」の矢じるし（短い円弧）
const ringFrom = polar(O, 26, 130), ringTo = polar(O, 26, 25);
const ring = swing("ring", [Math.round(ringFrom[0] * 100) / 100, Math.round(ringFrom[1] * 100) / 100], [Math.round(ringTo[0] * 100) / 100, Math.round(ringTo[1] * 100) / 100]);

export default {
  n: 5,
  title: "回転移動（Oを中心に時計まわり90°）",
  problem: "△ABC を点 O を中心に、時計の針の回転の方向に 90° 回転移動させた △A′B′C′ をかきなさい。",
  answer: "点Oから「右へ6・上へ1」の点が A′、「右へ2・上へ3」の点が B′、「右へ2・上へ1」の点が C′。この3点を結んだ △A′B′C′。（方眼の左上のかどから右へ・下へ数えて A′(10, 6)、B′(6, 4)、C′(6, 6)）",
  view: [-20, -10, 350, 330],
  grid: { x: 0, y: 0, nx: 10, ny: 10, s: 30 },
  steps: [
    {
      cap: "問題：△ABC を、点Oを中心に、時計の針と同じ向きに90°回した △A′B′C′ をかくよ。",
      add: [
        P("A", A[0], A[1], "A", "nw"), P("B", B[0], B[1], "B", "sw"), P("C", C[0], C[1], "C", "se"),
        seg("A", "B"), seg("B", "C"), seg("C", "A"),
        P("O", O[0], O[1], "O", "sw"),
      ],
    },
    {
      cap: "回転移動は、図形の**すべての点**を、中心Oのまわりに**同じ角度**だけ回すこと。頂点A、B、Cの行き先を決めよう。",
      add: [...ring, txt(O[0] + 40, O[1] + 50, "時計まわり", { id: "ringt", size: 16, c: "p" })],
      eq: ["## 考え方", "回転移動 ＝ 中心Oのまわりに、同じ角度だけ回す", "向き：時計の針と同じ（右まわり）", "角度：90°"],
    },
    {
      cap: "まず頂点Aから。Oから見て、Aは**左へ1・上へ6**の位置にあるよ。OAをひこう。",
      hide: ["ring", "ringh", "ringt"],
      add: [seg("O", "A", { id: "oa", w: 2.2 })],
      eq: ["## 頂点A", "OA：左へ 1、上へ 6"],
    },
    {
      cap: "時計まわりに90°回すと、向きは**左→上、上→右**にかわる。だから A′ は、Oから**上へ1・右へ6**だよ。",
      add: [
        ...swing("sa", A, A2), seg("O", A2, { id: "oa2", w: 2.2 }), rt("O", "A", A2, { id: "rta", s: 16, c: "p" }),
        P("A2", A2[0], A2[1], "A′", "ne"),
      ],
      eq: ["時計まわり90°：左→上、上→右、右→下、下→左", "OA′：上へ 1、右へ 6", "// OA ⊥ OA′、OA＝OA′"],
    },
    {
      cap: "頂点Bも同じ。OBは**左へ3・上へ2**。回すと**上へ3・右へ2**になって、B′が決まるよ。",
      hide: ["rta"],
      add: [
        seg("O", "B", { id: "ob", w: 2.2 }), ...swing("sb", B, B2), seg("O", B2, { id: "ob2", w: 2.2 }), rt("O", "B", B2, { id: "rtb", s: 16, c: "p" }),
        P("B2", B2[0], B2[1], "B′", "ne"),
      ],
      eq: ["## 頂点B", "OB：左へ 3、上へ 2", "→ OB′：上へ 3、右へ 2"],
    },
    {
      cap: "頂点Cも。OCは**左へ1・上へ2**。回すと**上へ1・右へ2**で、C′だね。",
      hide: ["rtb"],
      add: [
        seg("O", "C", { id: "oc", w: 2.2 }), ...swing("sc", C, C2), seg("O", C2, { id: "oc2", w: 2.2 }), rt("O", "C", C2, { id: "rtc", s: 16, c: "p" }),
        P("C2", C2[0], C2[1], "C′", "se"),
      ],
      eq: ["## 頂点C", "OC：左へ 1、上へ 2", "→ OC′：上へ 1、右へ 2"],
    },
    {
      cap: "A′、B′、C′を線でむすぼう。できた △A′B′C′ が答えだよ！",
      hide: ["rtc", "sa", "sah", "sb", "sbh", "sc", "sch"],
      add: [poly(["A2", "B2", "C2"], { id: "ans", c: "a", w: 3.2, fill: "a" })],
      eq: ["=> △A′B′C′（A′ B′ C′ をむすぶ）"],
      fin: true,
    },
    {
      cap: "確かめよう。もとの三角形は C が直角。回しても形は変わらないから、C′ も直角で、辺は 90° 回った向きになるよ。",
      add: [rt("C", "A", "B", { id: "rc", s: 14, c: "p" }), rt("C2", "A2", "B2", { id: "rc2", s: 14, c: "p" })],
      together: true,
      eq: ["## 確かめ", "CA（たて4）→ C′A′（横4）", "CB（横2）→ C′B′（たて2）", "// 90° 回しても、長さも形もかわらない"],
    },
  ],
};
