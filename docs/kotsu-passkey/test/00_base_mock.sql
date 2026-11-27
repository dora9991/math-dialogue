-- 手元テスト用：本番の kotsu スキーマのうち、ログインに かかわる 部分だけを まねる（本番の 定義から 写した）
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema extensions; create extension pgcrypto schema extensions;
create schema kotsu; grant usage on schema kotsu to anon, authenticated;

create table kotsu.orgs (id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, kind text not null default 'juku',
  active boolean not null default true, roster_salt text, roster_check text, roster_iter int not null default 600000, roster_at timestamptz,
  limits jsonb not null default '{"staff": 50, "students": 500}', note text not null default '', created_at timestamptz not null default now(), fb_named boolean not null default false);
create table kotsu.users (id uuid primary key default gen_random_uuid(), org_id uuid not null references kotsu.orgs(id), role text not null, login_id text not null,
  pass_hash text not null, nick text not null default '', name_enc text, grade text, active boolean not null default true, created_at timestamptz not null default now(),
  last_login_at timestamptz, pass_set_at timestamptz not null default now(), unique (org_id, login_id));
create table kotsu.sessions (token_hash text primary key, user_id uuid references kotsu.users(id) on delete cascade, kind text not null default 'user',
  created_at timestamptz not null default now(), last_seen timestamptz not null default now(), expires_at timestamptz not null);
create table kotsu.audit (id bigserial primary key, org_id uuid, actor uuid, actor_role text not null, action text not null, target text not null default '', detail jsonb not null default '{}', at timestamptz not null default now());
create table kotsu.rate (k text primary key, n int not null default 0, since timestamptz not null default now());
alter table kotsu.orgs enable row level security; alter table kotsu.users enable row level security; alter table kotsu.sessions enable row level security;
alter table kotsu.audit enable row level security; alter table kotsu.rate enable row level security;

CREATE OR REPLACE FUNCTION kotsu._err(p_code text) RETURNS void LANGUAGE plpgsql AS $function$ begin raise exception using errcode = 'P0001', message = p_code; end $function$;
CREATE OR REPLACE FUNCTION kotsu._h(p text) RETURNS text LANGUAGE sql IMMUTABLE AS $function$ select encode(extensions.digest(coalesce(p, ''), 'sha256'), 'hex') $function$;
CREATE OR REPLACE FUNCTION kotsu._audit(p_org uuid, p_actor uuid, p_role text, p_action text, p_target text DEFAULT ''::text, p_detail jsonb DEFAULT '{}'::jsonb)
 RETURNS void LANGUAGE sql AS $function$ insert into kotsu.audit (org_id, actor, actor_role, action, target, detail) values (p_org, p_actor, p_role, p_action, coalesce(p_target, ''), coalesce(p_detail, '{}'::jsonb)) $function$;
CREATE OR REPLACE FUNCTION kotsu._org_json(o kotsu.orgs) RETURNS jsonb LANGUAGE sql STABLE AS $function$
  select jsonb_build_object('id', o.id, 'code', o.code, 'name', o.name, 'kind', o.kind, 'active', o.active,
    'roster', case when o.roster_check is null then null else jsonb_build_object('salt', o.roster_salt, 'check', o.roster_check, 'iter', o.roster_iter, 'at', o.roster_at) end,
    'fb_named', coalesce(o.fb_named, false)) $function$;
CREATE OR REPLACE FUNCTION kotsu._user_json(u kotsu.users) RETURNS jsonb LANGUAGE sql STABLE AS $function$
  select jsonb_build_object('id', u.id, 'role', u.role, 'login', u.login_id, 'nick', u.nick, 'name_enc', u.name_enc,
    'grade', u.grade, 'active', u.active, 'last_login_at', u.last_login_at, 'created_at', u.created_at) $function$;
CREATE OR REPLACE FUNCTION kotsu._rate_clear(p_k text) RETURNS void LANGUAGE sql AS $function$ delete from kotsu.rate where k = p_k $function$;
CREATE OR REPLACE FUNCTION kotsu._rate_hit(p_k text, p_win interval) RETURNS void LANGUAGE sql AS $function$
  insert into kotsu.rate (k, n, since) values (p_k, 1, now())
  on conflict (k) do update set
    n = case when kotsu.rate.since < now() - p_win then 1 else kotsu.rate.n + 1 end,
    since = case when kotsu.rate.since < now() - p_win then now() else kotsu.rate.since end $function$;
