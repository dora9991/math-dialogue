// app.js — 一覧と、動画の画面
import { createPlayer, fmt } from "./player.js";

const SECS = [
  { from: 1, to: 13, ic: "✏️", t: "図形の基本・移動・作図", s: "問1〜13" },
  { from: 14, to: 24, ic: "📐", t: "作図の応用・空間の位置関係・投影図・展開図", s: "問14〜24" },
  { from: 25, to: 34, ic: "🧊", t: "体積・表面積・おうぎ形・球", s: "問25〜34" },
  { from: 35, to: 42, ic: "🚀", t: "発展問題（最短・切断・回転体・転がる図形）", s: "問35〜42" },
];
const KEY = "ganbari-seen-v1";
const seen = (() => { try { return new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { return new Set(); } })();
const saveSeen = () => { try { localStorage.setItem(KEY, JSON.stringify([...seen])); } catch {} };
const q = new URLSearchParams(location.search);
const STILL = q.has("still");
const $ = (id) => document.getElementById(id);

let manifest = [], player = null, openN = null;
const pad = (n) => String(n).padStart(2, "0");

function renderList() {
  const list = $("list");
  list.innerHTML = "";
  for (const s of SECS) {
    const h = document.createElement("div");
    h.className = "sec";
    h.innerHTML = `${s.ic} ${s.t} <small>${s.s}</small>`;
    list.appendChild(h);
    const g = document.createElement("div");
    g.className = "grid";
    for (let n = s.from; n <= s.to; n++) {
      const m = manifest.find((x) => x.n === n);
      const b = document.createElement("button");
      b.type = "button";
      b.className = "card" + (seen.has(n) ? " seen" : "") + (m ? "" : " wait");
      b.dataset.n = n;
      b.innerHTML = `<span class="no"><small>問</small>${n}</span><span class="tt">${m ? fmt(m.title) : "じゅんび中"}</span><span class="go">${m ? "▶" : ""}</span>`;
      if (m) b.onclick = () => { location.hash = String(n); };
      g.appendChild(b);
    }
    list.appendChild(g);
  }
}

async function open(n) {
  let m = manifest.find((x) => x.n === n);
  if (!m && !q.has("still")) return close();
  if (!m) m = { n, title: "" };
  openN = n;
  const ov = $("overlay");
  ov.hidden = false;
  document.body.style.overflow = "hidden";
  ov.scrollTop = 0;
  $("ov-title").textContent = `問${n}　${m.title}`;
  $("ov-prob").innerHTML = "";
  $("ov-next-box").hidden = true;
  const idx = manifest.findIndex((x) => x.n === n);
  $("ov-prev").disabled = idx <= 0;
  $("ov-next").disabled = idx >= manifest.length - 1;
  let scene;
  try { scene = (await import(`./q/q${pad(n)}.js?v=${manifest.v || 1}`)).default; } catch (e) { $("ov-player").textContent = "この問題の動画を読みこめませんでした。"; console.error(e); return; }
  if (openN !== n) return;
  if (!m.title) $("ov-title").textContent = `問${n}　${scene.title}`;
  const prob = $("ov-prob");
  prob.innerHTML = `<span class="lb">問${n}</span>${fmt(scene.problem)}`;
  prob.classList.toggle("long", scene.problem.length > 140);
  if (player) player.destroy();
  player = createPlayer($("ov-player"), scene, {
    still: STILL, autoplay: !STILL,
    onEnd: () => { seen.add(n); saveSeen(); renderList(); showNext(idx); },
    onStep: (i, last) => { if (i === last) { seen.add(n); saveSeen(); } else $("ov-next-box").hidden = true; },
  });
  window.__player = player;
}
function showNext(idx) {
  const box = $("ov-next-box");
  box.innerHTML = "";
  const again = document.createElement("button");
  again.className = "pbtn"; again.type = "button"; again.textContent = "↻ もういちど見る";
  again.onclick = () => { box.hidden = true; player.play(); };
  box.appendChild(again);
  const nx = manifest[idx + 1];
  if (nx) {
    const b = document.createElement("button");
    b.className = "pbtn main"; b.type = "button"; b.textContent = `つぎ：問${nx.n} ›`;
    b.onclick = () => go(nx.n);
    box.appendChild(b);
  }
  box.hidden = false;
}
function close() {
  openN = null;
  if (player) { player.destroy(); player = null; }
  $("overlay").hidden = true;
  document.body.style.overflow = "";
  renderList();
}
// 動画のあいだの移動（前へ・つぎへ）は、履歴を積まない（「一覧」で一覧にもどれるように）
const go = (n) => { if (openN) location.replace("#" + n); else location.hash = String(n); };
function route() {
  const n = parseInt(location.hash.replace("#", ""), 10);
  if (n) open(n); else close();
}
$("ov-close").onclick = () => { if (location.hash) history.back(); else close(); };
$("ov-prev").onclick = () => { const i = manifest.findIndex((x) => x.n === openN); if (i > 0) go(manifest[i - 1].n); };
$("ov-next").onclick = () => { const i = manifest.findIndex((x) => x.n === openN); if (i < manifest.length - 1) go(manifest[i + 1].n); };
window.addEventListener("hashchange", route);
window.addEventListener("keydown", (e) => {
  if (!player || $("overlay").hidden) return;
  if (e.key === " ") { e.preventDefault(); player.playing ? player.pause() : player.play(); }
  else if (e.key === "ArrowRight") player.next();
  else if (e.key === "ArrowLeft") player.prev();
  else if (e.key === "Escape") $("ov-close").click();
});

(async () => {
  try { const r = await fetch(`manifest.json?v=${Date.now()}`); manifest = await r.json(); } catch { manifest = []; }
  manifest.sort((a, b) => a.n - b.n);
  renderList();
  route();
})();
