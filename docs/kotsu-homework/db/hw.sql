-- hw.sql — コツコツくん「先生が出す宿題」の、データベース部分（表・関数）。
-- 契約：scratchpad/hw/HW-CONTRACT.md  ／  進み具合の基準：progress.mjs と vectors.json
-- 本番（Supabase project mtzhbiadzqjhvhzzdsbn、schema kotsu）に入れる変更。何度流しても同じ結果（冪等）。
-- apply_migration の query にそのまま渡せる（begin / commit は書かない。apply_migration が包む）。
-- 既存の関数・表は、一つも書きかえない（新しい表 1つ、新しい関数 15こ を足すだけ）。
--
-- ■ 作るもの
--   表   kotsu.homework
--   内部 kotsu._hw_progress / _hw_stats / _hw_eval / _hw_can / _hw_mine / _hw_item / _hw_truthy / _hw_secnum   （postgres だけが実行できる）
--   公開 kotsu.hw_t_create / hw_t_list / hw_t_detail / hw_t_grid / hw_t_close / hw_t_delete / hw_s_list
--                                                                              （anon / authenticated が実行できる。中でトークンを確かめる）
-- ■ 既存の仕組みをそのまま使う
--   トークン：kotsu._staff(p_token)（先生・管理者）／ kotsu._who(p_token)（生徒）  ← 期限切れ・でたらめ・停止中は 'auth'、塾が止まっていれば 'org_off'、役割ちがいは 'role'
--   クラス：kotsu._can_class(t, class)（管理者＝学校のすべて／先生＝class_teachers に入っているクラスだけ）、kotsu._can_see(t, student)
--   エラー：kotsu._err('code')（errcode P0001・message=code）で投げ、関数の最後で {"error": code} にして返す（契約どおり）
--   SECURITY DEFINER ＋ search_path = kotsu, extensions, public ＋ revoke from public / grant to anon, authenticated（既存の公開関数と同じ）
-- ■ 先生に見せる範囲：クラス宛ての宿題は、その担当クラスの生徒。個人宛ての宿題で、ほかのクラスの生徒がまざっているとき、先生には 自分のクラスの生徒だけ（詳細・人数）。管理者は、学校の全員。
-- ■ 本名：users.name_enc（暗号化された本名）は、ここの関数では一切読まない・出さない。出すのは 出席番号(no)・ニックネーム(nick)・ログインID(login) だけ。

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. 表 kotsu.homework
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists kotsu.homework (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references kotsu.orgs(id) on delete cascade,
  class_id    uuid references kotsu.classes(id) on delete cascade,   -- クラス全員に出す。クラスが消えたら、宿題も消える（a_class_delete が失敗しないように cascade）
  user_ids    uuid[],                                                -- class_id が null のとき、個人宛て（生徒の id）
  title       text not null,
  unit_id     text,                                                  -- 小単元ID（例 J1-u1）。n と組
  n           integer,                                               -- 解く問題数（まちがいも数える）
  min         integer,                                               -- 学習時間（分）
  start_date  date not null,                                         -- 期間（日本時間。両端をふくむ）
  due_date    date not null,
  note        text,                                                  -- 先生のひとこと
  created_by  uuid references kotsu.users(id) on delete set null,    -- 先生が消えても、宿題は残す
  created_at  timestamptz not null default now(),
  closed      boolean not null default false,                        -- 先生が締めた（取り消した）宿題
  constraint homework_target check (
    (class_id is not null and user_ids is null)
    or (class_id is null and user_ids is not null and cardinality(user_ids) between 1 and 500 and array_position(user_ids, null) is null)),
  constraint homework_title  check (char_length(title) between 1 and 100),
  constraint homework_note   check (note is null or char_length(note) between 1 and 200),
  constraint homework_unit   check (unit_id is null or unit_id ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$'),
  constraint homework_goal   check (n is not null or min is not null),
  constraint homework_unit_n check ((unit_id is null) = (n is null)),         -- unit_id と n は組（unit_id なしで n はだめ／unit_id があって n なしもだめ）
  constraint homework_n      check (n is null or n between 1 and 200),
  constraint homework_min    check (min is null or min between 1 and 240),
  constraint homework_period check (start_date <= due_date and due_date - start_date <= 59)   -- 最長 60日（両端をふくむ）
);

comment on table kotsu.homework is '先生が出す宿題。進み具合は、生徒の kotsu.states.state（log・daily）から、その場で計算する（kotsu._hw_progress）。ここには、進み具合を書きこまない。';
comment on column kotsu.homework.class_id is 'クラス全員宛て。null なら user_ids の生徒だけ。対象の生徒は、いまの class_students で決める（クラスを移れば、宿題も移った先のものになる）';
comment on column kotsu.homework.start_date is '期間の最初の日（日本時間 0:00 から数える）。出した日より前でもよい';

create index if not exists homework_org_class_created on kotsu.homework using btree (org_id, class_id, created_at desc);
create index if not exists homework_org_created       on kotsu.homework using btree (org_id, created_at desc);
create index if not exists homework_creator           on kotsu.homework using btree (created_by, created_at desc);
create index if not exists homework_user_ids          on kotsu.homework using gin (user_ids) where user_ids is not null;

-- 既存の表と同じ：RLS 有効・ポリシーなし・anon / authenticated には何も与えない（読み書きは、security definer の関数だけ）
alter table kotsu.homework enable row level security;
revoke all on table kotsu.homework from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. 内部の関数（postgres だけが実行できる。_org_json などと同じ）
-- ═══════════════════════════════════════════════════════════════════════════

-- 解答の ok を、JS の「真っぽさ」で真偽に（true・0でない数・空でない文字列・配列・オブジェクト が真。null・無し・0・空文字・false が偽）
create or replace function kotsu._hw_truthy(v jsonb)
returns boolean
language sql
immutable
as $fn$
  select case jsonb_typeof(v)
    when 'boolean' then (v #>> '{}')::boolean
    when 'number'  then (v #>> '{}')::numeric <> 0
    when 'string'  then (v #>> '{}') <> ''
    when 'array'   then true
    when 'object'  then true
    else false end
$fn$;

-- daily[日].sec の値を、秒（数）に：数と、数字だけの文字列（前後の空白・符号・小数点はよい）。ほかは 0。負は 0（JS の Math.max(0, Number(x) || 0)）
create or replace function kotsu._hw_secnum(v jsonb)
returns numeric
language sql
immutable
as $fn$
  select greatest(0::numeric,
    case jsonb_typeof(v)
      when 'number' then (v #>> '{}')::numeric
      when 'string' then case when btrim(v #>> '{}') ~ '^[+-]?([0-9]+(\.[0-9]*)?|\.[0-9]+)$' then btrim(v #>> '{}')::numeric else 0 end
      else 0 end)
$fn$;

-- 進み具合。progress.mjs の progress(hw, state, nowMs) と同じ結果（全部の検算データ・ランダムな照合で確認）。
--   hw ＝ 宿題の行、st ＝ 生徒の state（kotsu.states.state。null でもよい）、p_now ＝「いま」（テスト用に渡せる）
--   → {count, correct, sec, pct, done, done_at, status, phase}   （done_at は 'YYYY-MM-DD'（日本時間）か null。progress.mjs の doneAt）
--   日本時間は +9時間の固定（夏時間なし）なので、窓は整数のミリ秒で計算する：start_ms ＝ start_date 0:00 JST、end_ms ＝ due_date 23:59:59.999 JST。
create or replace function kotsu._hw_progress(hw kotsu.homework, st jsonb, p_now timestamptz default now())
returns jsonb
language sql
stable
as $fn$
  with
  w as (
    select ((hw.start_date - date '1970-01-01')::bigint * 86400000 - 32400000)::numeric as s_ms,
           ((hw.due_date   - date '1970-01-01')::bigint * 86400000 + 86400000 - 32400000 - 1)::numeric as e_ms
  ),
  -- 窓のなかの、その単元の解答（log は、配列でなければ空とみなす）。e.t は数値のものだけ。e.ok は JS の「真っぽさ」と同じに数える
  lg as (
    select x.t, x.ok
    from w,
    lateral (
      select case when jsonb_typeof(e->'t') = 'number' then (e->>'t')::numeric end as t,
             kotsu._hw_truthy(e->'ok') as ok
      from jsonb_array_elements(case when jsonb_typeof(st->'log') = 'array' then st->'log' else '[]'::jsonb end) as e
      where hw.unit_id is not null
        and jsonb_typeof(e) = 'object' and jsonb_typeof(e->'u') = 'string' and e->>'u' = hw.unit_id
    ) x
    where x.t between w.s_ms and w.e_ms
  ),
  agg as (select count(*)::int as cnt, (count(*) filter (where ok))::int as cor from lg),
  -- start_date〜due_date の各日の学習秒（daily[日].sec。数・数字の文字列だけ。ほかは 0。負は 0）
  dd as (
    select d::date as d, kotsu._hw_secnum(v) as sec
    from generate_series(hw.start_date::timestamp, hw.due_date::timestamp, interval '1 day') as d
    cross join lateral (select st->'daily'->to_char(d, 'YYYY-MM-DD')->'sec' as v) x
  ),
  cm  as (select d, sum(sec) over (order by d) as c from dd),
  tot as (select coalesce(sum(sec), 0) as sec from dd),
  f as (
    select agg.cnt, agg.cor, tot.sec,
           (hw.n is not null or hw.min is not null)
             and (hw.n is null or agg.cnt >= hw.n)
             and (hw.min is null or tot.sec >= hw.min * 60) as done,
           case when hw.n is null and hw.min is null then 0::float8
                else least(case when hw.n   is null then 1::float8 else least(1::float8, agg.cnt::float8 / hw.n) end,
                           case when hw.min is null then 1::float8 else least(1::float8, tot.sec::float8 / (hw.min * 60)) end) end as pct
    from agg, tot
  ),
  -- 達成した日：n の条件は「古い順に n 件目の日」、min の条件は「日ごとの学習秒を足して min×60 に届いた最初の日」。両方あるときは遅いほう
  da as (
    select case when f.done then
             greatest(
               case when hw.n is not null then date '1970-01-01' + floor((nth.t + 32400000) / 86400000)::int end,
               case when hw.min is not null then (select min(cm.d) from cm where cm.c >= hw.min * 60) end)
           end as done_at
    from f
    left join lateral (select lg.t from lg order by lg.t offset (hw.n - 1) limit 1) nth on true
  )
  select jsonb_build_object(
    'count',   f.cnt,
    'correct', f.cor,
    'sec',     f.sec,
    'pct',     floor(f.pct * 1000 + 0.5) / 1000,     -- 小数第3位まで（JS の Math.round(pct*1000)/1000）
    'done',    f.done,
    'done_at', da.done_at,
    'status',  case when f.done then 'done' when f.pct > 0 then 'partial' else 'none' end,
    'phase',   case when p_now < (hw.start_date::timestamp at time zone 'Asia/Tokyo') then 'upcoming'
                    when p_now >= ((hw.due_date + 1)::timestamp at time zone 'Asia/Tokyo') then 'ended'
                    else 'active' end)
  from f, da
$fn$;

-- 先生 t が担当するクラスの生徒（個人宛ての宿題で、先生に見せてよい生徒の範囲）。管理者は、学校の全員（この関数は使わない）
create or replace function kotsu._hw_mine(t kotsu.users)
returns setof uuid
language sql
stable
as $fn$
  select cs.user_id
  from kotsu.class_students cs
  join kotsu.class_teachers ct on ct.class_id = cs.class_id and ct.user_id = t.id
  join kotsu.classes c on c.id = cs.class_id and c.org_id = t.org_id
$fn$;

-- 先生 t が、その宿題を見られるか。管理者＝学校の全部／先生＝担当クラスの宿題、または 担当クラスの生徒が入っている個人宛ての宿題
create or replace function kotsu._hw_can(t kotsu.users, h kotsu.homework)
returns boolean
language sql
stable
as $fn$
  select coalesce(h.org_id = t.org_id and (
    t.role = 'admin'
    or (t.role = 'teacher' and (
      (h.class_id is not null and exists (
        select 1 from kotsu.class_teachers ct where ct.class_id = h.class_id and ct.user_id = t.id))
      or (h.class_id is null and exists (
        select 1 from kotsu.class_students cs
        join kotsu.class_teachers ct on ct.class_id = cs.class_id and ct.user_id = t.id
        join kotsu.classes c on c.id = cs.class_id and c.org_id = t.org_id
        where cs.user_id = any (h.user_ids)))))), false)
$fn$;

-- 宿題の対象の生徒（いまのクラス所属で決める。やめた（active でない）生徒・ほかの学校の人・生徒でない人は入れない）と、進み具合
--   クラス宛て：その class_students の no を使う。個人宛て：その生徒の、いちばん小さい no（どのクラスにも入っていなければ null）
create or replace function kotsu._hw_eval(h kotsu.homework, p_now timestamptz default now())
returns table (user_id uuid, no integer, nick text, login text, prog jsonb)
language sql
stable
set search_path to 'kotsu', 'extensions', 'public'      -- SET があると、呼び出し側に展開されない（prog を、参照のたびに計算しなおさない）
as $fn$
  select u.id, tg.no, u.nick, u.login_id, kotsu._hw_progress(h, st.state, p_now)
  from (
    select cs.user_id as uid, cs.no
      from kotsu.class_students cs
      where h.class_id is not null and cs.class_id = h.class_id
    union all
    select x as uid, (select min(c2.no) from kotsu.class_students c2 where c2.user_id = x) as no
      from (select distinct y as x from unnest(h.user_ids) as y) as ux
      where h.class_id is null
  ) tg
  join kotsu.users u on u.id = tg.uid and u.role = 'student' and u.active and u.org_id = h.org_id
  left join kotsu.states st on st.user_id = u.id
$fn$;

-- 宿題（複数）の、対象の生徒ごとの進み具合を、まとめて（集合で）計算する。一覧（hw_t_list）とマス目（hw_t_grid）が使う。
--   _hw_progress は 1組ずつ（生徒の記録 400件を、宿題の数だけ読みなおす）で、40人 × 40件のマス目や 60件の一覧では遅い（本番の anon は 3秒で止まる）。
--   こちらは、生徒の log・daily を 1回だけ展開して、宿題と結合する。同じ式：count・correct・sec・pct・status・phase は _hw_progress と同じ結果（検算データ・ランダム 1900件・規模のデータで照合）。
--   done_at は出さない（詳細 hw_t_detail が、_hw_progress で出す）。pct は小数第3位まで（status は丸める前の値で決める）。
--   対象の生徒の決めかたは _hw_eval と同じ（いまのクラス所属／個人宛て。やめた・ほかの学校・生徒でない人は入れない）。
create or replace function kotsu._hw_stats(p_ids uuid[], p_now timestamptz default now())
returns table (hw_id uuid, user_id uuid, no integer, nick text, login text, cnt integer, cor integer, sec numeric, pct double precision, status text, phase text)
language sql
stable
set search_path to 'kotsu', 'extensions', 'public'
as $fn$
  with
  hw as materialized (
    select h.id, h.org_id, h.class_id, h.user_ids, h.unit_id, h.n, h.min, h.start_date, h.due_date,
           ((h.start_date - date '1970-01-01')::bigint * 86400000 - 32400000)::numeric as s_ms,
           ((h.due_date   - date '1970-01-01')::bigint * 86400000 + 86400000 - 32400000 - 1)::numeric as e_ms
    from kotsu.homework h where h.id = any (p_ids)
  ),
  tg as materialized (
    select hw.id as hw_id, u.id as user_id, cs.no as no, u.nick as nick, u.login_id as login
    from hw
    join kotsu.class_students cs on cs.class_id = hw.class_id
    join kotsu.users u on u.id = cs.user_id and u.role = 'student' and u.active and u.org_id = hw.org_id
    where hw.class_id is not null
    union all
    select hw.id, u.id, (select min(c2.no) from kotsu.class_students c2 where c2.user_id = u.id), u.nick, u.login_id
    from hw
    cross join lateral (select distinct y as x from unnest(hw.user_ids) as y) as ux
    join kotsu.users u on u.id = ux.x and u.role = 'student' and u.active and u.org_id = hw.org_id
    where hw.class_id is null
  ),
  tu as materialized (select distinct tg.user_id from tg),
  units as materialized (select distinct hw.unit_id from hw where hw.unit_id is not null),
  le as materialized (            -- 生徒の解答を 1回だけ展開（宿題で使う単元のぶんだけ）
    select s.user_id, e->>'u' as u, (e->>'t')::numeric as t, kotsu._hw_truthy(e->'ok') as ok
    from tu
    join kotsu.states s on s.user_id = tu.user_id
    cross join lateral jsonb_array_elements(case when jsonb_typeof(s.state->'log') = 'array' then s.state->'log' else '[]'::jsonb end) as e
    where jsonb_typeof(e) = 'object' and jsonb_typeof(e->'t') = 'number' and jsonb_typeof(e->'u') = 'string'
      and e->>'u' in (select units.unit_id from units)
  ),
  lc as (
    select tg.hw_id, tg.user_id, count(le.t)::integer as cnt, (count(le.t) filter (where le.ok))::integer as cor
    from tg
    join hw on hw.id = tg.hw_id
    left join le on le.user_id = tg.user_id and le.u = hw.unit_id and le.t between hw.s_ms and hw.e_ms
    group by tg.hw_id, tg.user_id
  ),
  hd as materialized (            -- 宿題の期間の、各日（YYYY-MM-DD）
    select hw.id as hw_id, to_char(d, 'YYYY-MM-DD') as day
    from hw cross join lateral generate_series(hw.start_date::timestamp, hw.due_date::timestamp, interval '1 day') as d
  ),
  dl as materialized (            -- 生徒の daily を 1回だけ展開（日の形のキーだけ）
    select s.user_id, k.key as day, kotsu._hw_secnum(k.value->'sec') as sec
    from tu
    join kotsu.states s on s.user_id = tu.user_id
    cross join lateral jsonb_each(case when jsonb_typeof(s.state->'daily') = 'object' then s.state->'daily' else '{}'::jsonb end) as k
    where k.key ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
  ),
  sc as (
    select tg.hw_id, tg.user_id, coalesce(sum(dl.sec), 0) as sec
    from tg
    join hd on hd.hw_id = tg.hw_id
    left join dl on dl.user_id = tg.user_id and dl.day = hd.day
    group by tg.hw_id, tg.user_id
  )
  select tg.hw_id, tg.user_id, tg.no, tg.nick, tg.login, lc.cnt, lc.cor, sc.sec,
         floor(f.pct * 1000 + 0.5) / 1000,
         case when f.done then 'done' when f.pct > 0 then 'partial' else 'none' end,
         case when p_now < (hw.start_date::timestamp at time zone 'Asia/Tokyo') then 'upcoming'
              when p_now >= ((hw.due_date + 1)::timestamp at time zone 'Asia/Tokyo') then 'ended'
              else 'active' end
  from tg
  join hw on hw.id = tg.hw_id
  join lc on lc.hw_id = tg.hw_id and lc.user_id = tg.user_id
  join sc on sc.hw_id = tg.hw_id and sc.user_id = tg.user_id
  cross join lateral (
    select (hw.n is not null or hw.min is not null)
             and (hw.n is null or lc.cnt >= hw.n)
             and (hw.min is null or sc.sec >= hw.min * 60) as done,
           case when hw.n is null and hw.min is null then 0::double precision
                else least(case when hw.n   is null then 1::double precision else least(1::double precision, lc.cnt::double precision / hw.n) end,
                           case when hw.min is null then 1::double precision else least(1::double precision, sc.sec::double precision / (hw.min * 60)) end) end as pct
  ) f
$fn$;

-- 宿題 1件の、先生に見せる形（人数なし）。unit_name は、データベースに単元の名前がないので付けない（画面が、自分の単元の一覧から出す）
create or replace function kotsu._hw_item(h kotsu.homework)
returns jsonb
language sql
stable
as $fn$
  select jsonb_build_object(
    'id', h.id, 'title', h.title, 'class_id', h.class_id,
    'class_name', (select c.name from kotsu.classes c where c.id = h.class_id),
    'user_ids', h.user_ids, 'unit_id', h.unit_id, 'n', h.n, 'min', h.min,
    'start_date', h.start_date, 'due_date', h.due_date, 'note', h.note,
    'created_at', h.created_at, 'closed', h.closed)
$fn$;

revoke all on function kotsu._hw_truthy(jsonb)                                from public, anon, authenticated;
revoke all on function kotsu._hw_secnum(jsonb)                                 from public, anon, authenticated;
revoke all on function kotsu._hw_progress(kotsu.homework, jsonb, timestamptz) from public, anon, authenticated;
revoke all on function kotsu._hw_can(kotsu.users, kotsu.homework)              from public, anon, authenticated;
revoke all on function kotsu._hw_mine(kotsu.users)                             from public, anon, authenticated;
revoke all on function kotsu._hw_eval(kotsu.homework, timestamptz)              from public, anon, authenticated;
revoke all on function kotsu._hw_stats(uuid[], timestamptz)                     from public, anon, authenticated;
revoke all on function kotsu._hw_item(kotsu.homework)                           from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. 先生の関数（スタッフのトークン）
--    エラーは {"error": "auth"|"role"|"org_off"|"bad_args"|"not_found"|"forbidden"|"hw_limit"|"full"|"not_deletable"} で返す（中で _err を投げ、最後に受けて返す）
-- ═══════════════════════════════════════════════════════════════════════════

-- 宿題を出す。クラス全員（p_class）か、個人（p_users）か、どちらか一方。
--   n・min：どちらかは必須。unit と n は組。期間は最長 60日（start 省略＝今日）。start は 今日の前後 365日以内。
--   1人の先生が 1日に出せるのは 60件まで（hw_limit）。1つの学校の宿題の総数は 20000件まで（full）。
create or replace function kotsu.hw_t_create(
  p_token text,
  p_class uuid default null,
  p_users uuid[] default null,
  p_title text default null,
  p_unit text default null,
  p_n integer default null,
  p_min integer default null,
  p_start date default null,
  p_due date default null,
  p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path to 'kotsu', 'extensions', 'public'
as $fn$
declare
  t kotsu.users; c kotsu.classes; today date; v_start date; v_unit text; v_title text; v_note text;
  v_users uuid[]; u uuid; v_id uuid;
begin
  t := kotsu._staff(p_token);
  today := (now() at time zone 'Asia/Tokyo')::date;
  v_start := coalesce(p_start, today);
  v_unit := nullif(btrim(coalesce(p_unit, '')), '');
  v_title := btrim(coalesce(p_title, ''));
  v_note := nullif(btrim(coalesce(p_note, '')), '');

  -- 入力の検証
  if p_due is null then perform kotsu._err('bad_args'); end if;
  if (p_class is null) = (p_users is null) then perform kotsu._err('bad_args'); end if;                 -- クラスか個人か、どちらか一方だけ
  if p_n is null and p_min is null then perform kotsu._err('bad_args'); end if;                         -- n か min のどちらかは必須
  if p_n is not null and (p_n < 1 or p_n > 200) then perform kotsu._err('bad_args'); end if;
  if p_min is not null and (p_min < 1 or p_min > 240) then perform kotsu._err('bad_args'); end if;
  if (v_unit is null) <> (p_n is null) then perform kotsu._err('bad_args'); end if;                     -- unit と n は組
  if v_unit is not null and v_unit !~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$' then perform kotsu._err('bad_args'); end if;
  if v_start > p_due or p_due - v_start > 59 then perform kotsu._err('bad_args'); end if;                -- 期間は最長 60日
  if v_start < today - 365 or v_start > today + 365 then perform kotsu._err('bad_args'); end if;
  if char_length(v_title) > 100 or v_title ~ '[\x00-\x1f\x7f]' then perform kotsu._err('bad_args'); end if;
  if v_note is not null and (char_length(v_note) > 200 or v_note ~ '[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]') then perform kotsu._err('bad_args'); end if;

  -- 宛先と権限
  if p_class is not null then
    select * into c from kotsu.classes where id = p_class;
    if not found then perform kotsu._err('not_found'); end if;
    if not kotsu._can_class(t, p_class) then perform kotsu._err('forbidden'); end if;                   -- ほかの学校・担当外
    if c.archived then perform kotsu._err('not_found'); end if;
    v_users := null;
  else
    if array_position(p_users, null) is not null then perform kotsu._err('bad_args'); end if;
    select array_agg(distinct x) into v_users from unnest(p_users) as x;
    if v_users is null or cardinality(v_users) > 500 then perform kotsu._err('bad_args'); end if;
    foreach u in array v_users loop
      if not kotsu._can_see(t, u) then perform kotsu._err('forbidden'); end if;                        -- 自分のクラスの生徒だけ（管理者は学校内の生徒）
    end loop;
  end if;

  -- 上限
  if (select count(*) from kotsu.homework where created_by = t.id and created_at > now() - interval '1 day') >= 60 then
    perform kotsu._err('hw_limit');
  end if;
  if (select count(*) from kotsu.homework where org_id = t.org_id) >= 20000 then perform kotsu._err('full'); end if;

  -- 題が空なら、自動で作る（データベースには単元の名前がないので、単元ID で）
  if v_title = '' then
    v_title := case when v_unit is not null
                    then v_unit || ' ' || p_n || '問' || case when p_min is not null then '・' || p_min || '分' else '' end
                    else p_min || '分 学習' end;
  end if;

  insert into kotsu.homework (org_id, class_id, user_ids, title, unit_id, n, min, start_date, due_date, note, created_by)
    values (t.org_id, p_class, v_users, v_title, v_unit, p_n, p_min, v_start, p_due, v_note, t.id)
    returning id into v_id;
  perform kotsu._audit(t.org_id, t.id, t.role, 'hw_create', v_id::text,
    jsonb_build_object('class', p_class, 'users', cardinality(v_users), 'unit', v_unit, 'n', p_n, 'min', p_min, 'due', p_due));
  return jsonb_build_object('ok', true, 'id', v_id);
exception when sqlstate 'P0001' then
  return jsonb_build_object('error', sqlerrm);
end $fn$;

-- 宿題の一覧（新しい順）。p_class を渡すと、そのクラス宛て＋そのクラスの生徒が入っている個人宛て。p_limit は 1〜200（既定 60）
create or replace function kotsu.hw_t_list(p_token text, p_class uuid default null, p_limit integer default 60)
returns jsonb
language plpgsql
security definer
set search_path to 'kotsu', 'extensions', 'public'
as $fn$
declare t kotsu.users; lim integer; v jsonb;
begin
  t := kotsu._staff(p_token);
  lim := least(greatest(coalesce(p_limit, 60), 1), 200);
  if p_class is not null then
    if not exists (select 1 from kotsu.classes where id = p_class) then perform kotsu._err('not_found'); end if;
    if not kotsu._can_class(t, p_class) then perform kotsu._err('forbidden'); end if;
  end if;
  with hws as materialized (
    select hh as h from kotsu.homework hh
    where hh.org_id = t.org_id
      and case when p_class is null then kotsu._hw_can(t, hh)
               else (hh.class_id = p_class
                     or (hh.class_id is null and exists (select 1 from kotsu.class_students cs where cs.class_id = p_class and cs.user_id = any (hh.user_ids)))) end
    order by hh.created_at desc, hh.id
    limit lim
  ),
  cnt as (
    select x.hw_id, count(*) as total,
           count(*) filter (where x.status = 'done') as done,
           count(*) filter (where x.status = 'partial') as partial,
           count(*) filter (where x.status = 'none' and x.phase <> 'ended') as none,
           count(*) filter (where x.status = 'none' and x.phase = 'ended') as missed
    from kotsu._hw_stats(array(select (hws.h).id from hws)) x
    join hws on (hws.h).id = x.hw_id
    where t.role = 'admin' or (hws.h).class_id is not null or x.user_id in (select kotsu._hw_mine(t))     -- 個人宛て：先生には、自分のクラスの生徒だけ数える
    group by x.hw_id
  )
  select coalesce(jsonb_agg(kotsu._hw_item(hws.h) || jsonb_build_object(
           'total', coalesce(cnt.total, 0), 'done', coalesce(cnt.done, 0), 'partial', coalesce(cnt.partial, 0),
           'none', coalesce(cnt.none, 0), 'missed', coalesce(cnt.missed, 0))
         order by (hws.h).created_at desc, (hws.h).id), '[]'::jsonb) into v
  from hws left join cnt on cnt.hw_id = (hws.h).id;
  return jsonb_build_object('ok', true, 'items', v);
exception when sqlstate 'P0001' then
  return jsonb_build_object('error', sqlerrm);
end $fn$;

-- 宿題 1件の、生徒ごとの進み（出席番号順）。login は先生にだけ見える。本名は出さない
create or replace function kotsu.hw_t_detail(p_token text, p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'kotsu', 'extensions', 'public'
as $fn$
declare t kotsu.users; h kotsu.homework; v_hw jsonb; v_students jsonb;
begin
  t := kotsu._staff(p_token);
  select * into h from kotsu.homework where id = p_id;
  if not found then perform kotsu._err('not_found'); end if;
  if not kotsu._hw_can(t, h) then perform kotsu._err('forbidden'); end if;
  with e as materialized (
    select x.* from kotsu._hw_eval(h) x
    where t.role = 'admin' or h.class_id is not null or x.user_id in (select kotsu._hw_mine(t))      -- 個人宛て：先生には、自分のクラスの生徒だけ見せる
  )
  select kotsu._hw_item(h) || jsonb_build_object(
           'total',   (select count(*) from e),
           'done',    (select count(*) from e where e.prog->>'status' = 'done'),
           'partial', (select count(*) from e where e.prog->>'status' = 'partial'),
           'none',    (select count(*) from e where e.prog->>'status' = 'none' and e.prog->>'phase' <> 'ended'),
           'missed',  (select count(*) from e where e.prog->>'status' = 'none' and e.prog->>'phase' = 'ended')),
         (select coalesce(jsonb_agg(jsonb_build_object(
                'id', e.user_id, 'no', e.no, 'nick', e.nick, 'login', e.login,
                'count', e.prog->'count', 'correct', e.prog->'correct', 'sec', e.prog->'sec',
                'pct', e.prog->'pct', 'status', e.prog->'status', 'done_at', e.prog->'done_at')
              order by e.no nulls last, e.login), '[]'::jsonb) from e)
    into v_hw, v_students;
  return jsonb_build_object('ok', true, 'hw', v_hw, 'students', v_students);
exception when sqlstate 'P0001' then
  return jsonb_build_object('error', sqlerrm);
end $fn$;

-- クラスの生徒 × 宿題のマス目。宿題は、締めていないもの。開始日の新しい順に p_limit 件（最大 40）を取り、古い順で返す。
--   p_from / p_to を渡すと、期間がその範囲にかかる宿題だけ。cells は、その生徒が対象の宿題だけ（個人宛てで対象でない生徒には、その宿題のキーがない）
create or replace function kotsu.hw_t_grid(p_token text, p_class uuid, p_from date default null, p_to date default null, p_limit integer default 40)
returns jsonb
language plpgsql
security definer
set search_path to 'kotsu', 'extensions', 'public'
as $fn$
declare t kotsu.users; lim integer; v_hws jsonb; v_students jsonb;
begin
  t := kotsu._staff(p_token);
  if not exists (select 1 from kotsu.classes where id = p_class) then perform kotsu._err('not_found'); end if;
  if not kotsu._can_class(t, p_class) then perform kotsu._err('forbidden'); end if;
  lim := least(greatest(coalesce(p_limit, 40), 1), 40);
  with sel as materialized (
    select hh as h from kotsu.homework hh
    where hh.org_id = t.org_id and not hh.closed
      and (hh.class_id = p_class
           or (hh.class_id is null and exists (select 1 from kotsu.class_students cs where cs.class_id = p_class and cs.user_id = any (hh.user_ids))))
      and (p_from is null or hh.due_date >= p_from)
      and (p_to is null or hh.start_date <= p_to)
    order by hh.start_date desc, hh.created_at desc, hh.id desc
    limit lim
  ),
  stu as materialized (
    select cs.user_id, cs.no, u.nick, u.login_id
    from kotsu.class_students cs
    join kotsu.users u on u.id = cs.user_id and u.role = 'student' and u.active and u.org_id = t.org_id
    where cs.class_id = p_class
  ),
  cells as materialized (
    select x.user_id, jsonb_object_agg(x.hw_id, jsonb_build_object('pct', x.pct, 'status', x.status)) as j
    from kotsu._hw_stats(array(select (sel.h).id from sel)) x
    where x.user_id in (select stu.user_id from stu)
    group by x.user_id
  )
  select
    (select coalesce(jsonb_agg(jsonb_build_object(
        'id', (sel.h).id, 'title', (sel.h).title, 'start_date', (sel.h).start_date, 'due_date', (sel.h).due_date,
        'unit_id', (sel.h).unit_id, 'n', (sel.h).n, 'min', (sel.h).min)
      order by (sel.h).start_date, (sel.h).created_at, (sel.h).id), '[]'::jsonb) from sel),
    (select coalesce(jsonb_agg(jsonb_build_object('id', stu.user_id, 'no', stu.no, 'nick', stu.nick, 'cells', coalesce(cells.j, '{}'::jsonb))
      order by stu.no nulls last, stu.login_id), '[]'::jsonb)
     from stu left join cells on cells.user_id = stu.user_id)
  into v_hws, v_students;
  return jsonb_build_object('ok', true, 'hws', v_hws, 'students', v_students);
exception when sqlstate 'P0001' then
  return jsonb_build_object('error', sqlerrm);
end $fn$;

-- 締める（取り消し）／再開
create or replace function kotsu.hw_t_close(p_token text, p_id uuid, p_closed boolean default true)
returns jsonb
language plpgsql
security definer
set search_path to 'kotsu', 'extensions', 'public'
as $fn$
declare t kotsu.users; h kotsu.homework;
begin
  t := kotsu._staff(p_token);
  select * into h from kotsu.homework where id = p_id;
  if not found then perform kotsu._err('not_found'); end if;
  if not kotsu._hw_can(t, h) then perform kotsu._err('forbidden'); end if;
  update kotsu.homework set closed = coalesce(p_closed, true) where id = h.id;
  return jsonb_build_object('ok', true);
exception when sqlstate 'P0001' then
  return jsonb_build_object('error', sqlerrm);
end $fn$;

-- 消す（出した直後のまちがい用）。消せるのは、作ってから 1日（24時間）以内、または まだだれも取り組んでいない宿題だけ
-- （取り組み ＝ n の宿題なら その単元を解いた生徒がいる／min の宿題なら 学習時間が 1秒でもある生徒がいる）。
-- それ以外は not_deletable（「締める」を使う）。
create or replace function kotsu.hw_t_delete(p_token text, p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'kotsu', 'extensions', 'public'
as $fn$
declare t kotsu.users; h kotsu.homework;
begin
  t := kotsu._staff(p_token);
  select * into h from kotsu.homework where id = p_id;
  if not found then perform kotsu._err('not_found'); end if;
  if not kotsu._hw_can(t, h) then perform kotsu._err('forbidden'); end if;
  -- 取り組み ＝ 宿題の目標に向けた分：n の宿題なら その単元を解いた（count>0）、min の宿題なら 学習した（sec>0）。（n だけの宿題では、ほかの単元の学習時間は数えない）
  if now() - h.created_at >= interval '1 day'
     and exists (select 1 from kotsu._hw_eval(h) e
                 where (h.n is not null and (e.prog->>'count')::int > 0) or (h.min is not null and (e.prog->>'sec')::numeric > 0)) then
    perform kotsu._err('not_deletable');
  end if;
  delete from kotsu.homework where id = h.id;
  perform kotsu._audit(t.org_id, t.id, t.role, 'hw_delete', h.id::text, jsonb_build_object('title', h.title, 'class', h.class_id));
  return jsonb_build_object('ok', true);
exception when sqlstate 'P0001' then
  return jsonb_build_object('error', sqlerrm);
end $fn$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. 生徒の関数（生徒のトークン）
-- ═══════════════════════════════════════════════════════════════════════════

-- その生徒が対象の宿題（クラス宛て＝いま入っているクラス、個人宛て）のうち、締めていなくて、期限が 14日前より新しいもの
-- （due_date >= 今日(JST) − 14日。まだ先のものも入る）。進み具合は返さない（生徒の画面が、自分の state から計算する）。
create or replace function kotsu.hw_s_list(p_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'kotsu', 'extensions', 'public'
as $fn$
declare u kotsu.users; today date; v jsonb;
begin
  u := kotsu._who(p_token);
  if u.role <> 'student' then perform kotsu._err('role'); end if;
  today := (now() at time zone 'Asia/Tokyo')::date;
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', h.id, 'title', h.title, 'unit_id', h.unit_id, 'n', h.n, 'min', h.min,
      'start_date', h.start_date, 'due_date', h.due_date, 'note', h.note,
      'created_at', h.created_at, 'closed', h.closed)
    order by h.due_date, h.created_at desc, h.id), '[]'::jsonb) into v
  from (
    select * from kotsu.homework hh
    where hh.org_id = u.org_id and not hh.closed and hh.due_date >= today - 14
      and (hh.class_id in (select cs.class_id from kotsu.class_students cs where cs.user_id = u.id)
           or (hh.class_id is null and hh.user_ids @> array[u.id]))
    order by hh.due_date desc, hh.created_at desc, hh.id       -- 50件を超えるときは、期限の遅い（これから）ほうを残す
    limit 50
  ) h;
  return jsonb_build_object('ok', true, 'items', v);
exception when sqlstate 'P0001' then
  return jsonb_build_object('error', sqlerrm);
end $fn$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. 権限（既存の公開関数と同じ：public から外して、anon / authenticated に与える）
-- ═══════════════════════════════════════════════════════════════════════════
revoke all on function kotsu.hw_t_create(text, uuid, uuid[], text, text, integer, integer, date, date, text) from public;
revoke all on function kotsu.hw_t_list(text, uuid, integer)                         from public;
revoke all on function kotsu.hw_t_detail(text, uuid)                                from public;
revoke all on function kotsu.hw_t_grid(text, uuid, date, date, integer)             from public;
revoke all on function kotsu.hw_t_close(text, uuid, boolean)                        from public;
revoke all on function kotsu.hw_t_delete(text, uuid)                                from public;
revoke all on function kotsu.hw_s_list(text)                                        from public;
grant execute on function kotsu.hw_t_create(text, uuid, uuid[], text, text, integer, integer, date, date, text) to anon, authenticated;
grant execute on function kotsu.hw_t_list(text, uuid, integer)                      to anon, authenticated;
grant execute on function kotsu.hw_t_detail(text, uuid)                             to anon, authenticated;
grant execute on function kotsu.hw_t_grid(text, uuid, date, date, integer)          to anon, authenticated;
grant execute on function kotsu.hw_t_close(text, uuid, boolean)                     to anon, authenticated;
grant execute on function kotsu.hw_t_delete(text, uuid)                             to anon, authenticated;
grant execute on function kotsu.hw_s_list(text)                                     to anon, authenticated;

-- PostgREST に、新しい関数を知らせる（Supabase は DDL で自動でも更新する。念のため）
notify pgrst, 'reload schema';
