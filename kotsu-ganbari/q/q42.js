// 問42：正八面体の展開図（辺・面・頂点の対応）
import { P, seg, poly, txt, dot } from "../dsl.js";

// コマの長さ（ms）：字幕を読む時間をみて、すこし短めにする
const withDur = (steps) => steps.map((s) => ({ dur: Math.min(12500, Math.round(1500 + s.cap.length * 105 + (s.eq || []).length * 350 + Math.min((s.add || []).length, 5) * 150)), ...s }));

// ── 展開図（正三角形の1辺 a）─────────────────────────────
const a = 66, h = (a * Math.sqrt(3)) / 2, bx = 30, by = 125;
const N = {
  B: [bx, by], J: [bx + a, by], I: [bx + 2 * a, by], H: [bx + 3 * a, by],
  C: [bx + a / 2, by + h], D: [bx + 1.5 * a, by + h], E: [bx + 2.5 * a, by + h], G: [bx + 3.5 * a, by + h],
  A: [bx + a / 2, by - h], F: [bx + 3 * a, by + 2 * h],
};
const FACE = {
  ア: ["A", "B", "J"], イ: ["B", "J", "C"], ウ: ["J", "C", "D"], エ: ["J", "D", "I"],
  オ: ["I", "D", "E"], カ: ["I", "E", "H"], キ: ["H", "E", "G"], ク: ["E", "G", "F"],
};
const cen = (f) => FACE[f].map((v) => N[v]).reduce((s, p) => [s[0] + p[0] / 3, s[1] + p[1] / 3], [0, 0]);

// ── 立体（正八面体）。頂点は ±x, ±y, ±z に置いて、展開図の頂点をわりあてる ─────
// 展開図の頂点 → 立体の頂点（3次元で折りたたんで確かめた対応）
//   J＝手前(j)、C・G＝右(x)、D・F＝上(z)、B・H＝下(nz)、A・I＝左(nx)、E＝うしろ(y)
const SV = { J: "j", C: "x", G: "x", D: "z", F: "z", B: "nz", H: "nz", A: "nx", I: "nx", E: "y" };
const COL = { j: "#e0383e", x: "#2b6fdc", z: "#0b8f73", nz: "#12a5c4", nx: "#8a4bd8", y: "#c98a00" };
const Oc = [395, 150], R = 64;
const ca = Math.cos((40 * Math.PI) / 180), sa = Math.sin((40 * Math.PI) / 180);
const pr3 = ([x, y, z]) => [Oc[0] + R * (x + 0.5 * y * ca), Oc[1] - R * (z + 0.5 * y * sa)];
const P3 = { j: pr3([0, -1, 0]), y: pr3([0, 1, 0]), x: pr3([1, 0, 0]), nx: pr3([-1, 0, 0]), z: pr3([0, 0, 1]), nz: pr3([0, 0, -1]) };
const keys = Object.keys(P3);
const opp = { j: "y", y: "j", x: "nx", nx: "x", z: "nz", nz: "z" };
const edges3 = [];
for (let i = 0; i < keys.length; i++) for (let k = i + 1; k < keys.length; k++) if (opp[keys[i]] !== keys[k]) edges3.push([keys[i], keys[k]]);
const octa = edges3.map(([p, q]) => seg(P3[p], P3[q], { c: "g", dash: p === "y" || q === "y", id: `o_${p}_${q}` }));

// ── 部品 ─────────────────────────────────────
const netFill = (f, fill = "y", fo = 0.4) => poly(FACE[f].map((v) => N[v]), { fill, w: 0, fo, id: `nf${f}${fill}` });
const solFill = (f, fill = "y", fo = 0.45, id) => poly(FACE[f].map((v) => P3[SV[v]]), { fill, w: 0, fo, id: id || `sf${f}${fill}` });
const nd = (v) => dot(N[v][0], N[v][1], { r: 6, c: COL[SV[v]], id: `nd${v}` });
const lpos = { j: "sw", y: "ne", x: "e", nx: "w", z: "n", nz: "s" };
const v3 = (k, label, id) => P(id, P3[k][0], P3[k][1], label, lpos[k], { c: COL[k], r: 5.5 });
const netEdge = (u, v, id) => seg(u, v, { c: "a", w: 3.5, id });
const solEdge = (p, q, id) => seg(P3[p], P3[q], { c: "a", w: 3.5, id });
const axis = (p, q, id) => seg(P3[p], P3[q], { c: "k", dash: "2 5", w: 2, id });
const allNetFills = ["ア", "イ", "ウ", "エ", "オ", "カ", "キ", "ク"].map((f) => `nf${f}y`);

// 検算：展開図の三角形がどれも、立体の「となりあう3頂点」になっている（向かい合う頂点を2つ含まない）
for (const f of Object.keys(FACE)) {
  const ks = FACE[f].map((v) => SV[v]);
  console.assert(new Set(ks).size === 3 && !ks.some((k) => ks.includes(opp[k])), `面${f}がおかしい`);
}

