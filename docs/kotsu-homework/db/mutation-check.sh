#!/usr/bin/env bash
# mutation-check.sh — テストが「本当に」まちがいを見つけるかの確認：hw.sql をわざと 1か所だけ壊して、テストが失敗するかを見る。
#   使いかた：  bash mutation-check.sh [名前の一部]      （約 30秒 × 壊し方の数。名前の一部を渡すと、その壊し方だけ）。どれも「失敗あり」になれば、テストが効いている。
set -uo pipefail
cd "$(dirname "$0")"
mkdir -p work/mut
python3 - <<'PY'
import re, pathlib
src = pathlib.Path('hw.sql').read_text(encoding='utf-8')
muts = {
 'progress：窓の端を含めない': ("    where x.t between w.s_ms and w.e_ms\n  ),\n  agg", "    where x.t > w.s_ms and x.t < w.e_ms\n  ),\n  agg"),
 'stats：窓の端を含めない': ("le.t between hw.s_ms and hw.e_ms", "le.t > hw.s_ms and le.t < hw.e_ms"),
 'progress：達成日を 早いほう（least）': ("             greatest(\n               case when hw.n is not null then date", "             least(\n               case when hw.n is not null then date"),
 'stats：正解を数えない（cor を 0）': ("(count(le.t) filter (where le.ok))::integer as cor", "0 as cor"),
 'stats：やめた生徒も数える（クラス宛て）': ("join kotsu.users u on u.id = cs.user_id and u.role = 'student' and u.active and u.org_id = hw.org_id\n    where hw.class_id is not null", "join kotsu.users u on u.id = cs.user_id and u.role = 'student' and u.org_id = hw.org_id\n    where hw.class_id is not null"),
 '権限：_hw_can が、ほかのクラスの先生も通す': ("      (h.class_id is not null and exists (\n        select 1 from kotsu.class_teachers ct where ct.class_id = h.class_id and ct.user_id = t.id))", "      (h.class_id is not null and exists (\n        select 1 from kotsu.class_teachers ct where ct.user_id = t.id))"),
 '権限：個人宛てで、生徒を確かめない': ("      if not kotsu._can_see(t, u) then perform kotsu._err('forbidden'); end if;", "      null;"),
 '権限：クラスの確かめを外す（create）': ("    if not kotsu._can_class(t, p_class) then perform kotsu._err('forbidden'); end if;                   -- ほかの学校・担当外", "    null;"),
 '権限：生徒の一覧が、ほかのクラスも出す': ("      and (hh.class_id in (select cs.class_id from kotsu.class_students cs where cs.user_id = u.id)", "      and (hh.class_id in (select cs.class_id from kotsu.class_students cs)"),
 '生徒の一覧：14日 → 15日': ("hh.due_date >= today - 14", "hh.due_date >= today - 15"),
 '生徒の一覧：締めた宿題も出す': ("where hh.org_id = u.org_id and not hh.closed and", "where hh.org_id = u.org_id and"),
 '消す：取り組みがあっても消せる': ("    perform kotsu._err('not_deletable');", "    null;"),
 '上限：60件 → 61件': ("created_at > now() - interval '1 day') >= 60 then", "created_at > now() - interval '1 day') >= 61 then"),
 '検証：n の上限 200 → 201': ("if p_n is not null and (p_n < 1 or p_n > 200)", "if p_n is not null and (p_n < 1 or p_n > 201)"),
 '検証：期間 59 → 60': ("if v_start > p_due or p_due - v_start > 59 then", "if v_start > p_due or p_due - v_start > 60 then"),
 '権限：内部の関数を public から外し忘れる（anon が呼べる）': ("revoke all on function kotsu._hw_progress(kotsu.homework, jsonb, timestamptz) from public, anon, authenticated;", "-- (外し忘れ)"),
 '範囲：詳細で、個人宛てのほかのクラスの生徒も出す': ("    where t.role = 'admin' or h.class_id is not null or x.user_id in (select kotsu._hw_mine(t))      -- 個人宛て：先生には、自分のクラスの生徒だけ見せる", "    where true"),
 '範囲：一覧の人数に、ほかのクラスの生徒も数える': ("    where t.role = 'admin' or (hws.h).class_id is not null or x.user_id in (select kotsu._hw_mine(t))     -- 個人宛て：先生には、自分のクラスの生徒だけ数える", "    where true"),
 '権限：anon が表を読める': ("revoke all on table kotsu.homework from public, anon, authenticated;", "revoke all on table kotsu.homework from public;\ngrant select on table kotsu.homework to anon;"),
 '本名：マス目に name_enc を出す': ("select cs.user_id, cs.no, u.nick, u.login_id\n    from kotsu.class_students cs", "select cs.user_id, cs.no, u.nick || coalesce(u.name_enc, '') as nick, u.login_id\n    from kotsu.class_students cs"),
 'マス目：締めた宿題も出す': ("    where hh.org_id = t.org_id and not hh.closed\n      and (hh.class_id = p_class", "    where hh.org_id = t.org_id\n      and (hh.class_id = p_class"),
 '一覧：期限切れも none に入れる（missed を使わない）': ("count(*) filter (where x.status = 'none' and x.phase <> 'ended') as none", "count(*) filter (where x.status = 'none') as none"),
 'progress：pct の丸めを 2桁': ("'pct',     floor(f.pct * 1000 + 0.5) / 1000,", "'pct',     floor(f.pct * 100 + 0.5) / 100,"),
 'progress：期限日の終わりを 23:59:59 より前に': ("+ 86400000 - 32400000 - 1)::numeric as e_ms\n  ),\n  -- 窓のなかの", "+ 86400000 - 32400000 - 3600001)::numeric as e_ms\n  ),\n  -- 窓のなかの"),
 'create：個人宛てを重複のまま保存': ("select array_agg(distinct x) into v_users from unnest(p_users) as x;", "v_users := p_users;"),
}
for i, (name, (old, new)) in enumerate(muts.items()):
    if old == new:
        continue
    if old not in src:
        print('NOT FOUND:', name); continue
    pathlib.Path(f'work/mut/m{i:02d}.sql').write_text(src.replace(old, new, 1), encoding='utf-8')
    pathlib.Path(f'work/mut/m{i:02d}.name').write_text(name, encoding='utf-8')
PY
fail=0; total=0
for f in work/mut/m*.sql; do
  b=${f%.sql}; name=$(cat $b.name)
  if [ -n "${1:-}" ] && [[ "$name" != *"$1"* ]]; then continue; fi
  total=$((total+1))
  out=$(HW_SQL=$f HW_DB=kotsu_hw_mut bash run-tests.sh 2>&1); rc=$?
  nfail=$(echo "$out" | grep -E '^ *[0-9]+ \| *[0-9]+ \| *[0-9]+ *$' | tail -1 | awk -F'|' '{gsub(/ /,"",$3); print $3}')
  firstfail=$(echo "$out" | sed -n '/失敗したもの/,/時間/p' | sed -n '4,4p' | cut -c1-110)
  if [ $rc -ne 0 ]; then echo "検出 OK   ：$name（失敗 ${nfail:-中断}件）"; else echo "★見のがし：$name"; fail=$((fail+1)); fi
done
echo "壊し方 $total 通りのうち、テストが見のがしたもの：$fail"
exit $fail
