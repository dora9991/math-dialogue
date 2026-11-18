#!/usr/bin/env node
/* クラブ v2 の通しの検査（club/schema.sql の v2：級の種類・自主練・コーチの拍手／いいね／怒り・予定と参加の申し込み・体験／入団の申し込み）。
   手元の Postgres に schema.sql を流し、検査用サーバー（tools/club-dev-server.cjs）ごしに bg_* の関数を呼ぶ。本番の Supabase には向けない。
   使い方：NODE_PATH=$(npm root -g) node tools/club-api-test2.cjs [--db=postgres://postgres@127.0.0.1:54434/bgtest] */
const { start } = require('./club-dev-server.cjs');

const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const DB = arg('db', process.env.BG_DB || 'postgres://postgres@127.0.0.1:54434/bgtest');
if (/supabase\.co/.test(DB)) { console.error('本番には実行できません'); process.exit(2); }

let pass = 0, fail = 0;
const ok = (cond, msg, extra) => { if (cond) pass++; else { fail++; console.log('✗ ' + msg + (extra !== undefined ? '  ' + JSON.stringify(extra).slice(0, 400) : '')); } };
const rnd = () => Math.random().toString(36).slice(2, 7);
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(400, 7), Buffer.from([0xff, 0xd9])]).toString('base64');
const T = (title, drill_id, target, unit, cond, photo = 'opt') => ({ title, drill_id, target, unit, cond, how: '', photo });
const SOGO = [{ name: '10級', color: '#e9e5dc', tasks: [T('ボディサークル', 'd-handling', 10, '周', '連続')] }];
const DRIBBLE = [
  { name: '10級', color: '#e9e5dc', tasks: [T('ポンドドリブル（右手）', 'd-pound', 20, '回', 'その場で'), T('ボディサークル', 'd-handling', 10, '周', '連続')] },
  { name: '9級', color: '#f2c94c', tasks: [T('ポンドドリブル（左手）', 'd-pound', 20, '回', 'その場で')] },
];
const dayStr = (d) => d.toISOString().slice(0, 10);

