/* minibasket/js/extract.js
   スコアシートの写真 → 読み取りJSON。
   ・プロンプト（どの経路でも共通。手動コピー用にも使う）
   ・写真の切り出し（領域ごとに約120万画素に収める。ブラウザ専用）
   ・Claude への問い合わせ（アーティファクトの sample 機能）
   ・返ってきたJSONの取り出し・つなぎ合わせ

   なぜ領域ごとに切り出すか：
   写真1枚をそのまま渡すと、Claude 側で約120万画素に縮小されて、ランニングスコアの小さな数字がつぶれる。
   「見出し」「A欄」「B欄」「ランニングスコア（3分割）」に分けて、それぞれを大きく見せる。
   読み取りは2段階：①基本情報（得点・出場・ファウル・タイムアウト）②ランニングスコア。
   ②には①の結果（ピリオド得点・各ピリオドの出場メンバー）を渡して、背番号の読み違いを減らす。 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MB = Object.assign(root.MB || {}, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // ════════ 1. プロンプト ════════════════════════════════════════════════

  const GUIDE_SHEET = `
## シートの構造（JBAミニバスケットボール スコアシート。FIBA形式の日本語版）
- 上段の表：大会名・日付・会場・時間・Game No.、その下に「スコア」欄（チームAの最終得点の枠／ピリオド別の「A − B」が上から4行／チームBの最終得点の枠）。
- 左上がチームA欄、左下がチームB欄。どちらも、チーム名と（白）（濃）、タイムアウト欄（①②③④OT の5マス）、選手行（行番号・ライセンスNo.・選手氏名・背番号No.・出場時限 ①②③④・ファウル 1〜5）でできている。
- A欄・B欄の右隣の縦長の表が「チームファウル」（1Q 2Q／3Q 4Q の枠。各枠の中に 1〜4 の数字が縦に並ぶ）。Aの表はA欄の高さ、Bの表はB欄の高さにある。
- 右側が「ランニングスコア」。3つの塊（1〜40／41〜80／81〜120）が横に並ぶ。各塊は左から [A側の背番号欄][Aの得点番号][Bの得点番号][B側の背番号欄]。
- インクの色：1Q・3Qは赤、2Q・4Qは黒（青）で書く決まり。ファウルや得点が何ピリオドのものかの手がかりになるので、赤か黒かを見分けること。`;

  const GUIDE_MARKS = `
## 記号の読み方
- 出場時限（①〜④のマス）：そのピリオドに出場した選手のマスに斜線「/」。ごくまれに逆斜線「\\」や「X」が書かれる（交代などの意味）。見えたまま "/" "\\" "X"、空欄は ""。
- ファウル：左の枠から順に「P」。Pの右下に小さな数字があればフリースローの本数（P2＝2本、P1＝1本、数字なしのP＝0）。添え字の「1」は短い縦棒、「2」は上に小さな曲がりがあって下が横線。T・U・D などもあり得る。赤インクなら "red"、黒なら "black"。
- タイムアウト欄（①②③④OT）：数字が書かれたマスだけ {box:マス番号(1〜4、OTは5), minute:数字}。横線などで消されたマスは書かない。
- チームファウル：1Q〜4Qの各枠で、×印が付いた数字の個数（0〜4）。縦線でまとめて消されている数字は「使わなかった」ので数えない。
- ランニングスコア：得点が入るたびに、その得点の番号のマスに印を付ける（印のないマスは得点が入っていない）。
  ・● （塗りつぶした点）＝フリースロー1点 → mark:"dot"。数字が太く潰れて見えることもある。
  ・斜線「/」＝2点シュート → mark:"slash"。得点番号は2つ進む（…,2,4,6…）。3点なら3つ進む。
  ・得点者の背番号は、A側は左端の欄、B側は右端の欄に書いてある。背番号が丸で囲まれていたら playerCircled:true（3点シュート。ただしこの丸は得点番号のマスの丸とは別）。
  ・ピリオドの最後の得点には大きな丸と下線が付く → その得点に qEnd:true。
  ・手書きの癖：背番号の「1」は短い斜線で書かれることが多い（18 は「/8」、11 は「//」、21 は「2/」、13 は「/3」）。4は「×」のように、5は「ᕗ」のように、7は「ㄱ」のように見える。
    背番号は必ず選手欄に書かれた番号のどれか。登録にない番号に読めたら、読み違いを疑う。`;

  const OUTPUT_RULES = `
## 出力のルール
- 出力はJSONだけ。前置き・説明・コードフェンスは付けない。
- 読めない・自信がない箇所は、推測で埋めずに、見えたとおりに書き、notes に「どこが・どう読めないか」を日本語で書く。
- 数字は半角。背番号は文字列。`;

  // 記入例の値はすべて架空（実際の写真の値を例に使うと、読み取りがそれにつられる）
  const SCHEMA_INFO = `{
  "meta": { "event": "○○大会", "date": "2026-05-04", "venue": "△△体育館", "time": "09:30", "gameNo": "1" },
  "teams": [
    { "side": "A", "name": "Aチームの名前", "uniform": "白",
      "finalScore": 23, "quarterScores": [7, 5, 6, 5],
      "timeouts": [ { "box": 1, "minute": 3 } ],
      "teamFouls": [2, 3, 1, 4],
      "players": [ { "no": "12", "name": "", "marks": ["/", "", "/", "/"], "fouls": [ { "type": "P", "ft": 2, "ink": "red" } ] } ] },
    { "side": "B", "name": "Bチームの名前", "uniform": "濃", "finalScore": 31, "quarterScores": [9, 8, 6, 8], "timeouts": [], "teamFouls": [0, 2, 4, 1], "players": [] }
  ],
  "notes": []
}
（値はすべて形の例です。写真の内容とは関係ありません）`;

  const SCHEMA_RUNNING = `{
  "A": [ { "total": 2, "mark": "slash", "player": "12" }, { "total": 3, "mark": "dot", "player": "7" }, { "total": 7, "mark": "slash", "player": "12", "qEnd": true } ],
  "B": [ { "total": 3, "mark": "slash", "player": "9", "playerCircled": true } ],
  "notes": []
}
（値はすべて形の例です。写真の内容とは関係ありません）`;

  /** 再読み取り：前回の結果と、整合性チェックで見つかった不一致を付け足す */
  function repairAppendix(r) {
    if (!r) return '';
    return `

## 前回の読み取り結果と、見つかった不一致（これは読み直しです）
前回の結果：
${JSON.stringify(r.previous)}
不一致：
${(r.issues || []).map(s => '- ' + s).join('\n')}
画像をもう一度、不一致の周辺を中心によく見て、読み違い・読み落としを直した結果を、同じ形のJSONだけで返してください。
読み直しても不一致が残るときは、見えたとおりに書いて notes に理由を書くこと。`;
  }

  /** ①基本情報（画像：上段の表／A欄／B欄） */
  function buildInfoPrompt(opts) {
    opts = opts || {};
    return `あなたは、日本のミニバスケットボールの公式スコアシートを読み取る係です。渡された画像から、試合の基本情報を下のJSONに書き起こしてください。
${opts.tiles === false ? '画像は、シート全体の写真1枚です。' : '画像は同じ1枚のシートを領域ごとに拡大したものです。順に：1枚目＝上段の表（大会名・日付・スコア欄）、2枚目＝チームA欄（右隣にAのチームファウル）、3枚目＝チームB欄（右隣にBのチームファウル）。'}
${GUIDE_SHEET}
${GUIDE_MARKS}

## 今回読み取るもの（ランニングスコアは次の段階で読むので、今回は不要）
- meta：大会名・日付(YYYY-MM-DD)・会場・時間・Game No.。
- スコア欄：各チームの最終得点(finalScore)と、ピリオド別の得点(quarterScores、上から1Q,2Q,3Q,4Q。左がA・右がB。延長に書き込みがあれば5番目に追加)。
- 各チーム：チーム名・ユニフォーム色（白/濃）・タイムアウト・チームファウル・全選手（登録されている行すべて。出場の印やファウルがない選手も入れる）。
- 選手の氏名は、読める範囲で name に。空欄なら ""。
- 書き終えたら確認：各ピリオドの出場は、ふつうちょうど5人（途中交代があると6人以上）。5人に満たないピリオドは、斜線の見落としがないか、その列をもう一度見る。特に④の列は右の太い縦線に接していて、薄い斜線を見落としやすい。
${opts.noNames ? '- 氏名は読み取らず、name は常に "" にすること。\n' : ''}${OUTPUT_RULES}

## 出力JSONの形（値は例）
${SCHEMA_INFO}${repairAppendix(opts.repair)}`;
  }

  /** ②ランニングスコア（画像：ランニングスコアを上から3分割）。①の結果を制約として渡す */
  function buildRunningPrompt(info, opts) {
    opts = opts || {};
    const L = [];
    (info.teams || []).forEach(t => {
      const qs = (t.quarterScores || []).map(Number);
      const cum = []; qs.reduce((s, v, k) => (cum[k] = s + v), 0);
      const q = [0, 1, 2, 3].map(k => {
        const ps = (t.players || []).filter(p => p.marks && p.marks[k]).map(p => p.no);
        return `${k + 1}Q(${k % 2 === 0 ? '赤' : '黒'})：出場 ${ps.join(' ') || '?'}／ピリオド得点 ${qs[k] ?? '?'}／終了時の累計 ${cum[k] ?? '?'}`;
      });
      L.push(`チーム${t.side}（${t.name || ''}）最終得点 ${t.finalScore}\n  選手登録：${(t.players || []).map(p => p.no).join(' ')}\n  ${q.join('\n  ')}`);
    });
    return `あなたは、日本のミニバスケットボールの公式スコアシートの「ランニングスコア」を読み取る係です。渡された画像から、AとBそれぞれの得点の記録を、下のJSONに書き起こしてください。
画像は同じランニングスコアを上から順に3分割して拡大したもの（1枚目＝上、2枚目＝中、3枚目＝下。隣の画像と数行ぶん重なっている）。各画像には、1〜40／41〜80／81〜120 の3つの塊が横に並んで写っている。重なっている行を二重に数えないこと。
${GUIDE_SHEET}
${GUIDE_MARKS}

## すでに分かっていること（①の読み取り結果。読み違い防止の手がかり）
${L.join('\n')}
- 各ピリオドの得点者は、そのピリオドに「出場」している選手のはず。
- 各チームの得点の記録は、ピリオドごとに「終了時の累計」で終わる（その得点に大きな丸と下線）。最後の得点は最終得点に一致する。
- この制約に合わない読みになったときは、制約に合わせて作り変えず、見えたとおりに書いて notes に不一致を書く。

## 今回読み取るもの
- 印が付いた得点番号のマスだけを、AとBそれぞれ、得点番号の小さい順に並べる。1つの要素＝{ total:得点番号, mark:"dot"か"slash", player:背番号(文字列) }。丸で囲まれた背番号は playerCircled:true、ピリオド最後の丸・下線は qEnd:true を付ける。
- 印のないマスは書かない。総得点の増え方は 1点(●)・2点(斜線)・3点(斜線＋丸で囲んだ背番号) のどれか。増え方が合わないときは、飛ばしたマスに印の見落としがないか見直す。
${OUTPUT_RULES}

## 出力JSONの形（値は例）
${SCHEMA_RUNNING}${repairAppendix(opts.repair)}`;
  }

  /** 写真1枚から全部を一度に読み取る（手動コピー用。ChatGPT/Gemini/Claude のチャットに写真と一緒に貼る） */
  function buildFullPrompt(opts) {
    opts = opts || {};
    return `あなたは、日本のミニバスケットボールの公式スコアシートを読み取る係です。添付した写真（スコアシート1枚）の内容を、下のJSONにすべて書き起こしてください。
細かい数字は、画像を拡大して1行ずつ確認してから答えてください。
${GUIDE_SHEET}
${GUIDE_MARKS}

## 読み取るもの
- meta：大会名・日付(YYYY-MM-DD)・会場・時間・Game No.
- 各チーム：チーム名・ユニフォーム色・最終得点(finalScore)・ピリオド別得点(quarterScores、上から1Q〜4Q。左がA・右がB)・タイムアウト・チームファウル・全選手（出場の印やファウルがない選手も入れる）・ランニングスコア(running)
- running は、印が付いた得点番号のマスだけを、得点番号の小さい順に。1要素＝{ total, mark:"dot"|"slash", player, playerCircled?, qEnd? }。
- 書き終えたら必ず確認：各チームの「ピリオド得点の合計＝最終得点」「runningの最後の total＝最終得点」「各ピリオド終了時の累計の total が running の中にある」「得点者は、そのピリオドに出場している選手」。合わなければ読み直す。
${opts.noNames ? '- 氏名は読み取らず、name は常に "" にすること。\n' : ''}${OUTPUT_RULES}

## 出力JSONの形（値は例。running は各チームの中に入れる）
${SCHEMA_INFO.replace('"players": [ { "no": "12"', '"running": [ { "total": 2, "mark": "slash", "player": "12" } ],\n      "players": [ { "no": "12"')}`;
  }

  // ════════ 2. 返ってきたJSONの取り出し・つなぎ合わせ ═══════════════════════

  /** 前後に説明文やコードフェンスが付いていても、JSONを取り出す */
  function parseLooseJson(text) {
    let s = String(text == null ? '' : text).trim();
    const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(s);
    if (fence) s = fence[1].trim();
    const a = s.search(/[{[]/);
    if (a < 0) throw new Error('JSONが見つかりません');
    const open = s[a], close = open === '{' ? '}' : ']';
    const b = s.lastIndexOf(close);
    if (b <= a) throw new Error('JSONが途中で切れています');
    s = s.slice(a, b + 1);
    try { return JSON.parse(s); } catch (e) {
      // よくある崩れ：末尾カンマ・全角の引用符
      const t = s.replace(/,\s*([}\]])/g, '$1').replace(/[“”]/g, '"');
      return JSON.parse(t);
    }
  }

  /** ①の結果 と ②の結果 を1つの試合データにする */
  function mergeInfoAndRunning(info, running) {
    const g = JSON.parse(JSON.stringify(info || {}));
    g.teams = g.teams || [];
    (['A', 'B']).forEach((side, i) => {
      g.teams[i] = g.teams[i] || { side };
      g.teams[i].running = (running && running[side]) || g.teams[i].running || [];
    });
    g.notes = [].concat(g.notes || [], (running && running.notes) || []);
    return g;
  }

  /** 1つの試合データの形をざっと整える（モデルが少し形を崩しても受け取る） */
  function coerceRaw(x) {
    if (Array.isArray(x)) x = x[0];
    if (x && x.game) x = x.game;
    if (x && !x.teams && x.A && x.B) x = { meta: x.meta, teams: [x.A, x.B], notes: x.notes };
    return x;
  }

  // ════════ 3. 写真の切り出し（ブラウザ専用）══════════════════════════════

  /** 切り出す領域。数字は「用紙の外接矩形」に対する割合 (u:横, v:縦) */
  const TILES = {
    head: { label: '上段の表', u0: 0.0, v0: 0.00, u1: 1.00, v1: 0.30 },
    A:    { label: 'チームA欄', u0: 0.0, v0: 0.19, u1: 0.62, v1: 0.61 },
    B:    { label: 'チームB欄', u0: 0.0, v0: 0.55, u1: 0.62, v1: 1.00 },
    R1:   { label: 'ランニングスコア（上）', u0: 0.50, v0: 0.19, u1: 1.0, v1: 0.52 },
    R2:   { label: 'ランニングスコア（中）', u0: 0.50, v0: 0.44, u1: 1.0, v1: 0.75 },
    R3:   { label: 'ランニングスコア（下）', u0: 0.50, v0: 0.67, u1: 1.0, v1: 1.00 },
  };

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => resolve({ img, url, w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('画像を開けませんでした')); };
      img.src = url;
    });
  }

  /** 用紙（白い部分）の外接矩形を推定する。
      小さなブロックの平均の明るさ・彩度で「紙っぽいか」を決め、画像の中心から外へ、紙っぽいブロックの割合が
      減るところまで広げる。（罫線や文字だらけの部分も、平均すれば紙の明るさ。黄色いバインダーは彩度で除く） */
  function detectPaper(img, w, h) {
    const S = 240, sc = Math.min(1, S / Math.max(w, h)), BK = 4;
    const cw = Math.max(16, Math.round(w * sc)), ch = Math.max(16, Math.round(h * sc));
    const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.imageSmoothingQuality = 'high';
    x.drawImage(img, 0, 0, cw, ch);
    const d = x.getImageData(0, 0, cw, ch).data;
    const bw = Math.floor(cw / BK), bh = Math.floor(ch / BK);
    const lum = new Float32Array(bw * bh), sat = new Float32Array(bw * bh);
    for (let by = 0; by < bh; by++) for (let bx = 0; bx < bw; bx++) {
      let l = 0, s2 = 0;
      for (let yy = 0; yy < BK; yy++) for (let xx = 0; xx < BK; xx++) {
        const i = ((by * BK + yy) * cw + (bx * BK + xx)) * 4;
        l += (d[i] + d[i + 1] + d[i + 2]) / 3;
        s2 += Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]);
      }
      lum[by * bw + bx] = l / (BK * BK); sat[by * bw + bx] = s2 / (BK * BK);
    }
    const mid = [];
    for (let by = Math.floor(bh * 0.3); by < bh * 0.7; by++) for (let bx = Math.floor(bw * 0.3); bx < bw * 0.7; bx++) mid.push(lum[by * bw + bx]);
    mid.sort((a, b) => a - b);
    const ref = mid[Math.floor(mid.length * 0.85)] || 200;
    const paper = (bx, by) => { const p = by * bw + bx; return lum[p] >= ref * 0.62 && sat[p] <= 60; };
    const rowCov = by => { let n = 0, m = 0; for (let bx = Math.floor(bw * 0.2); bx < bw * 0.8; bx++) { m++; if (paper(bx, by)) n++; } return n / m; };
    const colCov = bx => { let n = 0, m = 0; for (let by = Math.floor(bh * 0.25); by < bh * 0.75; by++) { m++; if (paper(bx, by)) n++; } return n / m; };
    const grow = (cov, start, lim, step) => {
      let pos = start, miss = 0, last = start;
      while (pos + step >= 0 && pos + step < lim) {
        pos += step;
        if (cov(pos) >= 0.5) { last = pos; miss = 0; } else if (++miss >= 2) break;
      }
      return last;
    };
    const top = grow(rowCov, Math.floor(bh / 2), bh, -1), bot = grow(rowCov, Math.floor(bh / 2), bh, 1);
    const left = grow(colCov, Math.floor(bw / 2), bw, -1), right = grow(colCov, Math.floor(bw / 2), bw, 1);
    const r = { x: left / bw, y: top / bh, w: (right - left + 1) / bw, h: (bot - top + 1) / bh };
    const ar = (r.h * h) / (r.w * w);
    const ok = r.w * r.h >= 0.3 && ar >= 0.9 && ar <= 2.0;
    return { rect: ok ? r : { x: 0, y: 0, w: 1, h: 1 }, detected: ok };
  }

  /** 用紙の矩形(割合)と領域の割合から、元画像のピクセル範囲を出す。少し余白を足す */
  function tileBox(rect, t, w, h, pad) {
    pad = pad == null ? 0.015 : pad;
    const x0 = (rect.x + rect.w * Math.max(0, t.u0 - pad)) * w, x1 = (rect.x + rect.w * Math.min(1, t.u1 + pad)) * w;
    const y0 = (rect.y + rect.h * Math.max(0, t.v0 - pad)) * h, y1 = (rect.y + rect.h * Math.min(1, t.v1 + pad)) * h;
    return { x: Math.max(0, x0), y: Math.max(0, y0), w: Math.min(w, x1) - Math.max(0, x0), h: Math.min(h, y1) - Math.max(0, y0) };
  }

  /** 切り出して縮小（約120万画素・長辺1568px以内）。JPEG の Blob を返す */
  function renderTile(img, box, maxPixels) {
    maxPixels = maxPixels || 1.2e6;
    const sc = Math.min(1, Math.sqrt(maxPixels / (box.w * box.h)), 1568 / Math.max(box.w, box.h));
    const cw = Math.max(1, Math.round(box.w * sc)), ch = Math.max(1, Math.round(box.h * sc));
    const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.fillStyle = '#fff'; x.fillRect(0, 0, cw, ch);
    x.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, cw, ch);
    return new Promise(res => c.toBlob(b => res({ blob: b, w: cw, h: ch, canvas: c }), 'image/jpeg', 0.92));
  }

  async function makeTiles(loaded, rect, ids) {
    const out = {};
    for (const id of ids) out[id] = await renderTile(loaded.img, tileBox(rect, TILES[id], loaded.w, loaded.h));
    return out;
  }

  // ════════ 4. Claude への問い合わせ ═════════════════════════════════════

  const ERR_TEXT = {
    not_granted: 'Claude の利用が許可されていません。Claude にログインした状態でページを開き直し、表示される確認で「許可」を選んでください。',
    sampling_disabled: 'このアカウントでは Claude を使えません。',
    rate_limited: '利用回数の上限に達したか、短時間に呼びすぎです。少し待ってからやり直してください。',
    session_expired: 'Claude へのログインが切れているか、ログインしていません。ログインしてから、ページを開き直してください。',
    image_rejected: '画像を受け付けられませんでした（形式・大きさ）。別の写真で試してください。',
    images_unavailable: 'この画面からは画像を送れません。手動コピー（下）を使ってください。',
    invalid_json: 'Claude の返答をJSONとして読めませんでした。もう一度試すか、手動コピーを使ってください。',
    refused: 'Claude が読み取りを断りました。別の写真で試してください。',
    empty_completion: '返答が空でした。もう一度試してください。',
    cancelled: '中止しました。',
    upstream_error: '通信か Claude 側の一時的なエラーです。もう一度試してください。',
  };

  /** アーティファクト：window.claude の sample 機能で読み取る */
  async function sampleExtract(sample, tiles, steps, hooks) {
    hooks = hooks || {};
    const note = m => hooks.onStatus && hooks.onStatus(m);
    const opt = (ids, signal) => ({ images: ids.map(i => tiles[i].blob), modelTier: 'complex', signal, onText: hooks.onText });
    note('① 基本情報を読み取り中…（1〜2分かかることがあります）');
    const info = await sample.json(buildInfoPrompt({ noNames: hooks.noNames }), opt(['head', 'A', 'B'], hooks.signal));
    note('② ランニングスコアを読み取り中…');
    const running = await sample.json(buildRunningPrompt(coerceRaw(info) || info), opt(['R1', 'R2', 'R3'], hooks.signal));
    return mergeInfoAndRunning(coerceRaw(info), running);
  }

  /** 不一致を伝えて読み直す（scope: 'info' | 'running'）。結果を、元の試合データに反映して返す */
  async function sampleRepair(sample, tiles, scope, raw, issues, hooks) {
    hooks = hooks || {};
    const o = { images: (scope === 'info' ? ['head', 'A', 'B'] : ['R1', 'R2', 'R3']).map(i => tiles[i].blob), modelTier: 'complex', signal: hooks.signal, onText: hooks.onText, cache: false };
    const g = JSON.parse(JSON.stringify(raw));
    if (scope === 'info') {
      const prev = JSON.parse(JSON.stringify(raw)); (prev.teams || []).forEach(t => { delete t.running; });
      const info = coerceRaw(await sample.json(buildInfoPrompt({ noNames: hooks.noNames, repair: { previous: prev, issues } }), o));
      return mergeInfoAndRunning(info, { A: g.teams[0].running, B: g.teams[1].running, notes: [] });
    }
    const info = JSON.parse(JSON.stringify(raw)); (info.teams || []).forEach(t => { delete t.running; });
    const prev = { A: g.teams[0].running, B: g.teams[1].running };
    const running = await sample.json(buildRunningPrompt(info, { repair: { previous: prev, issues } }), o);
    g.teams[0].running = running.A || g.teams[0].running; g.teams[1].running = running.B || g.teams[1].running;
    g.notes = [].concat(g.notes || [], running.notes || []);
    return g;
  }

  return {
    GUIDE_SHEET, GUIDE_MARKS, buildInfoPrompt, buildRunningPrompt, buildFullPrompt,
    parseLooseJson, mergeInfoAndRunning, coerceRaw,
    TILES, loadImage, detectPaper, tileBox, renderTile, makeTiles,
    ERR_TEXT, sampleExtract, sampleRepair,
  };
});
