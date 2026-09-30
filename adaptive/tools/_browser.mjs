// ============================================================
// tools/_browser.mjs — ブラウザ系の検査ツールが共有する小道具（静的サーバー・Playwright の起動）
// ============================================================
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".svg": "image/svg+xml" };

/** adaptive/ を配る小さな静的サーバーを、空いているポートで起動する。{ base, close } を返す */
export async function startServer(root = ROOT) {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const file = path.join(root, p === "/" ? "index.html" : p);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return { base: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}

/** Playwright と Chromium を探して起動する。見つからなければ null */
export async function launchBrowser() {
  let pw = null;
  for (const c of ["playwright", "/opt/node22/lib/node_modules/playwright/index.mjs", "@playwright/test"]) {
    try {
      pw = await import(c);
      break;
    } catch {
      /* 次の候補へ */
    }
  }
  if (!pw) return null;
  const chromium = pw.chromium || pw.default?.chromium;
  try {
    return await chromium.launch();
  } catch {
    return await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" }).catch(() => null);
  }
}
