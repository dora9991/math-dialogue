/* データの整え方・点検の検査。使い方：node conference-editor/test/schema.js */
"use strict";
const S = require("../js/schema.js");
let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log("✗", m); } else if (process.env.VERBOSE) console.log("✓", m); };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), m + "  期待 " + JSON.stringify(b) + " 実際 " + JSON.stringify(a));

// ---- 日付・URL ----
eq(S.isoDate("2027-03-06"), "2027-03-06", "正しい日付");
eq(S.isoDate("2027-02-30"), "", "存在しない日付は空");
eq(S.isoDate("2027/03/06"), "", "区切りが違う日付は空");
eq(S.isoDate(20270306), "", "文字列でない日付は空");
eq(S.jpDate("2027-03-06"), "2027年3月6日", "日本語の日付");
eq(S.jpDate(""), "", "空の日付");
eq(S.safeUrl("https://note.com/zenrekiken"), "https://note.com/zenrekiken", "https は通す");
eq(S.safeUrl("http://example.com/a?b=1"), "http://example.com/a?b=1", "http は通す");
eq(S.safeUrl("javascript:alert(1)"), "", "javascript: は空");
eq(S.safeUrl("data:text/html,<script>1</script>"), "", "data: は空");
eq(S.safeUrl("//evil.example"), "", "スキームなしは空");
eq(S.safeUrl('https://a.example/"onmouseover="x'), "", "引用符を含むURLは空");
eq(S.safeUrl("https://a.example/ b"), "", "空白を含むURLは空");

// ---- お知らせ ----
const news = [
  { date: "2027-03-06", text: "  本文  ", url: "https://example.com" },
  { date: "bad", text: "日付が不正", url: "javascript:alert(1)" },
  { date: "", text: "", url: "" }
];
eq(S.normalize("news", news, false).length, 3, "下書きは空の行も残す");
eq(S.normalize("news", news, true).length, 2, "公開用は本文が空の行を除く");
eq(S.normalize("news", news, true)[0], { date: "2027-03-06", text: "本文", url: "https://example.com" }, "前後の空白を削る");
eq(S.normalize("news", news, true)[1], { date: "", text: "日付が不正", url: "" }, "不正な日付・URLは空にする");
eq(S.normalize("news", "文字列", false), [], "配列でなければ空");
eq(S.normalize("news", [null, 1, "x", {}], false).length, 4, "壊れた要素があっても落ちない");
eq(S.normalize("news", Array.from({ length: 500 }, () => ({ text: "x" })), false).length, S.LIMITS.items, "件数の上限");
eq(S.normalize("news", [{ text: "あ".repeat(5000) }], false)[0].text.length, S.LIMITS.long, "文字数の上限");
eq(S.normalize("nothing", [1], false), [], "不明な key は空");

// ---- 大会概要 ----
const ov = [{ k: "会場", v: "【調整中】" }, { k: "主催", v: "" }, { k: "", v: "項目名なし" }];
eq(S.normalize("overview", ov, true), [{ k: "会場", v: "【調整中】" }], "公開用は項目名か内容が空の行を除く");
eq(S.normalize("overview", ov, false).length, 3, "下書きは残す");

// ---- プログラム ----
const pg = [
  { label: "1日目", sub: "総会", items: [{ time: "9:30", text: "受付" }, { time: "", text: "" }] },
  { label: "", sub: "", items: [{ time: "1", text: "見出しなしの日" }] },
  { label: "3日目", items: "壊れた" }
];
eq(S.normalize("program", pg, true), [{ label: "1日目", sub: "総会", items: [{ time: "9:30", text: "受付" }] }, { label: "3日目", sub: "", items: [] }], "公開用は空の項目・見出しなしの日を除く");
eq(S.normalize("program", pg, false).length, 3, "下書きは残す");
eq(S.normalize("program", Array.from({ length: 50 }, () => ({ label: "x", items: [] })), false).length, S.LIMITS.days, "日数の上限");

// ---- 点検 ----
const v1 = S.validate("news", news);
ok(v1.some((x) => x.level === "error" && /本文が空/.test(x.message)), "お知らせ：本文が空はエラー");
ok(v1.some((x) => x.level === "error" && /http/.test(x.message)), "お知らせ：不正なURLはエラー");
ok(v1.some((x) => x.level === "error" && /日付の形/.test(x.message)), "お知らせ：不正な日付はエラー");
ok(S.validate("news", [{ date: "", text: "日付なし" }]).every((x) => x.level === "warn"), "お知らせ：日付なしは注意だけ");
ok(S.validate("news", [{ date: "2027-01-01", text: "OK", url: "" }]).length === 0, "お知らせ：問題なしは0件");
ok(S.validate("overview", ov).some((x) => x.level === "error" && /項目名/.test(x.message)), "概要：項目名が空はエラー");
ok(S.validate("overview", ov).some((x) => x.level === "warn" && /主催/.test(x.message)), "概要：内容が空は注意");
ok(S.validate("program", pg).some((x) => x.level === "error" && /見出し/.test(x.message)), "プログラム：見出しが空はエラー");
ok(S.validate("program", pg).some((x) => x.level === "error" && /内容が空/.test(x.message)), "プログラム：項目の内容が空はエラー");
ok(S.validate("news", null).length === 0, "null でも落ちない");

// ---- 同じ内容か ----
ok(S.sameContent("news", [{ date: "", text: "a", url: "" }, { text: "" }], [{ date: "", text: " a ", url: "" }]), "公開用に整えた結果が同じなら同じ内容");
ok(!S.sameContent("news", [{ text: "a" }], [{ text: "b" }]), "違う内容は違う");

// ---- エラー ----
const e = S.ConfError("conflict", "衝突");
ok(e instanceof Error && e.code === "conflict" && e.message === "衝突", "ConfError は code と message を持つ");

console.log(bad ? "\n失敗 " + bad + " 件" : "schema: すべて通過");
process.exit(bad ? 1 : 0);