CREATE OR REPLACE FUNCTION kotsu._rate_locked(p_k text, p_lim integer, p_win interval) RETURNS boolean LANGUAGE sql STABLE AS $function$ select exists (select 1 from kotsu.rate r where r.k = p_k and r.n >= p_lim and r.since > now() - p_win) $function$;
CREATE OR REPLACE FUNCTION kotsu._who(p_token text) RETURNS kotsu.users LANGUAGE plpgsql AS $function$
declare s kotsu.sessions; u kotsu.users;
begin
  if p_token is null or length(p_token) < 20 then perform kotsu._err('auth'); end if;
  select * into s from kotsu.sessions where token_hash = kotsu._h(p_token) and kind = 'user';
  if not found or s.expires_at < now() then perform kotsu._err('auth'); end if;
  select * into u from kotsu.users where id = s.user_id;
  if not found or not u.active then perform kotsu._err('auth'); end if;
  if not exists (select 1 from kotsu.orgs o where o.id = u.org_id and o.active) then perform kotsu._err('org_off'); end if;
  if s.last_seen < now() - interval '10 minutes' then
    update kotsu.sessions set last_seen = now(),
      expires_at = greatest(expires_at, now() + case when u.role = 'student' then interval '180 days' else interval '30 days' end)
    where token_hash = s.token_hash;
  end if;
  return u;
end $function$;
CREATE OR REPLACE FUNCTION kotsu._staff(p_token text) RETURNS kotsu.users LANGUAGE plpgsql AS $function$
declare u kotsu.users := kotsu._who(p_token);
begin
  if u.role not in ('admin', 'teacher') then perform kotsu._err('role'); end if;
  return u;
end $function$;
CREATE OR REPLACE FUNCTION kotsu.login(p_org text, p_login text, p_pass text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'kotsu', 'extensions', 'public' AS $function$
declare o kotsu.orgs; u kotsu.users; k text; ko text; tok text;
begin
  k := 'L:' || upper(trim(coalesce(p_org, ''))) || ':' || lower(trim(coalesce(p_login, '')));
  ko := 'O:' || upper(trim(coalesce(p_org, '')));
  if kotsu._rate_locked(k, 10, interval '15 minutes') or kotsu._rate_locked(ko, 200, interval '15 minutes') then
    return jsonb_build_object('error', 'locked');
  end if;
  select * into o from kotsu.orgs where code = upper(trim(coalesce(p_org, '')));
  if found then
    select * into u from kotsu.users where org_id = o.id and login_id = lower(trim(coalesce(p_login, '')));
  end if;
  if u.id is null then
    perform extensions.crypt(coalesce(p_pass, ''), extensions.gen_salt('bf', 8));
  end if;
  if u.id is null or not u.active or u.pass_hash <> extensions.crypt(coalesce(p_pass, ''), u.pass_hash) then
    perform kotsu._rate_hit(k, interval '15 minutes');
    perform kotsu._rate_hit(ko, interval '15 minutes');
    return jsonb_build_object('error', 'bad');
  end if;
  if not o.active then return jsonb_build_object('error', 'org_off'); end if;
  perform kotsu._rate_clear(k);
  tok := encode(extensions.gen_random_bytes(24), 'hex');
  insert into kotsu.sessions (token_hash, user_id, kind, expires_at)
    values (kotsu._h(tok), u.id, 'user', now() + case when u.role = 'student' then interval '180 days' else interval '30 days' end);
  delete from kotsu.sessions where user_id = u.id and token_hash in (
    select token_hash from kotsu.sessions where user_id = u.id order by last_seen desc offset 10);
  update kotsu.users set last_login_at = now() where id = u.id;
  if u.role <> 'student' then perform kotsu._audit(o.id, u.id, u.role, 'login'); end if;
  return jsonb_build_object('ok', true, 'token', tok, 'user', kotsu._user_json(u), 'org', kotsu._org_json(o));
end $function$;
revoke all on all functions in schema kotsu from public;
grant execute on function kotsu.login(text,text,text) to anon, authenticated;

-- テスト用の 組織と 人
insert into kotsu.orgs (code, name, kind) values ('TEST01', 'テスト中学', 'school');
insert into kotsu.users (org_id, role, login_id, pass_hash, nick) select id, 'teacher', 'sensei', extensions.crypt('pass1234', extensions.gen_salt('bf', 8)), '田中先生' from kotsu.orgs where code = 'TEST01';
insert into kotsu.users (org_id, role, login_id, pass_hash, nick) select id, 'admin', 'kocho', extensions.crypt('pass5678', extensions.gen_salt('bf', 8)), '校長' from kotsu.orgs where code = 'TEST01';
insert into kotsu.users (org_id, role, login_id, pass_hash, nick) select id, 'student', 's001', extensions.crypt('pass0000', extensions.gen_salt('bf', 8)), '' from kotsu.orgs where code = 'TEST01';
