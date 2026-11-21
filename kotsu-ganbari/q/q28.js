// 問28：円柱と円錐を重ねた立体の表面積
import { P, seg, ell, arc, poly, path, txt, dot, arrow, polar } from "../dsl.js";

const f = (v) => Math.round(v * 10) / 10;
const S = 24;                                   // 1cm ＝ 24
const r = 3 * S, H = 3 * S, RY = 14;             // 半径 3cm、円柱の高さ 3cm
const hc = Math.sqrt(8 * 8 - 3 * 3) * S;         // 円錐の高さ（母線8cm、半径3cm から）
const cx = 195, yt = 205;                        // 円柱の上の円の中心
const Ct = [cx, yt], Cb = [cx, yt + H], Ta = [cx, f(yt - hc)];
const Lt = [cx - r, yt], Rt = [cx + r, yt], Lb = [cx - r, yt + H], Rb = [cx + r, yt + H];

// 点線の「寸法の弧」（a→b、bulge＝ふくらみ。進む向きの左が＋）
function dim(id, a, b, bulge, label, o = {}) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), n = [dy / L, -dx / L];
  const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const c = [m[0] + n[0] * bulge * 2, m[1] + n[1] * bulge * 2];
  const pk = o.lab || [m[0] + n[0] * bulge, m[1] + n[1] * bulge];
  const els = [path(`M${f(a[0])} ${f(a[1])}Q${f(c[0])} ${f(c[1])} ${f(b[0])} ${f(b[1])}`, { id, dash: true, c: "g" })];
  if (label) els.push(txt(pk[0], pk[1] + 5, label, { id: id + "t", size: 16, c: "g", anchor: o.anchor || "middle" }));
  return els;
}

const solidEls = [
  P("T", Ta[0], Ta[1], "", "n", { dot: false }), P("Lt", Lt[0], Lt[1], "", "w", { dot: false }), P("Rt", Rt[0], Rt[1], "", "e", { dot: false }),
  P("Lb", Lb[0], Lb[1], "", "w", { dot: false }), P("Rb", Rb[0], Rb[1], "", "e", { dot: false }),
  seg("T", "Lt", { id: "s_cl", c: "g" }), seg("T", "Rt", { id: "s_cr", c: "g" }),
  ell(Ct, r, RY, 0, 180, { id: "s_tb", c: "g", dash: true }), ell(Ct, r, RY, 180, 360, { id: "s_tf", c: "g" }),
  seg("Lt", "Lb", { id: "s_l", c: "g" }), seg("Rt", "Rb", { id: "s_r", c: "g" }),
  ell(Cb, r, RY, 0, 180, { id: "s_bb", c: "g", dash: true }), ell(Cb, r, RY, 180, 360, { id: "s_bf", c: "g" }),
  seg(Cb, Rb, { id: "s_rad", c: "g", w: 2 }), dot(Cb[0], Cb[1], { id: "s_ctr", c: "g", r: 4 }),
  ...dim("s8", Ta, Rt, 30, "8 cm"),
  ...dim("s3h", Rt, Rb, 26, "3 cm", { anchor: "start", lab: [Rt[0] + 36, (Rt[1] + Rb[1]) / 2] }),
  ...dim("s3r", Cb, Rb, -9, ""),
  path(`M${f(cx + r / 2)} ${f(Cb[1] + 11)}Q${f(cx + r / 2 + 6)} ${f(Cb[1] + 40)} ${f(Rb[0] + 6)} ${f(Cb[1] + 45)}`, { id: "s3rl", c: "g", w: 1.6 }),
  txt(Rb[0] + 12, Cb[1] + 51, "3 cm", { id: "s3rt", size: 16, c: "g", anchor: "start" }),
];
const SOLID_IDS = solidEls.filter((e) => e.id).map((e) => e.id);

// 面ごとの色ぬり
const ep = (c, rx, ry) => `M${f(c[0] - rx)} ${f(c[1])}A${rx} ${ry} 0 1 0 ${f(c[0] + rx)} ${f(c[1])}A${rx} ${ry} 0 1 0 ${f(c[0] - rx)} ${f(c[1])}Z`;
const coneSide = `M${Ta[0]} ${Ta[1]}L${Lt[0]} ${Lt[1]}A${r} ${RY} 0 0 0 ${Rt[0]} ${Rt[1]}Z`;
const cylSide = `M${Lt[0]} ${Lt[1]}L${Lb[0]} ${Lb[1]}A${r} ${RY} 0 0 0 ${Rb[0]} ${Rb[1]}L${Rt[0]} ${Rt[1]}A${r} ${RY} 0 0 1 ${Lt[0]} ${Lt[1]}Z`;

// 展開図（1cm ＝ 13）
const U = 13;
const A0 = [240, 24], R8 = 8 * U;
const E1 = polar(A0, R8, 202.5), E2 = polar(A0, R8, 337.5);     // 中心角 135°
const W = 2 * Math.PI * 3 * U, Hr = 3 * U;                         // 長方形：よこ 6π、たて 3
const rx0 = 240 - W / 2, ry0 = 175;
const Cc = [240, 300], Rc = 3 * U;

