-- GRD independent nicknames; login identifiers remain private.
-- Administrator authorization was performed separately for the verified owner account.
create table public.grd_nicknames(
 user_id uuid primary key references auth.users(id) on delete cascade,
 nickname text not null check(nickname ~ '^[가-힣A-Za-z0-9_]{2,16}$'),
 updated_at timestamptz not null default now()
);
create unique index grd_nickname_unique_ci on public.grd_nicknames(lower(nickname));
alter table public.grd_nicknames enable row level security;
revoke all on public.grd_nicknames from public,anon,authenticated;
grant select,insert,update on public.grd_nicknames to authenticated;
create policy grd_nickname_read on public.grd_nicknames for select to authenticated using((select auth.uid())=user_id and (select auth.jwt()->'app_metadata'->>'grd_named_account')='true');
create policy grd_nickname_insert on public.grd_nicknames for insert to authenticated with check((select auth.uid())=user_id and (select auth.jwt()->'app_metadata'->>'grd_named_account')='true');
create policy grd_nickname_update on public.grd_nicknames for update to authenticated using((select auth.uid())=user_id and (select auth.jwt()->'app_metadata'->>'grd_named_account')='true') with check((select auth.uid())=user_id and (select auth.jwt()->'app_metadata'->>'grd_named_account')='true');
-- Only server-created GRD identities enroll; ITM and other users are untouched.
create function grd_internal.enroll_nickname() returns trigger language plpgsql security definer set search_path='' as $$
declare n text;
begin
 if new.raw_app_meta_data->>'grd_named_account' is distinct from 'true' then return new; end if;
 n:=new.raw_app_meta_data->>'grd_initial_nickname';
 if n is not null then insert into public.grd_nicknames(user_id,nickname) values(new.id,n); end if;
 return new;
end $$;
revoke all on function grd_internal.enroll_nickname() from public,anon,authenticated;
create trigger grd_enroll_nickname after insert on auth.users for each row execute function grd_internal.enroll_nickname();
-- Hide preexisting login-name-based scores until a nickname is explicitly selected.
drop policy grd_scores_public_read on public.grd_scores;
create function grd_internal.score_nickname_matches(p_user uuid,p_nickname text) returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.grd_nicknames n where n.user_id=p_user and n.nickname=p_nickname)
$$;
revoke all on function grd_internal.score_nickname_matches(uuid,text) from public;
grant execute on function grd_internal.score_nickname_matches(uuid,text) to anon,authenticated;
create policy grd_scores_public_read on public.grd_scores for select to anon using(grd_internal.score_nickname_matches(user_id,nickname));
alter table public.grd_scores drop constraint grd_scores_nickname_check;
alter table public.grd_scores add constraint grd_scores_nickname_check check(nickname ~ '^[가-힣A-Za-z0-9_]{2,16}$') not valid;
drop policy grd_scores_insert on public.grd_scores;
drop policy grd_scores_update on public.grd_scores;
create policy grd_scores_insert on public.grd_scores for insert to authenticated with check((select auth.uid())=user_id and (select auth.jwt()->'app_metadata'->>'grd_named_account')='true' and exists(select 1 from public.grd_nicknames n where n.user_id=grd_scores.user_id and n.nickname=grd_scores.nickname));
create policy grd_scores_update on public.grd_scores for update to authenticated using((select auth.uid())=user_id and (select auth.jwt()->'app_metadata'->>'grd_named_account')='true') with check((select auth.uid())=user_id and (select auth.jwt()->'app_metadata'->>'grd_named_account')='true' and exists(select 1 from public.grd_nicknames n where n.user_id=grd_scores.user_id and n.nickname=grd_scores.nickname));
create function grd_internal.sync_score_nickname() returns trigger language plpgsql security invoker set search_path='' as $$
begin update public.grd_scores set nickname=new.nickname where user_id=new.user_id; return new;end $$;
revoke all on function grd_internal.sync_score_nickname() from public,anon;
grant execute on function grd_internal.sync_score_nickname() to authenticated;
create trigger grd_sync_score_nickname after insert or update of nickname on public.grd_nicknames for each row execute function grd_internal.sync_score_nickname();
