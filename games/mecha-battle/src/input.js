'use strict';
/* ============================================================
   input.js — キーボード / ゲームパッド / 画面タッチ → 入力ビット
   ============================================================ */
const KEYS_SOLO = {
  KeyW: IN.UP, ArrowUp: IN.UP, KeyS: IN.DOWN, ArrowDown: IN.DOWN, KeyA: IN.LEFT, ArrowLeft: IN.LEFT, KeyD: IN.RIGHT, ArrowRight: IN.RIGHT,
  KeyZ: IN.A, KeyF: IN.A, KeyJ: IN.A, KeyX: IN.B, KeyG: IN.B, KeyK: IN.B,
};
const KEYS_P1 = { KeyW: IN.UP, KeyS: IN.DOWN, KeyA: IN.LEFT, KeyD: IN.RIGHT, KeyF: IN.A, KeyG: IN.B };
const KEYS_P2 = { ArrowUp: IN.UP, ArrowDown: IN.DOWN, ArrowLeft: IN.LEFT, ArrowRight: IN.RIGHT, Comma: IN.A, KeyK: IN.A, Period: IN.B, KeyL: IN.B };

const Input = {
  mode: 'solo',                 // 'solo'（P1だけ人間）| 'versus'（2人）
  held: new Set(),              // いま押されているキー
  hit: new Set(),               // このtickで押されたキー（エッジ）
  tapped: new Set(),            // 前回のpollから今までに押されたキー（一瞬の連打も取りこぼさない）
  masks: [0, 0], prev: [0, 0],
  touch: 0,                     // 画面タッチの入力（P1）
  tap: null,                    // このtickでのタップ位置（論理座標）
  any: false,                   // このtickで何かが押された
  padOn: false,

  keyMask(map) {
    let m = 0;
    for (const k of this.held) if (map[k]) m |= map[k];
    for (const k of this.tapped) if (map[k]) m |= map[k];
    return m;
  },

  padMask(i) {
    let m = 0;
    try {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      const p = pads[i];
      if (!p) return 0;
      this.padOn = true;
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      if (ax < -0.5 || (p.buttons[14] && p.buttons[14].pressed)) m |= IN.LEFT;
      if (ax > 0.5 || (p.buttons[15] && p.buttons[15].pressed)) m |= IN.RIGHT;
      if (ay < -0.5 || (p.buttons[12] && p.buttons[12].pressed)) m |= IN.UP;
      if (ay > 0.5 || (p.buttons[13] && p.buttons[13].pressed)) m |= IN.DOWN;
      if ((p.buttons[0] && p.buttons[0].pressed) || (p.buttons[2] && p.buttons[2].pressed)) m |= IN.A;
      if ((p.buttons[1] && p.buttons[1].pressed) || (p.buttons[3] && p.buttons[3].pressed)) m |= IN.B;
    } catch (e) { /* ゲームパッドが使えない環境 */ }
    return m;
  },

  /* 毎tickの最初に呼ぶ */
  poll() {
    this.prev[0] = this.masks[0]; this.prev[1] = this.masks[1];
    if (this.override) { this.masks[0] = this.override[0]; this.masks[1] = this.override[1]; this.tapped.clear(); return; }   // テスト用
    if (this.mode === 'versus') {
      this.masks[0] = this.keyMask(KEYS_P1) | this.padMask(0) | this.touch;
      this.masks[1] = this.keyMask(KEYS_P2) | this.padMask(1);
    } else {
      this.masks[0] = this.keyMask(KEYS_SOLO) | this.padMask(0) | this.padMask(1) | this.touch;
      this.masks[1] = 0;
    }
    this.tapped.clear();
  },
  /* 毎tickの最後に呼ぶ */
  endTick() { this.hit.clear(); this.tap = null; this.any = false; },

  edge(p, bit) { return (this.masks[p] & bit) !== 0 && (this.prev[p] & bit) === 0; },
  key(code) { return this.hit.has(code); },
  /* メニュー用の「決定」「戻る」 */
  confirm() { return this.edge(0, IN.A) || this.edge(1, IN.A) || this.key('Enter') || this.key('Space'); },
  cancel() { return this.edge(0, IN.B) || this.key('Escape') || this.key('Backspace'); },
  pause() { return this.key('Enter') || this.key('Escape') || this.key('KeyP'); },
  nav() { // -1,0,+1 の十字キー入力（P1/P2どちらでも）
    const e = (b) => this.edge(0, b) || (this.mode === 'versus' && this.edge(1, b));
    return { x: (e(IN.RIGHT) ? 1 : 0) - (e(IN.LEFT) ? 1 : 0), y: (e(IN.DOWN) ? 1 : 0) - (e(IN.UP) ? 1 : 0) };
  },
};