export default {
  n: 42,
  title: "正八面体の展開図",
  problem: "右の図は、正八面体の展開図である。この展開図を組み立ててできる正八面体について、次の問いに答えなさい。\n(1) 辺CDに重なる辺はどれか答えなさい。\n(2) 点Aに集まるすべての面を答えなさい。\n(3) 面イと平行になる面はどれか答えなさい。",
  answer: "(1) 辺FG（辺GF）　(2) 面ア・面エ・面オ・面カ　(3) 面オ",
  view: [0, 0, 540, 300],
  steps: withDur([
    {
      cap: "問題：正八面体の展開図だよ。組み立てて、(1)辺CDに重なる辺、(2)点Aに集まる面、(3)面イと平行な面を答えよう。",
      add: [
        ...Object.entries({ A: "n", B: "w", J: "ne", I: "n", H: "n", C: "s", D: "s", E: "s", G: "e", F: "s" }).map(([k, pos]) => P(k, N[k][0], N[k][1], k, pos, { dot: false, ...(pos === "s" ? { dy: 21 } : {}) })),
        // 外のふち（実線）
        seg("A", "B"), seg("A", "J"), seg("B", "C"), seg("C", "D"), seg("D", "E"), seg("E", "F"), seg("F", "G"), seg("G", "H"), seg("H", "I"), seg("I", "J"),
        // 内がわの折り目（点線）
        seg("B", "J", { dash: true }), seg("J", "C", { dash: true }), seg("J", "D", { dash: true }), seg("I", "D", { dash: true }),
        seg("I", "E", { dash: true }), seg("H", "E", { dash: true }), seg("E", "G", { dash: true }),
        ...Object.keys(FACE).map((f) => txt(cen(f)[0], cen(f)[1] + 5, f, { bold: false })),
      ],
    },
    {
      cap: "展開図を組み立てると**正八面体**。正三角形の面が8枚で、頂点は**6つ**。でも展開図の頂点の名前は10個。同じ頂点が重なっているよ。",
      add: octa,
      eq: ["## 正八面体", "面：正三角形が 8 枚", "頂点：6 つ", "展開図の名前：A〜J の 10 個", "→ 同じ頂点に2つの名前がつく所がある"],
    },
    {
      cap: "まず面**ウ**（J, C, D）を、立体の手前の面にするよ。J、C、D の3つの頂点に、**3色**をつけよう。",
      add: [netFill("ウ"), solFill("ウ", "y", 0.45, "sfウ"), nd("J"), nd("C"), nd("D"), v3("j", "J", "vj"), v3("x", "C", "vx"), v3("z", "D", "vz")],
      eq: ["## 組み立てる順", "① ウ：J、C、D"],
    },
    {
      cap: "次は面**イ**（B, J, C）。ウと**辺JC**でくっつくよ。辺JCをはさんで、D と B は上と下。**向かい合う頂点**だね。",
      hide: ["sfウ"],
      add: [netFill("イ"), solFill("イ", "y", 0.45, "sfイ"), netEdge("J", "C", "e1"), solEdge("j", "x", "e1s"), axis("z", "nz", "ax1"), nd("B"), v3("nz", "B", "vnz")],
      hl: ["e1", "e1s"],
      eq: ["② イ：B（D の向かい側）"],
    },
    {
      cap: "面**エ**（J, D, I）は、ウと**辺JD**でくっつくよ。C と I が向かい合う頂点。I は左はしの頂点（紫）になるね。",
      hide: ["sfイ", "e1", "e1s"],
      add: [netFill("エ"), solFill("エ", "y", 0.45, "sfエ"), netEdge("J", "D", "e2"), solEdge("j", "z", "e2s"), axis("x", "nx", "ax2"), nd("I"), v3("nx", "I", "vnx")],
      hl: ["e2", "e2s"],
      eq: ["③ エ：I（C の向かい側）"],
    },
    {
      cap: "面**ア**（A, B, J）は、イと**辺BJ**でくっつくよ。イの C と向かい合うのは A。だから A は I と**同じ頂点**（紫）だ！",
      hide: ["sfエ", "e2", "e2s", "vnx"],
      add: [netFill("ア"), solFill("ア", "y", 0.45, "sfア"), netEdge("B", "J", "e3"), solEdge("nz", "j", "e3s"), nd("A"), v3("nx", "A・I", "vnx2")],
      hl: ["e3", "e3s"],
      eq: ["④ ア：A（C の向かい側）", "→ A ＝ I"],
    },
    {
      cap: "面**オ**（I, D, E）は、エと**辺ID**でくっつくよ。エの J と向かい合うのが E。E は一番うしろの頂点（黄）だね。",
      hide: ["sfア", "e3", "e3s"],
      add: [netFill("オ"), solFill("オ", "y", 0.45, "sfオ"), netEdge("I", "D", "e4"), solEdge("nx", "z", "e4s"), axis("j", "y", "ax3"), nd("E"), v3("y", "E", "vy")],
      hl: ["e4", "e4s"],
      eq: ["⑤ オ：E（J の向かい側）"],
    },
    {
      cap: "面**カ**（I, E, H）は、オと**辺IE**でくっつくよ。オの D と向かい合うのが H。だから H は B と同じ頂点（水色）。",
      hide: ["sfオ", "e4", "e4s", "vnz"],
      add: [netFill("カ"), solFill("カ", "y", 0.45, "sfカ"), netEdge("I", "E", "e5"), solEdge("nx", "y", "e5s"), nd("H"), v3("nz", "B・H", "vnz2")],
      hl: ["e5", "e5s"],
      eq: ["⑥ カ：H（D の向かい側）", "→ H ＝ B"],
    },
    {
      cap: "面**キ**（H, E, G）は、カと**辺HE**でくっつくよ。カの I と向かい合うのが G。だから G は C と同じ頂点（青）だよ。",
      hide: ["sfカ", "e5", "e5s", "vx"],
      add: [netFill("キ"), solFill("キ", "y", 0.45, "sfキ"), netEdge("H", "E", "e6"), solEdge("nz", "y", "e6s"), nd("G"), v3("x", "C・G", "vx2")],
      hl: ["e6", "e6s"],
      eq: ["⑦ キ：G（I の向かい側）", "→ G ＝ C"],
    },
    {
      cap: "最後の面**ク**（E, G, F）は、キと**辺EG**でくっつくよ。キの H と向かい合うのが F。だから F は D と同じ頂点（緑）だね。",
      hide: ["sfキ", "e6", "e6s", "vz"],
      add: [netFill("ク"), solFill("ク", "y", 0.45, "sfク"), netEdge("E", "G", "e7"), solEdge("y", "x", "e7s"), nd("F"), v3("z", "D・F", "vz2")],
      hl: ["e7", "e7s"],
      eq: ["⑧ ク：F（H の向かい側）", "→ F ＝ D"],
    },
    {
      cap: "これで8枚の面がそろったよ。**同じ色 ＝ 同じ頂点**。立体の頂点は、J、C＝G、D＝F、E、A＝I、B＝H の6つ！",
      hide: [...allNetFills, "sfク", "e7", "e7s", "ax1", "ax2", "ax3"],
      eq: ["## 同じ頂点", "C ＝ G　　D ＝ F", "A ＝ I　　B ＝ H", "J と E は1つだけ"],
    },
    {
      cap: "(1) 辺CDに重なる辺。C は G と、D は F と同じ頂点だから、辺CD は**辺GF**と重なるよ。",
      add: [netEdge("C", "D", "k1"), netEdge("F", "G", "k2"), solEdge("x", "z", "k3")],
      hl: ["k1", "k2", "k3"],
      eq: ["## (1)", "C ＝ G、D ＝ F", "=> (1) 辺FG（辺GF）"],
    },
    {
      cap: "(2) 点Aに集まる面。A は I と同じ頂点だから、A か I をふくむ面を探すよ。ア、エ、オ、カの**4つ**だね。",
      hide: ["k1", "k2", "k3"],
      add: [
        netFill("ア", "p", 0.35), netFill("エ", "p", 0.35), netFill("オ", "p", 0.35), netFill("カ", "p", 0.35),
        solFill("ア", "p", 0.35), solFill("エ", "p", 0.35), solFill("オ", "p", 0.35), solFill("カ", "p", 0.35),
      ],
      together: true,
      eqClear: true,
      eq: ["## (2)", "A ＝ I だから、A か I をふくむ面", "ア（A）、エ（I）、オ（I）、カ（I）", "// 正八面体は、1つの頂点に面が4つ集まる", "=> (2) 面ア・エ・オ・カ"],
    },
    {
      cap: "(3) 面イと平行な面。イの頂点 B、J、C と向かい合うのは、D、E、A(＝I)。この3つをもつ面が**オ**だよ。",
      hide: ["nfアp", "nfエp", "nfオp", "nfカp", "sfアp", "sfエp", "sfオp", "sfカp"],
      add: [netFill("イ", "a", 0.35), netFill("オ", "a", 0.35), solFill("イ", "a", 0.35), solFill("オ", "a", 0.35)],
      together: true,
      eqClear: true,
      eq: ["## (3)", "イ：B、J、C", "向かい合う頂点：D、E、A（＝I）", "→ 面オ（I、D、E）", "// 共通の頂点がない面どうしが平行"],
    },
    {
      cap: "答え：(1) 辺**FG**、(2) 面**ア・エ・オ・カ**、(3) 面**オ**。向かい合う頂点を使うと、立体を思いうかべやすいよ！",
      eq: ["=> (1) 辺FG　(2) ア・エ・オ・カ　(3) オ"],
      fin: true,
    },
  ]),
};
