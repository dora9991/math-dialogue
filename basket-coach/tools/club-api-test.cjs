#!/usr/bin/env node
/* クラブ（club/schema.sql）の通しの検査。手元の Postgres に schema.sql を流し、検査用サーバー（tools/club-dev-server.cjs）ごしに
   bg_* の関数を、コーチ・子ども・べつのクラブの人として呼ぶ。本番の Supabase には向けない。
   使い方：NODE_PATH=$(npm root -g) node tools/club-api-test.cjs [--db=postgres://postgres@127.0.0.1:54434/bgtest]
   調べること：ログイン（合言葉・あいことば・回数制限）・級と課題・提出（写真の点検・おきかえ）・評価と認定・
     ひろば（ことばの点検・コーチの確認・スタンプ）・写真を見られる人・べつのクラブから見えないこと・メンバーの変更と削除・
     テーブルと内部関数に anon から さわれないこと */
const path = require('path');
const { start } = require('./club-dev-server.cjs');

const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const DB = arg('db', process.env.BG_DB || 'postgres://postgres@127.0.0.1:54434/bgtest');
if (/supabase\.co/.test(DB)) { console.error('本番には実行できません'); process.exit(2); }

let pass = 0, fail = 0;
const ok = (cond, msg, extra) => { if (cond) pass++; else { fail++; console.log('✗ ' + msg + (extra !== undefined ? '  ' + JSON.stringify(extra).slice(0, 300) : '')); } };
const rnd = () => Math.random().toString(36).slice(2, 7);

// 小さな画像（JPEG の頭・PNG の頭）
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(400, 7), Buffer.from([0xff, 0xd9])]).toString('base64');
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(300, 1)]).toString('base64');
const BIG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(310000, 3)]).toString('base64');
const NOTIMG = Buffer.from('<html>' + 'x'.repeat(300) + '</html>').toString('base64');

const LEVELS = [
  { name: '10級', color: '#e9e5dc', note: 'はじめの一歩', tasks: [
    { title: 'ポンドドリブル（右手）', drill_id: 'd-pound', target: 20, unit: '回', cond: 'その場で', photo: 'opt' },
    { title: 'かべパス', drill_id: 'd-wallpass', target: 10, unit: '回', cond: '連続', photo: 'need' },
  ] },
  { name: '9級', color: '#f2c94c', tasks: [{ title: 'ゴール下シュート', drill_id: 'd-formshoot', target: 5, unit: '本', cond: '10本中', photo: 'none' }] },
];

