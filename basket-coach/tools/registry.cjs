/* 項目の一覧（id と名前と、書くファイル）。データを書く前に決めた「設計図」。
   ほかのファイルの項目を指すときは、ここにある id だけを使う（tools/check.cjs が、ここにない id をまちがいにする）。
   名前は、データの name・title の「目安」。少し言いかえてもよい。 */
const files = {
  'data/tactics-offense.js': { kind: 'tactic', items: {
    't-pnr': 'ピック＆ロール', 't-pnp': 'ピック＆ポップ', 't-spain': 'スペイン・ピック＆ロール', 't-handoff': 'ハンドオフ（DHO）',
    't-passcut': 'パス＆カット（ギブ＆ゴー）', 't-backdoor': 'バックドアカット', 't-downscreen': 'ダウンスクリーン', 't-backscreen': 'バックスクリーン（UCLAカット）',
    't-flare': 'フレアスクリーン', 't-stagger': 'スタッガースクリーン', 't-postup': 'ポストアップ（インサイドアウト）', 't-highlow': 'ハイロー',
    't-iso': 'アイソレーション', 't-5out': '5アウト', 't-4out1in': '4アウト1イン', 't-ddm': 'ドリブルドライブ・モーション',
    't-motion': 'モーションオフェンス', 't-14high': '1-4ハイ', 't-horns': 'ホーンズ', 't-flex': 'フレックスオフェンス',
    't-princeton': 'プリンストンオフェンス', 't-triangle': 'トライアングルオフェンス', 't-zone-off': 'ゾーンオフェンスの原則', 't-overload': 'オーバーロード',
    't-pressbreak': 'プレスブレイク', 't-blob': 'エンドラインからのスローイン（BLOB）', 't-slob': 'サイドラインからのスローイン（SLOB）', 't-endgame': '終盤の戦い方（時間と点差）',
    't-pace': 'ペースコントロール',
  } },
  'data/tactics-defense.js': { kind: 'tactic', items: {
    't-man': 'マンツーマンの原則', 't-pack': 'パックライン・ディフェンス', 't-deny': 'ディナイ・ディフェンス（プレッシャーマンツーマン）', 't-help': 'ヘルプ＆ローテーション',
    't-pnrd': 'ピック＆ロールの守り方', 't-hedge': 'ショウ・ヘッジ', 't-drop': 'ドロップ', 't-switch': 'スイッチ',
    't-ice': 'アイス（ブルー）', 't-blitz': 'ブリッツ（トラップ）', 't-postd': 'ポストディフェンス', 't-zone23': '2-3ゾーン',
    't-zone32': '3-2ゾーン（1-2-2）', 't-zone131': '1-3-1ゾーン', 't-matchup': 'マッチアップゾーン', 't-junk': 'ボックスワン・トライアングルツー',
    't-press-man': 'オールコート・マンツーマン', 't-press-1211': '1-2-1-1ゾーンプレス', 't-press-221': '2-2-1ゾーンプレス', 't-trap': 'トラップ（ダブルチーム）の原則',
    't-fastbreak': '速攻（3レーン）', 't-outnumber': 'アウトナンバー（2対1・3対2）の攻め方', 't-secondary': 'セカンダリーブレイク（アーリーオフェンス）', 't-trans-d': 'トランジションディフェンス（戻り）',
  } },
  'data/drills-shoot.js': { kind: 'drill', items: {
    // からだ
    'd-dynamic': 'ダイナミック・ウォームアップ', 'd-ladder': 'ラダートレーニング', 'd-suicide': 'ライン走（スーサイド）', 'd-sideline': 'サイドライン往復走',
    'd-landing': '着地とジャンプの練習（ケガ予防）', 'd-core': '体幹トレーニング', 'd-reaction': '反応ダッシュ', 'd-cooldown': 'クールダウン（静的ストレッチ）',
    // シュート
    'd-formshoot': 'フォームシューティング', 'd-lyingshoot': '寝ころびシュート', 'd-around': '5か所シューティング（アラウンド・ザ・ワールド）', 'd-catchshoot': 'キャッチ＆シュート',
    'd-pullup': '1ドリブル・プルアップ', 'd-ft': 'フリースロー・ルーティン', 'd-ftpressure': 'プレッシャー・フリースロー', 'd-partner': 'パートナーシューティング（1分間）',
    'd-beatpro': 'ビート・ザ・プロ', 'd-knockout': 'ノックアウト（シュートゲーム）', 'd-curlshoot': 'スクリーンからのシュート（カール・フェード）', 'd-contested': 'クローズアウト付きシュート',
    'd-fatigue-shoot': 'ダッシュ後のシュート',
    // フィニッシュ
    'd-mikan': 'マイカンドリル', 'd-layup-lines': '2列レイアップ', 'd-layup-step': 'レイアップのステップ練習', 'd-weakhand-layup': '逆手レイアップ',
    'd-eurostep': 'ユーロステップ', 'd-reverse-layup': 'リバースレイアップ（バックシュート）', 'd-contact-finish': 'コンタクト・フィニッシュ', 'd-powerup': 'パワーレイアップ',
    'd-floater': 'フローター',
  } },
  'data/drills-handle.js': { kind: 'drill', items: {
    // ドリブル
    'd-pound': 'ポンドドリブル', 'd-2ball': '2ボール・ドリブル', 'd-handling': 'ボールハンドリング（8の字・ボディサークル）', 'd-zigzag': 'ジグザグドリブル',
    'd-moves': 'ドリブルチェンジの技（クロスオーバー・レッグスルー・バック・ロール）', 'd-headup': '顔を上げるドリブル（指の数）', 'd-protect': 'プロテクトドリブル', 'd-dribble-tag': 'ドリブル鬼ごっこ',
    'd-speed-dribble': 'オールコート・スピードドリブル', 'd-tennisball': 'テニスボール・ドリブル', 'd-1v2-dribble': '1対2のプレッシャー突破',
    // パス
    'd-partner-pass': '対面パス（チェスト・バウンド・オーバーヘッド）', 'd-3man-weave': '3メン（スリーメン）', 'd-starpass': 'スターパス', 'd-keepaway': 'キープアウェイ（鳥かご）',
    'd-2ball-pass': '2ボールパス', 'd-pivot-pass': 'ピボット＆パス（ディフェンスつき）', 'd-meet': 'ミート＆キャッチ', 'd-wallpass': 'かべパス（ひとりでパス・キャッチ）',
    // フットワーク
    'd-jumpstop': 'ジャンプストップ＆ピボット', 'd-triple': 'トリプルスレット（ジャブステップ）',
    // 1対1の攻め
    'd-1v1-wing': 'ウイングからの1対1', 'd-1v1-full': 'オールコート1対1', 'd-1v1-limited': '2ドリブル制限の1対1', 'd-kickout': 'ドライブ＆キック',
    'd-shotfake': 'ショットフェイク＆ドライブ', 'd-attack-closeout': 'クローズアウトを攻める', 'd-chase': 'チェイスドリル', 'd-post-moves': 'ポストムーブ（ドロップステップ・フック）',
  } },
  'data/drills-team.js': { kind: 'drill', items: {
    // オフボール
    'd-vcut': 'Vカット・Lカット', 'd-backcut': 'バックドアカットの練習', 'd-screen-2v2': 'スクリーンの基本（2対2）', 'd-pnr-2v2': 'ピック＆ロール2対2',
    'd-nodribble3v3': 'ノードリブル3対3', 'd-drive-spacing': 'ドライブへの合わせ（ドリフト・リフト・ダイブ）',
    // リバウンド
    'd-boxout': 'ボックスアウト1対1', 'd-circle-boxout': 'サークル・ボックスアウト', 'd-rebound-war': 'リバウンド・ウォー', 'd-tip': 'ティップドリル',
    'd-outlet': 'リバウンド＆アウトレット', 'd-superman': 'スーパーマン・ドリル',
    // トランジション
    'd-2v1': '2対1', 'd-3v2-2v1': '3対2→2対1', 'd-11man': '11メン', 'd-5man-break': '5人の速攻（レーンを走る）', 'd-trans-3v3': 'トランジション3対3',
    // チームの攻め
    'd-5v0': '5対0（動きの確認）', 'd-4v4-motion': '4対4モーション', 'd-zone-offense': 'ゾーンオフェンスの練習', 'd-pressbreak-drill': 'プレスブレイクの練習',
    'd-cond-game': 'ルール付きゲーム', 'd-3v3-half': '3対3（ハーフコート）', 'd-inbound': 'スローインの練習',
  } },
  'data/drills-defense.js': { kind: 'drill', items: {
    // 1対1の守り
    'd-stance': 'スタンス＆スライド', 'd-zigzag-d': 'ジグザグ・ディフェンス', 'd-closeout': 'クローズアウト', 'd-mirror': 'ミラードリル',
    'd-charge': 'テイクチャージ（安全に）', 'd-deny-drill': 'ディナイドリル', 'd-ballpressure': 'ボールプレッシャー',
    // チームの守り
    'd-shell': 'シェルドリル', 'd-help-recover': 'ヘルプ＆リカバー', 'd-rotation': 'ローテーション・ドリル', 'd-talk': '声を出すディフェンス',
    'd-pnr-defense': 'ピック＆ロール・ディフェンス', 'd-scramble': 'スクランブル（数的不利の守り）', 'd-zone-d': 'ゾーンディフェンスの動き', 'd-trap-drill': 'トラップの練習',
    'd-post-defense': 'ポストディフェンスの練習',
    // 判断
    'd-endgame': '終盤のシチュエーション練習', 'd-advantage': 'アドバンテージ・ドリル（ズレからの判断）', 'd-film': '動画で振り返る',
    // メンタル
    'd-routine': 'プレショット・ルーティンづくり', 'd-competition': '勝ち負けをつける練習', 'd-breathing': '呼吸とイメージトレーニング', 'd-goalnote': '目標と振り返りノート',
    // 指導
    'd-huddle': '選手で話し合う振り返り（ハドル）', 'd-station': 'ステーション練習',
  } },
  'data/views-skills.js': { kind: 'view', items: {
    // シュート
    'v-shoot-base': '足とバランス（土台）', 'v-shoot-hold': 'ボールの持ち方と肘の向き', 'v-shoot-release': 'リリースとフォロースルー', 'v-shoot-arc': '軌道（アーチ）',
    'v-shoot-rhythm': 'リズムと全身の連動', 'v-shoot-ready': '打つ前の準備（ハンズ・足）', 'v-shoot-range': '飛距離と力の出どころ', 'v-shoot-select': 'シュートセレクション',
    // フィニッシュ
    'v-fin-step': '踏み切りとステップ', 'v-fin-hand': '手の使い分け（逆手）', 'v-fin-board': 'ボードの使い方', 'v-fin-contact': '当たりへの強さ（ボールを守る）',
    'v-fin-timing': '進入の角度とタイミングのずらし',
    // ドリブル
    'v-drb-low': '低く強くつく', 'v-drb-eyes': '顔を上げる（視野）', 'v-drb-protect': '体と腕でボールを守る', 'v-drb-change': '緩急と方向転換',
    'v-drb-purpose': 'ドリブルの目的（つきすぎない）', 'v-drb-weak': '逆手のドリブル',
    // パス
    'v-pass-target': '受け手の取りやすい場所へ', 'v-pass-timing': 'パスのタイミングと速さ', 'v-pass-fake': 'フェイクで守りをずらす', 'v-pass-choice': 'パスの種類を選ぶ',
    'v-pass-catch': '受け手の準備（ミート・ハンズ）',
    // フットワーク
    'v-foot-stop': '止まる技術', 'v-foot-pivot': 'ピボット', 'v-foot-triple': 'トリプルスレット', 'v-foot-first': 'ファーストステップ',
    // 1対1の攻め
    'v-atk-read': '守りを読む', 'v-atk-first': '一歩目と抜く角度', 'v-atk-fake': 'フェイクの使い方', 'v-atk-after': '抜いた後の判断',
    'v-atk-post': 'ポストでの攻め',
    // オフボール
    'v-off-space': 'スペーシング', 'v-off-cut': 'カットの質', 'v-off-screen': 'スクリーンのかけ方・使い方', 'v-off-timing': '動き出しのタイミング',
    'v-off-relocate': 'ドライブへの合わせ',
    // リバウンド
    'v-reb-predict': '落ちる場所の予測', 'v-reb-contact': '先に当たる（ボックスアウト）', 'v-reb-hands': '高い位置で両手でつかむ', 'v-reb-team': 'チームでのリバウンド（役割）',
    'v-reb-next': 'リバウンドを取った後',
  } },
  'data/views-team.js': { kind: 'view', items: {
    // 1対1の守り
    'v-def-stance': 'スタンス', 'v-def-distance': '間合い', 'v-def-feet': '足の運び', 'v-def-hands': '手の使い方（ファウルしない）',
    'v-def-direction': 'コースに入る（方向づけ）', 'v-def-closeout': 'クローズアウト',
    // チームの守り
    'v-dt-position': 'ボール・自分・マークの位置', 'v-dt-help': 'ヘルプの位置とタイミング', 'v-dt-rotate': 'ローテーション', 'v-dt-talk': '声（コミュニケーション）',
    'v-dt-screen': 'スクリーンへの対応', 'v-dt-post': 'ポストの守り',
    // トランジション
    'v-tr-outlet': 'リバウンドからの出し（アウトレット）', 'v-tr-lanes': 'レーンを走る', 'v-tr-decision': '数的有利の判断', 'v-tr-getback': '戻り',
    'v-tr-early': 'アーリーオフェンス',
    // チームの攻め
    'v-to-space': '5人の配置', 'v-to-ballmove': 'ボールを動かす', 'v-to-advantage': 'ズレをつなぐ', 'v-to-zone': 'ゾーン攻略の視点',
    'v-to-roles': '役割と個性', 'v-to-shotquality': '良いシュートを選ぶ',
    // 判断
    'v-iq-situation': '点差・時間・ファウルを読む', 'v-iq-scan': '首を振る（スキャン）', 'v-iq-turnover': 'ターンオーバーを減らす', 'v-iq-adjust': '試合中の修正',
    // からだ
    'v-body-agility': '敏捷性', 'v-body-stamina': '持久力', 'v-body-power': '当たりに負けない力', 'v-body-injury': 'ケガの予防',
    'v-body-recovery': '回復（睡眠・食事・休養）',
    // メンタル
    'v-mind-nerve': '緊張とのつきあい方', 'v-mind-confidence': '自信', 'v-mind-focus': '集中と切りかえ', 'v-mind-mistake': 'ミスの受け止め方',
    'v-mind-motivation': 'やる気と目標',
    // 指導
    'v-coach-design': '練習の組み立て', 'v-coach-feedback': '声かけ・フィードバック', 'v-coach-gap': 'レベル差への対応', 'v-coach-autonomy': '主体性を育てる',
    'v-coach-fun': '楽しさと競争', 'v-coach-team': 'チームの雰囲気', 'v-coach-game': '試合での采配',
  } },
  'data/issues-player.js': { kind: 'issue', items: {
    // シュート
    'i-shoot-miss': 'シュートが入らない', 'i-shoot-form': 'シュートフォームが安定しない', 'i-shoot-range': '遠くから届かない', 'i-shoot-lr': 'シュートが左右にずれる',
    'i-shoot-depth': 'シュートが手前・奥に当たる', 'i-shoot-game': '試合になるとシュートが入らない', 'i-shoot-ft': 'フリースローが入らない', 'i-shoot-slow': 'シュートが遅い・ブロックされる',
    'i-shoot-hesitate': 'シュートを打てない・迷う',
    // フィニッシュ
    'i-layup-miss': 'レイアップが入らない', 'i-layup-step': 'レイアップの足が合わない', 'i-weakhand': '逆の手でシュートできない', 'i-blocked': 'ゴール下でブロックされる・当たられると落とす',
    // ドリブル
    'i-drb-stolen': 'ドリブル中にボールを取られる', 'i-drb-lookdown': 'ドリブルで下を見てしまう', 'i-drb-weak': '逆手のドリブルが苦手', 'i-drb-press': 'プレッシャーをかけられるとボールを運べない',
    'i-drb-toomuch': 'ドリブルをつきすぎる',
    // パス
    'i-pass-steal': 'パスをカットされる', 'i-pass-bad': 'パスがそれる・強さが合わない', 'i-catch': 'キャッチミスが多い', 'i-pass-vision': 'パスを出す相手が見つからない',
    // フットワーク
    'i-travel': 'トラベリングをとられる', 'i-trapped': '囲まれると何もできない',
    // 1対1の攻め
    'i-cant-beat': '1対1で抜けない', 'i-drive-after': '抜いた後どうするか迷う', 'i-passive': '攻めるのが怖い・すぐパスしてしまう', 'i-post': 'ポストで攻められない',
    // オフボール
    'i-cant-get-open': 'ボールをもらえない（フリーになれない）', 'i-standing': '止まってしまう・どこに動けばいいか分からない', 'i-spacing': '味方同士が近くて混む', 'i-screen': 'スクリーンがうまく使えない',
    // リバウンド
    'i-reb-lose': 'リバウンドが取れない', 'i-reb-bigger': '大きい相手にリバウンドで負ける', 'i-oreb': 'オフェンスリバウンドに入れない',
  } },
  'data/issues-team.js': { kind: 'issue', items: {
    // 1対1の守り
    'i-def-beat': 'ディフェンスで抜かれる', 'i-def-foul': 'ファウルが多い', 'i-def-shooter': 'シューターに打たれる', 'i-def-quick': '速い相手についていけない',
    'i-def-post': 'ポストで押しこまれる',
    // チームの守り
    'i-help': 'ヘルプが遅い・カバーがいない', 'i-dt-talk': 'ディフェンスの声が出ない', 'i-screen-d': 'スクリーン・ピック＆ロールを守れない', 'i-backdoor': '裏をとられる（バックドア）',
    'i-dt-breakdown': '1人抜かれると守りが崩れる',
    // トランジション
    'i-fb-none': '速攻が出ない', 'i-fb-finish': '速攻を決めきれない', 'i-getback': '戻りが遅い・速攻をやられる',
    // チームの攻め
    'i-vs-zone': 'ゾーンディフェンスを攻略できない', 'i-vs-press': 'プレスをかけられると崩れる', 'i-to-stuck': 'オフェンスが止まる・1人で攻めてしまう', 'i-to-pattern': '決まった攻め方（セットプレー）がほしい',
    'i-to-badshot': '無理なシュートが多い', 'i-vs-tall': '大きい相手に勝てない', 'i-vs-deny': 'ディナイが激しくてボールが回らない', 'i-inbound': 'スローインが入らない',
    // 判断
    'i-turnover': 'ターンオーバーが多い', 'i-endgame': '接戦の終盤で負ける', 'i-read': '状況判断が遅い', 'i-momentum': '流れが悪いときに立て直せない',
    // からだ
    'i-stamina': '後半にバテる', 'i-weak-body': '当たり負けする', 'i-slow': '動きが遅い・反応が遅い', 'i-injury': 'ケガが多い・痛みがある',
    'i-jump': 'ジャンプ力をつけたい',
    // メンタル
    'i-nerve': '試合で緊張する', 'i-mistake-fear': 'ミスを怖がる・引きずる', 'i-confidence': '自信がない', 'i-motivation': 'やる気が出ない・続かない',
    'i-focus': '集中が続かない',
    // 指導
    'i-practice-plan': '練習メニューの組み方がわからない', 'i-manneri': '練習がマンネリ・選手が飽きる', 'i-gap': 'うまい子とはじめての子の差が大きい', 'i-listen': '話を聞かない・主体性がない',
    'i-few': '人数が少ない・ゴールが少ない', 'i-beginner': 'はじめて教える・何から教えればいいか', 'i-team-mood': 'チームの雰囲気が悪い', 'i-home': '家でできる練習が知りたい',
    'i-short-time': '練習時間が短い',
  } },
};

// { tactic: { id: 名前 }, drill: {…}, view: {…}, issue: {…} }
const byKind = { tactic: {}, drill: {}, view: {}, issue: {} };
const fileOf = {};
for (const [file, { kind, items }] of Object.entries(files)) {
  for (const [id, name] of Object.entries(items)) {
    byKind[kind][id] = name;
    fileOf[id] = file;
  }
}
module.exports = { files, byKind, fileOf };

// node tools/registry.cjs で、一覧を見やすく出す
if (require.main === module) {
  for (const [file, { kind, items }] of Object.entries(files)) {
    console.log(`\n## ${file}（${Object.keys(items).length}）`);
    for (const [id, name] of Object.entries(items)) console.log(`${id}\t${name}`);
  }
  console.log('\n合計：' + Object.entries(byKind).map(([k, v]) => `${k} ${Object.keys(v).length}`).join('・'));
}
