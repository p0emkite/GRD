-- Independent GRD identity, private profiles, optional unverified leaderboard.
create or replace function private.grd_is_admin() returns boolean language sql stable security definer set search_path='' as $$
select auth.uid() is not null and coalesce(auth.jwt()->'app_metadata'->>'grd_named_account','')='true' and exists(select 1 from private.grd_studio_admins a where a.user_id=auth.uid())
$$;
create table public.grd_signup_limits(client_hash text primary key, attempts int not null, window_started_at timestamptz not null);
alter table public.grd_signup_limits enable row level security;
revoke all on public.grd_signup_limits from public,anon,authenticated;
grant select,insert,update on public.grd_signup_limits to service_role;
create function public.grd_signup_attempt(p_client_hash text) returns boolean language plpgsql security invoker set search_path='' as $$
declare n int;
begin
 if p_client_hash is null or p_client_hash !~ '^[a-f0-9]{64}$' then return false; end if;
 insert into public.grd_signup_limits as t values(p_client_hash,1,now()) on conflict(client_hash) do update set attempts=case when t.window_started_at<now()-interval '1 hour' then 1 else t.attempts+1 end,window_started_at=case when t.window_started_at<now()-interval '1 hour' then now() else t.window_started_at end returning attempts into n;
 return n<=6;
end $$;
revoke all on function public.grd_signup_attempt(text) from public,anon,authenticated;
grant execute on function public.grd_signup_attempt(text) to service_role;
create table public.grd_profiles(user_id uuid primary key references auth.users(id) on delete cascade, progress jsonb not null default '{}'::jsonb check(jsonb_typeof(progress)='object' and octet_length(progress::text)<200000), updated_at timestamptz not null default now());
alter table public.grd_profiles enable row level security;
revoke all on public.grd_profiles from public,anon,authenticated;
grant select,insert,update on public.grd_profiles to authenticated;
create policy grd_profile_read on public.grd_profiles for select to authenticated using((select auth.uid())=user_id and (select auth.jwt()->'app_metadata'->>'grd_named_account')='true');
create policy grd_profile_insert on public.grd_profiles for insert to authenticated with check((select auth.uid())=user_id and (select auth.jwt()->'app_metadata'->>'grd_named_account')='true');
create policy grd_profile_update on public.grd_profiles for update to authenticated using((select auth.uid())=user_id and (select auth.jwt()->'app_metadata'->>'grd_named_account')='true') with check((select auth.uid())=user_id and (select auth.jwt()->'app_metadata'->>'grd_named_account')='true');
create table public.grd_scores(user_id uuid not null references auth.users(id) on delete cascade, board text not null check(board ~ '^(easy|normal|hard|hell|endless|daily-[0-9]{4}-[0-9]{2}-[0-9]{2})$'), nickname text not null check(nickname ~ '^[a-z][a-z0-9_]{3,19}$'), round int not null check(round between 0 and 99999), kills int not null check(kills between 0 and 10000000), clear boolean not null default false, updated_at timestamptz not null default now(),primary key(user_id,board));
alter table public.grd_scores enable row level security;
revoke all on public.grd_scores from public,anon,authenticated;
grant select(board,nickname,round,kills,clear,updated_at) on public.grd_scores to anon,authenticated;
grant select(user_id),insert,update on public.grd_scores to authenticated;
create policy grd_scores_read on public.grd_scores for select to anon,authenticated using(true);
create policy grd_scores_insert on public.grd_scores for insert to authenticated with check((select auth.uid())=user_id and (select auth.jwt()->'app_metadata'->>'grd_named_account')='true' and nickname=(select auth.jwt()->'app_metadata'->>'grd_username'));
create policy grd_scores_update on public.grd_scores for update to authenticated using((select auth.uid())=user_id and (select auth.jwt()->'app_metadata'->>'grd_named_account')='true') with check((select auth.uid())=user_id and (select auth.jwt()->'app_metadata'->>'grd_named_account')='true' and nickname=(select auth.jwt()->'app_metadata'->>'grd_username'));
-- Seed metadata only when missing; preserve user-published media and balance.
update public.grd_catalog set payload=jsonb_set(payload,'{groups}',(select jsonb_agg(g || jsonb_build_object('generation',coalesce(nullif(g->>'generation',''),m.gen,''),'agency',coalesce(nullif(g->>'agency',''),m.agency,''),'country',coalesce(nullif(g->>'country',''),'대한민국')) order by ord) from jsonb_array_elements(payload->'groups') with ordinality as x(g,ord) left join (values ('davichi','2세대',''),('2ne1','2세대','YG'),('bp','3세대','YG'),('ive','4세대','스타쉽'),('snsd','2세대','SM'),('izone','3.5세대','오프더레코드'),('twice','3세대','JYP'),('tts','2세대','SM'),('misamo','3세대','JYP')) as m(id,gen,agency) on m.id=g->>'id'),true),revision=revision+1,updated_at=now() where id=1;
