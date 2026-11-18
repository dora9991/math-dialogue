// テスト用の動画を、パソコンの Chrome（WebCodecs の H.264）で作る（ffmpeg がないとき）。
//   コマの番号と時刻を大きく描き、動く帯も入れる（640×360・30 コマ/秒）
const fs = require('fs');
const path = require('path');
const { MUX } = require('../../tools/mp4mux.cjs');
async function chromeVideo(chromium, file, sec, o) {
  const opt = Object.assign({ W: 640, H: 360, fps: 30, kbps: 300 }, o || {});
  const browser = await chromium.launch({ headless: true });
  const srv = await require('../server.cjs').start(0);          // WebCodecs は「安全なページ」（localhost など）でだけ使える
  try {
    const page = await browser.newPage({ acceptDownloads: true });
    await page.goto(srv.url + '__blank');
    await page.addScriptTag({ content: MUX + '\nwindow.__mux = mux;' });
    const err = await page.evaluate(async (o) => {
      const cv = document.createElement('canvas'); cv.width = o.W; cv.height = o.H;
      const g = cv.getContext('2d');
      const chunks = []; let avcC = null, e1 = null;
      const enc = new VideoEncoder({ output: (c, m) => { const d = new Uint8Array(c.byteLength); c.copyTo(d); chunks.push({ d, key: c.type === 'key' }); if (m && m.decoderConfig && m.decoderConfig.description && !avcC) avcC = new Uint8Array(m.decoderConfig.description); }, error: (e) => { e1 = e; } });
      enc.configure({ codec: 'avc1.42E01F', width: o.W, height: o.H, bitrate: o.kbps * 1000, framerate: o.fps, avc: { format: 'avc' } });
      const n = Math.round(o.sec * o.fps);
      for (let k = 0; k < n && !e1; k++) {
        g.fillStyle = `hsl(${(k * 2) % 360}, 45%, 30%)`; g.fillRect(0, 0, o.W, o.H);
        g.fillStyle = '#fff'; g.fillRect((k * 7) % o.W, o.H - 30, 40, 20);
        g.font = 'bold 64px sans-serif'; g.fillText(String(k), 30, 110);
        g.font = '32px sans-serif'; g.fillText((k / o.fps).toFixed(2) + ' s', 30, 170);
        const vf = new VideoFrame(cv, { timestamp: Math.round(k * 1e6 / o.fps), duration: Math.round(1e6 / o.fps) });
        enc.encode(vf, { keyFrame: k % (o.fps * 2) === 0 });
        vf.close();
        while (enc.encodeQueueSize > 4) await new Promise((r) => setTimeout(r, 2));
        if (k % 90 === 0) await new Promise((r) => setTimeout(r, 0));
      }
      await enc.flush(); enc.close();
      if (e1 || !avcC) return String(e1 || 'avcC がない');
      window.__blob = window.__mux(chunks, Array.from(avcC), o.W, o.H, o.fps);
      return null;
    }, Object.assign({ sec }, opt));
    if (err) throw new Error(err);
    const [dl] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => { const a = document.createElement('a'); a.href = URL.createObjectURL(window.__blob); a.download = 'v.mp4'; document.body.appendChild(a); a.click(); })]);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await dl.saveAs(file);
  } finally { await browser.close(); await srv.close(); }
  return file;
}
module.exports = { chromeVideo };
