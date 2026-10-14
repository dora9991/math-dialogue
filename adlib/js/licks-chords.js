/* リック辞典：コード1つに使えるリック（maj7／m7／m6／m(maj7)／m7♭5／dim7）。
   音は C の調で書いてある（Cmaj7・Cm7 など）。 */
(function () {
  'use strict';
  const L = (typeof window !== 'undefined' ? window : globalThis).AL.L;

  /* ================= maj7：トニックのメジャー（イオニアン／リディアン） ================= */
  L.pack({ ctx: 'maj7', ref: 'Cmaj7', segs: [4], lvl: 1 }, [
    ['ビバップ・メジャー下降（根音から）', 'C5 B4 A4 Ab4 G4 F4 E4 D4', 'ビバップ・メジャー（♭6 を足した8音）で降りる。拍の頭は 1・6・5・3。', { tags: ['bebop', 'scale'] }],
    ['ビバップ・メジャー下降（5度から）', 'G5 F5 E5 D5 C5 B4 A4 Ab4', '5度から降りる。拍の頭は 5・3・1・6。', { tags: ['bebop', 'scale'] }],
    ['ビバップ・メジャー上昇', 'C4 D4 E4 F4 G4 Ab4 A4 B4', '根音から上がる。拍の頭は 1・3・5・6、最後の B（7度）が光る。', { tags: ['bebop', 'scale'] }],
    ['分散和音（上がって降りる）', 'C4 E4 G4 B4 / C5 B4 G4 E4', '1-3-5-7 を上がって折り返す。', { tags: ['arp'] }],
    ['4分音符の下行アルペジオ', 'B4:q G4:q E4:q C4:q', '7-5-3-1。', { tags: ['arp', 'rhythm'] }],
    ['3度から（Em7 の分散和音）', 'E4 G4 B4 D5 / E5 D5 B4 G4', '3-5-7-9。Cmaj9 の響き。maj7 の定番のアッパーストラクチャー。', { tags: ['arp', 'upper'] }],
    ['5度から（G の分散和音）', 'G4 B4 D5 F#5 E5 D5 B4 G4', '5-7-9-♯11。Gmaj7 の分散で、C のリディアンの響きに。', { tags: ['arp', 'lydian'], lvl: 2 }],
    ['1-2-3-5 のデジタル・パターン', 'C4 D4 E4 G4 / E4 D4 C4 B3', '1-2-3-5 上行、3-2-1-7 下行。', { tags: ['digital'] }],
    ['3-5-7-9 のデジタル・パターン', 'E4 G4 B4 D5 / D5 B4 G4 E4', '3-5-7-9 を上がって折り返す。', { tags: ['digital'] }],
    ['メジャー・ペンタトニック', 'C4 D4 E4 G4 A4 G4 E4 D4', 'C・D・E・G・A の5音。きれいで安定した響き。', { tags: ['pent'] }],
    ['ペンタトニック（Em ペンタ）', 'E4 G4 A4 B4 D5 B4 A4 G4', 'E マイナー・ペンタ（3-5-6-7-9）。Cmaj9 の洗練された響き。', { tags: ['pent', 'modern'], lvl: 2 }],
    ['半音アプローチで3度へ', 'Eb4 E4 G4 B4 C5 B4 G4 E4', '♭3（E♭）から3度へ半音で入る。', { tags: ['chromatic'] }],
    ['半音アプローチで5度へ', 'F#4 G4 B4 D5 C5 B4 G4 E4', '♯4（F♯）から5度へ。リディアンの響きを足して始める。', { tags: ['chromatic', 'lydian'], lvl: 2 }],
    ['3度のエンクロージャー', 'C5 B4 G4 F4:s Eb4:s E4 G4 B4 C5', '3度（E）を上（F）と下（E♭）から挟んで入る。', { tags: ['enclosure'], lvl: 2 }],
    ['根音のエンクロージャー', 'D5 B4 C5 E5 G5 E5 C5 G4', '根音（C）を上（D）と下（B）から挟んでから分散。', { tags: ['enclosure', 'bebop'], lvl: 2 }],
    ['3連符の上行', 'C4:t E4:t G4:t B4:t D5:t B4:t G4:q E4:q', '3連符でスムーズに上がり、4分で降りる。', { tags: ['triplet', 'arp'], lvl: 2 }],
    ['シンコペーションで入る', 'r E4 G4 B4 C5 B4 G4:q', '裏から入って、3-5-7-1-7-5。', { tags: ['rhythm'], lvl: 2 }],
    ['間をとる', 'E4 G4 B4 D5 C5:q r:q', 'フレーズの後ろに休符。', { tags: ['rhythm'] }],
    ['ガイドトーン（7→3）', 'B4:q. A4 G4:q E4:q', '7th から3度へ降りるガイドトーンの線。', { tags: ['guide', 'rhythm'] }],
    ['付点のリズム', 'E4:e. F#4:s G4 B4 C5 D5 E5:q', '付点8分＋16分の跳ねるリズムで駆け上がる。', { tags: ['rhythm'], lvl: 2 }],
    ['9th から降りる', 'D5 C5 B4 A4 G4 E4 D4 C4', '9th から根音までスケールで降りる。', { tags: ['scale'] }],
    ['6度を含む上昇（C6 の響き）', 'C4 E4 G4 A4 B4 C5 D5 E5', '6度（A）を通って上がる。明るく開放的。', { tags: ['scale'] }],
    ['16分音符のラン', '@s E4 F4 G4 Ab4 A4 B4 C5 D5 E5 D5 C5 B4 A4 G4 E4 C4', '16分音符のビバップ・メジャーを往復。テンポを落として。', { tags: ['bebop', 'scale'], lvl: 3 }],
    ['5度の下から', 'G3 B3 C4 E4 G4 E4 C4 B3', '低い音域から。導音（B）で終わって次を呼ぶ。', { tags: ['arp'] }],
    ['Dmaj トライアド（9-♯11-13）', 'D4 F#4 A4 D5 A4 F#4 D4 E4', 'リディアンの2度のトライアド。明るい浮遊感。', { tags: ['lydian', 'upper'], lvl: 2 }],
  ]);
  L.pack({ ctx: 'maj7', ref: 'Cmaj7', segs: [2], lvl: 1 }, [
    ['短い分散', 'E4 G4 B4:q', '3-5-7。', { tags: ['arp'] }],
    ['短い下降', 'C5 B4 G4:q', '1-7-5。', { tags: ['arp'] }],
    ['5度から1度へ', 'G4 A4 B4 C5', '5-6-7-1 と上がる。', { tags: ['scale'] }],
    ['3度のエンクロージャー', 'F4 Eb4 E4:q', '上と下から3度を挟む。', { tags: ['enclosure'] }],
    ['9th から降りる', 'D5 C5 B4:q', '9-1-7。', { tags: ['scale'] }],
    ['根音から3度へ', 'C4 D4 E4 G4', '1-2-3-5。', { tags: ['digital'] }],
    ['裏から入る', 'r:e E4 G4 B4', '3-5-7 を裏から。', { tags: ['rhythm'] }],
    ['3度と5度', 'E4:q G4:q', '2つの音だけで間を作る。', { tags: ['rhythm'] }],
    ['リディアンの一音', 'G4 F#4 E4 D4', '5-♯4-3-2。', { tags: ['lydian'] }],
  ]);

  /* ================= maj7#11：リディアン（IV・♭VI・♭III） ================= */
  L.pack({ ctx: 'maj7#11', ref: 'Cmaj7#11', segs: [4], lvl: 1 }, [
    ['リディアン下降', 'C5 B4 A4 G4 F#4 E4 D4 C4', '♯11（F♯）を通って降りる。浮遊感のある響き。', { tags: ['lydian', 'scale'] }],
    ['リディアン上昇', 'C4 D4 E4 F#4 G4 A4 B4 C5', '根音から上がる、リディアン・スケール。', { tags: ['lydian', 'scale'] }],
    ['G の分散和音（5-7-9-♯11）', 'G4 B4 D5 F#5 D5 B4 G4 E4', '5度の上のメジャー7th。maj7(♯11) の響き。', { tags: ['lydian', 'arp'] }],
    ['D トライアド（9-♯11-13）', 'D4 F#4 A4 D5 B4 A4 F#4 E4', '2度のメジャー・トライアド。リディアンの決まり手。', { tags: ['lydian', 'upper'], lvl: 2 }],
    ['Em の分散にF♯をそえて', 'E4 G4 B4 D5 F#5 E5 D5 B4', '3-5-7-9-♯11。maj13(♯11) の響き。', { tags: ['lydian', 'arp'], lvl: 2 }],
    ['♯11 から5度へ', 'F#4 G4 A4 B4 C5 B4 G4 E4', '♯11 を強調してから解決。', { tags: ['lydian'] }],
    ['ペンタトニック（D メジャー）', 'D4 E4 F#4 A4 B4 A4 F#4 E4', 'D・E・F♯・A・B。♯11 と 7th が出る明るい色。', { tags: ['lydian', 'pent'], lvl: 2 }],
    ['4分音符で歌う', 'E4:q F#4:q G4:q B4:q', '3-♯11-5-7 をゆったりと。', { tags: ['lydian', 'rhythm'] }],
    ['3連符で降りる', 'B4:t A4:t G4:t F#4:t E4:t D4:t C4:q E4:q', '3連符のリディアン。', { tags: ['lydian', 'triplet'], lvl: 2 }],
    ['根音と♯11 のトライトーン', 'C4 F#4 G4 B4 C5 B4 G4 F#4', '根音と♯11 のトライトーンを聞かせる。', { tags: ['lydian', 'arp'] }],
  ]);

  /* ================= min7：ドリアン（IIm7・IIIm7・VIm7・Im7） ================= */
  L.pack({ ctx: 'min7', ref: 'Cm7', segs: [4], lvl: 1 }, [
    ['ドリアン下降（根音から）', 'C5 Bb4 A4 G4 F4 Eb4 D4 C4', 'ドリアン・スケールで降りる。拍の頭は 1・6・4・9 などの色。', { tags: ['scale'] }],
    ['ビバップ・ドリアン下降', 'C5 B4 Bb4 A4 G4 F4 Eb4 D4', '導音（B）を足したビバップの下降。拍の頭が 1・♭7・5・♭3。', { tags: ['bebop', 'scale'] }],
    ['ビバップ・ドリアン下降（♭7から）', 'Bb4 A4 G4 F4 Eb4 D4 C4 B3', '♭7 から。拍の頭は ♭7・5・♭3・1。', { tags: ['bebop', 'scale'] }],
    ['ドリアン上昇', 'C4 D4 Eb4 F4 G4 A4 Bb4 C5', '根音から上がるドリアン。6度（A）が特徴。', { tags: ['scale'] }],
    ['分散和音（上がって降りる）', 'C4 Eb4 G4 Bb4 / C5 Bb4 G4 Eb4', '1-♭3-5-♭7。', { tags: ['arp'] }],
    ['♭3 から（E♭maj7 の分散）', 'Eb4 G4 Bb4 D5 / C5 Bb4 G4 Eb4', '♭3-5-♭7-9。Cm9 の響きになる。', { tags: ['arp', 'upper'] }],
    ['5度から（Gm7 の分散）', 'G4 Bb4 D5 F5 Eb5 D5 Bb4 G4', '5-♭7-9-11。m11 の響き。', { tags: ['arp', 'upper'], lvl: 2 }],
    ['4分音符の下行アルペジオ', 'Bb4:q G4:q Eb4:q C4:q', '♭7-5-♭3-1。', { tags: ['arp', 'rhythm'] }],
    ['1-2-♭3-5 のデジタル・パターン', 'C4 D4 Eb4 G4 / Eb4 D4 C4 Bb3', '1-2-♭3-5 上行、♭3-2-1-♭7 下行。', { tags: ['digital'] }],
    ['マイナー・ペンタトニック', 'C4 Eb4 F4 G4 Bb4 G4 F4 Eb4', 'マイナー・ペンタトニックの上下。', { tags: ['pent'] }],
    ['マイナー・ペンタトニック（上昇）', 'G4 Bb4 C5 Eb5 F5 Eb5 C5 Bb4', '5度から上のペンタ。', { tags: ['pent'] }],
    ['4度のペンタ（Dm7 ペンタ風）', 'D4 F4 G4 A4 C5 A4 G4 F4', 'D・F・G・A・C。ドリアンの 9-11-5-13-♭7 でモダンな響き。', { tags: ['pent', 'modern'], lvl: 2 }],
    ['4度の積み重ね', 'D4 G4 C5 F5 C5 G4 D4 Eb4', '4度を重ねた形（D-G-C-F）。マッコイ・タイナー風のモード・サウンド。', { tags: ['quartal', 'modern'], lvl: 2 }],
    ['半音アプローチで♭3 へ', 'D4 E4 Eb4 G4 Bb4 G4 Eb4 C4', '3度（E）経由で♭3（E♭）に解決する、ブルースの色。', { tags: ['chromatic', 'blues'], lvl: 2 }],
    ['半音アプローチで5度へ', 'Gb4 G4 Bb4 D5 C5 Bb4 G4 Eb4', '♭5（G♭）から5度へ半音で入る。', { tags: ['chromatic'], lvl: 2 }],
    ['♭3 のエンクロージャー', 'C5 Bb4 G4 F4:s E4:s Eb4 G4 Bb4 C5', '♭3（E♭）を上（F）と下（E）から挟む。', { tags: ['enclosure', 'bebop'], lvl: 2 }],
    ['3連符の上行', 'C4:t Eb4:t G4:t Bb4:t D5:t Bb4:t G4:q Eb4:q', '3連符で上がり、4分で降りる。', { tags: ['triplet', 'arp'], lvl: 2 }],
    ['シンコペーションで入る', 'r Eb4 G4 Bb4 C5 Bb4 G4:q', '裏から入る。', { tags: ['rhythm'], lvl: 2 }],
    ['間をとる', 'Eb4 G4 Bb4 C5 Bb4:q r:q', 'フレーズの後ろに休符。', { tags: ['rhythm'] }],
    ['ガイドトーン（♭7→♭3）', 'Bb4:q. A4 G4:q Eb4:q', '♭7th から♭3 へ降りるガイドトーン。', { tags: ['guide', 'rhythm'] }],
    ['11th をそえた下降', 'F5 Eb5 D5 C5 Bb4 G4 F4 Eb4', '11th（F）から降りる。m11 の渋い響き。', { tags: ['scale'] }],
    ['ブルージーなマイナー', 'C4 Eb4 F4 Gb4 G4 Bb4 C5:q', 'ブルース・スケール（♭5 を含む）で上がる。', { tags: ['blues', 'scale'] }],
    ['16分音符のペンタ・ラン', '@s C4 Eb4 F4 G4 Bb4 C5 Eb5 C5 Bb4 G4 F4 Eb4 C4 Eb4 F4 G4', '16分音符でペンタを往復。', { tags: ['pent'], lvl: 3 }],
    ['6度（A）を含む上昇', 'Eb4 F4 G4 A4 Bb4 C5 D5 Eb5', '♭3 から上がるドリアン。', { tags: ['scale'] }],
    ['オクターブ跳躍の動機', 'C4 G4 Eb5 D5 C5 Bb4 G4:q', '5度・短6度の跳躍で始める大きな動機。', { tags: ['arp'], lvl: 2 }],
  ]);
  L.pack({ ctx: 'min7', ref: 'Cm7', segs: [2], lvl: 1 }, [
    ['短い分散', 'Eb4 G4 Bb4:q', '♭3-5-♭7。', { tags: ['arp'] }],
    ['短い下降', 'C5 Bb4 G4:q', '1-♭7-5。', { tags: ['arp'] }],
    ['ペンタの下降', 'Bb4 G4 F4 Eb4', '♭7-5-4-♭3。', { tags: ['pent'] }],
    ['上行のドリアン', 'D4 Eb4 F4 G4', '2-♭3-4-5。', { tags: ['scale'] }],
    ['♭3 の半音アプローチ', 'D4 E4 Eb4:q', '2-3-♭3。', { tags: ['chromatic'] }],
    ['9th から降りる', 'D5 C5 Bb4:q', '9-1-♭7。', { tags: ['scale'] }],
    ['4度の積み重ね', 'D4 G4 C5:q', '9-5-1。', { tags: ['quartal'] }],
    ['裏から入る', 'r:e Eb4 G4 Bb4', '裏から♭3-5-♭7。', { tags: ['rhythm'] }],
    ['根音の周り', 'Bb4 C5 D5 C5', '♭7-1-9-1。', { tags: ['digital'] }],
    ['11th から降りる', 'F5 Eb5 D5 C5', '11-♭3-9-1。', { tags: ['scale'] }],
  ]);

  /* ================= min6：マイナー6th（ドリアン／メロディックマイナー） ================= */
  L.pack({ ctx: 'min6', ref: 'Cm6', segs: [4], lvl: 1 }, [
    ['メロディックマイナー上昇', 'C4 D4 Eb4 F4 G4 A4 B4 C5', '6度（A）と7度（B）を含むメロディックマイナー。m6 の定番。', { tags: ['scale'] }],
    ['メロディックマイナー下降', 'C5 B4 A4 G4 F4 Eb4 D4 C4', 'メロディックマイナーの下降。', { tags: ['scale'] }],
    ['m6 の分散和音', 'C4 Eb4 G4 A4 G4 Eb4 C4 A3', '1-♭3-5-6 の分散。', { tags: ['arp'] }],
    ['♭3-5-6-1 の分散', 'Eb4 G4 A4 C5 A4 G4 Eb4 C4', '♭3 と 6度（A）の組み合わせが m6 の特徴。', { tags: ['arp'] }],
    ['6度から降りる', 'A4 G4 F4 Eb4 D4 C4 D4 Eb4', '6度（A）から降りて、戻る。', { tags: ['scale'] }],
    ['ペンタ（Cm6 ペンタ）', 'C4 Eb4 F4 G4 A4 G4 F4 Eb4', '1-♭3-4-5-6 のペンタ。', { tags: ['pent'] }],
    ['半音アプローチで6度へ', 'G4 Ab4 A4 C5 A4 G4 Eb4 C4', '5度から♭6 を経由して6度へ半音で。', { tags: ['chromatic'], lvl: 2 }],
    ['シンコペーションの入り', 'r Eb4 G4 A4 C5 A4 G4:q', '裏から入る。', { tags: ['rhythm'], lvl: 2 }],
    ['3連符の上行', 'C4:t Eb4:t G4:t A4:t C5:t A4:t G4:q Eb4:q', '3連符で上がる。', { tags: ['triplet', 'arp'], lvl: 2 }],
    ['間をとる', 'Eb4 G4 A4 C5 G4:q r:q', 'フレーズの後ろに休符。', { tags: ['rhythm'] }],
  ]);

  /* ================= minmaj7：マイナー・メジャー7th（メロディックマイナー／ハーモニックマイナー） ================= */
  L.pack({ ctx: 'minmaj7', ref: 'Cm(maj7)', segs: [4], lvl: 1 }, [
    ['m(maj7) の分散和音', 'C4 Eb4 G4 B4 C5 B4 G4 Eb4', '1-♭3-5-7。', { tags: ['arp'] }],
    ['メロディックマイナー上昇', 'C4 D4 Eb4 F4 G4 A4 B4 C5', 'メロディックマイナーで上がる。', { tags: ['scale'] }],
    ['ハーモニックマイナー下降', 'C5 B4 Ab4 G4 F4 Eb4 D4 C4', '♭6-7 の増2度を含む、エキゾチックなライン。', { tags: ['scale'] }],
    ['導音（B）から降りる', 'B4 Ab4 G4 F4 Eb4 D4 C4 B3', '導音から降りて、次の根音を呼ぶ。', { tags: ['scale'] }],
    ['7度から降りる分散', 'B4 G4 Eb4 C4 Eb4 G4 B4 C5', '7-5-♭3-1 と降りて、戻る。', { tags: ['arp'] }],
    ['メロディックマイナーの3連符', 'C4:t D4:t Eb4:t G4:t A4:t B4:t C5:q B4:q', '3連符のメロディックマイナー。', { tags: ['triplet', 'scale'], lvl: 2 }],
    ['Eb メジャー（♭3-5-7-9）の分散', 'Eb4 G4 B4 D5 B4 G4 Eb4 C4', 'E♭ 増3和音を含む、m(maj7) 特有の響き。', { tags: ['arp', 'upper'], lvl: 2 }],
    ['間をとる', 'Eb4 G4 B4 C5 B4:q r:q', 'フレーズの後ろに休符。', { tags: ['rhythm'] }],
  ]);
  L.pack({ ctx: 'minmaj7', ref: 'Cm(maj7)', segs: [2], lvl: 1 }, [
    ['短い分散', 'Eb4 G4 B4:q', '♭3-5-7。', { tags: ['arp'] }],
    ['導音から根音へ', 'G4 Ab4 B4 C5', '5-♭6-7-1。', { tags: ['scale'] }],
    ['メロディックマイナー', 'D4 Eb4 F4 G4', '2-♭3-4-5。', { tags: ['scale'] }],
  ]);

  /* ================= m7b5：ハーフディミニッシュ（ロクリアン♯2） ================= */
  L.pack({ ctx: 'm7b5', ref: 'Cm7b5', segs: [4], lvl: 1 }, [
    ['ロクリアン♯2 の下降', 'C5 Bb4 Ab4 Gb4 F4 Eb4 D4 C4', '9th が自然な音のロクリアン♯2 で降りる。', { tags: ['scale'] }],
    ['ロクリアン♯2 の上昇', 'C4 D4 Eb4 F4 Gb4 Ab4 Bb4 C5', '根音から上がる。♭5（G♭）が目立つ。', { tags: ['scale'] }],
    ['m7♭5 の分散和音', 'C4 Eb4 Gb4 Bb4 C5 Bb4 Gb4 Eb4', '1-♭3-♭5-♭7。', { tags: ['arp'] }],
    ['♭3 から（E♭m(maj7) の分散）', 'Eb4 Gb4 Bb4 D5 Bb4 Gb4 Eb4 C4', '♭3-♭5-♭7-9。Cm7♭5(9) の響きになる。', { tags: ['arp', 'upper'] }],
    ['11th をそえた分散', 'Gb4 Bb4 C5 F5 Eb5 C5 Bb4 Gb4', '♭5-♭7-1-11。モダンな m7♭5。', { tags: ['arp', 'modern'], lvl: 2 }],
    ['♭5 のエンクロージャー', 'C5 Bb4 Ab4 G4:s F4:s Gb4 Bb4 C5 Bb4', '♭5（G♭）を上（G）と下（F）から挟んで入る。', { tags: ['enclosure'], lvl: 3 }],
    ['ペンタ（Fm ペンタ）', 'F4 Ab4 Bb4 C5 Eb5 C5 Bb4 Ab4', 'F マイナー・ペンタ（11-♭13-♭7-1-♭3）。m7♭5 に合う定番。', { tags: ['pent'] }],
    ['E♭m ペンタ', 'Eb4 Gb4 Ab4 Bb4 Db5 Bb4 Ab4 Gb4', 'E♭ のマイナー・ペンタ。', { tags: ['pent'], lvl: 2 }],
    ['4分音符の下行', 'Bb4:q Gb4:q Eb4:q C4:q', '♭7-♭5-♭3-1。', { tags: ['arp', 'rhythm'] }],
    ['シンコペーションの入り', 'r Eb4 Gb4 Bb4 C5 Bb4 Gb4:q', '裏から入る。', { tags: ['rhythm'], lvl: 2 }],
    ['3連符の上行', 'C4:t Eb4:t Gb4:t Bb4:t C5:t Bb4:t Gb4:q Eb4:q', '3連符のアルペジオ。', { tags: ['triplet', 'arp'], lvl: 2 }],
    ['間をとる', 'Eb4 Gb4 Bb4 C5 Bb4:q r:q', 'フレーズの後ろに休符。', { tags: ['rhythm'] }],
  ]);
  L.pack({ ctx: 'm7b5', ref: 'Cm7b5', segs: [2], lvl: 1 }, [
    ['短い分散', 'Eb4 Gb4 Bb4:q', '♭3-♭5-♭7。', { tags: ['arp'] }],
    ['短い下降', 'C5 Bb4 Gb4:q', '1-♭7-♭5。', { tags: ['arp'] }],
    ['ロクリアン', 'Ab4 Gb4 F4 Eb4', '♭6-♭5-4-♭3。', { tags: ['scale'] }],
    ['11th から', 'F4 Eb4 D4 C4', '11-♭3-9-1。', { tags: ['scale'] }],
    ['♭5 を狙う', 'D4 Eb4 F4 Gb4', '9-♭3-11-♭5。', { tags: ['scale'] }],
  ]);

  /* ================= dim7：ディミニッシュ7th ================= */
  L.pack({ ctx: 'dim7', ref: 'Cdim7', segs: [4], lvl: 1 }, [
    ['ディミニッシュの分散和音', 'C4 Eb4 Gb4 A4 C5 A4 Gb4 Eb4', '1-♭3-♭5-♭♭7。短3度で積み重なる対称な形。', { tags: ['dim', 'arp'] }],
    ['全・半ディミニッシュ上昇', 'C4 D4 Eb4 F4 Gb4 Ab4 A4 B4', '全音・半音を交互にくり返すスケール。', { tags: ['dim', 'scale'] }],
    ['全・半ディミニッシュ下降', 'C5 B4 A4 Ab4 Gb4 F4 Eb4 D4', '同じスケールの下降。', { tags: ['dim', 'scale'] }],
    ['半音上から入る', 'Db4 C4 Eb4 Gb4 A4 Gb4 Eb4 C4', '導音風の入り方。', { tags: ['dim', 'chromatic'] }],
    ['3連符の分散', 'C4:t Eb4:t Gb4:t A4:t Gb4:t Eb4:t C4:q Eb4:q', '3連符で上がって降りる。', { tags: ['dim', 'triplet'], lvl: 2 }],
    ['4分音符の上行', 'C4:q Eb4:q Gb4:q A4:q', '短3度ずつ上がる。', { tags: ['dim', 'rhythm'] }],
    ['A♭ 方向へ解決する', 'A4 Gb4 Eb4 C4 Db4 Eb4 F4 Ab4', 'dim7 から半音上の和音へ動く準備。', { tags: ['dim', 'scale'], lvl: 2 }],
    ['シンコペーションの入り', 'r Eb4 Gb4 A4 C5 A4 Gb4:q', '裏から入る。', { tags: ['dim', 'rhythm'], lvl: 2 }],
  ]);
  L.pack({ ctx: 'dim7', ref: 'Cdim7', segs: [2], lvl: 1 }, [
    ['短い分散', 'C4 Eb4 Gb4 A4', 'dim7 の4音。', { tags: ['dim', 'arp'] }],
    ['下降', 'A4 Gb4 Eb4 C4', 'dim7 の4音を降りる。', { tags: ['dim', 'arp'] }],
    ['スケール', 'Eb4 F4 Gb4 Ab4', 'ディミニッシュ・スケールの一部。', { tags: ['dim', 'scale'] }],
  ]);
})();
