/* つながるアプリ：バスケ・グロウを「入口」にして、クラブで使うほかのアプリへ行けるようにする。
   - 試合の記録・場面の切り出し：バスケ タップ記録（同じサイトの /basket-tap/）。?from= で、戻るときの行き先を伝える
   - 保護者会：部活保護者会アプリ（予定・出欠・配車・会計など。べつのサイト・べつのログイン）
   どちらも、同じタブで開く（スマホの「戻る」で、グロウに戻れる）。
   BC.links.tap(from)   … タップ記録の URL（from：'grow-home'・'grow-club'・'grow-more'）
   BC.links.HOGOSHA     … 保護者会アプリの URL
   BC.links.forAdult()  … ホームに出すか（コーチとしてログインしている・学年が「おとな」）
   BC.links.rows(row, from) … 「もっと」・コーチのページに並べる行（row は、その画面の行の作り方） */
(function () {
  const BC = (window.BC = window.BC || {});
  const TAP = 'https://dora9991.github.io/math-dialogue/basket-tap/';
  const HOGOSHA = 'https://dora9991.github.io/hogosha-app/';
  const tap = (from) => TAP + (from ? '?from=' + encodeURIComponent(from) : '');
  const ls = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  function forAdult() {
    const sess = BC.club && BC.club.session ? BC.club.session() : ls('bc.club');
    if (sess && sess.me && sess.me.role === 'coach') return true;
    const me = ls('bc.me');
    return !!(me && me.grade === 'a');
  }
  const ITEMS = [
    { key: 'tap', icon: 'camera', title: '試合の記録・場面の切り出し', sub: 'バスケ タップ記録：タップで記録して、試合の動画から 必要な場面だけを取り出す' },
    { key: 'hogosha', icon: 'people', title: '保護者会', sub: '部活保護者会アプリ：予定・出欠・配車・お弁当・連絡・会計（べつのログイン）' },
  ];
  const href = (it, from) => (it.key === 'tap' ? tap(from) : HOGOSHA);
  // row(href, icon, title, sub) は、その画面の行の作り方（title は HTML のまま入る）
  function rows(row, from) {
    return ITEMS.map((it) => row(href(it, from), it.icon, it.title + '<span class="go-out" aria-label="（べつのページ）">↗</span>', it.sub)).join('');
  }
  BC.links = { TAP, HOGOSHA, tap, forAdult, rows, ITEMS, href };
})();
