/* バスケ分析スタジオ — 共通処理（名前空間・乱数・書式・イベントバス）
   DOM に依存しないので node のテストからも読み込める。 */
(function (root) {
  'use strict';
  const BS = root.BS = root.BS || {};
  BS.VERSION = '1.0.0';

  /* ---------- 乱数（シード固定・mulberry32） ---------- */
  BS.rng = function (seed) {
    let a = (seed >>> 0) || 1;
    function next() {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    return {
      next,
      range: (lo, hi) => lo + (hi - lo) * next(),
      int: (lo, hi) => Math.floor(lo + (hi - lo + 1) * next()),
      chance: (p) => next() < p,
      pick: (arr) => arr[Math.floor(next() * arr.length)],
      /* items: [[value, weight], ...] */
      weighted(items) {
        let sum = 0;
        for (const it of items) sum += Math.max(0, it[1]);
        let r = next() * sum;
        for (const it of items) { r -= Math.max(0, it[1]); if (r <= 0) return it[0]; }
        return items[items.length - 1][0];
      },
      gauss(mu, sd) {
        const u = Math.max(1e-9, next()), v = next();
        return mu + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      }
    };
  };

  /* ---------- 数値・書式 ---------- */
  BS.clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  BS.lerp = (a, b, k) => a + (b - a) * k;
  BS.smooth = (k) => k * k * (3 - 2 * k);
  BS.round = (v, d = 1) => { const m = Math.pow(10, d); return Math.round(v * m) / m; };

  BS.fmtTime = function (sec, withTenths) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const pad = (n) => String(n).padStart(2, '0');
    let out = (h ? h + ':' + pad(m) : String(m)) + ':' + pad(s);
    if (withTenths) out += '.' + Math.floor((sec * 10) % 10);
    return out;
  };
  /* 割合（%）。分母0なら「—」 */
  BS.pct = function (num, den, digits = 1) {
    if (!den) return '—';
    return (100 * num / den).toFixed(digits);
  };
  BS.ratio = function (num, den, digits = 2) {
    if (!den) return '—';
    return (num / den).toFixed(digits);
  };
  BS.signed = (n) => (n > 0 ? '+' + n : String(n));

  BS.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  let uidCounter = 0;
  BS.uid = function (prefix = 'e') {
    uidCounter = (uidCounter + 1) % 1e6;
    return prefix + Date.now().toString(36) + uidCounter.toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  };

  BS.deepCopy = (o) => JSON.parse(JSON.stringify(o));

  /* ---------- イベントバス ---------- */
  BS.emitter = function () {
    const map = new Map();
    return {
      on(name, fn) { if (!map.has(name)) map.set(name, new Set()); map.get(name).add(fn); return () => map.get(name).delete(fn); },
      off(name, fn) { if (map.has(name)) map.get(name).delete(fn); },
      emit(name, payload) {
        if (!map.has(name)) return;
        for (const fn of Array.from(map.get(name))) {
          try { fn(payload); } catch (err) { if (typeof console !== 'undefined') console.error('[BS] handler error', name, err); }
        }
      }
    };
  };
  BS.bus = BS.emitter();

  /* ---------- コート（FIBA 28m × 15m） ---------- */
  BS.COURT = {
    L: 28, W: 15,
    rimFromBaseline: 1.575,
    boardFromBaseline: 1.2,
    rimH: 3.05, rimR: 0.225,
    three: 6.75, cornerLine: 0.9, cornerDepth: 2.99,
    keyW: 4.9, keyL: 5.8, ftR: 1.8, centerR: 1.8, raR: 1.25
  };

  /* ハーフコート座標（sx: 0〜15 左右、sy: ベースラインからの距離）→ 2P/3P とゾーン */
  BS.shotZone = function (sx, sy) {
    const C = BS.COURT;
    const dx = sx - 7.5, dy = sy - C.rimFromBaseline;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const inCornerStrip = sy <= C.cornerDepth && (sx < C.cornerLine || sx > C.W - C.cornerLine);
    const three = inCornerStrip || (sy > C.cornerDepth && dist > C.three);
    let zone;
    if (three) zone = sy <= C.cornerDepth + 0.4 ? 'c3' : 'ab3';
    else if (dist <= 2.0) zone = 'rim';
    else if (Math.abs(dx) <= C.keyW / 2 && sy <= C.keyL) zone = 'paint';
    else zone = 'mid';
    return { three, zone, dist };
  };
  BS.ZONES = [
    { id: 'rim', label: 'ゴール下', short: 'ゴール下' },
    { id: 'paint', label: 'ペイント', short: 'ペイント' },
    { id: 'mid', label: 'ミドル', short: 'ミドル' },
    { id: 'c3', label: 'コーナー3P', short: 'コーナー3' },
    { id: 'ab3', label: 'トップ/ウイング3P', short: 'トップ3' }
  ];
  BS.zoneLabel = (id) => (BS.ZONES.find((z) => z.id === id) || { label: '位置なし' }).label;

  /* ---------- コート図の向き ----------
     シュート位置はいつも「ゴールを上にしたハーフコート」の座標（sx, sy）で持つ。画面に描くときだけ、図を回して見せる。
     確認モードでは、図を映像と同じ向きにそろえる（図の下＝手前＝カメラ側）と、見たままの場所を押せる。
       0＝ゴールが上（カメラがコートの端から、奥のゴールを見ている）
      90＝ゴールが右／270＝ゴールが左（カメラがコートの横から見ている）
     180＝ゴールが下（手前のゴールを、後ろ側から見ている）
     図の単位は 10cm（横 150 × 縦 142）。回すのは「回転」だけ（鏡写しにはしない）なので、左右が入れ替わることはない */
  BS.COURT_ROTS = [0, 90, 180, 270];
  BS.courtXform = function (rot) {
    const W = 150, H = 142;
    rot = ((Math.round((rot || 0) / 90) * 90) % 360 + 360) % 360;
    if (rot === 90) return { rot, w: H, h: W, svg: `translate(${H},0) rotate(90)`, toView: (x, y) => [H - y, x], toCourt: (u, v) => [v, H - u] };
    if (rot === 180) return { rot, w: W, h: H, svg: `translate(${W},${H}) rotate(180)`, toView: (x, y) => [W - x, H - y], toCourt: (u, v) => [W - u, H - v] };
    if (rot === 270) return { rot, w: H, h: W, svg: `translate(0,${W}) rotate(-90)`, toView: (x, y) => [y, W - x], toCourt: (u, v) => [W - v, u] };
    return { rot: 0, w: W, h: H, svg: '', toView: (x, y) => [x, y], toCourt: (u, v) => [u, v] };
  };
  /* ゴールの指定（バックボードの枠とリング）から、図の向きの初期値を決める。
     横から見たゴールは、リングが板からコートの内側へ突き出して見える：リングが板の中心より右にあれば、コートは右へ広がる（＝ゴールは左）。
     板のほぼ正面にリングがあれば、コートの端から見ている（＝ゴールは上）。合わないときは、利用者が画面で回せる */
  BS.courtRotOfMark = function (mark) {
    if (!mark || !mark.box || !mark.rim || !(mark.box.w > 0)) return 0;
    const off = (mark.rim.cx - (mark.box.x + mark.box.w / 2)) / mark.box.w;
    if (off > 0.12) return 270;
    if (off < -0.12) return 90;
    return 0;
  };

  /* プレータイプ（Synergy の分類を中学・高校向けに簡略化） */
  BS.PLAYS = [
    { id: 'transition', label: '速攻' },
    { id: 'pnr', label: 'ピック&ロール' },
    { id: 'iso', label: 'アイソレーション' },
    { id: 'post', label: 'ポストアップ' },
    { id: 'spot', label: 'スポットアップ' },
    { id: 'cut', label: 'カット' },
    { id: 'offscreen', label: 'オフスクリーン' },
    { id: 'putback', label: 'プットバック' },
    { id: 'other', label: 'その他' }
  ];
  BS.playLabel = (id) => (BS.PLAYS.find((p) => p.id === id) || { label: '未分類' }).label;

  BS.TO_KINDS = [
    { id: 'pass', label: 'パスミス' },
    { id: 'lost', label: 'ボールロスト' },
    { id: 'travel', label: 'トラベリング' },
    { id: 'offfoul', label: 'オフェンスファウル' },
    { id: 'oob', label: 'アウトオブバウンズ' },
    { id: 'viol', label: 'その他の違反' }
  ];
  BS.toLabel = (id) => (BS.TO_KINDS.find((k) => k.id === id) || { label: '未分類' }).label;

  BS.FOUL_KINDS = [
    { id: 'P', label: '通常' },
    { id: 'S', label: 'シュート時' },
    { id: 'O', label: 'オフェンス' },
    { id: 'T', label: 'テクニカル' },
    { id: 'U', label: 'アンスポーツマンライク' }
  ];
  BS.foulLabel = (id) => (BS.FOUL_KINDS.find((k) => k.id === id) || { label: '通常' }).label;
})(typeof window !== 'undefined' ? window : globalThis);
