-- ============================================================
-- kotsu：先生・管理者の パスキー（Face ID・Touch ID・指紋・端末の PIN）での ログイン
--
--  ・登録：ログイン中の 先生・管理者が、パスワードを もう一度 入れて、この 端末の かぎ（公開鍵）を 登録する。
--          かぎの 登録には 署名の 確かめは いらない（ログイン中の 本人が、自分の 端末で 作った かぎを 置くだけ）。
--          clientDataJSON の 種類・チャレンジ・オリジン だけ 確かめる。
--  ・ログイン：署名の 確かめ（ECDSA P-256 / RSA）は Postgres では できないので、Edge Function「passkey」が 行い、
--          その あとで kotsu.pk_login_finish を よぶ（service_role だけ が よべる）。
--  ・生徒は 使えない（_staff・role の 確かめ）。止めた 人・止めた 組織は 入れない。人を 消すと かぎも 消える。
-- ============================================================

create table if not exists kotsu.passkeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references kotsu.users(id) on delete cascade,
  cred_id text not null unique check (cred_id ~ '^[A-Za-z0-9_-]+$' and length(cred_id) between 16 and 1400),
  public_key text not null check (public_key ~ '^[A-Za-z0-9_-]+$' and length(public_key) between 60 and 2000),
  alg integer not null check (alg in (-7, -257)),
  sign_count bigint not null default 0,
  label text not null default '' check (length(label) <= 40),
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
create index if not exists passkeys_user_idx on kotsu.passkeys (user_id);
alter table kotsu.passkeys enable row level security;
comment on table kotsu.passkeys is '先生・管理者の パスキー（端末の 公開鍵、SPKI を base64url）。読み書きは kotsu.pk_* の 関数だけ。';

create table if not exists kotsu.passkey_challenges (
  challenge text primary key,
  purpose text not null check (purpose in ('reg', 'login')),
  user_id uuid references kotsu.users(id) on delete cascade,
  expires_at timestamptz not null
);
alter table kotsu.passkey_challenges enable row level security;
comment on table kotsu.passkey_challenges is 'パスキーの 1回かぎりの チャレンジ（登録 5分・ログイン 3分）。';

revoke all on kotsu.passkeys, kotsu.passkey_challenges from public, anon, authenticated;

-- base64url ⇔ bytea
create or replace function kotsu._b64u(p text) returns bytea language sql immutable as $$
  select decode(rpad(translate(coalesce(p, ''), '-_', '+/'), ((length(coalesce(p, '')) + 3) / 4) * 4, '='), 'base64') $$;
create or replace function kotsu._b64u_enc(p bytea) returns text language sql immutable as $$
  select rtrim(translate(replace(encode(p, 'base64'), E'\n', ''), '+/', '-_'), '=') $$;

-- パスキーを 使って よい ページの オリジン（rpId は dora9991.github.io）
create or replace function kotsu._pk_origins() returns text[] language sql immutable as $$
  select array['https://dora9991.github.io'] $$;

-- clientDataJSON（base64url）の 種類・チャレンジ・オリジンを 確かめる。ちがえば 'pk_bad' で 止める
create or replace function kotsu._pk_client(p_client text, p_type text, p_challenge text) returns void
language plpgsql as $$
declare j jsonb;
begin
  begin
    j := convert_from(kotsu._b64u(p_client), 'UTF8')::jsonb;
  exception when others then
    perform kotsu._err('pk_bad');
  end;
  if j ->> 'type' is distinct from p_type or j ->> 'challenge' is distinct from p_challenge
     or not coalesce(j ->> 'origin' = any (kotsu._pk_origins()), false) then
    perform kotsu._err('pk_bad');
  end if;
end $$;

-- 自分の パスキーの 一覧
create or replace function kotsu.pk_list(p_token text) returns jsonb
language plpgsql security definer set search_path to 'kotsu', 'extensions', 'public' as $$
declare u kotsu.users := kotsu._staff(p_token);
begin
  return jsonb_build_object('ok', true, 'keys', coalesce((
    select jsonb_agg(jsonb_build_object('id', k.id, 'label', k.label, 'created_at', k.created_at, 'last_used_at', k.last_used_at) order by k.created_at)
    from kotsu.passkeys k where k.user_id = u.id), '[]'::jsonb));
end $$;

