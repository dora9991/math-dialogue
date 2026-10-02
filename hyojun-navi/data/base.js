/* 授業ナビ 標準版 — データの入れ物と、書きこむための道具。
   ここに入るものは、学習指導要領の内容と、数学そのものをもとに、この教材のために新しく書いたもの。
   本や市販の教材の要約・言いかえ・転記は入れない。

   PL.unit({ key, grade, name, short, color, goals, overview, groups })
   PL.plan(単元のキー, [[型, めあて, 内容], …])        … 年間計画（1行＝1時間）
       型：'探'＝課題解決  '例'＝例題と練習  '遊'＝ゲーム・活動  '練'＝習熟・教え合い  '活'＝活用・表現  '確'＝まとめ
   PL.events(学年, [{ m:月, w:その月の何週目, n:コマ数, name, exam }…])   … 授業以外に使うコマ（定期テスト・学期のまとめ）
   PL.card(時間のID, { goal, prep, flow, think, say, see, tips, board, matome })   … 授業構想と板書計画
       goal ＝ ねらい
       prep ＝ 準備するもの（なければ書かない）
       flow ＝ [[場面, 分, すること, 発問1, 発問2…], …]   … 「本時の中心」の部分だけ（はじめの小テスト・演習・振り返りは、型ごとに決まっている）
       think＝ この時間の「考える問い」（ここだけは、すぐに教えずに待つ）
       say  ＝ 表現する場面（だれに・何を・どう表すか）
       see  ＝ 見取り（思考・判断・表現などを、どこで・何を見て判断するか）
       tips ＝ つまずきと手立て
       board＝ 板書計画 [[左の見出し, 行…], [中の見出し, 行…], [右の見出し, 行…]]
               行のはじめのしるし：「□」＝枠で囲む（課題・問題）　「★」＝黄色で書く（大事なこと・まとめ）　「→」＝生徒の考え・答え（白）　「？」＝問い（青）
       matome＝まとめ（スライドの最後に出る） */
(function () {
  const LDB = window.LDB = { units: [], lessons: [], events: {}, worksheets: {}, drills: {}, quizzes: {} };
  const byId = {};
  const pad = n => String(n).padStart(2, '0');
  window.PL = {
    events(grade, list) { LDB.events[grade] = list; },
    unit(u) { LDB.units.push(Object.assign({ grade: 1, goals: [], groups: [] }, u)); },
    plan(key, rows) {
      rows.forEach((r, i) => {
        const l = { id: key + '-' + pad(i + 1), unit: key, no: i + 1, type: r[0], title: r[1], sub: r[2] || '' };
        LDB.lessons.push(l); byId[l.id] = l;
      });
    },
    card(id, c) {
      const l = byId[id];
      if (!l) { console.warn('[授業ナビ 標準版] 年間計画にない時間の授業構想：' + id); return; }
      Object.assign(l, c, { card: true });
      l.flow = (c.flow || []).map(f => Array.isArray(f) ? { st: f[0], min: f[1], tx: f[2], q: f.slice(3) } : f);
    },
    cards(key, list) { list.forEach((c, i) => { if (c) PL.card(key + '-' + pad(i + 1), c); }); }
  };
})();
