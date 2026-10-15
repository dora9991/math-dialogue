/* hibi/js/image.js
   写真・PDF を、裏側に送れる形にする。
   ・写真：長い辺を 2000px までに縮めて JPEG にする（Claude が読むのにも十分。通信も軽い）。小さいサムネイルも同時につくる
   ・PDF・そのほか：そのまま base64 にする（20MB まで）
   iPhone の Safari は、写真を選ぶと HEIC を JPEG にして渡してくれる。読めない画像（パソコンの HEIC など）は、そのまま送る（裏側が JPEG にする）。 */
(function (root) {
  'use strict';
  const HB = root.HB = root.HB || {};
  const MAX_RAW = 20 * 1024 * 1024;

  function readAsDataURL(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error || new Error('読めませんでした'));
      r.readAsDataURL(blob);
    });
  }

  async function loadImage(file) {
    if (typeof createImageBitmap === 'function') {
      try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { /* 下の方法で */ }
    }
    const url = URL.createObjectURL(file);
    try {
      return await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('画像として読めませんでした'));
        img.src = url;
      });
    } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
  }

  function draw(img, max) {
    const w = img.width || img.naturalWidth, h = img.height || img.naturalHeight;
    const s = Math.min(1, max / Math.max(w, h));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * s)); c.height = Math.max(1, Math.round(h * s));
    const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);   // 透明な PNG も白地に
    g.drawImage(img, 0, 0, c.width, c.height);
    return c;
  }
  const toBlob = (c, q) => new Promise(r => c.toBlob(b => r(b), 'image/jpeg', q));

  function stamp() {
    const d = new Date(), p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  }
  /** 名前：カメラの「image.jpg」などは「写真_日時.jpg」にする */
  function niceName(file, kind) {
    const n = String(file && file.name || '');
    if (!n || /^(image|photo|img)\.(jpe?g|png|heic)$/i.test(n)) return (kind === 'photo' ? '写真_' : '資料_') + stamp() + (kind === 'photo' ? '.jpg' : '');
    return kind === 'photo' ? n.replace(/\.(heic|heif|png|webp|gif)$/i, '.jpg') : n;
  }

  /** ファイル1つ → { kind, name, mime, data(base64), thumb(dataURL|''), preview(URL), size } */
  async function prepare(file) {
    const isImage = /^image\//.test(file.type) || /\.(jpe?g|png|heic|heif|webp|gif)$/i.test(file.name || '');
    if (isImage) {
      try {
        const img = await loadImage(file);
        const big = draw(img, 2000), small = draw(img, 360);
        if (img.close) img.close();
        const blob = await toBlob(big, 0.85);
        const dataUrl = await readAsDataURL(blob);
        return { kind: 'photo', name: niceName(file, 'photo'), mime: 'image/jpeg', data: dataUrl.split(',')[1], thumb: small.toDataURL('image/jpeg', 0.72), preview: small.toDataURL('image/jpeg', 0.72), size: blob.size };
      } catch (e) { /* 読めない画像は、そのまま送る */ }
    }
    if (file.size > MAX_RAW) throw new Error(`「${file.name}」は大きすぎます（20MB まで）`);
    const dataUrl = await readAsDataURL(file);
    const kind = isImage ? 'photo' : /pdf/i.test(file.type) || /\.pdf$/i.test(file.name || '') ? 'pdf' : 'file';
    return { kind, name: niceName(file, kind), mime: file.type || '', data: dataUrl.split(',')[1], thumb: '', preview: '', size: file.size };
  }

  HB.image = { prepare, readAsDataURL };
})(typeof globalThis !== 'undefined' ? globalThis : this);
