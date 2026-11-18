/* ikkan：QR コードの図（SVG）をつくる。js/vendor/qrcode.js（qrcode-generator）のあとに読む。画面を持たない。
   IK.qr.svg(文字列, 一辺のmm)  … 余白（クワイエットゾーン）をふくまない図。まわりに、モジュール 4 つぶん以上の白をあけて置くこと。
   IK.qr.size(文字列)           … 1 辺のモジュール数（33 なら バージョン 4） */
(function () {
  'use strict';
  const IK = (window.IK = window.IK || {});
  // 訂正レベルは M（約 15% まで欠けても読める）。バージョンは文字数に合わせて自動。
  // M だと、1つの辺が 33 モジュール（バージョン 4）をこえるとき（授業のIDが長い単元）は、L（約 7%）にして、14mm 角でも読みやすい大きさ（33 以内）をたもつ
  const build = (text, lv) => { const q = qrcode(0, lv); q.addData(String(text), 'Byte'); q.make(); return q; };
  const make = text => { const m = build(text, 'M'); if (m.getModuleCount() <= 33) return m; const l = build(text, 'L'); return l.getModuleCount() < m.getModuleCount() ? l : m; };
  function svg(text, mm, cls) {
    const q = make(text), n = q.getModuleCount();
    let d = '';
    for (let r = 0; r < n; r++) {   // 同じ行の黒が続くところは、1 本の四角にまとめる（印刷でも、すき間が出にくい）
      for (let c = 0; c < n; c++) {
        if (!q.isDark(r, c)) continue;
        let e = c; while (e + 1 < n && q.isDark(r, e + 1)) e++;
        d += `M${c} ${r}h${e - c + 1}v1h${c - e - 1}z`;
        c = e;
      }
    }
    return `<svg class="${cls || 'qr'}" viewBox="0 0 ${n} ${n}" width="${mm}mm" height="${mm}mm" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="QRコード"><path d="${d}" fill="#000"/></svg>`;
  }
  IK.qr = { svg, size: text => make(text).getModuleCount() };
})();
