/* サンプルのライブラリ（形の見本）。★ここに書いてあるのは、動画の中身ではなく「こう書く」という例だけ。
   自分の動画を入れるときは、このファイルは触らず、data/library.js（または basket-navi.html と同じ場所の library.js）を作る。
   library.js があれば、そちらが優先され、このサンプルは出なくなる。作り方は README を見る。

   1本の動画の書き方：
     id        … 動画ごとに別の文字列（'v001' など）。メモや計画がこの id でひも付くので、あとから変えない
     title     … 動画の名前
     category  … 'coaching'（指導法）／ 'tactics'（戦術）／ 'training'（トレーニング）
     file      … 動画ファイルのパス（basket-navi.html を置いた場所から見た相対パス。空なら動画なし）
     url       … OneDrive の共有リンクなど（任意。スマホやタブレットで「開く」ボタンになる）
     duration  … 長さ（秒。任意）
     tags      … 好きなだけ。ライブラリの絞りこみに出る
     summary   … 要点。空行で段落、「・」で始まる行は箇条書きになる
     clips     … 見どころ。at（開始の秒）・title・type（'point' ポイント／'drill' 練習／'play' プレー）
                 ・minutes（練習の目安の分）・note（ひとことメモ）
   見どころは、動画を見ながら画面の「ここに印をつける」でも貯められる（ブラウザの中に保存される）。 */
window.BASKET_SAMPLE = {
  sample: true,
  title: 'サンプル',
  videos: [
    {
      id: 'sample-1',
      title: '【サンプル】指導法：説明は短く、見本を見せて、やらせて、直す',
      category: 'coaching',
      file: '',
      duration: 0,
      tags: ['声かけ', '練習の進め方'],
      summary: 'これはサンプルです。ここに、動画の要点を自分の言葉で書きます。\n\n・例）説明 → 見本 → やってみる → 直す、の順で進める\n・例）直すときは、1回に1つだけ',
      clips: [
        { at: 30, title: '説明は短く（例）', type: 'point', note: 'ここに「この場面で何を持ち帰るか」を書く' },
        { at: 95, title: '見本の見せ方（例）', type: 'point' }
      ]
    },
    {
      id: 'sample-2',
      title: '【サンプル】戦術：ピック＆ロールの基本',
      category: 'tactics',
      file: '',
      duration: 0,
      tags: ['オフェンス', 'ピック＆ロール'],
      summary: 'これはサンプルです。戦術の動画なら、「いつ・誰が・どこへ動くか」を短く書いておくと、練習のときに見返しやすい。',
      clips: [
        { at: 60, title: 'スクリーンのかけ方（例）', type: 'play', minutes: 15, note: '2対2から始めて、3対3に広げる' },
        { at: 210, title: 'ディフェンスの対応（例）', type: 'point' }
      ]
    },
    {
      id: 'sample-3',
      title: '【サンプル】トレーニング：ハンドリングの基礎ドリル',
      category: 'training',
      file: '',
      duration: 0,
      tags: ['ハンドリング', 'ウォームアップ'],
      summary: 'これはサンプルです。ドリルの動画は、「何分・何人・どこに気をつけるか」を見どころに書いておくと、そのまま今日の練習に入れられる。',
      clips: [
        { at: 20, title: 'その場でのドリブル（例）', type: 'drill', minutes: 10, note: '目線は上げる' },
        { at: 240, title: '2ボールドリブル（例）', type: 'drill', minutes: 8 },
        { at: 400, title: '前進しながらのドリブル（例）', type: 'drill', minutes: 12, note: '2人1組' }
      ]
    }
  ]
};