-- 登録の はじめ：パスワードを もう一度 確かめて、チャレンジを わたす
create or replace function kotsu.pk_reg_begin(p_token text, p_pass text) returns jsonb
language plpgsql security definer set search_path to 'kotsu', 'extensions', 'public' as $$
declare u kotsu.users := kotsu._staff(p_token); o kotsu.orgs; k text; ch text;
begin
  k := 'PKR:' || u.id::text;
  if kotsu._rate_locked(k, 10, interval '15 minutes') then return jsonb_build_object('error', 'locked'); end if;
  if u.pass_hash <> extensions.crypt(coalesce(p_pass, ''), u.pass_hash) then
    perform kotsu._rate_hit(k, interval '15 minutes');
    return jsonb_build_object('error', 'pk_pass');
  end if;
  perform kotsu._rate_clear(k);
  if (select count(*) from kotsu.passkeys where user_id = u.id) >= 10 then return jsonb_build_object('error', 'pk_many'); end if;
  delete from kotsu.passkey_challenges where expires_at < now() or (user_id = u.id and purpose = 'reg');
  ch := kotsu._b64u_enc(extensions.gen_random_bytes(32));
  insert into kotsu.passkey_challenges (challenge, purpose, user_id, expires_at) values (ch, 'reg', u.id, now() + interval '5 minutes');
  select * into o from kotsu.orgs where id = u.org_id;
  return jsonb_build_object('ok', true, 'challenge', ch,
    'user_handle', kotsu._b64u_enc(uuid_send(u.id)),
    'name', u.login_id || '@' || o.code,
    'display', coalesce(nullif(u.nick, ''), u.login_id) || '（' || o.name || '）',
    'exclude', coalesce((select jsonb_agg(cred_id) from kotsu.passkeys where user_id = u.id), '[]'::jsonb));
end $$;

-- 登録の おわり：端末が 作った かぎ（公開鍵）を しまう
create or replace function kotsu.pk_reg_finish(p_token text, p_challenge text, p_cred_id text, p_client text, p_public_key text, p_alg integer, p_label text)
returns jsonb language plpgsql security definer set search_path to 'kotsu', 'extensions', 'public' as $$
declare u kotsu.users := kotsu._staff(p_token); c kotsu.passkey_challenges; pk bytea; lb text; nid uuid;
begin
  delete from kotsu.passkey_challenges where challenge = p_challenge and purpose = 'reg' and user_id = u.id returning * into c;
  if c.challenge is null or c.expires_at < now() then return jsonb_build_object('error', 'pk_expired'); end if;
  perform kotsu._pk_client(p_client, 'webauthn.create', p_challenge);
  if p_alg is null or p_alg not in (-7, -257) then return jsonb_build_object('error', 'pk_alg'); end if;
  if coalesce(p_cred_id, '') !~ '^[A-Za-z0-9_-]+$' or length(p_cred_id) not between 16 and 1400
     or coalesce(p_public_key, '') !~ '^[A-Za-z0-9_-]+$' or length(p_public_key) not between 60 and 2000 then
    return jsonb_build_object('error', 'pk_bad');
  end if;
  begin pk := kotsu._b64u(p_public_key); exception when others then return jsonb_build_object('error', 'pk_bad'); end;
  if get_byte(pk, 0) <> 48 then return jsonb_build_object('error', 'pk_bad'); end if;   -- SPKI は DER の SEQUENCE（0x30）
  if exists (select 1 from kotsu.passkeys where cred_id = p_cred_id) then return jsonb_build_object('error', 'pk_dup'); end if;
  if (select count(*) from kotsu.passkeys where user_id = u.id) >= 10 then return jsonb_build_object('error', 'pk_many'); end if;
  lb := left(coalesce(nullif(btrim(regexp_replace(coalesce(p_label, ''), '[[:cntrl:]]', '', 'g')), ''), 'この端末'), 40);
  insert into kotsu.passkeys (user_id, cred_id, public_key, alg, label) values (u.id, p_cred_id, p_public_key, p_alg, lb) returning id into nid;
  perform kotsu._audit(u.org_id, u.id, u.role, 'passkey_add', nid::text, jsonb_build_object('label', lb));
  return jsonb_build_object('ok', true, 'id', nid, 'label', lb);
end $$;

-- 自分の パスキーを 消す（なくした 端末・使わない 端末）
create or replace function kotsu.pk_delete(p_token text, p_id uuid) returns jsonb
language plpgsql security definer set search_path to 'kotsu', 'extensions', 'public' as $$
declare u kotsu.users := kotsu._staff(p_token); lb text;
begin
  delete from kotsu.passkeys where id = p_id and user_id = u.id returning label into lb;
  if lb is null then return jsonb_build_object('error', 'not_found'); end if;
  perform kotsu._audit(u.org_id, u.id, u.role, 'passkey_del', p_id::text, jsonb_build_object('label', lb));
  return jsonb_build_object('ok', true);
end $$;

-- ログインの はじめ：だれでも よべる。チャレンジを わたす（3分・1回かぎり）
create or replace function kotsu.pk_login_begin() returns jsonb
language plpgsql security definer set search_path to 'kotsu', 'extensions', 'public' as $$
declare ch text;
begin
  if kotsu._rate_locked('PKB', 600, interval '15 minutes') then return jsonb_build_object('error', 'locked'); end if;
  perform kotsu._rate_hit('PKB', interval '15 minutes');
  delete from kotsu.passkey_challenges where expires_at < now();
  ch := kotsu._b64u_enc(extensions.gen_random_bytes(32));
  insert into kotsu.passkey_challenges (challenge, purpose, expires_at) values (ch, 'login', now() + interval '3 minutes');
  return jsonb_build_object('ok', true, 'challenge', ch);
