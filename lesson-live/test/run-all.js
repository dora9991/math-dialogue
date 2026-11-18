// すべてのテストを実行: node lesson-live/test/run-all.js
// サーバーのテスト（api.test.js）は、検証用のローカルサーバーが動いているときだけ実行する
const { execFileSync } = require("child_process");
const path = require("path");
const run = f => { execFileSync(process.execPath, [path.join(__dirname, f)], { stdio: "inherit" }); };
let failed = false;
for (const f of ["math.test.js", "bank.test.js", "quizcore.test.js", "reflect.test.js"]) {
  try { run(f); } catch (e) { failed = true; }
}
(async () => {
  const base = process.env.LL_REST || "http://127.0.0.1:54433";
  let up = false;
  try { const r = await fetch(base + "/", { signal: AbortSignal.timeout(5000) }); up = r.status < 500; } catch (e) { up = false; }
  if (up) { try { run("api.test.js"); } catch (e) { failed = true; } }
  else console.log("api: スキップ（検証用サーバーが起動していません）");
  process.exit(failed ? 1 : 0);
})();
