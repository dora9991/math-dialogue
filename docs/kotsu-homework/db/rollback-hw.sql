-- rollback-hw.sql — hw.sql で入れたものを、すべて取りのぞく（元にもどす）。既存の関数・表には、さわらない。
-- 注意：宿題のデータ（kotsu.homework の行）は、消える。もどす前に、必要なら控える（select * from kotsu.homework）。
-- apply_migration か、SQL エディタで流す。何度流しても同じ（if exists）。
-- 順番：関数（表の型を使っているもの）→ 表。
drop function if exists kotsu.hw_t_create(text, uuid, uuid[], text, text, integer, integer, date, date, text);
drop function if exists kotsu.hw_t_list(text, uuid, integer);
drop function if exists kotsu.hw_t_detail(text, uuid);
drop function if exists kotsu.hw_t_grid(text, uuid, date, date, integer);
drop function if exists kotsu.hw_t_close(text, uuid, boolean);
drop function if exists kotsu.hw_t_delete(text, uuid);
drop function if exists kotsu.hw_s_list(text);
drop function if exists kotsu._hw_stats(uuid[], timestamptz);
drop function if exists kotsu._hw_eval(kotsu.homework, timestamptz);
drop function if exists kotsu._hw_progress(kotsu.homework, jsonb, timestamptz);
drop function if exists kotsu._hw_can(kotsu.users, kotsu.homework);
drop function if exists kotsu._hw_mine(kotsu.users);
drop function if exists kotsu._hw_item(kotsu.homework);
drop function if exists kotsu._hw_truthy(jsonb);
drop function if exists kotsu._hw_secnum(jsonb);
drop table if exists kotsu.homework;
notify pgrst, 'reload schema';