window.addEventListener('keydown', (e) => {
  if (e.target && e.target.tagName === 'INPUT') return;      // ルームコード入力中は、ゲームのキーとして扱わない
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if (!e.repeat) { Input.hit.add(e.code); Input.tapped.add(e.code); Input.any = true; }
  Input.held.add(e.code);
  if (typeof Sound !== 'undefined') Sound.unlock();
});
window.addEventListener('keyup', (e) => { Input.held.delete(e.code); });
window.addEventListener('blur', () => { Input.held.clear(); Input.touch = 0; });

/* ---------- 画面タッチ（スマホ） ---------- */
function setupTouch() {
  const root = document.getElementById('touch');
  if (!root) return;
  const show = () => { root.hidden = false; document.body.classList.add('has-touch'); if (window.fitScreen) window.fitScreen(); };
  if ('ontouchstart' in window || (navigator.maxTouchPoints | 0) > 0) show();
  window.addEventListener('touchstart', show, { once: true, passive: true });

  const dpad = document.getElementById('dpad'), knob = document.getElementById('knob');
  let dirPtr = null;
  const setDir = (e) => {
    const r = dpad.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = e.clientX - cx, dy = e.clientY - cy, th = r.width * 0.16;
    let m = 0;
    if (dx < -th) m |= IN.LEFT; if (dx > th) m |= IN.RIGHT; if (dy < -th) m |= IN.UP; if (dy > th) m |= IN.DOWN;
    Input.touch = (Input.touch & ~15) | m;
    const kx = Math.max(-1, Math.min(1, dx / (r.width / 2))) * r.width * 0.28, ky = Math.max(-1, Math.min(1, dy / (r.height / 2))) * r.height * 0.28;
    knob.style.transform = `translate(${kx}px, ${ky}px)`;
  };
  dpad.addEventListener('pointerdown', (e) => { e.preventDefault(); dirPtr = e.pointerId; dpad.setPointerCapture(e.pointerId); setDir(e); Input.any = true; if (typeof Sound !== 'undefined') Sound.unlock(); });
  dpad.addEventListener('pointermove', (e) => { if (e.pointerId === dirPtr) setDir(e); });
  const endDir = (e) => { if (e.pointerId === dirPtr) { dirPtr = null; Input.touch &= ~15; knob.style.transform = ''; } };
  dpad.addEventListener('pointerup', endDir); dpad.addEventListener('pointercancel', endDir);

  [['btnA', IN.A], ['btnB', IN.B]].forEach(([id, bit]) => {
    const el = document.getElementById(id);
    let ptr = null;
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); ptr = e.pointerId; el.setPointerCapture(e.pointerId); Input.touch |= bit; el.classList.add('on'); Input.any = true; if (typeof Sound !== 'undefined') Sound.unlock(); });
    const up = (e) => { if (e.pointerId === ptr) { ptr = null; Input.touch &= ~bit; el.classList.remove('on'); } };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  });
  const pb = document.getElementById('btnPause');
  if (pb) pb.addEventListener('pointerdown', (e) => { e.preventDefault(); Input.hit.add('Enter'); Input.any = true; if (typeof Sound !== 'undefined') Sound.unlock(); });
  root.addEventListener('contextmenu', (e) => e.preventDefault());
}

/* キャンバスのタップ（メニュー選択用）：論理座標(256x224)へ変換して渡す */
function setupCanvasTap(cv) {
  cv.addEventListener('pointerdown', (e) => {
    const r = cv.getBoundingClientRect();
    Input.tap = { x: (e.clientX - r.left) / r.width * SCREEN_W, y: (e.clientY - r.top) / r.height * SCREEN_H };
    Input.any = true;
    if (typeof Sound !== 'undefined') Sound.unlock();
  });
}
