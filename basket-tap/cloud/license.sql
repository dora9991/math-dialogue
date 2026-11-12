-- バスケ タップ記録 — 場面パックの購入コード（サーバー側）
--
-- これは何か
--   クラブが「場面パック」（年 3万円）を買ったときに渡す購入コードを、サーバーに覚えておく表と関数です。
--   アプリ（js/license.js）は、コードを入れられたときと、24 時間に 1 回だけ、btap_code_check で確かめます。
--   ・コードそのものは保存しません（正規化したコードの sha256 だけ）。だから、なくしたコードは見られません。新しく作り直します
--   ・表（btap_codes）は、アプリからは直接さわれません（RLS 有効・決まりなし・anon / authenticated の権限なし）
--   ・アプリが呼べるのは btap_code_check だけ。コードを作る・延ばす・止める関数は、この SQL Editor からだけ動きます
--   ・何回流しても大丈夫です（あるものは作り直さず、関数は置きかえ）
--   ・関数は search_path を空にして、表・関数をみな public. を付けて呼びます（別の場所に同じ名前のものを置かれても、まちがって使わないように）
--
-- 使い方（Supabase の math-labo-second の SQL Editor で）
--   1. このファイル全部を貼って Run（はじめの 1 回。あとで直したときも、もう 1 回）
--   2. コードを作る（クラブ名と、何か月か。コードは、この結果に 1 回だけ出ます。控えて、クラブに渡す）
--        select public.btap_code_new('致遠館高校バスケ部', 12, '2026-11 申し込み・担当 ○○');
--        → 'K7M2-9QXA-4HTE' のような文字
--   3. 期限を延ばす（更新のとき。今の期限か、切れていれば今から数えて 12 か月）
--        select public.btap_code_extend('K7M2-9QXA-4HTE', 12);
--   4. 止める（返金・流出のとき。次に端末がつながったときに使えなくなる）
--        select public.btap_code_revoke('K7M2-9QXA-4HTE');
--   5. 見る（コードは出ません。クラブ名・期限・確かめられた回数）
--        select club, expires_at, revoked_at, checks, last_check_at, note from public.btap_codes order by created_at desc;
--
-- 注意：端末は、いちど確かめたコードを期限まで控えで通します（体育館で電波がなくても使えるように）。
--       止めても、その端末が次につながるまでは使えます（最長でほぼ 1 日）。

create table if not exists public.btap_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text unique not null,                    -- 正規化したコード（大文字・「-」なし 12 文字）の sha256（16 進）
  club text not null,
  plan text not null default 'scene',
  starts_at timestamptz default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  note text,
  created_at timestamptz default now(),
  last_check_at timestamptz,
  checks integer not null default 0
);

alter table public.btap_codes enable row level security;     -- 決まり（policy）は作らない＝アプリからは何も見えない
revoke all on table public.btap_codes from anon, authenticated;

-- コードをそろえる：大文字・空白と「-」を除く
create or replace function public.btap_code_norm(p_code text)
returns text
language sql
immutable
set search_path = ''
as $$
  select upper(regexp_replace(coalesce(p_code, ''), '[\s\-]', '', 'g'));
$$;

