// ============================================================
// tools/render-audit.mjs — 全テンプレートを実際のブラウザで描いて、見た目の崩れを機械的に探す
//
//   node tools/render-audit.mjs [--width 343] [--seeds 2]
//
//  すべての単元 × テンプレ × 難易度 × 数個の種について、問題・答える欄・キーパッド・答え合わせ（誤答時）を
//  スマホ幅（既定 343px ＝ 375px 画面のカード内側）に描いて、次を調べる：
//   ・はみ出し：カードの外にはみ出す要素がないか（数式の中の横スクロールは除く）
//   ・KaTeX のエラー表示（赤字）がないか
//   ・数式が横スクロールを必要としているもの（長い式）を、参考として一覧にする
// ============================================================
import { startServer, launchBrowser } from "./_browser.mjs";

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? Number(args[args.indexOf(k) + 1]) : d);
const WIDTH = opt("--width", 343);
const SEEDS = opt("--seeds", 2);

const browser = await launchBrowser();
if (!browser) {
  console.log("Playwright / Chromium が見つからないため、描画の検査をスキップしました。");
  process.exit(2);
}
const { base, close } = await startServer();
const page = await browser.newPage({ viewport: { width: WIDTH + 32, height: 900 } });
const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push(e.message));
await page.goto(`${base}/index.html`);
await page.waitForSelector(".hero");

const { count, issues } = await page.evaluate(
  async ({ width, seeds }) => {
    const { SKILLS, ALL_IDS } = await import("/js/data/graph.js");
    const { makeItem } = await import("/js/core/items.js");
    const { ItemView, feedbackView, buildKeypad } = await import("/js/ui/render.js");
    const host = document.createElement("div");
    host.className = "card";
    host.style.cssText = `position:absolute;left:0;top:0;width:${width}px;`;
    document.body.append(host);
    const out = [];
    let n = 0;
    for (const id of ALL_IDS) {
      for (const tpl of SKILLS[id].tpl) {
        for (const level of [1, 2, 3]) {
          for (let seed = 1; seed <= seeds; seed++) {
            let item;
            try {
              item = makeItem(SKILLS[id], level, seed, tpl.id);
            } catch (e) {
              out.push({ uid: `${id}/${tpl.id}/${level}/${seed}`, type: "generate", by: 0, msg: e.message });
              continue;
            }
            const view = new ItemView(item, {});
            const parts = [view.el];
            if (item.kind !== "choice") parts.push(buildKeypad(view, { mixed: !!item.mixed }));
            parts.push(feedbackView(item, { ok: false, mc: null }));
            host.replaceChildren(...parts);
            n++;
            const hr = host.getBoundingClientRect();
            const inner = hr.right - parseFloat(getComputedStyle(host).paddingRight);
            let worst = 0;
            for (const el of host.querySelectorAll("*")) {
              if (el.closest(".m") && !el.classList.contains("m")) continue; // 数式の中は、数式ごとのスクロールに任せる
              const r = el.getBoundingClientRect();
              if (r.width === 0 && r.height === 0) continue;
              worst = Math.max(worst, r.right - inner);
            }
            if (worst > 1) out.push({ uid: item.uid, type: "overflow", by: Math.round(worst) });
            if (host.querySelector(".katex-error")) out.push({ uid: item.uid, type: "katex-error", by: 0 });
            for (const m of host.querySelectorAll(".m")) if (m.scrollWidth > m.clientWidth + 1) out.push({ uid: item.uid, type: "formula-scroll", by: m.scrollWidth - m.clientWidth });
          }
        }
      }
    }
    host.remove();
    return { count: n, issues: out };
  },
  { width: WIDTH, seeds: SEEDS },
);
await browser.close();
close();

const hard = issues.filter((i) => i.type !== "formula-scroll");
const soft = issues.filter((i) => i.type === "formula-scroll");
console.log(`描画した問題: ${count}（幅 ${WIDTH}px）`);
console.log(`参考：数式が横スクロールを必要とする問題 ${new Set(soft.map((s) => s.uid)).size} 件`);
const bySkill = {};
for (const s of soft) {
  const k = s.uid.split("/").slice(0, 2).join("/");
  bySkill[k] = Math.max(bySkill[k] || 0, s.by);
}
const top = Object.entries(bySkill).sort((a, b) => b[1] - a[1]).slice(0, 12);
if (top.length) console.log("  はみ出しの大きい順：" + top.map(([k, v]) => `${k}(+${v}px)`).join("、"));
if (consoleErrors.length) hard.push(...consoleErrors.map((m) => ({ uid: "-", type: "console", by: 0, msg: m })));
if (hard.length) {
  console.log(`✗ 問題あり: ${hard.length} 件`);
  for (const h of hard.slice(0, 40)) console.log(`  - ${h.type} ${h.uid}${h.by ? ` (+${h.by}px)` : ""}${h.msg ? ` ${h.msg}` : ""}`);
  process.exit(1);
}
console.log("✓ 描画の検査 OK（はみ出し・KaTeX エラーなし）");
