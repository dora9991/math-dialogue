-- queries.sql — 「評価される学習時間」の仕様を決めるときに使った集計（読むだけ。書きこみはしない）
-- 対象：Supabase の kotsu スキーマ。生徒は class_students にいる active な student。
-- 1人あたりの解答の記録（state.log）は直近400問まで。たくさん解く生徒は、古いぶんが入らない。
-- 入れかえたあとに同じ集計をすると、前後をくらべられる。

-- ───────────────────────────────────────────────────────────────
-- ① 続けて解いていた時間に対して、どれだけカウントされているか（生徒・日ごと）
--    span＝前の解答から20分以内なら「つづき」として、その間の時間を足したもの
-- ───────────────────────────────────────────────────────────────
with stu as (
  select u.id from kotsu.users u join kotsu.class_students cs on cs.user_id = u.id where u.role = 'student' and u.active
), lg as (
  select stu.id, (l->>'t')::bigint as t, coalesce((l->>'d')::numeric, 0) as d,
         (to_timestamp((l->>'t')::bigint / 1000.0) at time zone 'Asia/Tokyo') as jst
  from stu join kotsu.states s on s.user_id = stu.id, jsonb_array_elements(s.state->'log') l
), g as (
  select *, (t - lag(t) over (partition by id order by t)) / 1000.0 as gap from lg
), sd as (
  select id, jst::date as dt, count(*) n, sum(d) counted,
         sum(case when gap is not null and gap <= 1200 then gap else d end) as span
  from g group by id, jst::date
), e as (
  select *, counted / nullif(span, 0) ratio,
         case when dt <= '2026-11-09' then 'A 〜11/9（上限5分）' when dt <= '2026-11-11' then 'B 11/10-11（上限3分・見えない間は数えない）' else 'C 11/12〜（操作中の窓だけ）' end era
  from sd where n >= 10
)
select era, count(*) student_days, round(sum(counted) / 60) counted_min, round(sum(span) / 60) span_min, round(100.0 * sum(counted) / sum(span)) pct,
       round((percentile_cont(0.1) within group (order by ratio))::numeric * 100) p10,
       round((percentile_cont(0.5) within group (order by ratio))::numeric * 100) med,
       count(*) filter (where ratio < 0.5) under_half
from e group by era order by era;

-- ───────────────────────────────────────────────────────────────
-- ② 答えたあと、次の問題が出るまでの時間（＝解説を読む時間。いまは数えていない）
-- ───────────────────────────────────────────────────────────────
with stu as (
  select u.id from kotsu.users u join kotsu.class_students cs on cs.user_id = u.id where u.role = 'student' and u.active
), lg as (
  select stu.id, (l->>'t')::bigint as t, coalesce((l->>'d')::numeric, 0) as d, (l->>'ok')::boolean as ok
  from stu join kotsu.states s on s.user_id = stu.id, jsonb_array_elements(s.state->'log') l
), g as (
  select *, (lead(t) over w - t) / 1000.0 as gap_next, lead(d) over w as d_next from lg window w as (partition by id order by t)
), p as (
  select *, case when gap_next is not null and gap_next <= 600 then greatest(gap_next - d_next, 0) end as post from g
)
select ok, count(post) n,
       round((percentile_cont(0.5) within group (order by post))::numeric, 1) p50,
       round((percentile_cont(0.9) within group (order by post))::numeric, 1) p90,
       round((percentile_cont(0.95) within group (order by post))::numeric, 1) p95,
       round(sum(post) / 60) total_min,
       round(sum(least(post, case when ok then 20 else 90 end)) / 60) capped_min   -- 上限（正解20秒・まちがい90秒）をかけたとき
from p where post is not null group by ok;

-- ───────────────────────────────────────────────────────────────
-- ③ 新しいルールを、いまの記録に当てはめた試算（近似）
--    ・「弱点」＝アプリが weak としている単元、または、その単元のはじめの5問の正答率が 80% 未満
--    ・「合格」＝同じ単元・同じレベルで5問つづけて正解。そのあと7日以内の同じレベルは「くり返し」
--    ・中1以上の単元は、すべて「いま・予習・同学年」として数えた（中1の中の古い単元の区別は、していない）
--    ・時間は、解く時間 d ＋ 答えたあとの時間（上限：正解20秒・まちがい90秒）
-- ───────────────────────────────────────────────────────────────
with stu as (
  select u.id from kotsu.users u join kotsu.class_students cs on cs.user_id = u.id where u.role = 'student' and u.active
), lg as (
  select stu.id, (l->>'t')::bigint as t, coalesce((l->>'d')::numeric, 0) as d, (l->>'L')::int as lvl, (l->>'ok')::boolean as ok, l->>'u' as unit
  from stu join kotsu.states s on s.user_id = stu.id, jsonb_array_elements(s.state->'log') l
), flagged as (
  select stu.id, un.key as unit from stu join kotsu.states s on s.user_id = stu.id, jsonb_each(s.state->'units') un where coalesce((un.value->>'weak')::boolean, false)
  union
  select stu.id, w->>'u' from stu join kotsu.states s on s.user_id = stu.id, jsonb_array_elements(s.summary->'weak') w
), a as (
  select lg.*, (lead(t) over w1 - t) / 1000.0 as gap_next, lead(d) over w1 as d_next,
         row_number() over (partition by id, unit order by t) as rn_unit,
         count(*) filter (where not ok) over (partition by id, unit, lvl order by t) as wrongs_so_far
  from lg window w1 as (partition by id order by t)
), b as (
  select a.*,
         count(*) filter (where ok) over (partition by id, unit, lvl, wrongs_so_far order by t) as run_len,
         avg(ok::int) filter (where rn_unit <= 5) over (partition by id, unit) as first5_acc,
         count(*) filter (where rn_unit <= 5) over (partition by id, unit) as first5_n
  from a
), c as (
  select b.*, min(t) filter (where ok and run_len >= 5) over (partition by id, unit, lvl) as pass_t from b
), e as (
  select c.*,
         case when gap_next is not null and gap_next <= 600 then least(greatest(gap_next - d_next, 0), case when ok then 20 else 90 end) else 0 end as review,
         (unit ~ '^E') as elem,
         (pass_t is not null and t > pass_t and t - pass_t < 7 * 86400000::bigint) as repeat_passed,
         exists (select 1 from flagged f where f.id = c.id and f.unit = c.unit) as is_flagged
  from c
), f as (
  select e.*,
         case when repeat_passed then 'x 合格ずみレベルのくり返し'
              when not elem then 'o 中1以上（いま・予習・同学年）'
              when is_flagged or (first5_n >= 5 and first5_acc < 0.8) then 'o 学び直し（弱点・つまずきあり）'
              else 'x 下の学年（弱点でない）' end as cls
  from e
)
select cls, count(*) answers, count(distinct id) students, round(sum(d) / 60) old_min, round(sum(d + review) / 60) new_min,
       round(100.0 * avg(ok::int)) acc, percentile_cont(0.5) within group (order by d) med_sec
from f group by cls order by cls;