create or replace function public.btap_code_hash(p_norm text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(sha256(convert_to(p_norm, 'UTF8')), 'hex');
$$;

-- アプリから呼ぶ：コードを確かめる
create or replace function public.btap_code_check(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  n text := public.btap_code_norm(p_code);
  r public.btap_codes%rowtype;
begin
  if n !~ '^[2-9A-HJKMNP-Z]{12}$' then
    return jsonb_build_object('ok', false, 'error', 'format');
  end if;
  select * into r from public.btap_codes where code_hash = public.btap_code_hash(n);
  if not found then
    return jsonb_build_object('ok', false, 'error', 'none');
  end if;
  update public.btap_codes set last_check_at = now(), checks = checks + 1 where id = r.id;
  if r.revoked_at is not null then
    return jsonb_build_object('ok', false, 'error', 'revoked');
  end if;
  if r.expires_at <= now() or r.starts_at > now() then
    return jsonb_build_object('ok', false, 'error', 'expired');
  end if;
  return jsonb_build_object('ok', true, 'club', r.club, 'plan', r.plan, 'expires_at', r.expires_at);
end;
$$;

-- 管理用：新しいコードを作る（12 文字を、XXXX-XXXX-XXXX で 1 回だけ返す）
create or replace function public.btap_code_new(p_club text, p_months integer default 12, p_note text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  abc constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';      -- まぎらわしい文字（0 O 1 I L）は使わない
  -- 乱数は gen_random_uuid()（暗号用の乱数）から取る。random() は当てられることがあるので使わない。
  -- uuid の 16 バイトのうち、版と種類の決まったビットが入る 6・8 番目は使わず、残りから 12 バイト
  pos constant integer[] := array[0, 1, 2, 3, 4, 5, 7, 9, 10, 11, 12, 13];
  b bytea;
  n text;
  tries integer := 0;
begin
  if coalesce(btrim(p_club), '') = '' then raise exception 'club is required'; end if;
  if p_months is null or p_months < 1 or p_months > 120 then raise exception 'months must be 1..120'; end if;
  loop
    n := '';
    b := uuid_send(gen_random_uuid());
    for i in 1..12 loop
      n := n || substr(abc, 1 + (get_byte(b, pos[i]) % length(abc)), 1);
    end loop;
    exit when not exists (select 1 from public.btap_codes where code_hash = public.btap_code_hash(n));
    tries := tries + 1;
    if tries > 20 then raise exception 'could not make a unique code'; end if;
  end loop;
  insert into public.btap_codes (code_hash, club, expires_at, note)
  values (public.btap_code_hash(n), btrim(p_club), now() + make_interval(months => p_months), p_note);
  return substr(n, 1, 4) || '-' || substr(n, 5, 4) || '-' || substr(n, 9, 4);
end;
$$;

-- 管理用：期限を延ばす（まだ切れていなければ今の期限から、切れていれば今から）。止めたコードは戻さない
create or replace function public.btap_code_extend(p_code text, p_months integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.btap_codes%rowtype;
begin
  if p_months is null or p_months < 1 or p_months > 120 then raise exception 'months must be 1..120'; end if;
  select * into r from public.btap_codes where code_hash = public.btap_code_hash(public.btap_code_norm(p_code)) for update;
  if not found then raise exception 'no such code'; end if;
  if r.revoked_at is not null then raise exception 'code is revoked'; end if;
  update public.btap_codes set expires_at = greatest(r.expires_at, now()) + make_interval(months => p_months) where id = r.id
    returning * into r;
  return jsonb_build_object('club', r.club, 'expires_at', r.expires_at);
end;
$$;

-- 管理用：止める
create or replace function public.btap_code_revoke(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.btap_codes%rowtype;
begin
  update public.btap_codes set revoked_at = coalesce(revoked_at, now())
    where code_hash = public.btap_code_hash(public.btap_code_norm(p_code))
    returning * into r;
  if not found then raise exception 'no such code'; end if;
  return jsonb_build_object('club', r.club, 'revoked_at', r.revoked_at);
end;
$$;

-- 権限：アプリ（anon）から呼べるのは btap_code_check だけ。あとは SQL Editor（postgres）からだけ
revoke all on function public.btap_code_norm(text) from public, anon, authenticated;
revoke all on function public.btap_code_hash(text) from public, anon, authenticated;
revoke all on function public.btap_code_check(text) from public;
revoke all on function public.btap_code_new(text, integer, text) from public, anon, authenticated;
revoke all on function public.btap_code_extend(text, integer) from public, anon, authenticated;
revoke all on function public.btap_code_revoke(text) from public, anon, authenticated;
grant execute on function public.btap_code_check(text) to anon, authenticated;

-- アプリの窓口（PostgREST）に、新しい関数を知らせる
notify pgrst, 'reload schema';
