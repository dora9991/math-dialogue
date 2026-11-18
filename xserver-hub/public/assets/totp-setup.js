// 二段階認証の登録の画面：otpauth の URI を、QR コードにして見せる（画像を外のサービスに作らせない＝秘密を外に出さない）。
// QR の部品は vendor/qrcode.js（qrcode-generator 1.4.4・MIT）。先に読み込まれて、window.qrcode がある。

const box = document.getElementById('qr');
const uri = box?.dataset.uri;
if (box && uri && typeof window.qrcode === 'function') {
  const qr = window.qrcode(0, 'M');
  qr.addData(uri);
  qr.make();
  const n = qr.getModuleCount();
  const size = 4;
  const margin = 4;
  const px = (n + margin * 2) * size;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${px} ${px}`);
  svg.setAttribute('width', '220');
  svg.setAttribute('height', '220');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', '認証アプリで読み込む QR コード');
  const bg = document.createElementNS(ns, 'rect');
  bg.setAttribute('width', String(px));
  bg.setAttribute('height', String(px));
  bg.setAttribute('fill', '#fff');
  svg.append(bg);
  let d = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.isDark(r, c)) d += `M${(c + margin) * size} ${(r + margin) * size}h${size}v${size}h-${size}z`;
    }
  }
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', '#000');
  svg.append(path);
  box.append(svg);
} else if (box) {
  box.textContent = 'QR コードを表示できませんでした。下の「QR コードを読めないとき」の文字を、アプリに入れてください。';
}
