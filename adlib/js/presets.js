/* アドリブ・ラボ：サンプルのコード進行（画面を持たない）。
   text はそのまま「コード譜」の入力欄に入る。style は B.STYLES のid、tempo は標準のテンポ。
   ジャズの練習でよく使う進行を、基本 → ブルース → スタンダード → 裏コード → モード → 雰囲気ちがい → 練習用 の順にならべた。 */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const AL = (root.AL = root.AL || {});
  const P = (AL.P = AL.P || {});

  P.CATS = [
    { id: 'basic', jp: '基本のかたち' },
    { id: 'blues', jp: 'ブルース' },
    { id: 'standard', jp: 'スタンダードによく出る進行' },
    { id: 'sub', jp: '裏コード・代理・経過' },
    { id: 'modal', jp: 'モード・ヴァンプ' },
    { id: 'feel', jp: 'ボサノバ・バラード・ワルツ・ファンク' },
    { id: 'practice', jp: '練習用（長めの進行）' },
  ];

  P.LIST = [
    /* ---- 基本のかたち ---- */
    { id: 'ii-V-I', cat: 'basic', title: 'ii–V–I（メジャー）', style: 'swing', tempo: 120,
      text: '| Dm7 | G7 | Cmaj7 | % |',
      desc: 'ジャズのいちばんの基本。ii で準備して、V で緊張をつくり、I で着地する。リックの練習はまずここから。' },
    { id: 'ii-V-I-fast', cat: 'basic', title: 'ii–V–I（2拍ずつ・早い動き）', style: 'swing', tempo: 130,
      text: '| Dm7 G7 | Cmaj7 | Dm7 G7 | Cmaj7 |',
      desc: '1小節に ii–V を詰めた形。スタンダードでよく出てくる速さで、リックは短めのものが活躍する。' },
    { id: 'ii-V-i', cat: 'basic', title: 'ii–V–i（マイナー）', style: 'swing', tempo: 110,
      text: '| Dm7b5 | G7b9 | Cm7 | % |',
      desc: 'マイナーの ii–V–i。V7 は ♭9・♭13 を含むオルタード系の音を使うと、解決への引力が強くなる。' },
    { id: 'turn-1', cat: 'basic', title: 'I–vi–ii–V（イチロクニゴー）', style: 'swing', tempo: 130,
      text: '| Cmaj7 Am7 | Dm7 G7 | Cmaj7 Am7 | Dm7 G7 |',
      desc: '曲の終わりやAセクションの後半でおなじみの循環。2拍ずつ動くので、短いリックをつなげる練習に。' },
    { id: 'turn-2', cat: 'basic', title: 'iii–VI7–ii–V（サンロクニゴー）', style: 'swing', tempo: 130,
      text: '| Em7 A7 | Dm7 G7 | Em7 A7 | Dm7 G7 |',
      desc: '5度下行でぐるぐるつながる4コード。A7 は Dm7 へのセカンダリー・ドミナントとして働く。' },
    { id: 'turn-3', cat: 'basic', title: 'I–VI7–ii–V（リズムチェンジ風）', style: 'swing', tempo: 140,
      text: '| Cmaj7 A7 | Dm7 G7 | Cmaj7 A7 | Dm7 G7 |',
      desc: 'I–vi の vi をドミナント7th（VI7）にした形。A7 では ♭9・♯9 を混ぜると、ビバップらしい響きになる。' },
    { id: 'turn-dim', cat: 'basic', title: 'I–♯Io7–ii–V（ディミニッシュ経過）', style: 'swing', tempo: 120,
      text: '| Cmaj7 C#o7 | Dm7 G7 | Cmaj7 C#o7 | Dm7 G7 |',
      desc: '半音ずつ上がる経過のディミニッシュ。C♯o7 は「次の Dm7 へ向かう通り道」として弾くと自然。' },
    { id: 'ii-V-I-3keys', cat: 'basic', title: 'ii–V–I で3つの調をわたる', style: 'swing', tempo: 120,
      text: '| Dm7 G7 | Cmaj7 | Cm7 F7 | Bbmaj7 |\n| Bbm7 Eb7 | Abmaj7 | % | % |',
      desc: '全音ずつ下がりながら、調が C → B♭ → A♭ へ移っていく。同じリックを移調して弾く練習に向いている。' },

    /* ---- ブルース ---- */
    { id: 'blues-easy', cat: 'blues', title: 'ブルース（B♭・やさしい形）', style: 'swing', tempo: 110,
      text: '| Bb7 | Eb7 | Bb7 | Bb7 |\n| Eb7 | Eb7 | Bb7 | Bb7 |\n| F7 | Eb7 | Bb7 | F7 |',
      desc: '12小節ブルースのいちばん素朴な形。ブルース・スケールだけでも成立するので、まずは歌うように。' },
    { id: 'blues-jazz', cat: 'blues', title: 'ジャズブルース（F）', style: 'swing', tempo: 140,
      text: '| F7 | Bb7 | F7 | Cm7 F7 |\n| Bb7 | Bo7 | F7 | Am7b5 D7b9 |\n| Gm7 | C7 | F7 D7b9 | Gm7 C7 |',
      desc: 'ブルースの中に ii–V がたくさん隠れている、ジャズブルースの定番形。4小節目・8小節目・12小節目の動きに注目。' },
    { id: 'blues-bebop', cat: 'blues', title: 'バップ・ブルース（F・ii–V だらけ）', style: 'swing', tempo: 150,
      text: '| Fmaj7 | Em7b5 A7b9 | Dm7 G7 | Cm7 F7 |\n| Bb7 | Bbm7 Eb7 | Am7 | Abm7 Db7 |\n| Gm7 | C7 | Fmaj7 D7b9 | Gm7 C7 |',
      desc: 'ビバップ以降のブルース。ほとんどのコードが ii–V でつながっている。リックの「つなぎ目」を意識して。' },
    { id: 'blues-minor', cat: 'blues', title: 'マイナー・ブルース（C）', style: 'swing', tempo: 120,
      text: '| Cm7 | % | % | % |\n| Fm7 | % | Cm7 | % |\n| Ab7 | G7b9 | Cm7 | G7alt |',
      desc: 'マイナー・ペンタトニックとブルース・スケールがよく合う。9〜10小節目の A♭7 → G7 で空気が変わる。' },

    /* ---- スタンダードによく出る進行 ---- */
    { id: 'autumn', cat: 'standard', title: '枯葉と同じ動き（Gm）', style: 'swing', tempo: 130,
      text: '| Cm7 | F7 | Bbmaj7 | Ebmaj7 |\n| Am7b5 | D7b9 | Gm7 | % |',
      desc: 'メジャーの ii–V–I（Cm7–F7–B♭maj7）のあと、同じ調の平行調 Gm への ii–V–i（Am7♭5–D7♭9–Gm7）。マイナーとメジャーが仲よく並ぶ。' },
    { id: 'circle', cat: 'standard', title: '4度循環（サイクル・オブ・フィフス）', style: 'swing', tempo: 120,
      text: '| Cmaj7 | Fmaj7 | Bm7b5 | E7b9 |\n| Am7 | Dm7 | G7 | Cmaj7 |',
      desc: 'ルートが4度ずつ上がって（5度ずつ下がって）全部がつながる進行。途中に ii–V–i と ii–V–I が1つずつある。' },
    { id: 'rhythm', cat: 'standard', title: 'リズム・チェンジ（32小節 AABA）', style: 'swing', tempo: 170,
      text: '*A\n| Bbmaj7 G7 | Cm7 F7 | Dm7 G7 | Cm7 F7 |\n| Fm7 Bb7 | Ebmaj7 Ebm7 | Bbmaj7 G7 | Cm7 F7 |\n*A\n| Bbmaj7 G7 | Cm7 F7 | Dm7 G7 | Cm7 F7 |\n| Fm7 Bb7 | Ebmaj7 Ebm7 | Bbmaj7 G7 | Cm7 F7 |\n*B\n| D7 | % | G7 | % |\n| C7 | % | F7 | % |\n*A\n| Bbmaj7 G7 | Cm7 F7 | Dm7 G7 | Cm7 F7 |\n| Fm7 Bb7 | Ebmaj7 Ebm7 | Bbmaj7 G7 | Cm7 F7 |',
      desc: '無数の曲がこの進行を借りている、ジャズの共通語。A は I–VI–ii–V のくり返し、B は D7–G7–C7–F7 のドミナント連鎖。' },
    { id: 'sec-dom', cat: 'standard', title: 'セカンダリー・ドミナントの連鎖', style: 'swing', tempo: 140,
      text: '| Cmaj7 | E7 | Am7 | A7 |\n| Dm7 | D7 | G7 | G7 |',
      desc: 'E7 → Am7、A7 → Dm7、D7 → G7 と、ドミナント7th が次のコードへの V になっていく連鎖。ドミナントを「行き先」から弾く練習に。' },
    { id: 'lyd-dom', cat: 'standard', title: 'II7（♯11）をはさんだ4小節', style: 'swing', tempo: 140,
      text: '| Cmaj7 | D7#11 | Dm7 G7 | Cmaj7 |',
      desc: 'II7 はリディアン♭7 の浮遊感がきれい。「A列車」の出だしに似た動き。' },

    /* ---- 裏コード・代理・経過 ---- */
    { id: 'tritone', cat: 'sub', title: '裏コードの ii–V–I（G7 → D♭7）', style: 'swing', tempo: 130,
      text: '| Dm7 | Db7 | Cmaj7 | % |',
      desc: 'G7 のかわりに D♭7（三全音ちがい）を置くと、ルートが半音で下がってなめらか。リディアン♭7（♯11）の響き。' },
    { id: 'backdoor', cat: 'sub', title: 'バックドア ii–V（Fm7 → B♭7 → I）', style: 'swing', tempo: 120,
      text: '| Fm7 | Bb7 | Cmaj7 | % |',
      desc: 'サブドミナント・マイナーから入る「裏口」の解決。B♭7 は全音下から I に入る。ミクソリディアンで。' },
    { id: 'cliche', cat: 'sub', title: 'マイナー・クリシェ', style: 'ballad', tempo: 70,
      text: '| Cm | Cm(maj7) | Cm7 | Cm6 |',
      desc: 'ルートは動かず、内声の音が C → B → B♭ → A と半音ずつ下がる。メロディックマイナーの音が活躍する。' },
    { id: 'major-thirds', cat: 'sub', title: '長3度ずつ調が移る進行（コルトレーン・チェンジ系）', style: 'swing', tempo: 150,
      text: '| Bmaj7 D7 | Gmaj7 Bb7 | Ebmaj7 | Am7 D7 |\n| Gmaj7 Bb7 | Ebmaj7 F#7 | Bmaj7 | Fm7 Bb7 |',
      desc: 'B・G・E♭ の3つの調が長3度ずつ離れて並ぶ、上級者向けの進行。V7 → I の動きをひとつずつ丁寧に。' },

    /* ---- モード・ヴァンプ ---- */
    { id: 'dorian', cat: 'modal', title: 'ドリアン・モード（Dm7 ⇔ E♭m7）', style: 'swing', tempo: 140,
      text: '| Dm7 | % | % | % |\n| Ebm7 | % | Dm7 | % |',
      desc: 'コードが長く続くので、動きにこだわらず1つのスケールでじっくり。半音上の E♭m7 へ移るところで色が変わる。' },
    { id: 'funk-vamp', cat: 'modal', title: 'ファンク・ヴァンプ（Cm7 – F7）', style: 'funk', tempo: 100,
      text: '| Cm7 | % | F7 | % |',
      desc: 'Cm7 はドリアン、F7 はミクソリディアンで、ブルース・スケールを混ぜると雰囲気が出る。リズムを大事に。' },
    { id: 'lydian', cat: 'modal', title: '平行移動するリディアン', style: 'ballad', tempo: 76,
      text: '| Cmaj7#11 | % | Dbmaj7#11 | % |',
      desc: 'maj7♯11 が半音上にスライドするだけの、浮遊感の進行。ペンタトニックを平行移動して弾くと映える。' },

    /* ---- ボサノバ・バラード・ワルツ・ファンク ---- */
    { id: 'bossa', cat: 'feel', title: 'ボサノバ（I – VI7 – ii – V – iii – VI7 – ii – ♭II7）', style: 'bossa', tempo: 128,
      text: '| Cmaj7 | A7b13 | Dm7 | G7b9 |\n| Em7 | A7 | Dm7 Db7 | Cmaj7 |',
      desc: 'イーブン8分のボサノバ。最後の Dm7 → D♭7 → Cmaj7 は裏コードの ii–V–I。軽やかに、音を詰めすぎずに。' },
    { id: 'ballad', cat: 'feel', title: 'バラード（E♭）', style: 'ballad', tempo: 64,
      text: '| Ebmaj7 | Abmaj7 | Dm7b5 G7b9 | Cm7 |\n| Fm7 | Bb7 | Ebmaj7 Cm7 | Fm7 Bb7 |',
      desc: 'ゆったりしたバラード。音の数を減らして、長い音と間（ま）で語る。リックは「間」を含むものを選ぶと映える。' },
    { id: 'waltz', cat: 'feel', title: 'ジャズワルツ（3拍子）', style: 'waltz', tempo: 150,
      text: '| Dm7 | G7 | Cmaj7 | Fmaj7 |\n| Bm7b5 | E7b9 | Am7 | % |',
      desc: '3拍子のジャズ。メジャーの ii–V–I のあと、平行調（Am）への ii–V–i につながる。1小節＝1コードで、リックは短くまとまる。' },
    { id: 'funk-g7', cat: 'feel', title: 'ファンク（Cm7 – F7 – G7alt）', style: 'funk', tempo: 104,
      text: '| Cm7 | % | F7 | % |\n| Cm7 | % | G7alt | % |',
      desc: '8ビートのファンク。最後の G7alt でぐっと緊張して、頭の Cm7 に戻る。' },

    /* ---- 練習用（長めの進行） ---- */
    { id: 'twelve-keys', cat: 'practice', title: 'ii–V–I を12のキーで（全音ずつ下がる）', style: 'swing', tempo: 110,
      text: '| Dm7 G7 | Cmaj7 | Cm7 F7 | Bbmaj7 |\n| Bbm7 Eb7 | Abmaj7 | Abm7 Db7 | Gbmaj7 |\n| F#m7 B7 | Emaj7 | Em7 A7 | Dmaj7 |\n| C#m7 F#7 | Bmaj7 | Bm7 E7 | Amaj7 |\n| Am7 D7 | Gmaj7 | Gm7 C7 | Fmaj7 |\n| Fm7 Bb7 | Ebmaj7 | Ebm7 Ab7 | Dbmaj7 |',
      desc: '24小節かけて12のキーをひとまわり。苦手なキーを見つけて、そこだけ「範囲くり返し」で練習するのにどうぞ。' },
    { id: 'minor-keys', cat: 'practice', title: 'ii–V–i を3つのマイナーで', style: 'swing', tempo: 110,
      text: '| Dm7b5 G7b9 | Cm7 | Cm7b5 F7b9 | Bbm7 |\n| Bbm7b5 Eb7b9 | Abm7 | % | % |',
      desc: 'C マイナー → B♭ マイナー → A♭ マイナーと全音ずつ下がる。♭9・♭13 のオルタードの音を身体になじませる練習。' },
  ];

  P.byId = {};
  P.LIST.forEach(p => { P.byId[p.id] = p; });
  P.DEFAULT_ID = 'autumn';

  if (typeof module !== 'undefined' && module.exports) module.exports = AL;
})();
