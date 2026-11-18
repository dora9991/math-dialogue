/* 「これ1つ」の測るテスト（30秒チャレンジ）。ひとりで・短い時間で・同じやり方で はかれる、自分の「いまの力」のものさし。
   BC.FOCUS_TESTS の1つ：
     id        'f-…'（ずっと同じ id。きろくは この id で つながる）
     skill     技能 id（data/skills.js）
     name      短い名前（画面の見出し）
     what      なにを はかるか（「30秒で つけた回数」など。1行）
     how       はかりかた（1つずつ。子どもが読む）
     kind      'count'（決めた秒数のあいだの回数）・'time'（かかった時間。ストップウォッチ）・'hold'（つづけられた時間。ストップウォッチ）・'make'（N回中 いくつ）
     secs      kind が 'count' のとき、タイマーの秒数
     of        kind が 'make' のとき、全部で何回
     unit      '回'・'本'・'秒'
     better    'more'（多いほどよい）・'less'（少ないほどよい＝タイム）
     drills    この力をのばす練習メニュー（d-…）。はじめのものが きょうのメニューの中心になる
     cues      「つぎに 意識すること」の候補（短く）
     place     'any'（家でもできる）・'hoop'（ゴールがいる）
     note      気をつけること（なくてもよい）
   やり方を変えると、前の記録と くらべられなくなる。変えるときは、新しい id で つくる。 */