(async () => {
  const srv = await start({ port: 54436, db: DB, schema: true });
  const rpc = async (fn, args, ip) => {
    const r = await fetch(`${srv.url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-test-ip': ip || '10.0.0.1' }, body: JSON.stringify(args || {}) });
    const j = await r.json().catch(() => null);
    return r.status === 200 ? j : { http: r.status, ...(j || {}) };
  };
  try {
    // ---------- クラブをつくる ----------
    let r = await rpc('bg_club_create', { p_name: 'テストクラブ' + rnd(), p_pass: 'pass', p_coach: 'たなか', p_levels: LEVELS });
    ok(r.error === 'weak_password', 'みじかい合言葉は ことわる', r);
    r = await rpc('bg_club_create', { p_name: '  ', p_pass: 'coach-pass-123', p_coach: 'たなか', p_levels: LEVELS });
    ok(r.error === 'bad_name', 'クラブの名前がないと ことわる', r);
    r = await rpc('bg_club_create', { p_name: 'テストクラブ', p_pass: 'coach-pass-123', p_coach: 'たなか' });
    ok(r.http === 404, '引数がたりないと 404（PostgREST と同じ）', r);
    r = await rpc('bg_club_create', { p_name: 'テストクラブ' + rnd(), p_pass: 'coach-pass-123', p_coach: 'たなか', p_levels: LEVELS });
    ok(r.ok && r.token && /^[A-Z2-9]{6}$/.test(r.club.code) && r.me.role === 'coach', 'クラブをつくる', r);
    const T = r.token, CODE = r.club.code;

    r = await rpc('bg_home', { p_token: T });
    ok(r.ok && r.levels.length === 2 && r.levels[0].name === '10級' && r.levels[0].tasks.length === 2 && r.counts.kids === 0, 'コーチのホーム（級・課題）', r);
    const L10 = r.levels[0], L9 = r.levels[1];
    const TK_POUND = L10.tasks[0].id, TK_WALL = L10.tasks[1].id, TK_SHOOT = L9.tasks[0].id;
    ok(L10.tasks[0].target === 20 && L10.tasks[0].unit === '回' && L10.tasks[1].photo === 'need', '課題の回数・単位・写真', L10.tasks);

    // ---------- コーチのログイン ----------
    ok((await rpc('bg_coach_login', { p_code: CODE, p_pass: 'wrong-pass-xx', p_name: 'たなか' })).error === 'bad_login', 'コーチ：合言葉ちがい');
    r = await rpc('bg_coach_login', { p_code: CODE.toLowerCase(), p_pass: 'coach-pass-123', p_name: 'すずき' });
    ok(r.ok && r.me.nickname === 'すずき', 'コーチ：2人目（コードは小文字でも可）', r);
    const T2 = r.token;
    r = await rpc('bg_coach_login', { p_code: CODE, p_pass: 'coach-pass-123', p_name: 'たなか' });
    ok(r.ok && r.me.nickname === 'たなか', 'コーチ：同じ名前なら 同じコーチ', r);

    // ---------- 子どもをふやす・ログイン ----------
    r = await rpc('bg_member_add', { p_token: T, p_nickname: 'けんた', p_grade: 'e56' });
    ok(r.ok && r.member.no === 1 && /^[0-9]{6}$/.test(r.pin), '子ども1（ばんごう1・あいことば6けた）', r);
    const K1 = r.member, PIN1 = r.pin;
    r = await rpc('bg_member_add', { p_token: T, p_nickname: 'ゆい', p_grade: 'j1' });
    const K2 = r.member, PIN2 = r.pin;
    ok(K2.no === 2, '子ども2（ばんごう2）');
    ok((await rpc('bg_member_add', { p_token: T, p_nickname: '', p_grade: 'e56' })).error === 'bad_name', 'ニックネームがないと ことわる');
    r = await rpc('bg_kid_login', { p_code: CODE, p_no: 1, p_pin: PIN1 });
    ok(r.ok && r.me.role === 'kid' && r.me.nickname === 'けんた', '子ども1のログイン', r);
    const S1 = r.token;
    const S2 = (await rpc('bg_kid_login', { p_code: CODE, p_no: 2, p_pin: PIN2 })).token;
    ok((await rpc('bg_kid_login', { p_code: CODE, p_no: 1, p_pin: PIN2 === PIN1 ? '000000' : PIN2 })).error === 'bad_login', '子ども：あいことばちがい');
    ok((await rpc('bg_kid_login', { p_code: 'ZZZZZZ', p_no: 1, p_pin: PIN1 })).error === 'bad_login', '子ども：クラブコードちがい');
    ok((await rpc('bg_kid_login', { p_code: CODE, p_no: 99, p_pin: PIN1 })).error === 'bad_login', '子ども：いない ばんごう');

    // 子どもは コーチの関数を使えない
    for (const [fn, a] of [['bg_queue', {}], ['bg_member_add', { p_nickname: 'x', p_grade: '' }], ['bg_members_list', {}], ['bg_levels_save', { p_levels: LEVELS }],
      ['bg_grant', { p_member_id: K1.id, p_level_id: L10.id, p_comment: '' }], ['bg_post_mod', { p_id: K1.id, p_status: 'hidden' }],
      ['bg_club_update', { p_name: 'x', p_settings: {}, p_old_pass: '', p_new_pass: '' }]]) {
      ok((await rpc(fn, Object.assign({ p_token: S1 }, a))).error === 'not_coach', `子どもは ${fn} を使えない`);
    }
    ok((await rpc('bg_home', { p_token: 'bad-token' })).error === 'auth', 'にせのトークンは ことわる');

    // ---------- 提出 ----------
    r = await rpc('bg_home', { p_token: S1 });
    ok(r.ok && r.me.kyu === null && r.subs.length === 0 && r.levels.length === 2 && r.notices.reviews === 0, '子どものホーム', r);
    ok((await rpc('bg_submit', { p_token: S1, p_task_id: TK_WALL, p_count: 10, p_note: '', p_photo: '', p_mime: '', p_check: null })).error === 'need_photo', '写真が必要な課題は 写真なしで ことわる');
    ok((await rpc('bg_submit', { p_token: S1, p_task_id: TK_WALL, p_count: 10, p_note: '', p_photo: NOTIMG, p_mime: 'image/jpeg', p_check: null })).error === 'bad_photo', '画像でないものは ことわる');
    ok((await rpc('bg_submit', { p_token: S1, p_task_id: TK_WALL, p_count: 10, p_note: '', p_photo: BIG, p_mime: 'image/jpeg', p_check: null })).error === 'photo_big', '大きすぎる写真は ことわる');
    ok((await rpc('bg_submit', { p_token: S1, p_task_id: TK_SHOOT, p_count: 5, p_note: '', p_photo: JPEG, p_mime: 'image/jpeg', p_check: null })).error === 'no_photo', '写真なしの課題に 写真は送れない');
    ok((await rpc('bg_submit', { p_token: S1, p_task_id: TK_POUND, p_count: 20, p_note: 'バカ', p_photo: '', p_mime: '', p_check: null })).error === 'ng_word', '提出のメモも ことばの点検');
    r = await rpc('bg_submit', { p_token: S1, p_task_id: TK_POUND, p_count: 18, p_note: 'あと少し', p_photo: JPEG, p_mime: 'image/jpeg',
      p_check: { mode: 'dribble', label: 'ドリブル', score: 83, metrics: [{ label: '腰の低さ', value: '74%', status: 'good' }], extra: 'x'.repeat(10) } });
    ok(r.ok, '提出（写真・動画チェックの結果つき）', r);
    const SUB1 = r.id;
    r = await rpc('bg_submit', { p_token: S1, p_task_id: TK_POUND, p_count: 22, p_note: 'できた！', p_photo: JPEG, p_mime: 'image/jpeg',
      p_check: { mode: 'dribble', label: 'ドリブル', score: 83, metrics: [{ label: '腰の低さ', value: '74%', status: 'good' }], extra: 'x'.repeat(10) } });
    ok(r.ok && r.id === SUB1, '同じ課題の 確認まちは おきかえる', r);
    r = await rpc('bg_home', { p_token: S1 });
    ok(r.subs.length === 1 && r.subs[0].count === 22 && r.subs[0].status === 'pending' && r.subs[0].photo_id, 'おきかえた提出', r.subs);
    const PH1 = r.subs[0].photo_id;
    let photos = (await srv.pool.query('select count(*)::int as n from bg_photos where member_id = $1', [K1.id])).rows[0].n;
    ok(photos === 1, 'おきかえた前の写真は 消えている', photos);
    r = await rpc('bg_submit', { p_token: S1, p_task_id: TK_WALL, p_count: 10, p_note: '', p_photo: PNG, p_mime: 'image/png', p_check: null });
    ok(r.ok, '提出（PNG）', r);
    const SUB2 = r.id;
    ok((await rpc('bg_submit', { p_token: T, p_task_id: TK_POUND, p_count: 1, p_note: '', p_photo: '', p_mime: '', p_check: null })).error === 'not_kid', 'コーチは提出しない');

    // 写真を見られる人
    ok((await rpc('bg_photo', { p_token: S1, p_id: PH1 })).ok, '写真：本人は見られる');
    const ph = await rpc('bg_photo', { p_token: T2, p_id: PH1 });
    ok(ph.ok && ph.mime === 'image/jpeg' && ph.data === JPEG, '写真：コーチは見られる（中身も同じ）');
    ok((await rpc('bg_photo', { p_token: S2, p_id: PH1 })).error === 'bad_photo', '写真：ほかの子は 提出の写真を見られない');

    // ---------- 評価と認定 ----------
    r = await rpc('bg_queue', { p_token: T });
    ok(r.ok && r.pending.length === 2 && r.pending[0].member.nickname === 'けんた' && r.pending[0].task.title && r.pending[0].task.level.name === '10級', 'コーチ：確認まち', r.pending);
    ok(r.pending[0].check && r.pending[0].check.score === 83 && !('extra' in r.pending[0].check), '動画チェックの結果は かたちをそろえて残る', r.pending[0].check);
    r = await rpc('bg_review', { p_token: T, p_id: SUB1, p_status: 'pass', p_comment: 'ナイス！' });
    ok(r.ok && r.level_done === false, '評価：合格（まだ級はそろわない）', r);
    r = await rpc('bg_review', { p_token: T, p_id: SUB2, p_status: 'retry', p_comment: 'もう少し強く' });
    ok(r.ok && r.level_done === false, '評価：もう一度', r);
    r = await rpc('bg_home', { p_token: S1 });
    ok(r.notices.reviews === 2, 'お知らせ：コーチから2つ', r.notices);
    await rpc('bg_seen', { p_token: S1 });
    ok((await rpc('bg_home', { p_token: S1 })).notices.reviews === 0, 'お知らせを見たら 0');
    r = await rpc('bg_submit', { p_token: S1, p_task_id: TK_WALL, p_count: 12, p_note: '', p_photo: JPEG, p_mime: 'image/jpeg', p_check: null });
    const SUB3 = r.id;
    ok(SUB3 !== SUB2, 'もう一度のあとは 新しい提出');
    r = await rpc('bg_review', { p_token: T2, p_id: SUB3, p_status: 'pass', p_comment: '' });
    ok(r.ok && r.level_done === true && r.level_id === L10.id, '評価：10級の課題がそろった', r);
    r = await rpc('bg_queue', { p_token: T });
    ok(r.ready.length === 1 && r.ready[0].member.id === K1.id && r.ready[0].level.name === '10級', 'コーチ：認定できる人', r.ready);
    r = await rpc('bg_grant', { p_token: T, p_member_id: K1.id, p_level_id: L10.id, p_comment: 'おめでとう！' });
    ok(r.ok && r.member.kyu && r.member.kyu.name === '10級', '認定：10級', r);
    r = await rpc('bg_grant', { p_token: T, p_member_id: K1.id, p_level_id: L10.id, p_comment: 'おめでとう!!' });
    ok(r.ok, '認定は2回しても1つ');
    r = await rpc('bg_home', { p_token: S1 });
    ok(r.me.kyu.name === '10級' && r.certs.length === 1 && r.notices.certs === 1, '子ども：10級になった', r.me);
    ok((await rpc('bg_queue', { p_token: T })).ready.length === 0, '認定したら「認定できる人」から消える');
    // コーチの判断で、課題がなくても 9級
    r = await rpc('bg_grant', { p_token: T, p_member_id: K2.id, p_level_id: L9.id, p_comment: '' });
    ok(r.ok && r.member.kyu.name === '9級', 'コーチの判断で 9級（課題の提出なし）', r);
    r = await rpc('bg_cert_remove', { p_token: T, p_member_id: K2.id, p_level_id: L9.id });
    ok(r.ok && r.member.kyu === null, '認定のとり消し → 級なし', r);

    // ---------- ひろば ----------
    r = await rpc('bg_feed', { p_token: S2, p_before: null, p_limit: 20 });
    ok(r.ok && r.posts.length === 1 && r.posts[0].kind === 'cert' && r.posts[0].meta.level === '10級' && r.posts[0].member.nickname === 'けんた', 'ひろば：合格がのる（とり消した9級はのらない）', r.posts);
    const CERT_POST = r.posts[0].id;
    for (const [body, code] of [['あいつ キモい', 'ng_word'], ['ここ見て https://example.com', 'no_link'], ['でんわ 090-1234-5678', 'private_info'], ['', 'empty']]) {
      ok((await rpc('bg_post', { p_token: S1, p_body: body, p_photo: '', p_mime: '', p_meta: null })).error === code, `ひろば：「${body}」→ ${code}`);
    }
    ok((await rpc('bg_post', { p_token: S1, p_body: '練習ばかりで フォームがくずれた。ボールをうごかす練習をした', p_photo: '', p_mime: '', p_meta: null })).ok, 'ひろば：「ばかり」「くずれる」「うごかす」は だいじょうぶ');
    r = await rpc('bg_post', { p_token: S1, p_body: '左手のドリブルが 30回つづいた！', p_photo: '', p_mime: '', p_meta: null });
    ok(r.ok && r.status === 'shown', 'ひろば：文だけの投稿は すぐ出る', r);
    const P1 = r.id;
    r = await rpc('bg_post', { p_token: S1, p_body: 'シュート練習', p_photo: JPEG, p_mime: 'image/jpeg', p_meta: null });
    ok(r.ok && r.status === 'waiting', 'ひろば：写真つきは コーチの確認まち', r);
    const P2 = r.id;
    r = await rpc('bg_post', { p_token: S2, p_body: '', p_photo: '', p_mime: '', p_meta: { type: 'menu', label: 'きょうのメニュー クリア', hack: 1 } });
    ok(r.ok && r.status === 'shown', 'ひろば：アプリの記録をシェア', r);
    r = await rpc('bg_feed', { p_token: S2, p_before: null, p_limit: 20 });
    ok(!r.posts.some((p) => p.id === P2), 'ひろば：確認まちの写真投稿は、ほかの子には見えない');
    const share = r.posts.find((p) => p.kind === 'share');
    ok(share && share.meta.type === 'menu' && !('hack' in share.meta), 'シェアは かたちをそろえて残る', share);
    r = await rpc('bg_feed', { p_token: T, p_before: null, p_limit: 20 });
    const p2c = r.posts.find((p) => p.id === P2);
    ok(p2c && p2c.status === 'waiting', 'コーチには 確認まちも見える');
    const photoP2 = p2c.photo_id;
    ok((await rpc('bg_photo', { p_token: S2, p_id: photoP2 })).error === 'bad_photo', '確認まちの写真は ほかの子に見えない');
    ok((await rpc('bg_home', { p_token: T })).counts.waiting === 1, 'コーチのホーム：確認まちの投稿 1');
    ok((await rpc('bg_post_mod', { p_token: T, p_id: P2, p_status: 'shown' })).ok, 'コーチが 投稿を出す');
    ok((await rpc('bg_photo', { p_token: S2, p_id: photoP2 })).ok, '出た投稿の写真は クラブのみんなが見られる');
    ok((await rpc('bg_feed', { p_token: S2, p_before: null, p_limit: 20 })).posts.some((p) => p.id === P2), '出た投稿は ほかの子にも見える');

    // スタンプ
    r = await rpc('bg_react', { p_token: S2, p_post_id: P1, p_stamp: 'like', p_on: true });
    ok(r.ok && r.post.reacts.like === 1 && r.post.mine.includes('like'), 'スタンプ：いいね', r.post);
    await rpc('bg_react', { p_token: S2, p_post_id: P1, p_stamp: 'like', p_on: true });
    r = await rpc('bg_react', { p_token: T, p_post_id: P1, p_stamp: 'nice', p_on: true });
    ok(r.post.reacts.like === 1 && r.post.reacts.nice === 1, 'スタンプ：同じ人の同じスタンプは1つ', r.post.reacts);
    ok((await rpc('bg_react', { p_token: S2, p_post_id: P1, p_stamp: 'bad', p_on: true })).error === 'bad_stamp', 'スタンプ：決まったものだけ');
    ok((await rpc('bg_home', { p_token: S1 })).notices.reacts === 2, 'お知らせ：スタンプ 2');
    r = await rpc('bg_react', { p_token: S2, p_post_id: P1, p_stamp: 'like', p_on: false });
    ok(!r.post.reacts.like && !r.post.mine.length, 'スタンプ：はずす', r.post);
    ok((await rpc('bg_react', { p_token: S1, p_post_id: CERT_POST, p_stamp: 'wow', p_on: true })).ok, '合格の投稿にも スタンプ');

    // かくす・消す
    ok((await rpc('bg_post_mod', { p_token: T, p_id: P1, p_status: 'hidden' })).ok, 'コーチが 投稿をかくす');
    ok(!(await rpc('bg_feed', { p_token: S2, p_before: null, p_limit: 20 })).posts.some((p) => p.id === P1), 'かくした投稿は ほかの子に見えない');
    ok((await rpc('bg_feed', { p_token: S1, p_before: null, p_limit: 20 })).posts.some((p) => p.id === P1 && p.status === 'hidden'), 'かくされた投稿は 本人には見える（かくされた と分かる）');
    ok((await rpc('bg_react', { p_token: S2, p_post_id: P1, p_stamp: 'like', p_on: true })).error === 'bad_post', 'かくした投稿には スタンプできない');
    ok((await rpc('bg_post_delete', { p_token: S2, p_id: P2 })).error === 'bad_post', 'ほかの子の投稿は 消せない');
    ok((await rpc('bg_post_delete', { p_token: S1, p_id: P2 })).ok, '自分の投稿は 消せる');
    ok((await srv.pool.query('select count(*)::int as n from bg_photos where id = $1', [photoP2])).rows[0].n === 0, '投稿を消すと 写真も消える');

    // ---------- べつのクラブ ----------
    r = await rpc('bg_club_create', { p_name: 'べつのクラブ' + rnd(), p_pass: 'other-pass-123', p_coach: 'やまだ', p_levels: LEVELS }, '10.0.0.2');
    const TX = r.token;
    ok((await rpc('bg_photo', { p_token: TX, p_id: PH1 })).error === 'bad_photo', 'べつのクラブ：写真は見えない');
    ok((await rpc('bg_feed', { p_token: TX, p_before: null, p_limit: 50 })).posts.every((p) => p.kind === 'cert' ? false : true) &&
       !(await rpc('bg_feed', { p_token: TX, p_before: null, p_limit: 50 })).posts.length, 'べつのクラブ：ひろばは空');
    ok((await rpc('bg_queue', { p_token: TX })).pending.length === 0, 'べつのクラブ：確認まちは見えない');
    ok((await rpc('bg_review', { p_token: TX, p_id: SUB1, p_status: 'retry', p_comment: '' })).error === 'bad_sub', 'べつのクラブ：評価できない');
    ok((await rpc('bg_grant', { p_token: TX, p_member_id: K1.id, p_level_id: L10.id, p_comment: '' })).error === 'bad_member', 'べつのクラブ：認定できない');
    ok((await rpc('bg_member_remove', { p_token: TX, p_member_id: K1.id })).error === 'bad_member', 'べつのクラブ：メンバーを消せない');
    ok((await rpc('bg_react', { p_token: TX, p_post_id: CERT_POST, p_stamp: 'like', p_on: true })).error === 'bad_post', 'べつのクラブ：スタンプできない');
    ok((await rpc('bg_submit', { p_token: S1, p_task_id: (await rpc('bg_home', { p_token: TX })).levels[0].tasks[0].id, p_count: 1, p_note: '', p_photo: '', p_mime: '', p_check: null })).error === 'bad_task', 'べつのクラブの課題には 提出できない');

    // ---------- 級をつくりなおす ----------
    r = await rpc('bg_home', { p_token: T });
    const lv = r.levels;
    lv[0].name = '10きゅう';
    lv[0].tasks[0].target = 30;
    lv[0].tasks.push({ title: 'ボディサークル', drill_id: 'd-handling', target: 10, unit: '周', cond: '連続', photo: 'opt' });
    lv[1].tasks = []; // 9級の課題をしまう
    lv.push({ name: '8級', color: '#f2994a', tasks: [{ title: 'レイアップ', drill_id: 'd-layup-step', target: 4, unit: '本', cond: '10本中', photo: 'opt', how: '右からと左から' }] });
    r = await rpc('bg_levels_save', { p_token: T, p_levels: lv });
    ok(r.ok && r.levels.length === 3 && r.levels[0].name === '10きゅう' && r.levels[0].tasks.length === 3 && r.levels[0].tasks[0].target === 30 && r.levels[1].tasks.length === 0 && r.levels[2].tasks[0].how === '右からと左から', '級をつくりなおす', r.levels);
    ok(r.levels[0].id === L10.id && r.levels[0].tasks[0].id === TK_POUND, 'id は そのまま（記録が つながる）');
    r = await rpc('bg_home', { p_token: S1 });
    ok(r.me.kyu.name === '10きゅう' && r.subs.some((s) => s.task_id === TK_POUND && s.status === 'pass'), '級の名前を変えても 合格はそのまま', r.me);
    ok((await rpc('bg_levels_save', { p_token: T, p_levels: [] })).error === 'bad_levels', '級を空にはできない');
    // 10級の級をしまうと、いまの級が計算しなおされる
    r = await rpc('bg_levels_save', { p_token: T, p_levels: lv.slice(1) });
    ok((await rpc('bg_home', { p_token: S1 })).me.kyu === null, '認定した級をしまうと、いまの級は「なし」');
    await rpc('bg_levels_save', { p_token: T, p_levels: lv });
    ok((await rpc('bg_home', { p_token: S1 })).me.kyu.name === '10きゅう', 'もどすと、いまの級も もどる');

    // ---------- メンバー ----------
    r = await rpc('bg_members_list', { p_token: T });
    const k1 = r.members.find((x) => x.id === K1.id);
    ok(r.ok && r.members.filter((x) => x.role === 'coach').length === 2 && k1.passes === 2 && k1.certs.length === 1 && k1.last, 'メンバーの一覧', k1);
    r = await rpc('bg_member_update', { p_token: T, p_member_id: K1.id, p_nickname: 'けんたろう', p_grade: 'j1', p_reset_pin: true });
    ok(r.ok && r.member.nickname === 'けんたろう' && /^[0-9]{6}$/.test(r.pin), 'メンバー：名前・あいことばを作りなおす', r);
    const NEWPIN = r.pin;
    ok((await rpc('bg_home', { p_token: S1 })).error === 'auth', 'あいことばを作りなおすと、前のログインは切れる');
    ok((await rpc('bg_kid_login', { p_code: CODE, p_no: 1, p_pin: PIN1 })).error === 'bad_login' || NEWPIN === PIN1, '前の あいことばでは入れない');
    const S1b = (await rpc('bg_kid_login', { p_code: CODE, p_no: 1, p_pin: NEWPIN })).token;
    ok(S1b, '新しい あいことばで入れる');

    // ---------- 回数制限（あいことばを まちがえつづけると、しばらく入れない） ----------
    for (let i = 0; i < 8; i++) await rpc('bg_kid_login', { p_code: CODE, p_no: 2, p_pin: '999999' }, '10.0.0.9');
    ok((await rpc('bg_kid_login', { p_code: CODE, p_no: 2, p_pin: PIN2 }, '10.0.0.9')).error === 'locked', '8回まちがえると、正しい あいことばでも しばらく入れない');
    r = await rpc('bg_member_update', { p_token: T, p_member_id: K2.id, p_nickname: '', p_grade: '', p_reset_pin: true });
    ok((await rpc('bg_kid_login', { p_code: CODE, p_no: 2, p_pin: r.pin }, '10.0.0.9')).ok, 'コーチが あいことばを作りなおすと、すぐ入れる');
    for (let i = 0; i < 10; i++) await rpc('bg_coach_login', { p_code: CODE, p_pass: 'nope-nope-nope', p_name: 'x' }, '10.0.0.8');
    ok((await rpc('bg_coach_login', { p_code: CODE, p_pass: 'coach-pass-123', p_name: 'たなか' }, '10.0.0.8')).error === 'locked', 'コーチの合言葉を10回まちがえると、しばらく入れない');
    await srv.pool.query("delete from bg_rate where key like 'cpass:%'");

    // ---------- クラブの設定・合言葉 ----------
    r = await rpc('bg_club_update', { p_token: T, p_name: '', p_settings: { review_posts: true, photos: false, bogus: true }, p_old_pass: '', p_new_pass: '' });
    ok(r.ok && r.club.settings.review_posts === true && r.club.settings.photos === false && !('bogus' in r.club.settings), 'せってい', r.club.settings);
    ok((await rpc('bg_post', { p_token: S1b, p_body: 'がんばった', p_photo: '', p_mime: '', p_meta: null })).status === 'waiting', 'せってい：投稿はぜんぶ確認のあと');
    ok((await rpc('bg_post', { p_token: S1b, p_body: '写真', p_photo: JPEG, p_mime: 'image/jpeg', p_meta: null })).error === 'no_photo', 'せってい：ひろばに写真を出さない');
    ok((await rpc('bg_club_update', { p_token: T, p_name: '', p_settings: {}, p_old_pass: 'wrong', p_new_pass: 'new-coach-pass-1' })).error === 'bad_login', '合言葉の変更：前の合言葉ちがい');
    r = await rpc('bg_club_update', { p_token: T, p_name: '', p_settings: {}, p_old_pass: 'coach-pass-123', p_new_pass: 'new-coach-pass-1' });
    ok(r.ok, '合言葉を変える');
    ok((await rpc('bg_home', { p_token: T2 })).error === 'auth', '合言葉を変えると、ほかのコーチの端末は ログアウト');
    ok((await rpc('bg_home', { p_token: T })).ok, '変えた本人は そのまま');

    // ---------- メンバーを消す・ログアウト・クラブを消す ----------
    r = await rpc('bg_member_remove', { p_token: T, p_member_id: K1.id });
    ok(r.ok, 'メンバーを消す');
    const left = (await srv.pool.query('select (select count(*) from bg_subs where member_id = $1)::int + (select count(*) from bg_photos where member_id = $1)::int + (select count(*) from bg_posts where member_id = $1)::int + (select count(*) from bg_certs where member_id = $1)::int as n', [K1.id])).rows[0].n;
    ok(left === 0, '消したメンバーの記録・写真・投稿・認定は のこらない', left);
    ok((await rpc('bg_home', { p_token: S1b })).error === 'auth', '消したメンバーは ログインが切れる');
    ok((await rpc('bg_logout', { p_token: TX })).ok && (await rpc('bg_home', { p_token: TX })).error === 'auth', 'ログアウト');

    // ---------- anon から テーブル・内部関数に さわれない ----------
    for (const q of ['select * from bg_clubs', 'select * from bg_photos', 'insert into bg_rate (key) values ($$x$$)', 'select _bg_pin()', 'select _bg_new_token(gen_random_uuid(), 1)']) {
      const cli = await srv.pool.connect();
      let denied = false;
      try { await cli.query('begin'); await cli.query('set local role anon'); await cli.query(q); } catch (e) { denied = /permission denied/.test(e.message); }
      await cli.query('rollback').catch(() => {});
      cli.release();
      ok(denied, `anon は「${q}」ができない`);
    }

    // クラブをまるごと消す
    ok((await rpc('bg_club_delete', { p_token: T, p_pass: 'coach-pass-123' })).error === 'bad_login', 'クラブを消す：合言葉ちがい');
    const clubId = (await rpc('bg_home', { p_token: T })).club.id;
    ok((await rpc('bg_club_delete', { p_token: T, p_pass: 'new-coach-pass-1' })).ok, 'クラブを消す');
    const rest = (await srv.pool.query('select (select count(*) from bg_members where club_id = $1)::int + (select count(*) from bg_photos where club_id = $1)::int + (select count(*) from bg_levels where club_id = $1)::int as n', [clubId])).rows[0].n;
    ok(rest === 0, 'クラブを消すと、なにも のこらない', rest);
  } catch (e) {
    fail++;
    console.log('✗ とちゅうで止まった：' + e.stack);
  } finally {
    await srv.close();
  }
  console.log(`\n${fail ? '✗' : '✓'} ${pass} 合格・${fail} 不合格`);
  process.exit(fail ? 1 : 0);
})();
