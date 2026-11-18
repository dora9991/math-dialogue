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

  /* 画面サイズ：画面以外（ヒント・ロビー・スマホのボタン）と余白を引いて、収まる最大の大きさに（大きい時は整数倍でドットをそろえる）。
     スマホではページを固定している（スクロールできない）ので、1pxもはみ出さないよう、実際の余白・すき間から数える。 */
  function fit() {
    const stage = document.getElementById('stage');
    const cs = getComputedStyle(document.getElementById('app'));
    const gap = parseFloat(cs.rowGap) || 0;
    let others = 0;                                   // 画面の下に並ぶものの高さ（すき間込み）
    for (const id of ['lobby', 'hint', 'touch']) {
      const el = document.getElementById(id);
      if (!el || el.hidden) continue;
      const st = getComputedStyle(el);
      if (st.display === 'none' || st.position === 'fixed') continue;   // 横向きのスマホでは、ボタンは画面に重ねるので場所をとらない
      others += el.offsetHeight + gap;
    }
    const frame = 4;                                  // 画面のふち（上下2pxずつ）
    const availW = stage.clientWidth;
    const baseH = document.body.classList.contains('has-touch') ? document.body.clientHeight : window.innerHeight;   // スマホは、ノッチ等を除いた高さ
    const availH = baseH - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0) - others - frame;
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
    // スマホ：キーボードを閉じたあと、ページがずれたままにならないよう戻す
    rc.addEventListener('blur', () => { if (document.body.classList.contains('has-touch')) setTimeout(() => window.scrollTo(0, 0), 60); });
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
