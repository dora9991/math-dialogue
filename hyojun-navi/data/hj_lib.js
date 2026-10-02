/* 書くための小道具（ws_lib.js・qz_lib.js の上にのせる）。
     EX(番号, 例題の文, 行数, 解き方, {k, w})   … 例題（枠つき）＋「解き方」の記入欄。解き方は解答例（スライドでは1行ずつ出る）
     RN(見出し, 問いの文, 小問のならび, 列, 行)  … 練習（小問を 1〜3 列に）。小問は [問題, 解答例, 検算, {rows, p, t}]
     TH(問いの文, 行数, 解答例, {k, w})          … この時間の「考える問い」（枠つき）。考えを書く欄がつく
     GM(ルールの文, 行数)                         … ゲーム・活動のルール（枠つき）
     V(種類, 式)                                 … 検算の指定 { v, vp } をつくる
   演習プリントの裏の最後の見出しは WSL.NYU()（「入試に挑戦」）。問題は、入試でよく出る形に合わせてつくったもの（実際の入試問題ではない）。
   検算の種類は tools/verify.py の説明を見る。 */
(function () {
  const { K, T, W, QS } = WSL;
  WSL.EX = (n, text, rows, sol, o) => [K('例題' + (n == null ? '' : n), text, o && o.k), W('解き方', rows, sol, '', o && o.w)];
  WSL.RN = (label, lead, items, cols, rows, start) => [T(label, lead), ...QS(items, cols, rows, start)];
  WSL.TH = (text, rows, ans, o) => [K('考えよう', text, o && o.k), W('', rows, ans, '', o && o.w)];
  WSL.GM = (text, rows) => K('ルール', text, rows ? { rows } : undefined);
  WSL.V = (v, vp) => ({ v, vp });
  WSL.NYU = text => WSL.SEC('入試に挑戦', text || '入試でよく出る形に合わせてつくった問題に挑戦しよう。');
  // 根号の多い単元の授業構想用：文字の中の √2、√(4×5) を、上に線がのびる根号（√{2}、√{4×5}）に直す。PL.cards('単元', WSL.rootfix([ … ])) と書く
  const rq = s => s.replace(/√\(((?:[^()]|\([^()]*\))*)\)/g, '√{$1}').replace(/√(\d+(?:\.\d+)?|[a-z])/g, '√{$1}');
  WSL.rootfix = o => typeof o === 'string' ? rq(o) : Array.isArray(o) ? o.map(WSL.rootfix)
    : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, WSL.rootfix(v)])) : o;
})();
