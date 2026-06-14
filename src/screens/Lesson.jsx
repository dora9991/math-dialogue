// ============================================================
// Lesson.jsx — 「上で動画を見ながら、下のワークシートに書き込む」画面（試作）
//  ・上：YouTube 埋め込みプレイヤー（動画IDがあれば再生。無ければ19chを開くボタン）
//  ・下：PDFワークシートを pdf.js で表示し、その上に手書きレイヤーを重ねる
//      ✏️ペン（色）／🧽消しゴム／🖐️移動（スクロール）／ページ送り／保存。
//  ※ ワークシートPDFは public/worksheets/ に置いたもの。著作物は許可を得て差し替える。
// ============================================================
import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import Header from "../components/Header.jsx";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const PEN_COLORS = ["#1e1b4b", "#ef4444", "#2563eb", "#16a34a", "#f59e0b"];

export default function Lesson({ player, unit, media, onBack }) {
  const { youtubeId, playlistId, pdfUrl, videoPage } = media || {};
  // 埋め込みURL：再生リストがあれば章まるごと（中の動画を選べる）、無ければ単独動画。
  const embedSrc = playlistId
    ? `https://www.youtube.com/embed/${youtubeId || "videoseries"}?list=${playlistId}&rel=0&modestbranding=1`
    : youtubeId
      ? `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`
      : null;

  // ── 手書き設定 ──
  const [mode, setMode] = useState("pen");   // pen | erase | move（moveのときは下がスクロールできる）
  const [color, setColor] = useState(PEN_COLORS[0]);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [loadErr, setLoadErr] = useState(null);
  const [wrapW, setWrapW] = useState(0); // ワークシート表示エリアの実幅（px）

  const wrapRef = useRef(null);     // 横幅の計測用
  const pdfCanvasRef = useRef(null);
  const drawCanvasRef = useRef(null);
  const pdfDocRef = useRef(null);
  const drawCtxRef = useRef(null);
  const drawing = useRef(false);
  const lastPt = useRef({ x: 0, y: 0 });
  const strokesRef = useRef({});    // { [page]: dataURL } ページごとの手書きを保持
  const modeRef = useRef(mode);
  const colorRef = useRef(color);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { colorRef.current = color; }, [color]);

  // PDFを読み込む
  useEffect(() => {
    if (!pdfUrl) return;
    let alive = true;
    setLoadErr(null);
    pdfjsLib.getDocument(pdfUrl).promise.then((doc) => {
      if (!alive) return;
      pdfDocRef.current = doc;
      setNumPages(doc.numPages);
      setPage(1);
    }).catch((e) => { if (alive) setLoadErr(String(e?.message || e)); });
    return () => { alive = false; };
  }, [pdfUrl]);

  // ページ／幅が変わったら描画
  useEffect(() => {
    const doc = pdfDocRef.current;
    if (!doc || !wrapRef.current) return;
    const avail = wrapW || wrapRef.current.clientWidth || 0;
    if (avail <= 0) return; // 幅が未確定のうちは描かない（ResizeObserverで再実行）
    let cancelled = false;
    (async () => {
      const pdfPage = await doc.getPage(page);
      if (cancelled) return;
      const cssW = Math.min(avail, 720);
      const base = pdfPage.getViewport({ scale: 1 });
      const scale = cssW / base.width;
      const vp = pdfPage.getViewport({ scale });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const pc = pdfCanvasRef.current, dc = drawCanvasRef.current;
      for (const c of [pc, dc]) {
        c.width = Math.round(vp.width * dpr);
        c.height = Math.round(vp.height * dpr);
        c.style.width = vp.width + "px";
        c.style.height = vp.height + "px";
      }
      const ctx = pc.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, vp.width, vp.height);
      await pdfPage.render({ canvasContext: ctx, viewport: vp }).promise;

      // 手書きレイヤー初期化（このページの保存があれば復元）
      const dctx = dc.getContext("2d");
      dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dctx.lineCap = "round"; dctx.lineJoin = "round";
      dctx.clearRect(0, 0, vp.width, vp.height);
      drawCtxRef.current = dctx;
      const saved = strokesRef.current[page];
      if (saved) {
        const img = new Image();
        img.onload = () => dctx.drawImage(img, 0, 0, vp.width, vp.height);
        img.src = saved;
      }
    })();
    return () => { cancelled = true; };
  }, [page, numPages, wrapW]);

  // PDF未設定の単元でも「白紙のプリント」に手書きできるようにする（素材が届く前のフォールバック）。
  //  ワークシートPDFが OVERRIDES に入れば上の通常描画に切り替わる。
  useEffect(() => {
    if (pdfUrl || !wrapRef.current) return; // PDFがある単元はこの処理は不要
    const avail = wrapW || wrapRef.current.clientWidth || 0;
    if (avail <= 0) return;
    const cssW = Math.min(avail, 720);
    const cssH = Math.round(cssW * 1.414); // A4縦のおおよその比率
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pc = pdfCanvasRef.current, dc = drawCanvasRef.current;
    if (!pc || !dc) return;
    for (const c of [pc, dc]) {
      c.width = Math.round(cssW * dpr);
      c.height = Math.round(cssH * dpr);
      c.style.width = cssW + "px";
      c.style.height = cssH + "px";
    }
    const ctx = pc.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, cssW, cssH);
    const dctx = dc.getContext("2d");
    dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dctx.lineCap = "round"; dctx.lineJoin = "round";
    dctx.clearRect(0, 0, cssW, cssH);
    drawCtxRef.current = dctx;
    const saved = strokesRef.current[1]; // 白紙は1ページ扱い
    if (saved) {
      const img = new Image();
      img.onload = () => dctx.drawImage(img, 0, 0, cssW, cssH);
      img.src = saved;
    }
  }, [pdfUrl, wrapW]);

  // ラッパーの実幅を監視（レイアウト確定後に正しい幅で描画する）
  useEffect(() => {
    if (!wrapRef.current) return;
    // 初期計測（レイアウト確定直後に1回。ResizeObserverが発火しない環境の保険）
    const measure = () => { const w = wrapRef.current?.clientWidth || 0; if (w > 0) setWrapW((p) => (p === w ? p : w)); };
    measure();
    const raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver((ents) => {
      const w = Math.round(ents[0].contentRect.width);
      if (w > 0) setWrapW((p) => (p === w ? p : w));
    });
    ro.observe(wrapRef.current);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  // ── 手書きハンドラ ──
  function ptOf(e) {
    const r = drawCanvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function down(e) {
    if (modeRef.current === "move") return; // 移動モードはスクロールに任せる
    e.preventDefault();
    drawCanvasRef.current.setPointerCapture?.(e.pointerId);
    drawing.current = true;
    lastPt.current = ptOf(e);
    const ctx = drawCtxRef.current;
    ctx.globalCompositeOperation = modeRef.current === "erase" ? "destination-out" : "source-over";
    ctx.strokeStyle = colorRef.current;
    ctx.lineWidth = modeRef.current === "erase" ? 22 : 3;
    // 点でも描けるように小さな円
    ctx.beginPath(); ctx.arc(lastPt.current.x, lastPt.current.y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = modeRef.current === "erase" ? "rgba(0,0,0,1)" : colorRef.current;
    ctx.fill();
  }
  function move(e) {
    if (!drawing.current) return;
    e.preventDefault();
    const p = ptOf(e);
    const ctx = drawCtxRef.current;
    ctx.beginPath(); ctx.moveTo(lastPt.current.x, lastPt.current.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    lastPt.current = p;
  }
  function up() {
    if (!drawing.current) return;
    drawing.current = false;
    // このページの手書きを保存
    strokesRef.current[page] = drawCanvasRef.current.toDataURL("image/png");
  }
  function clearPage() {
    const ctx = drawCtxRef.current;
    if (!ctx) return;
    const dc = drawCanvasRef.current;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, dc.width, dc.height); ctx.restore();
    delete strokesRef.current[page];
  }
  function saveImage() {
    const pc = pdfCanvasRef.current, dc = drawCanvasRef.current;
    const out = document.createElement("canvas");
    out.width = pc.width; out.height = pc.height;
    const c = out.getContext("2d");
    c.drawImage(pc, 0, 0); c.drawImage(dc, 0, 0);
    const a = document.createElement("a");
    a.href = out.toDataURL("image/png");
    a.download = `worksheet-${unit?.id || "page"}-${page}.png`;
    a.click();
  }

  const tabBtn = (id, label) => (
    <button data-sfx="none" onClick={() => setMode(id)}
      style={{ ...toolBtn, background: mode === id ? "#6366f1" : "rgba(255,255,255,.08)" }}>{label}</button>
  );

  return (
    <div className="app">
      <Header player={player} back="もどる" onBack={onBack} />
      <div className="content" style={{ paddingBottom: 24 }}>
        <div className="pg-ttl" style={{ fontSize: 18 }}>📺 {unit?.name || "解説と練習"}</div>
        <div className="pg-sub">動画を見ながら、下のプリントに書きこもう</div>

        {/* ── 上：動画（アプリ内で埋め込み再生） ── */}
        {embedSrc ? (
          <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", borderRadius: 14, overflow: "hidden", background: "#000", border: "1px solid rgba(255,255,255,.12)" }}>
            <iframe
              title="解説動画"
              src={embedSrc}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="glass" style={{ padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.75)", lineHeight: 1.6, marginBottom: 10 }}>
              この単元の動画IDが未設定です。<br />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>（data/lessonMedia.js に YouTube動画IDを入れると、ここで埋め込み再生できます）</span>
            </div>
            {videoPage && (
              <button data-sfx="none" onClick={() => window.open(videoPage, "_blank", "noopener")}
                style={{ ...toolBtn, background: "linear-gradient(135deg,#ef4444,#f87171)", padding: "10px 16px" }}>
                ▶ 19chで動画を見る（別タブ）
              </button>
            )}
          </div>
        )}

        {/* ── 道具バー ── */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginTop: 12 }}>
          {tabBtn("pen", "✏️ ペン")}
          {tabBtn("erase", "🧽 消す")}
          {tabBtn("move", "🖐️ 移動")}
          <div style={{ display: "flex", gap: 5, marginLeft: 4 }}>
            {PEN_COLORS.map((c) => (
              <button key={c} data-sfx="none" onClick={() => { setColor(c); setMode("pen"); }}
                style={{ width: 24, height: 24, borderRadius: "50%", background: c, cursor: "pointer", border: color === c && mode === "pen" ? "3px solid #fff" : "2px solid rgba(255,255,255,.25)" }} />
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <button data-sfx="none" onClick={clearPage} style={toolBtn}>このページを消す</button>
          <button data-sfx="none" onClick={saveImage} style={{ ...toolBtn, background: "#16a34a" }}>💾 保存</button>
        </div>

        {/* PDF未設定の単元は白紙に書ける（プリントが入ると自動で表示） */}
        {!pdfUrl && !loadErr && (
          <div className="glass" style={{ padding: "8px 12px", fontSize: 11.5, color: "rgba(255,255,255,.72)", marginTop: 10, textAlign: "center", lineHeight: 1.6 }}>
            📝 この単元のワークシートは準備中です。動画を見ながら、下の白紙に計算や考えを書きこめます。
          </div>
        )}

        {/* ── 下：ワークシート（PDF＋手書き／PDFが無ければ白紙） ── */}
        <div ref={wrapRef} style={{ marginTop: 10, width: "100%", textAlign: "center" }}>
          {loadErr ? (
            <div className="glass" style={{ padding: 16, color: "#fca5a5", fontSize: 12 }}>プリントを読み込めませんでした：{loadErr}</div>
          ) : (
            <div style={{
              position: "relative", display: "inline-block", borderRadius: 10, overflow: "hidden",
              boxShadow: "0 8px 24px rgba(0,0,0,.4)", background: "#fff", maxWidth: "100%",
              // 移動モード以外はキャンバスのタッチを手書きに使う（スクロール抑制）
              touchAction: mode === "move" ? "auto" : "none",
            }}>
              <canvas ref={pdfCanvasRef} style={{ display: "block" }} />
              <canvas
                ref={drawCanvasRef}
                onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up}
                style={{ position: "absolute", left: 0, top: 0, cursor: mode === "move" ? "grab" : "crosshair", pointerEvents: mode === "move" ? "none" : "auto" }}
              />
            </div>
          )}
        </div>

        {/* ページ送り */}
        {numPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 12 }}>
            <button data-sfx="none" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} style={toolBtn}>◀ 前</button>
            <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,.8)" }}>{page} / {numPages}</span>
            <button data-sfx="none" disabled={page >= numPages} onClick={() => setPage((p) => Math.min(numPages, p + 1))} style={toolBtn}>次 ▶</button>
          </div>
        )}

        {pdfUrl && (
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.4)", textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
            ※ いまのプリントは差し替え用のサンプルです。葉一さんのプリントは、許可を得たうえで
            public/worksheets/ に置いて差し替えてください。
          </div>
        )}
      </div>
    </div>
  );
}

const toolBtn = {
  padding: "8px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit",
  fontSize: 12, fontWeight: 900, color: "#fff", background: "rgba(255,255,255,.08)",
};
