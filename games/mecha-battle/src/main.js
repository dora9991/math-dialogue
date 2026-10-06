'use strict';
/* ============================================================
   main.js — 起動・固定60Hzのループ・画面サイズ合わせ
   ============================================================ */
(function boot() {
  const cv = document.getElementById('screen');
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  Game.c = c; Game.cv = cv;
  buildAllSprites();
  Sound.init();
  setupTouch();
  setupCanvasTap(cv);

  /* 画面サイズ：スマホのボタン分を引いて、収まる最大の大きさに（大きい時は整数倍でドットをそろえる） */
  function fit() {
    const stage = document.getElementById('stage');
    const tp = document.getElementById('touch');
    let touchH = 0;
    if (tp && !tp.hidden && getComputedStyle(tp).position !== 'fixed') touchH = tp.offsetHeight;
    const hint = document.getElementById('hint'), lobby = document.getElementById('lobby');
    const hintH = (hint ? hint.offsetHeight + 8 : 0) + (lobby && !lobby.hidden ? lobby.offsetHeight + 8 : 0);
    const availW = stage.clientWidth;
    const availH = window.innerHeight - touchH - hintH - 24;
    let s = Math.min(availW / SCREEN_W, availH / SCREEN_H);
    if (s >= 2) s = Math.floor(s);
    s = Math.max(0.5, s);
    cv.style.width = Math.floor(SCREEN_W * s) + 'px';
    cv.style.height = Math.floor(SCREEN_H * s) + 'px';
  }
  window.fitScreen = fit;
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', () => setTimeout(fit, 200));
  fit();

  const sb = document.getElementById('btnSound');
  const syncSound = () => { if (sb) sb.textContent = 'おと ' + (Sound.on ? 'ON' : 'OFF'); };
  if (sb) sb.addEventListener('click', () => { Sound.toggle(); syncSound(); });
  syncSound();

  // オンライン：ルームコード入力欄
  const rc = document.getElementById('roomCode'), rg = document.getElementById('roomGo'), rcp = document.getElementById('roomCopy');
  if (rc) {
    rc.addEventListener('input', () => { rc.value = rc.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
    rc.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); SceneOnline.submit(); }
      else if (e.key === 'Escape') { SceneOnline.back(); rc.blur(); }
    });
  }
  if (rg) rg.addEventListener('click', () => SceneOnline.submit());
  if (rcp) rcp.addEventListener('click', () => SceneOnline.copyLink());
  // 招待リンク（…#ABCD）で開かれたら、スタート後に自動でその部屋へ入る
  const hashCode = (location.hash || '').slice(1).toUpperCase();
  if (Net.validCode(hashCode)) Game.pendingJoin = hashCode;

  Game.go('title');

  // タブを離れたら対戦を自動でポーズ
  document.addEventListener('visibilitychange', () => {
    const sc = Game.scene;
    if (document.hidden && Game.sceneName === 'fight' && sc && !sc.pause && sc.m.phase === 'fight') sc.openPause();
  });

  function tick() {
    Input.poll();
    if (Input.key('KeyM')) { Sound.toggle(); syncSound(); }
    Game.fr++;
    Game.scene.update();
    Input.endTick();
  }
  function draw() {
    c.setTransform(2, 0, 0, 2, 0, 0);
    c.imageSmoothingEnabled = false;
    Game.scene.render(c);
  }

  const STEP = 1000 / FPS;
  let last = performance.now(), acc = 0;
  function frame(now) {
    const dt = Math.min(100, now - last) * (Game.speed || 1);   // Game.speed はテスト用の倍速
    last = now;
    if (!Game.hold) {                                          // Game.hold はテスト用の一時停止
      acc += dt;
      let n = 0;
      while (acc >= STEP && n < 12) { acc -= STEP; n++; tick(); }
      if (n >= 12) acc = 0;
    }
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // 動作確認用（ブラウザのテストから呼ぶ）
  window.__mecha = { Game, Input, SCENES, tick, draw, CHARS, stepMatch, fit, Net, SceneOnline };
})();