export default {
  n: 28,
  title: "円柱と円錐を重ねた立体の表面積",
  problem: "右の図は、円柱と円錐を重ねた立体である。この立体の表面積を求めなさい。",
  answer: "51π cm²（円錐の側面 24π ＋ 円柱の側面 18π ＋ 円柱の底の円 9π）",
  view: [0, 0, 480, 360],
  steps: [
    {
      cap: "円柱と円錐を重ねた立体の**表面積**を求めるよ。外がわに出ている面を、ぜんぶたそう。",
      add: solidEls,
    },
    {
      cap: "表面になるのは、① 円錐の**側面**、② 円柱の**側面**、③ 円柱の**底**の円の、3つだよ。",
      add: [
        path(coneSide, { id: "f_cone", fill: "y", w: 0 }),
        path(cylSide, { id: "f_cyl", fill: "b", w: 0 }),
        path(ep(Cb, r, RY), { id: "f_bot", fill: "p", w: 0 }),
        txt(cx, Ta[1] + 100, "①", { id: "n1", size: 18, c: "g" }),
        txt(cx, yt + 42, "②", { id: "n2", size: 18, c: "g" }),
        txt(cx - 26, Cb[1] + 6, "③", { id: "n3", size: 18, c: "g" }),
      ],
      together: true,
      eq: ["## 表面になる面", "① 円錐の側面", "② 円柱の側面", "③ 円柱の底の円"],
    },
    {
      cap: "円錐の底面と円柱の上の面は、ぴったり重なって**外に出ない**。ここは数えないよ！",
      add: [
        path(ep(Ct, r, RY), { id: "f_top", fill: "hatch", w: 0 }),
        arrow([cx - 120, 168], [cx - 70, 200], { id: "ov_ar", c: "a", w: 2 }),
        txt(cx - 170, 160, "重なる円", { id: "ov_t", size: 16, c: "a", anchor: "start" }),
      ],
      eq: ["// 重なる2つの円は、表面積に入れない"],
    },
    {
      cap: "① 円錐の側面を開くと**おうぎ形**。半径は母線の 8cm、弧の長さは底の円周 2π × 3 ＝ 6π cm だよ。",
      hide: [...SOLID_IDS, "f_cone", "f_cyl", "f_bot", "f_top", "ov_ar", "ov_t", "n1", "n2", "n3"],
      add: [
        arc(A0, R8, 202.5, 337.5, { id: "n_sec", fill: "y" }),
        seg(A0, E1, { id: "n_r1" }), seg(A0, E2, { id: "n_r2" }),
        txt(180, 34, "母線 8cm", { id: "n_rt", size: 16, c: "g", anchor: "end" }),
        txt(240, A0[1] + R8 + 24, "弧の長さ 6π cm", { id: "n_at", size: 16, c: "g" }),
      ],
      eqClear: true,
      eq: ["## ① 円錐の側面（おうぎ形）", "弧の長さ ＝ 底の円周 ＝ 2π × 3 ＝ 6π (cm)"],
    },
    {
      cap: "半径 8cm の円の円周は 2π × 8 ＝ 16π。弧は 6π だから、円全体の [[6π|16π]] ＝ [[3|8]] だね。",
      hl: ["n_sec"],
      eq: ["半径 8cm の円周 ＝ 2π × 8 ＝ 16π", "割合 ＝ [[6π|16π]] ＝ [[3|8]]"],
    },
    {
      cap: "面積は、半径 8cm の円の面積 π × 8² ＝ 64π の [[3|8]]。64π × [[3|8]] ＝ 24π だよ。",
      eq: ["① ＝ π × 8^{2} × [[3|8]]", "＝ 64π × [[3|8]]", "＝ 24π (cm²)", "// 近道：π × 母線 × 半径 ＝ π × 8 × 3 ＝ 24π"],
    },
    {
      cap: "② 円柱の側面は**長方形**。たては高さ 3cm、よこは底の円周 6π cm だよ。",
      add: [
        poly([[rx0, ry0], [rx0 + W, ry0], [rx0 + W, ry0 + Hr], [rx0, ry0 + Hr]], { id: "n_rect", fill: "b" }),
        txt(rx0 - 8, ry0 + Hr / 2 + 5, "たて 3cm", { id: "n_ht", size: 16, c: "g", anchor: "end" }),
        txt(240, ry0 + Hr + 26, "よこ 6π cm（底の円周）", { id: "n_wt", size: 16, c: "g" }),
      ],
      eq: ["## ② 円柱の側面（長方形）", "3 × 6π ＝ 18π (cm²)"],
    },
    {
      cap: "③ 円柱の底の円は、半径 3cm。面積は π × 3² ＝ 9π だね。",
      add: [
        arc(Cc, Rc, 0, 360, { id: "n_circ", fill: "p" }),
        txt(Cc[0] + Rc + 12, Cc[1] + 5, "半径 3cm", { id: "n_ct", size: 16, c: "g", anchor: "start" }),
      ],
      eq: ["## ③ 底の円", "π × 3^{2} ＝ 9π (cm²)"],
    },
    {
      cap: "表面積 ＝ ① ＋ ② ＋ ③ ＝ 24π ＋ 18π ＋ 9π ＝ **51π cm²** だよ。",
      hl: ["n_sec", "n_rect", "n_circ"],
      eq: ["## 表面積", "24π ＋ 18π ＋ 9π", "＝ 51π", "=> 表面積 51π cm²"],
      fin: true,
    },
    {
      cap: "確かめ。円錐まるごと 33π と円柱まるごと 36π をたして、重なる2つの円 18π をひいても 51π だね。",
      eq: ["## 確かめ", "円錐まるごと ＝ 24π ＋ 9π ＝ 33π", "円柱まるごと ＝ 18π ＋ 9π × 2 ＝ 36π", "33π ＋ 36π − 9π × 2 ＝ 51π ✓"],
    },
  ],
};
