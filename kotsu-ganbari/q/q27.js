// 問27：円錐の体積（公式の問題の見本）
import { P, seg, ell, txt } from "../dsl.js";

// 円錐をかく（底面の中心 (cx,cy)、横の半径 rx、たての半径 ry、高さ h）
function cone(id, cx, cy, rx, ry, h) {
  return [
    ell([cx, cy], rx, ry, 0, 180, { id: id + "b", dash: true, c: "g" }),     // 底面のうしろ側（点線）
    ell([cx, cy], rx, ry, 180, 360, { id: id + "f", c: "g" }),               // 底面のまえ側
    P(id + "T", cx, cy - h, "", "n", { dot: false }),
    P(id + "L", cx - rx, cy, "", "w", { dot: false }),
    P(id + "R", cx + rx, cy, "", "e", { dot: false }),
    seg(id + "T", id + "L", { id: id + "sl", c: "g" }),
    seg(id + "T", id + "R", { id: id + "sr", c: "g" }),
  ];
}
const ids = (id) => [id + "b", id + "f", id + "sl", id + "sr", id + "r", id + "h", id + "rt", id + "ht"];

export default {
  n: 27,
  title: "円錐の体積",
  problem: "次のような円錐の体積を求めなさい。\n(1) 底面の半径が 9 cm、高さが 2 cm\n(2) 底面の直径が 6 cm、高さが 3 cm",
  answer: "(1) 54π cm³　(2) 9π cm³",
  view: [0, 0, 400, 260],
  steps: [
    {
      cap: "円錐の体積を求める問題だよ。(1)と(2)、1つずつやっていこう。",
      add: [...cone("a", 200, 190, 120, 26, 56),
        seg([200, 190], "aR", { id: "ar", c: "b", w: 2.5 }), txt(262, 207, "9cm", { id: "art", size: 16, c: "b" }),
        seg("aT", [200, 190], { id: "ah", c: "b", w: 2.5, dash: true }), txt(190, 172, "2cm", { id: "aht", size: 16, c: "b", anchor: "end" })],
    },
    {
      cap: "円錐の体積は、**底面積 × 高さ × [[1|3]]**。(柱の体積の3分の1だよ。)",
      eq: ["## 円錐の体積の公式", "V ＝ [[1|3]] × π × r^{2} × h", "// r：底面の半径　h：高さ"],
    },
    {
      cap: "(1) 半径 r＝**9** cm、高さ h＝**2** cm。公式に当てはめよう。",
      hl: ["ar", "ah"],
      eq: ["## (1)", "V ＝ [[1|3]] × π × 9^{2} × 2"],
    },
    {
      cap: "9² ＝ 81。そして [[1|3]] × 81 × 2 ＝ 54 だね。",
      eq: ["＝ [[1|3]] × π × 81 × 2", "＝ 54π", "=> (1) 54π cm³"],
    },
    {
      cap: "(2) 円錐を、(2)の形にかきかえるよ。",
      hide: ["ab", "af", "asl", "asr", "ar", "art", "ah", "aht"],
      eqClear: true,
      add: [...cone("b", 200, 200, 70, 20, 90),
        seg("bL", "bR", { id: "bd", c: "b", w: 2.5 }), txt(200, 238, "直径 6cm", { id: "bdt", size: 16, c: "b" }),
        seg("bT", [200, 200], { id: "bh", c: "b", w: 2.5, dash: true }), txt(190, 160, "3cm", { id: "bht", size: 16, c: "b", anchor: "end" })],
      eq: ["## (2)"],
    },
    {
      cap: "ここが**ひっかけ**！ 与えられたのは**直径** 6cm。公式の r は**半径**だから、6 ÷ 2 ＝ **3** cm だよ。",
      hl: ["bd"],
      eq: ["半径 ＝ 6 ÷ 2 ＝ 3 cm"],
    },
    {
      cap: "半径 3cm、高さ 3cm を公式に入れて計算しよう。",
      eq: ["V ＝ [[1|3]] × π × 3^{2} × 3", "＝ [[1|3]] × π × 9 × 3", "＝ 9π", "=> (2) 9π cm³"],
      fin: true,
    },
  ],
};