end $$;

-- （Edge Function 用）かぎを 取り出す
create or replace function kotsu.pk_get(p_cred_id text) returns jsonb
language plpgsql security definer set search_path to 'kotsu', 'extensions', 'public' as $$
declare k kotsu.passkeys;
begin
  select * into k from kotsu.passkeys where cred_id = p_cred_id;
  if not found then return jsonb_build_object('error', 'pk_unknown'); end if;
  return jsonb_build_object('ok', true, 'public_key', k.public_key, 'alg', k.alg, 'sign_count', k.sign_count);
end $$;

-- （Edge Function 用）署名を 確かめた あとで よぶ：チャレンジを 使い切り、ログインの トークンを 作る（login と 同じ 形で 返す）
create or replace function kotsu.pk_login_finish(p_cred_id text, p_challenge text, p_client text, p_sign_count bigint)
returns jsonb language plpgsql security definer set search_path to 'kotsu', 'extensions', 'public' as $$
declare c kotsu.passkey_challenges; k kotsu.passkeys; u kotsu.users; o kotsu.orgs; tok text;
begin
  delete from kotsu.passkey_challenges where challenge = p_challenge and purpose = 'login' returning * into c;
  if c.challenge is null or c.expires_at < now() then return jsonb_build_object('error', 'pk_expired'); end if;
  perform kotsu._pk_client(p_client, 'webauthn.get', p_challenge);
  select * into k from kotsu.passkeys where cred_id = p_cred_id;
  if not found then return jsonb_build_object('error', 'pk_unknown'); end if;
  select * into u from kotsu.users where id = k.user_id;
  if not found or not u.active or u.role not in ('teacher', 'admin') then return jsonb_build_object('error', 'pk_unknown'); end if;
  select * into o from kotsu.orgs where id = u.org_id;
  if not o.active then return jsonb_build_object('error', 'org_off'); end if;
  -- 署名の 回数（同期する パスキーは いつも 0）。前より 進んで いなければ、かぎの 写しの おそれ
  if (k.sign_count > 0 or coalesce(p_sign_count, 0) > 0) and coalesce(p_sign_count, 0) <= k.sign_count then
    perform kotsu._audit(u.org_id, u.id, u.role, 'passkey_counter', k.id::text, jsonb_build_object('stored', k.sign_count, 'got', p_sign_count));
    return jsonb_build_object('error', 'pk_counter');
  end if;
  update kotsu.passkeys set sign_count = greatest(sign_count, coalesce(p_sign_count, 0)), last_used_at = now() where id = k.id;
  tok := encode(extensions.gen_random_bytes(24), 'hex');
  insert into kotsu.sessions (token_hash, user_id, kind, expires_at) values (kotsu._h(tok), u.id, 'user', now() + interval '30 days');
  delete from kotsu.sessions where user_id = u.id and token_hash in (
    select token_hash from kotsu.sessions where user_id = u.id order by last_seen desc offset 10);
  update kotsu.users set last_login_at = now() where id = u.id;
  perform kotsu._audit(o.id, u.id, u.role, 'login_passkey', k.id::text);
  return jsonb_build_object('ok', true, 'token', tok, 'user', kotsu._user_json(u), 'org', kotsu._org_json(o));
end $$;

-- 実行の 権限：内部の 関数は だれにも 出さない。画面から よぶ ものは anon・authenticated、署名の あとの ものは service_role だけ
revoke all on function kotsu._b64u(text), kotsu._b64u_enc(bytea), kotsu._pk_origins(), kotsu._pk_client(text, text, text),
  kotsu.pk_list(text), kotsu.pk_reg_begin(text, text), kotsu.pk_reg_finish(text, text, text, text, text, integer, text),
  kotsu.pk_delete(text, uuid), kotsu.pk_login_begin(), kotsu.pk_get(text), kotsu.pk_login_finish(text, text, text, bigint) from public;
revoke all on function kotsu._b64u(text), kotsu._b64u_enc(bytea), kotsu._pk_origins(), kotsu._pk_client(text, text, text),
  kotsu.pk_get(text), kotsu.pk_login_finish(text, text, text, bigint) from anon, authenticated;
grant execute on function kotsu.pk_list(text), kotsu.pk_reg_begin(text, text), kotsu.pk_reg_finish(text, text, text, text, text, integer, text),
  kotsu.pk_delete(text, uuid), kotsu.pk_login_begin() to anon, authenticated;
grant usage on schema kotsu to service_role;
grant execute on function kotsu.pk_get(text), kotsu.pk_login_finish(text, text, text, bigint) to service_role;