(async () => {
  const srv = await start({ port: 54438, db: DB, schema: true });
  const rpc = async (fn, args, ip) => {
    const r = await fetch(`${srv.url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-test-ip': ip || '10.1.0.1' }, body: JSON.stringify(args || {}) });
    const j = await r.json().catch(() => null);
    return r.status === 200 ? j : { http: r.status, ...(j || {}) };
  };
  const q1 = async (sql, params) => (await srv.pool.query(sql, params)).rows[0];
  try {
    // 前に流したときの 申し込みの回数制限を消す（手元の検査用の Postgres だけ）
    await srv.pool.query(`delete from bg_rate where key like 'apply%'`);
    // 日本の「きょう」（サーバーの関数と同じ）
    const TODAY = (await q1(`select (now() at time zone 'Asia/Tokyo')::date::text as d`)).d;
    const day = (n) => { const d = new Date(TODAY + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return dayStr(d); };

    // ---------- じゅんび：クラブ・コーチ・子ども3人・べつのクラブ ----------
    let r = await rpc('bg_club_create', { p_name: 'v2クラブ' + rnd(), p_pass: 'coach-pass-123', p_coach: 'たなか', p_levels: SOGO });
    ok(r.ok, 'クラブをつくる', r);
    const C = r.token, CODE = r.club.code;
    const kids = [];
    for (const n of ['けんた', 'ゆい', 'そら']) {
      const a = await rpc('bg_member_add', { p_token: C, p_nickname: n, p_grade: 'e56' });
      const l = await rpc('bg_kid_login', { p_code: CODE, p_no: a.member.no, p_pin: a.pin });
      kids.push({ id: a.member.id, tok: l.token, name: n });
    }
    const [K1, K2, K3] = kids;
    ok(K1.tok && K2.tok && K3.tok, '子ども3人のログイン');
    r = await rpc('bg_club_create', { p_name: 'べつのクラブ' + rnd(), p_pass: 'other-pass-123', p_coach: 'やまだ', p_levels: SOGO }, '10.1.0.9');
    const OC = r.token;
    const oa = await rpc('bg_member_add', { p_token: OC, p_nickname: 'ほか', p_grade: 'e34' });
    const OK1 = { id: oa.member.id, tok: (await rpc('bg_kid_login', { p_code: r.club.code, p_no: 1, p_pin: oa.pin })).token };

    // ---------- 級の種類（スキルごとの級） ----------
    r = await rpc('bg_home', { p_token: C });
    ok(r.ok && r.tracks.length === 1 && r.tracks[0].name === '総合' && r.levels.every((l) => l.track_id === r.tracks[0].id), 'はじめは「総合」の1種類', r.tracks);
    const TR_SOGO = r.tracks[0].id, L_SOGO10 = r.levels[0].id;
    ok((await rpc('bg_track_save', { p_token: K1.tok, p_track_id: null, p_name: 'ドリブル', p_icon: 'ball', p_levels: DRIBBLE })).error === 'not_coach', '子どもは 種類をつくれない');
    ok((await rpc('bg_track_save', { p_token: C, p_track_id: null, p_name: 'ドリブル', p_icon: 'ball', p_levels: [] })).error === 'bad_levels', '級のない種類は つくれない');
    ok((await rpc('bg_track_save', { p_token: C, p_track_id: null, p_name: ' ', p_icon: 'ball', p_levels: DRIBBLE })).error === 'bad_name', '名前のない種類は つくれない');
    r = await rpc('bg_track_save', { p_token: C, p_track_id: null, p_name: 'ドリブル', p_icon: 'ball', p_levels: DRIBBLE });
    ok(r.ok && r.tracks.length === 2 && r.tracks[1].name === 'ドリブル' && r.tracks[1].icon === 'ball', '「ドリブル」の種類をつくる', r);
    const TR_DR = r.track_id;
    const drLevels = r.levels.filter((l) => l.track_id === TR_DR);
    ok(drLevels.length === 2 && drLevels[0].name === '10級' && drLevels[0].tasks.length === 2, 'ドリブルの級と課題', drLevels);
    const L_DR10 = drLevels[0], L_DR9 = drLevels[1];
    ok((await rpc('bg_track_save', { p_token: OC, p_track_id: TR_DR, p_name: 'のっとり', p_icon: 'ball', p_levels: DRIBBLE })).error === 'bad_track', 'べつのクラブのコーチは 種類を直せない');

    r = await rpc('bg_home', { p_token: K1.tok });
    ok(r.ok && r.tracks.length === 2 && r.levels.length === 3 && Array.isArray(r.kyus) && r.kyus.length === 0, '子どもにも 2種類の級が見える', { t: r.tracks, n: r.levels.length });
    // ドリブル10級の課題を2つ出して、合格 → 認定できる
    for (const t of L_DR10.tasks) await rpc('bg_submit', { p_token: K1.tok, p_task_id: t.id, p_count: t.target, p_note: '', p_photo: '', p_mime: '', p_check: null });
    r = await rpc('bg_queue', { p_token: C });
    for (const s of r.pending) await rpc('bg_review', { p_token: C, p_id: s.id, p_status: 'pass', p_comment: '' });
    r = await rpc('bg_queue', { p_token: C });
    const rd = r.ready.find((x) => x.member.id === K1.id);
    ok(rd && rd.level.id === L_DR10.id && rd.level.track === 'ドリブル', '認定できる級に「ドリブル 10級」', r.ready);
    ok((await rpc('bg_home', { p_token: C })).counts.ready === 1, 'コーチのホーム：認定できる 1');
    r = await rpc('bg_grant', { p_token: C, p_member_id: K1.id, p_level_id: L_DR10.id, p_comment: 'ナイス！' });
    ok(r.ok && r.member.kyu === null && r.level.track === 'ドリブル' && r.level.name === '10級', 'ドリブル10級を認定（メインの級は かわらない）', r);
    r = await rpc('bg_feed', { p_token: K2.tok, p_before: null, p_limit: 10 });
    ok(r.posts.some((p) => p.kind === 'cert' && p.meta.track === 'ドリブル' && p.meta.level === '10級'), 'ひろばに「ドリブル 10級に合格」', r.posts.map((p) => p.meta));
    await rpc('bg_grant', { p_token: C, p_member_id: K1.id, p_level_id: L_SOGO10, p_comment: '' });
    r = await rpc('bg_home', { p_token: K1.tok });
    ok(r.me.kyu && r.me.kyu.name === '10級' && r.me.kyu.track === '総合' && r.kyus.length === 2 && r.kyus[0].track_id === TR_SOGO && r.kyus[1].track_id === TR_DR,
      '子ども：メインの級（総合）と、種類ごとの級', { kyu: r.me.kyu, kyus: r.kyus });
    r = await rpc('bg_members_list', { p_token: C });
    ok(r.members.find((m) => m.id === K1.id).kyus.length === 2, 'メンバー一覧：種類ごとの級');
    // 直す：名前と回数（id はそのまま）。べつの種類の級の id をまぜても 動かさない（新しくつくる）
    const edit = [{ id: L_DR10.id, name: '10級', color: '#e9e5dc', tasks: L_DR10.tasks.map((t) => Object.assign({}, t, { target: t.target + 5 })) },
      { id: L_SOGO10, name: 'まぎれ', color: '#f2c94c', tasks: [T('まぎれた課題', '', 1, '回', '')] }];
    r = await rpc('bg_track_save', { p_token: C, p_track_id: TR_DR, p_name: 'ドリブル検定', p_icon: 'ball', p_levels: edit });
    const dr2 = r.levels.filter((l) => l.track_id === TR_DR), so2 = r.levels.filter((l) => l.track_id === TR_SOGO);
    ok(r.ok && r.tracks[1].name === 'ドリブル検定' && dr2[0].id === L_DR10.id && dr2[0].tasks[0].target === L_DR10.tasks[0].target + 5, '種類の名前と回数を直す（id はそのまま）', dr2);
    ok(dr2.length === 2 && dr2[1].id !== L_SOGO10 && so2.length === 1 && so2[0].id === L_SOGO10, 'べつの種類の級は 動かない（新しい級になる）', { dr2, so2 });
    ok(!dr2.some((l) => l.id === L_DR9.id), 'のせなかった級（9級）は しまう');
    // v1 の bg_levels_save は メインの種類だけ
    r = await rpc('bg_levels_save', { p_token: C, p_levels: [{ id: L_SOGO10, name: '10級', color: '#e9e5dc', tasks: [T('ボディサークル', 'd-handling', 12, '周', '連続')] }] });
    ok(r.ok && r.levels.filter((l) => l.track_id === TR_DR).length === 2, 'bg_levels_save（メインだけ）は ほかの種類を しまわない', r.levels.map((l) => l.track_id));
    // しまう
    ok((await rpc('bg_track_remove', { p_token: K1.tok, p_track_id: TR_DR })).error === 'not_coach', '子どもは 種類をしまえない');
    r = await rpc('bg_track_remove', { p_token: C, p_track_id: TR_DR });
    ok(r.ok && r.tracks.length === 1 && r.levels.every((l) => l.track_id === TR_SOGO), '種類をしまう', r.tracks);
    r = await rpc('bg_home', { p_token: K1.tok });
    ok(r.kyus.length === 1 && r.me.kyu && r.me.kyu.track === '総合', 'しまった種類の級は 出ない', r.kyus);
    ok((await rpc('bg_grant', { p_token: C, p_member_id: K2.id, p_level_id: L_DR10.id, p_comment: '' })).error === 'bad_level', 'しまった種類の級は 認定できない');
    ok((await q1('select count(*)::int as n from bg_certs where member_id = $1', [K1.id])).n === 2, 'しまっても 認定の記録は のこる');
    ok((await rpc('bg_track_remove', { p_token: C, p_track_id: TR_SOGO })).error === 'last_track', 'さいごの1種類は しまえない');
    // 8種類まで
    let made = 1;
    for (let i = 0; i < 8; i++) { const a = await rpc('bg_track_save', { p_token: C, p_track_id: null, p_name: 'しゅるい' + i, p_icon: 'star', p_levels: SOGO }); if (a.ok) made++; else { ok(a.error === 'too_many', '9つめは ふやせない', a); break; } }
    ok(made === 8, '種類は 8つまで', made);
    // 名前の点検
    ok((await rpc('bg_track_save', { p_token: C, p_track_id: TR_SOGO, p_name: 'バカ', p_icon: 'star', p_levels: SOGO })).error === 'ng_word', '種類の名前も ことばの点検');

    // ---------- 自主練（クエスト） ----------
    const base = { p_token: C, p_id: null, p_title: 'ドリブル100回', p_drill_id: 'd-pound', p_target: 100, p_unit: '回', p_times: 3, p_start: TODAY, p_end: day(6), p_photo: 'opt', p_how: '左右50回ずつ', p_members: null };
    ok((await rpc('bg_quest_save', Object.assign({}, base, { p_token: K1.tok }))).error === 'not_coach', '子どもは 自主練をつくれない');
    ok((await rpc('bg_quest_save', Object.assign({}, base, { p_title: '' }))).error === 'bad_name', '自主練：名前がない');
    ok((await rpc('bg_quest_save', Object.assign({}, base, { p_times: 0 }))).error === 'bad_count', '自主練：回数 0');
    ok((await rpc('bg_quest_save', Object.assign({}, base, { p_target: 20000 }))).error === 'bad_count', '自主練：数が多すぎる');
    ok((await rpc('bg_quest_save', Object.assign({}, base, { p_end: day(-1) }))).error === 'bad_date', '自主練：おわりが はじめより前');
    ok((await rpc('bg_quest_save', Object.assign({}, base, { p_end: day(100) }))).error === 'bad_date', '自主練：期間が長すぎる');
    ok((await rpc('bg_quest_save', Object.assign({}, base, { p_how: 'しね' }))).error === 'ng_word', '自主練：ことばの点検');
    ok((await rpc('bg_quest_save', Object.assign({}, base, { p_members: [OK1.id] }))).error === 'bad_member', '自主練：べつのクラブの子は えらべない');
    r = await rpc('bg_quest_save', base);
    ok(r.ok && r.quest.times === 3 && r.quest.members === null && r.quest.end_on === day(6), '自主練をつくる（全員）', r);
    const QA = r.quest.id;
    r = await rpc('bg_quest_save', Object.assign({}, base, { p_title: 'シュート50本', p_target: 50, p_unit: '本', p_times: 2, p_photo: 'need', p_members: [K2.id] }));
    ok(r.ok && r.quest.members.length === 1 && r.quest.photo === 'need', '自主練をつくる（ゆいだけ・写真が必要）', r);
    const QB = r.quest.id;
    r = await rpc('bg_quest_save', Object.assign({}, base, { p_title: 'あしたから', p_start: day(1), p_end: day(3) }));
    const QF = r.quest.id;
    r = await rpc('bg_quest_save', Object.assign({}, base, { p_title: 'もうおわり', p_start: day(-5), p_end: day(-1) }));
    const QO = r.quest.id;

    r = await rpc('bg_quest_list', { p_token: K1.tok });
    ok(r.ok && r.quests.some((q) => q.id === QA) && !r.quests.some((q) => q.id === QB) && r.quests.every((q) => !('members' in q)), 'けんたには 全員の自主練だけ（えらばれた子の一覧は 見えない）', r.quests.map((q) => q.title));
    r = await rpc('bg_quest_list', { p_token: K2.tok });
    ok(r.quests.some((q) => q.id === QB), 'ゆいには ゆいだけの自主練も見える');
    r = await rpc('bg_home', { p_token: K1.tok });
    ok(r.notices.quests >= 1 && r.quests.some((q) => q.id === QA && q.n === 0), '子どものホーム：新しい自主練のお知らせ', r.notices);
    await rpc('bg_seen', { p_token: K1.tok });
    ok((await rpc('bg_home', { p_token: K1.tok })).notices.quests === 0, '見たら お知らせは 0');

    ok((await rpc('bg_quest_log', { p_token: C, p_quest_id: QA, p_count: 100, p_note: '', p_photo: '', p_mime: '' })).error === 'not_kid', 'コーチは 記録できない');
    ok((await rpc('bg_quest_log', { p_token: K1.tok, p_quest_id: QB, p_count: 50, p_note: '', p_photo: '', p_mime: '' })).error === 'bad_quest', 'えらばれていない自主練は 記録できない');
    ok((await rpc('bg_quest_log', { p_token: K1.tok, p_quest_id: QF, p_count: 100, p_note: '', p_photo: '', p_mime: '' })).error === 'not_yet', 'まだ はじまっていない');
    ok((await rpc('bg_quest_log', { p_token: K1.tok, p_quest_id: QO, p_count: 100, p_note: '', p_photo: '', p_mime: '' })).error === 'quest_over', 'もう おわった');
    ok((await rpc('bg_quest_log', { p_token: K2.tok, p_quest_id: QB, p_count: 50, p_note: '', p_photo: '', p_mime: '' })).error === 'need_photo', '写真が必要な自主練');
    r = await rpc('bg_quest_log', { p_token: K2.tok, p_quest_id: QB, p_count: 50, p_note: 'できた', p_photo: JPEG, p_mime: 'image/jpeg' });
    ok(r.ok && r.n === 1 && !r.cleared, 'ゆい：写真つきで記録', r);
    const logB = (await rpc('bg_quest', { p_token: K2.tok, p_id: QB })).logs[0];
    ok(logB && logB.photo_id, '記録の写真');
    ok((await rpc('bg_photo', { p_token: K2.tok, p_id: logB.photo_id })).ok && (await rpc('bg_photo', { p_token: C, p_id: logB.photo_id })).ok, '自主練の写真：本人とコーチは 見られる');
    ok((await rpc('bg_photo', { p_token: K1.tok, p_id: logB.photo_id })).error === 'bad_photo', '自主練の写真：ほかの子は 見られない');
    ok((await rpc('bg_quest_log', { p_token: K1.tok, p_quest_id: QA, p_count: 100, p_note: 'バカ', p_photo: '', p_mime: '' })).error === 'ng_word', '記録のひとことも ことばの点検');
    r = await rpc('bg_quest_log', { p_token: K1.tok, p_quest_id: QA, p_count: 100, p_note: '', p_photo: '', p_mime: '' });
    ok(r.ok && r.n === 1 && r.times === 3 && !r.cleared, 'けんた：1回目', r);
    await rpc('bg_quest_log', { p_token: K1.tok, p_quest_id: QA, p_count: 100, p_note: '', p_photo: '', p_mime: '' });
    r = await rpc('bg_quest_log', { p_token: K1.tok, p_quest_id: QA, p_count: 120, p_note: 'クリア！', p_photo: '', p_mime: '' });
    ok(r.ok && r.n === 3 && r.cleared && r.just_cleared, 'けんた：3回目で クリア', r);
    ok((await rpc('bg_quest_log', { p_token: K1.tok, p_quest_id: QA, p_count: 100, p_note: '', p_photo: '', p_mime: '' })).error === 'today_full', '1日 3回まで');
    r = await rpc('bg_feed', { p_token: K3.tok, p_before: null, p_limit: 20 });
    const qpost = r.posts.find((p) => p.kind === 'quest' && p.member.id === K1.id);
    ok(qpost && qpost.meta.title === 'ドリブル100回' && qpost.meta.times === 3, 'ひろばに「自主練クリア」', r.posts.map((p) => p.kind));
    r = await rpc('bg_quest', { p_token: K1.tok, p_id: QA });
    ok(r.ok && r.n === 3 && r.logs.length === 3 && r.logs.every((g) => g.member_id === K1.id), '子ども：自分の記録だけ', r);
    ok((await rpc('bg_quest', { p_token: K1.tok, p_id: QB })).error === 'bad_quest', '子ども：えらばれていない自主練は 開けない');
    ok((await rpc('bg_quest', { p_token: OK1.tok, p_id: QA })).error === 'bad_quest', 'べつのクラブの子は 開けない');
    r = await rpc('bg_quest', { p_token: C, p_id: QA });
    const kq = (id) => r.kids.find((x) => x.member.id === id);
    ok(r.ok && r.kids.length === 3 && kq(K1.id).n === 3 && kq(K2.id).n === 0 && kq(K1.id).logs.length === 3, 'コーチ：子どもごとの回数と記録', r.kids.map((x) => [x.member.nickname, x.n]));
    r = await rpc('bg_quest_list', { p_token: C });
    const qa = r.quests.find((q) => q.id === QA);
    ok(qa && qa.kids === 3 && qa.cleared === 1 && qa.logs === 3 && qa.today === 3 && qa.unrated === 3, 'コーチの一覧：クリア1人・記録3・きょう3・まだ反応なし3', qa);
    ok((await rpc('bg_home', { p_token: C })).counts.logs_today === 4, 'コーチのホーム：きょうの記録', (await rpc('bg_home', { p_token: C })).counts);

    // ---------- コーチの 拍手・いいね・怒り ----------
    const logA = (await rpc('bg_quest', { p_token: K1.tok, p_id: QA })).logs[0];
    ok((await rpc('bg_coach_react', { p_token: K1.tok, p_post_id: null, p_log_id: logA.id, p_stamp: 'clap', p_comment: '' })).error === 'not_coach', '子どもは コーチのボタンを使えない');
    ok((await rpc('bg_coach_react', { p_token: C, p_post_id: null, p_log_id: null, p_stamp: 'clap', p_comment: '' })).error === 'bad_target', 'どれにも つけない → ことわる');
    ok((await rpc('bg_coach_react', { p_token: C, p_post_id: qpost.id, p_log_id: logA.id, p_stamp: 'clap', p_comment: '' })).error === 'bad_target', '2つに同時 → ことわる');
    ok((await rpc('bg_coach_react', { p_token: C, p_post_id: null, p_log_id: logA.id, p_stamp: 'love', p_comment: '' })).error === 'bad_stamp', 'しらないボタン');
    ok((await rpc('bg_coach_react', { p_token: OC, p_post_id: null, p_log_id: logA.id, p_stamp: 'clap', p_comment: '' })).error === 'bad_log', 'べつのクラブのコーチは つけられない');
    r = await rpc('bg_coach_react', { p_token: C, p_post_id: null, p_log_id: logA.id, p_stamp: 'clap', p_comment: 'いいリズム！' });
    ok(r.ok && r.coach.length === 1 && r.coach[0].stamp === 'clap' && r.coach[0].by === 'たなか' && r.coach[0].comment === 'いいリズム！', '自主練の記録に 拍手とひとこと', r);
    r = await rpc('bg_coach_react', { p_token: C, p_post_id: null, p_log_id: logA.id, p_stamp: 'angry', p_comment: 'もっと低く' });
    ok(r.ok && r.coach.length === 1 && r.coach[0].stamp === 'angry', 'コーチ1人に1つ（怒りに かえる）', r.coach);
    const C2 = (await rpc('bg_coach_login', { p_code: CODE, p_pass: 'coach-pass-123', p_name: 'すずき' })).token;
    r = await rpc('bg_coach_react', { p_token: C2, p_post_id: null, p_log_id: logA.id, p_stamp: 'good', p_comment: '' });
    ok(r.ok && r.coach.length === 2, 'べつのコーチの いいねも つく', r.coach);
    r = await rpc('bg_quest', { p_token: K1.tok, p_id: QA });
    ok(r.logs.find((g) => g.id === logA.id).coach.length === 2, '子どもに コーチの反応が見える');
    r = await rpc('bg_home', { p_token: K1.tok });
    ok(r.notices.coach === 2, '子どものお知らせ：コーチの反応 2', r.notices);
    ok((await rpc('bg_quest_list', { p_token: C })).quests.find((q) => q.id === QA).unrated === 2, '反応した記録は「まだ」から へる');
    r = await rpc('bg_coach_react', { p_token: C, p_post_id: null, p_log_id: logA.id, p_stamp: '', p_comment: '' });
    ok(r.ok && r.coach.length === 1 && r.coach[0].stamp === 'good', 'はずす（空のボタン）', r.coach);
    // ひろばの投稿に 怒り：みんなに見える
    r = await rpc('bg_coach_react', { p_token: C, p_post_id: qpost.id, p_log_id: null, p_stamp: 'angry', p_comment: '' });
    ok(r.ok && r.coach[0].stamp === 'angry', 'ひろばの投稿に 怒り', r);
    r = await rpc('bg_feed', { p_token: K3.tok, p_before: null, p_limit: 20 });
    ok(r.posts.find((p) => p.id === qpost.id).coach.some((x) => x.stamp === 'angry' && x.by === 'たなか'), 'ほかの子にも コーチの怒りが見える（みんなに見える設定）');
    await rpc('bg_coach_react', { p_token: C, p_post_id: qpost.id, p_log_id: null, p_stamp: 'clap', p_comment: '' });
    ok((await rpc('bg_feed', { p_token: K3.tok, p_before: null, p_limit: 20 })).posts.find((p) => p.id === qpost.id).coach[0].stamp === 'clap', 'ひろば：拍手に かえる');
    ok((await rpc('bg_react', { p_token: K2.tok, p_post_id: qpost.id, p_stamp: 'angry', p_on: true })).error === 'bad_stamp', '子どものスタンプに 怒りは ない');

    // 記録を消す：ほかの子は消せない・本人は消せる（写真も消える）。クリアのお知らせは 2回出さない
    ok((await rpc('bg_quest_log_delete', { p_token: K2.tok, p_id: logA.id })).error === 'bad_log', 'ほかの子の記録は 消せない');
    ok((await rpc('bg_quest_log_delete', { p_token: K2.tok, p_id: logB.id })).ok, '本人は 記録を消せる');
    ok((await q1('select count(*)::int as n from bg_photos where id = $1', [logB.photo_id])).n === 0, '消した記録の写真も 消える');
    await srv.pool.query('update bg_quest_logs set day = day - 1 where member_id = $1', [K1.id]);
    ok((await rpc('bg_quest_log_delete', { p_token: K1.tok, p_id: logA.id })).ok, 'けんた：記録を1つ消す（2回に）');
    r = await rpc('bg_quest_log', { p_token: K1.tok, p_quest_id: QA, p_count: 100, p_note: '', p_photo: '', p_mime: '' });
    ok(r.ok && r.n === 3 && r.just_cleared, 'もう一度 3回に', r);
    ok((await q1(`select count(*)::int as n from bg_posts where member_id = $1 and kind = 'quest'`, [K1.id])).n === 1, 'クリアのお知らせは 1回だけ');
    // 45日たった 自主練の写真は消える
    const lg = await rpc('bg_quest_log', { p_token: K3.tok, p_quest_id: QA, p_count: 100, p_note: '', p_photo: JPEG, p_mime: 'image/jpeg' });
    const ph = (await q1('select photo_id from bg_quest_logs where id = $1', [lg.id])).photo_id;
    await srv.pool.query(`update bg_photos set created_at = now() - interval '46 days' where id = $1`, [ph]);
    await rpc('bg_quest_list', { p_token: C });
    ok((await q1('select count(*)::int as n from bg_photos where id = $1', [ph])).n === 0 && (await q1('select photo_id from bg_quest_logs where id = $1', [lg.id])).photo_id === null, '45日たった自主練の写真は 消える（記録は のこる）');
    // おわりにする
    ok((await rpc('bg_quest_close', { p_token: K1.tok, p_id: QA })).error === 'not_coach', '子どもは おわりにできない');
    ok((await rpc('bg_quest_close', { p_token: C, p_id: QA })).ok, '自主練を おわりにする');
    ok(!(await rpc('bg_quest_list', { p_token: K1.tok })).quests.some((q) => q.id === QA), 'おわった自主練は 子どもに出ない');
    ok((await rpc('bg_quest_log', { p_token: K2.tok, p_quest_id: QA, p_count: 1, p_note: '', p_photo: '', p_mime: '' })).error === 'bad_quest', 'おわった自主練は 記録できない');
    // 直す
    r = await rpc('bg_quest_save', Object.assign({}, base, { p_id: QB, p_title: 'シュート60本', p_target: 60, p_members: [K2.id, K3.id] }));
    ok(r.ok && r.quest.title === 'シュート60本' && r.quest.members.length === 2, '自主練を直す（そらも ふやす）', r);
    ok((await rpc('bg_quest_save', Object.assign({}, base, { p_token: OC, p_id: QB }))).error === 'bad_quest', 'べつのクラブのコーチは 直せない');

    // ---------- 予定と、参加の申し込み ----------
    const ev = { p_token: C, p_id: null, p_title: '練習試合 vs さくら', p_kind: 'game', p_day: day(7), p_time: '9:00〜12:00', p_place: '中央体育館', p_note: 'お弁当', p_deadline: day(5), p_capacity: 2, p_members: null };
    ok((await rpc('bg_event_save', Object.assign({}, ev, { p_token: K1.tok }))).error === 'not_coach', '子どもは 予定をつくれない');
    ok((await rpc('bg_event_save', Object.assign({}, ev, { p_deadline: day(8) }))).error === 'bad_date', 'しめきりが 当日より あと');
    ok((await rpc('bg_event_save', Object.assign({}, ev, { p_day: day(-5) }))).error === 'bad_date', '前の日の予定は つくれない');
    ok((await rpc('bg_event_save', Object.assign({}, ev, { p_capacity: 600 }))).error === 'bad_count', '定員が多すぎる');
    ok((await rpc('bg_event_save', Object.assign({}, ev, { p_note: 'https://example.com' }))).error === 'no_link', '予定に リンクは のせない');
    r = await rpc('bg_event_save', Object.assign({}, ev, { p_kind: 'xxx' }));
    ok(r.ok && r.event.kind === 'other', 'しらない種類は「その他」', r.event);
    await rpc('bg_event_delete', { p_token: C, p_id: r.event.id });
    r = await rpc('bg_event_save', ev);
    ok(r.ok && r.event.open && r.event.capacity === 2 && r.event.time === '9:00〜12:00', '予定をつくる（定員2・しめきり）', r);
    const EV = r.event.id;
    r = await rpc('bg_home', { p_token: K1.tok });
    ok(r.notices.events === 1 && r.events.some((e) => e.id === EV && e.mine === null), '子ども：答えていない予定のお知らせ', r.notices);
    ok((await rpc('bg_entry', { p_token: K1.tok, p_event_id: EV, p_answer: 'go', p_note: '' })).error === 'bad_answer', 'しらない答え');
    ok((await rpc('bg_entry', { p_token: K1.tok, p_event_id: EV, p_answer: 'yes', p_note: '' })).answer === 'yes', 'けんた：参加する');
    ok((await rpc('bg_entry', { p_token: K2.tok, p_event_id: EV, p_answer: 'yes', p_note: '' })).ok, 'ゆい：参加する');
    ok((await rpc('bg_entry', { p_token: K3.tok, p_event_id: EV, p_answer: 'yes', p_note: '' })).error === 'full', 'そら：定員いっぱい');
    ok((await rpc('bg_entry', { p_token: K3.tok, p_event_id: EV, p_answer: 'maybe', p_note: '家族に聞く' })).ok, 'そら：まだわからない');
    ok((await rpc('bg_entry', { p_token: K1.tok, p_event_id: EV, p_answer: 'no', p_note: '' })).ok, 'けんた：やっぱり 参加しない');
    ok((await rpc('bg_entry', { p_token: K3.tok, p_event_id: EV, p_answer: 'yes', p_note: '' })).ok, 'そら：あいたので 参加する');
    ok((await rpc('bg_entry', { p_token: C, p_event_id: EV, p_answer: 'yes', p_note: '' })).error === 'not_kid', 'コーチは bg_entry を使わない');
    ok((await rpc('bg_entry', { p_token: OK1.tok, p_event_id: EV, p_answer: 'yes', p_note: '' })).error === 'bad_event', 'べつのクラブの子は 答えられない');
    r = await rpc('bg_home', { p_token: K1.tok });
    ok(r.notices.events === 0 && r.events.find((e) => e.id === EV).mine.answer === 'no' && r.events.find((e) => e.id === EV).yes === 2, '答えたら お知らせは 0・自分の答え', r.events);
    r = await rpc('bg_event', { p_token: C, p_id: EV });
    const ans = (id) => (r.kids.find((x) => x.member.id === id) || {}).answer;
    ok(r.ok && r.kids.length === 3 && ans(K1.id) === 'no' && ans(K2.id) === 'yes' && ans(K3.id) === 'yes', 'コーチ：子ども全員の答え', r.kids.map((x) => [x.member.nickname, x.answer]));
    ok((await rpc('bg_entry_set', { p_token: C, p_event_id: EV, p_member_id: K1.id, p_answer: 'yes', p_note: '電話で' })).ok, 'コーチが かわりに入れる（定員より多くても）');
    r = await rpc('bg_event', { p_token: C, p_id: EV });
    ok(r.kids.find((x) => x.member.id === K1.id).by_coach === true, 'コーチが入れた しるし');
    r = await rpc('bg_event_list', { p_token: C });
    const evl = r.events.find((e) => e.id === EV);
    ok(evl && evl.yes === 3 && evl.no === 0 && evl.kids === 3, 'コーチの一覧：参加の数', evl);
    ok((await rpc('bg_event', { p_token: OC, p_id: EV })).error === 'bad_event', 'べつのクラブのコーチは 開けない');
    ok((await rpc('bg_event_close', { p_token: C, p_id: EV, p_closed: true })).ok, 'しめきる');
    ok((await rpc('bg_entry', { p_token: K2.tok, p_event_id: EV, p_answer: 'no', p_note: '' })).error === 'event_closed', 'しめきったら 変えられない');
    ok((await rpc('bg_event_close', { p_token: C, p_id: EV, p_closed: false })).ok && (await rpc('bg_entry', { p_token: K2.tok, p_event_id: EV, p_answer: 'no', p_note: '' })).ok, 'ひらくと また変えられる');
    r = await rpc('bg_event_save', Object.assign({}, ev, { p_title: 'しめきりすぎ', p_day: day(3), p_deadline: day(-1), p_capacity: 0 }));
    ok((await rpc('bg_entry', { p_token: K1.tok, p_event_id: r.event.id, p_answer: 'yes', p_note: '' })).error === 'event_closed', 'しめきりの日が すぎた');
    r = await rpc('bg_event_save', Object.assign({}, ev, { p_title: 'ゆいだけ', p_capacity: 0, p_members: [K2.id] }));
    const EV2 = r.event.id;
    ok((await rpc('bg_entry', { p_token: K1.tok, p_event_id: EV2, p_answer: 'yes', p_note: '' })).error === 'bad_event', 'えらばれていない予定には 答えられない');
    ok(!(await rpc('bg_event_list', { p_token: K1.tok })).events.some((e) => e.id === EV2) && (await rpc('bg_event_list', { p_token: K2.tok })).events.some((e) => e.id === EV2), 'えらばれた子にだけ 見える');
    ok((await rpc('bg_event_delete', { p_token: C, p_id: EV2 })).ok && (await q1('select count(*)::int as n from bg_entries where event_id = $1', [EV2])).n === 0, '予定を消すと 答えも消える');

    // ---------- 体験・入団の申し込み ----------
    ok((await rpc('bg_apply_info', { p_code: CODE })).error === 'closed', 'クラブコードでは 申し込みページは 開かない');
    ok((await rpc('bg_apply_setup', { p_token: K1.tok, p_open: true, p_note: '', p_new_code: false })).error === 'not_coach', '子どもは 申し込みの せっていが できない');
    r = await rpc('bg_apply_setup', { p_token: C, p_open: true, p_note: '練習：土曜 9時〜 中央体育館。体育館シューズを持ってきてください', p_new_code: false });
    ok(r.ok && /^[A-Z2-9]{8}$/.test(r.code) && r.open === true, '申し込みを受けつける（8文字のコード）', r);
    let AC = r.code;
    ok((await rpc('bg_apply_info', { p_code: CODE })).error === 'closed', 'クラブコードでは 申し込めない（コードは べつ）');
    r = await rpc('bg_apply_info', { p_code: AC.toLowerCase() }, '10.2.0.1');
    ok(r.ok && /^v2クラブ/.test(r.club) && /体育館シューズ/.test(r.note), '申し込みページ：クラブの名前と お知らせ', r);
    const ap = { p_code: AC, p_kind: 'trial', p_child: 'さとう はると', p_kana: 'さとう はると', p_grade: 'e34', p_guardian: 'さとう', p_contact: '090-1234-5678', p_message: '土曜の体験に行きたいです。090-1111-2222 でも大丈夫です' };
    ok((await rpc('bg_apply', Object.assign({}, ap, { p_kind: 'buy' }), '10.2.0.2')).error === 'bad_kind', '申し込み：しらない種類');
    ok((await rpc('bg_apply', Object.assign({}, ap, { p_child: '' }), '10.2.0.2')).error === 'bad_name', '申し込み：子どもの名前がない');
    ok((await rpc('bg_apply', Object.assign({}, ap, { p_contact: 'abc' }), '10.2.0.2')).error === 'bad_contact', '申し込み：連絡先が メールでも電話でもない');
    ok((await rpc('bg_apply', Object.assign({}, ap, { p_message: 'くわしくは https://spam.example.com' }), '10.2.0.2')).error === 'no_link', '申し込み：リンクは のせない');
    r = await rpc('bg_apply', ap, '10.2.0.3');
    ok(r.ok, '申し込む（電話番号・メッセージの電話番号も OK）', r);
    r = await rpc('bg_apply', Object.assign({}, ap, { p_kind: 'join', p_child: 'たかはし', p_contact: 'mama@example.jp', p_grade: 'zz' }), '10.2.0.4');
    ok(r.ok, '入団の申し込み（メールの連絡先）', r);
    let lim = 0;
    for (let i = 0; i < 6; i++) { const a = await rpc('bg_apply', Object.assign({}, ap, { p_child: 'れんぞく' + i }), '10.2.0.5'); if (a.error === 'locked') { lim = i; break; } }
    ok(lim === 5, '同じところから 1時間に 5回まで', lim);
    ok((await rpc('bg_apply_list', { p_token: K1.tok })).error === 'not_coach', '子どもは 申し込みを見られない');
    ok((await rpc('bg_apply_list', { p_token: OC })).applies.length === 0, 'べつのクラブのコーチには 見えない');
    r = await rpc('bg_apply_list', { p_token: C });
    ok(r.ok && r.applies.length === 7 && r.code === AC && r.open && r.applies.some((a) => a.kind === 'join' && a.contact === 'mama@example.jp' && a.grade === ''), 'コーチ：申し込みの一覧', r.applies.length);
    const AP1 = r.applies.find((a) => a.child === 'さとう はると');
    ok((await rpc('bg_home', { p_token: C })).counts.applies === 7, 'コーチのホーム：新しい申し込み 7');
    ok((await rpc('bg_apply_mark', { p_token: C, p_id: AP1.id, p_status: 'sent' })).error === 'bad_status', 'しらない じょうたい');
    ok((await rpc('bg_apply_mark', { p_token: C, p_id: AP1.id, p_status: 'contacted' })).ok && (await rpc('bg_home', { p_token: C })).counts.applies === 6, '「連絡した」にすると 新着が へる');
    ok((await rpc('bg_apply_mark', { p_token: OC, p_id: AP1.id, p_status: 'done' })).error === 'bad_apply', 'べつのクラブのコーチは 変えられない');
    ok((await rpc('bg_apply_delete', { p_token: OC, p_id: AP1.id })).error === 'bad_apply', 'べつのクラブのコーチは 消せない');
    ok((await rpc('bg_apply_delete', { p_token: C, p_id: AP1.id })).ok, '申し込みを消す');
    await srv.pool.query(`update bg_applies set created_at = now() - interval '91 days' where club_id = (select club_id from bg_members where id = $1) and child = 'たかはし'`, [K1.id]);
    ok(!(await rpc('bg_apply_list', { p_token: C })).applies.some((a) => a.child === 'たかはし'), '90日たった申し込みは 消える');
    r = await rpc('bg_apply_setup', { p_token: C, p_open: true, p_note: null, p_new_code: true });
    ok(r.ok && r.code !== AC && /体育館シューズ/.test(r.note), 'リンクのコードを 作りなおす（お知らせは そのまま）', r);
    ok((await rpc('bg_apply_info', { p_code: AC }, '10.2.0.6')).error === 'closed', '前のコードは 使えない');
    AC = r.code;
    ok((await rpc('bg_apply_setup', { p_token: C, p_open: false, p_note: null, p_new_code: false })).open === false, '受けつけを止める');
    ok((await rpc('bg_apply_info', { p_code: AC }, '10.2.0.6')).error === 'closed' && (await rpc('bg_apply', Object.assign({}, ap, { p_code: AC }), '10.2.0.7')).error === 'closed', '止めたら 申し込めない');
    r = await rpc('bg_home', { p_token: C });
    ok(r.club.apply_code === AC && r.club.apply_note.length > 0, 'コーチのホーム：申し込みのコード');
    ok(!('apply_code' in (await rpc('bg_home', { p_token: K1.tok })).club), '子どもには 申し込みのコードを返さない');

    // ---------- ひろばに「今週の これ1つ」の のびを のせる（アプリの記録＝share）----------
    const FOCUS = '「ポンドドリブル（右手）」38回 → 44回（自己ベスト！）';
    r = await rpc('bg_post', { p_token: K2.tok, p_body: '', p_photo: '', p_mime: '', p_meta: { type: 'focus', label: FOCUS } });
    ok(r.ok && r.status === 'shown', 'ひろばに「これ1つ」の のびを のせる', r);
    r = await rpc('bg_feed', { p_token: K3.tok, p_before: null, p_limit: 30 });
    const fp = r.posts.find((p) => p.meta && p.meta.type === 'focus');
    ok(fp && fp.kind === 'share' && fp.meta.label === FOCUS, 'ひろばに 出る（share・ひとことそのまま）', fp);
    ok((await rpc('bg_post', { p_token: K2.tok, p_body: '', p_photo: '', p_mime: '', p_meta: { type: 'focus', label: 'あいつ キモい' } })).error === 'ng_word', 'のびの ひとことも ことばの点検');
    ok((await rpc('bg_post', { p_token: K2.tok, p_body: '', p_photo: '', p_mime: '', p_meta: { type: 'unknown', label: 'x' } })).error === 'empty', 'しらない種類の share は 空の投稿としてことわる');

    // ---------- メンバー・クラブを消すと のこらない／anon は さわれない ----------
    const before = await q1('select (select count(*) from bg_quest_logs where member_id = $1)::int as logs, (select count(*) from bg_entries where member_id = $1)::int as ent', [K1.id]);
    ok(before.logs > 0 && before.ent > 0, '消す前：けんたの記録と答え', before);
    ok((await rpc('bg_member_remove', { p_token: C, p_member_id: K1.id })).ok, 'けんたを消す');
    const after = await q1(`select (select count(*) from bg_quest_logs where member_id = $1)::int + (select count(*) from bg_entries where member_id = $1)::int
      + (select count(*) from bg_posts where member_id = $1)::int as n`, [K1.id]);
    ok(after.n === 0, '消したメンバーの 自主練の記録・答え・投稿は のこらない', after);
    for (const q of ['select * from bg_tracks', 'select * from bg_quests', 'select * from bg_quest_logs', 'select * from bg_coach_reacts',
      'select * from bg_events', 'select * from bg_entries', 'select * from bg_applies', 'select _bg_today()', 'select * from _bg_ready(gen_random_uuid())',
      'select _bg_apply_code()']) {
      const cli = await srv.pool.connect();
      let denied = false;
      try { await cli.query('begin'); await cli.query('set local role anon'); await cli.query(q); } catch (e) { denied = /permission denied/.test(e.message); }
      await cli.query('rollback').catch(() => {});
      cli.release();
      ok(denied, `anon は「${q}」ができない`);
    }
    const clubId = (await rpc('bg_home', { p_token: C })).club.id;
    ok((await rpc('bg_club_delete', { p_token: C, p_pass: 'coach-pass-123' })).ok, 'クラブを消す');
    const rest = await q1(`select (select count(*) from bg_tracks where club_id = $1)::int + (select count(*) from bg_quests where club_id = $1)::int
      + (select count(*) from bg_quest_logs where club_id = $1)::int + (select count(*) from bg_coach_reacts where club_id = $1)::int
      + (select count(*) from bg_events where club_id = $1)::int + (select count(*) from bg_applies where club_id = $1)::int as n`, [clubId]);
    ok(rest.n === 0, 'クラブを消すと、v2 のものも のこらない', rest);
    await rpc('bg_club_delete', { p_token: OC, p_pass: 'other-pass-123' });
  } catch (e) {
    fail++;
    console.log('✗ とちゅうで止まった：' + e.stack);
  } finally {
    await srv.close();
  }
  console.log(`\n${fail ? '✗' : '✓'} ${pass} 合格・${fail} 不合格`);
  process.exit(fail ? 1 : 0);
})();