BC.FOCUS_TESTS = [
  /* ---------- ドリブル ---------- */
  { id: 'f-pound-r', skill: 'dribble', name: 'ポンドドリブル（右手）', what: '30秒で つけた回数', kind: 'count', secs: 30, unit: '回', better: 'more', place: 'any',
    how: ['足を肩はばに開いて、ひざを曲げる', '右手だけで、ひざの高さに 強くつく（ボールは 見てもよい）', '30秒で なん回 つけたか 数える（声に出すか、おうちの人に 数えてもらう）'],
    drills: ['d-pound', 'd-handling'], cues: ['指の腹で 強く', 'ひざを まげる', 'ボールを 見ない', 'リズムを そろえる'] },
  { id: 'f-pound-l', skill: 'dribble', name: 'ポンドドリブル（左手）', what: '30秒で つけた回数', kind: 'count', secs: 30, unit: '回', better: 'more', place: 'any',
    how: ['足を肩はばに開いて、ひざを曲げる', '左手だけで、ひざの高さに 強くつく', '30秒で なん回 つけたか 数える'],
    drills: ['d-pound', 'd-2ball'], cues: ['左手の 指の腹で', 'ひざを まげる', '顔を 上げる', 'ゆっくりから 速く'] },
  { id: 'f-cross', skill: 'dribble', name: 'クロスオーバー', what: '30秒で 左右に ついた回数', kind: 'count', secs: 30, unit: '回', better: 'more', place: 'any',
    how: ['ひざを曲げて、体の前で ボールを 右手 → 左手 → 右手 … と ついて 移す', '1回 つくたびに 1回と 数える', '30秒で なん回か 数える'],
    drills: ['d-moves', 'd-handling'], cues: ['体の前で 低く', 'ボールを 見ない', '手を すばやく', 'ひざを まげる'] },
  { id: 'f-circle', skill: 'dribble', name: 'ボディサークル', what: '10周 まわる時間（少ないほどよい）', kind: 'time', unit: '秒', better: 'less', place: 'any',
    how: ['ボールを 腰のまわりで まわす（落とさずに）', '10周 まわったら ストップ。落としたら やりなおし', 'スタートで ストップウォッチが 動くよ'],
    drills: ['d-handling', 'd-pound'], cues: ['ボールを 見ない', '手首で まわす', 'リズムを そろえる', '落とさない'] },
  { id: 'f-zigzag', skill: 'dribble', name: 'ジグザグドリブル', what: 'コーン（くつ）5本を 往復する時間', kind: 'time', unit: '秒', better: 'less', place: 'any',
    how: ['くつ・ペットボトルなどを 2m ずつ はなして 5つ ならべる', 'ドリブルで ジグザグに 行って もどる（1往復）', 'ストップウォッチで 往復の時間を はかる'],
    drills: ['d-zigzag', 'd-moves'], cues: ['体の前で 手をかえる', '低く 速く', '前を 見る', 'コーンの ちかくで チェンジ'],
    note: 'まわりに 物や 人が いない 広い場所で。' },
  { id: 'f-2ball', skill: 'dribble', name: '2ボール・ドリブル', what: '落とさずに つづけた時間', kind: 'hold', unit: '秒', better: 'more', place: 'any',
    how: ['ボールを 2つ 持って、同時に つく', '1つ 落としたら ストップ（何秒 つづいたか）', 'ストップウォッチで はかる'],
    drills: ['d-2ball', 'd-pound'], cues: ['2つの リズムを そろえる', 'ひざを まげる', '前を 見る', 'ゆっくりから'],
    note: '音が ひびかない 場所で。' },

  /* ---------- シュート ---------- */
  { id: 'f-ft', skill: 'shoot', name: 'フリースロー', what: '10本中 入った数', kind: 'make', of: 10, unit: '本', better: 'more', place: 'hoop',
    how: ['フリースローラインから 10本 打つ', '毎回 同じ ルーティン（ボールを つく・息をはく）で', '入った数を 数える'],
    drills: ['d-ft', 'd-formshoot'], cues: ['同じ ルーティン', 'ひじを まっすぐ', 'さいごまで 手を のばす', 'ひざを つかう'] },
  { id: 'f-form', skill: 'shoot', name: 'ゴール下フォームシュート', what: '10本中 入った数', kind: 'make', of: 10, unit: '本', better: 'more', place: 'hoop',
    how: ['ゴールの すぐ近く（1〜2歩）から 片手で 打つ', 'ひじを まっすぐ 上へ。10本 打つ', '入った数を 数える'],
    drills: ['d-formshoot', 'd-lyingshoot'], cues: ['ひじを まっすぐ', 'さいごまで 手を のばす', '手首を 返す', '高く 打つ'] },
  { id: 'f-around', skill: 'shoot', name: '5か所シューティング', what: '15本中 入った数（5か所×3本）', kind: 'make', of: 15, unit: '本', better: 'more', place: 'hoop',
    how: ['ゴールのまわり 5か所 から 3本ずつ 打つ', '合計 15本。入った数を 数える'],
    drills: ['d-around', 'd-formshoot'], cues: ['どこでも 同じフォーム', 'ひざを つかう', 'ひじを まっすぐ', '打つ前に 足を そろえる'] },

  /* ---------- フィニッシュ（レイアップ） ---------- */
  { id: 'f-layup-r', skill: 'finish', name: 'レイアップ（右から）', what: '10本中 入った数', kind: 'make', of: 10, unit: '本', better: 'more', place: 'hoop',
    how: ['右がわから ドリブルして レイアップ', '10本 打って、入った数を 数える'],
    drills: ['d-layup-step', 'd-mikan'], cues: ['右・左の ステップ', '高く とぶ', 'ボードの 四角を ねらう', '最後まで 見る'] },
  { id: 'f-layup-l', skill: 'finish', name: 'レイアップ（左から）', what: '10本中 入った数', kind: 'make', of: 10, unit: '本', better: 'more', place: 'hoop',
    how: ['左がわから ドリブルして 左手で レイアップ', '10本 打って、入った数を 数える'],
    drills: ['d-weakhand-layup', 'd-layup-step'], cues: ['左・右の ステップ', '左手で 打つ', 'ボードの 四角を ねらう', '高く とぶ'] },
  { id: 'f-mikan', skill: 'finish', name: 'マイカンドリル', what: '30秒で 入った本数', kind: 'count', secs: 30, unit: '本', better: 'more', place: 'hoop',
    how: ['ゴールの下で、右 → 左 → 右 … と 交互に レイアップ', '30秒で 入った本数を 数える'],
    drills: ['d-mikan', 'd-layup-step'], cues: ['止まらず リズムよく', 'ボードを つかう', '手で ボールを 受ける', '高く とぶ'] },

  /* ---------- パス ---------- */
  { id: 'f-wallpass', skill: 'pass', name: 'かべパス', what: '30秒で パス・キャッチした回数', kind: 'count', secs: 30, unit: '回', better: 'more', place: 'any',
    how: ['かべから 2〜3m はなれて 立つ', '両手で かべへ パス → とって → パス… をくり返す', '30秒で なん回 できたか 数える（落としたら そこから つづける）'],
    drills: ['d-wallpass'], cues: ['親指を 下に', '両手で とる', 'ひじを のばして 出す', '足を 1歩 ふみこむ'],
    note: 'かべや まどが こわれない 場所・やわらかい ボールで。' },
  { id: 'f-wallaim', skill: 'pass', name: 'かべの まとあて', what: '10本中 まとに 当たった数', kind: 'make', of: 10, unit: '本', better: 'more', place: 'any',
    how: ['かべに テープで まと（30cm）を つくる', '3m はなれて、チェストパスで まとを ねらう', '10本中 まとに 当たった数を 数える'],
    drills: ['d-wallpass'], cues: ['まとを 見て 出す', 'ひじを のばす', '親指を 下に', '足を ふみこむ'],
    note: 'かべや まどが こわれない 場所・やわらかい ボールで。' },

  /* ---------- フットワーク ---------- */
  { id: 'f-footfast', skill: 'foot', name: '足ぶみ（すばやく）', what: '10秒で 足を ついた回数', kind: 'count', secs: 10, unit: '回', better: 'more', place: 'any',
    how: ['ひざを 軽く曲げて、その場で 左右の足を すばやく ふみかえる', '右足が ついた回数を 10秒間 数える'],
    drills: ['d-ladder', 'd-reaction'], cues: ['つま先で かるく', 'ひざを まげる', 'うでも ふる', '地面から はなれすぎない'] },
  { id: 'f-jumpstop', skill: 'foot', name: 'ジャンプストップ＆ピボット', what: '10回中 ブレずに できた数', kind: 'make', of: 10, unit: '回', better: 'more', place: 'any',
    how: ['ボールを持って 走る → 両足で とまる（ジャンプストップ）', '軸足を 動かさずに ピボットで 前・うしろへ 回る', '足が ずれずに できた回数を 数える（10回中）'],
    drills: ['d-jumpstop', 'd-triple'], cues: ['両足で 同時に', 'ひざを まげて とまる', '軸足を うごかさない', 'ボールを 体に 近く'] },

  /* ---------- 1対1の攻め ---------- */
  { id: 'f-drive', skill: 'attack', name: 'ドライブ → レイアップ', what: '10本中 入った数', kind: 'make', of: 10, unit: '本', better: 'more', place: 'hoop',
    how: ['トリプルスレット（ボールを持って かまえる）から、ジャブステップ', '1〜2回 ドリブルして レイアップ', '10本 打って、入った数を 数える'],
    drills: ['d-shotfake', 'd-triple'], cues: ['ジャブで 守りを ゆさぶる', '低く 速く', '1歩目を ひらく', 'さいごまで 見る'] },

  /* ---------- 1対1の守り ---------- */
  { id: 'f-slide', skill: 'defball', name: 'ディフェンス・スライド', what: '20秒で 横に すべった回数', kind: 'count', secs: 20, unit: '回', better: 'more', place: 'any',
    how: ['3m はなして 線を 2本（またはコーン）', 'ひざを 曲げて、足を そろえずに 横に すべって 線を ふむ', '線に ついたら 1回と 数える（20秒間）'],
    drills: ['d-stance', 'd-ladder'], cues: ['こしを 落とす', '足を クロスしない', '頭の 高さを かえない', '手を ひろげる'],
    note: 'ゆかが すべらない 場所で。' },
  { id: 'f-stance', skill: 'defball', name: 'ひくい かまえ', what: 'こしを 落として キープできた時間', kind: 'hold', unit: '秒', better: 'more', place: 'any',
    how: ['ディフェンスの かまえ（ひざを曲げて こしを落とす）を とる', 'こしが 上がったら ストップ（何秒 キープできたか）', 'ストップウォッチで はかる'],
    drills: ['d-stance', 'd-mirror'], cues: ['こしを 落とす', '背中を まっすぐ', '手を ひろげる', '足を 肩はばより 広く'],
    note: 'ひざや こしが いたい日は むりしない。' },

  /* ---------- リバウンド ---------- */
  { id: 'f-wallreb', skill: 'rebound', name: 'かべジャンプキャッチ', what: '30秒で ジャンプして とった回数', kind: 'count', secs: 30, unit: '回', better: 'more', place: 'any',
    how: ['かべに ボールを 高めに 投げる', 'はね返りを ジャンプして 空中で 両手で つかむ', '30秒で なん回 とれたか 数える'],
    drills: ['d-tip', 'd-superman'], cues: ['ひざを まげて とぶ', '両手で つかむ', '高い所で とる', '着地で ひざを まげる'],
    note: 'かべや まどが こわれない 場所で。' },

  /* ---------- からだづくり ---------- */
  { id: 'f-plank', skill: 'body', name: 'プランク', what: 'しせいを キープできた時間', kind: 'hold', unit: '秒', better: 'more', place: 'any',
    how: ['ひじを ついて、あたまから かかとまで まっすぐに', 'おしりが 下がったり 上がったら ストップ', 'ストップウォッチで はかる'],
    drills: ['d-core', 'd-dynamic'], cues: ['おなかに 力', 'おしりを 下げない', '息を とめない', '体を まっすぐ'],
    note: 'こしが いたいときは やらない。' },
  { id: 'f-squat', skill: 'body', name: 'スクワット', what: '30秒で できた回数', kind: 'count', secs: 30, unit: '回', better: 'more', place: 'any',
    how: ['足を 肩はばに 開いて、おしりを うしろへ ひく', 'ひざが 足の指より 前に 出ないように しゃがんで 立つ', '30秒で なん回か 数える'],
    drills: ['d-core', 'd-dynamic'], cues: ['ひざを 外へ', 'せなかを まっすぐ', 'かかとを ゆかに', '息を はきながら 立つ'],
    note: 'ひざが いたい日は むりしない。' },
  { id: 'f-onefoot', skill: 'body', name: '片足立ち', what: 'ふらつかずに 立てた時間（左右の 少ないほう）', kind: 'hold', unit: '秒', better: 'more', place: 'any',
    how: ['平らな ゆかで、片足で 立つ（もう片足は 少し うかす）', 'うでを 広げても OK。ふらついたり 足が ついたら ストップ', '右と 左を はかって、少ないほうを 記録する'],
    drills: ['d-landing', 'd-dynamic'], cues: ['ひざを やわらかく', '1点を 見る', 'おなかに 力', '足首を ぐらつかせない'],
    note: 'ころばない よう、まわりに 物が ない場所で。' },
];
