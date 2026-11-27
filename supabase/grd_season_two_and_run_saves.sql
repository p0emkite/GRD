create table if not exists public.grd_run_saves (
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null check(jsonb_typeof(payload)='object' and octet_length(payload::text)<2000000),
 updated_at timestamptz not null default now()
);
alter table public.grd_run_saves enable row level security;
revoke all on public.grd_run_saves from anon, authenticated;
grant select,insert,update,delete on public.grd_run_saves to authenticated;
create policy grd_run_owner on public.grd_run_saves for all to authenticated using ((select auth.uid())=user_id and (select auth.jwt())->'app_metadata'->>'grd_named_account'='true') with check ((select auth.uid())=user_id and (select auth.jwt())->'app_metadata'->>'grd_named_account'='true');
create table if not exists public.grd_season_scores (
 user_id uuid not null references auth.users(id) on delete cascade,
 board text not null check(board ~ '^s[0-9]+-(easy|normal|hard|hell|endless|daily-[0-9]{4}-[0-9]{2}-[0-9]{2})$'),
 nickname text not null check(nickname ~ '^[가-힣A-Za-z0-9_]{2,16}$'),
 round integer not null check(round between 0 and 99999),
 kills integer not null check(kills between 0 and 10000000),
 clear boolean not null default false, updated_at timestamptz not null default now(),
 primary key(user_id,board)
);
alter table public.grd_season_scores enable row level security;
revoke all on public.grd_season_scores from anon,authenticated;
grant select(nickname,board,round,kills,clear) on public.grd_season_scores to anon,authenticated;
grant select(user_id),insert,update on public.grd_season_scores to authenticated;
create policy grd_season_public on public.grd_season_scores for select to anon,authenticated using (true);
create policy grd_season_insert on public.grd_season_scores for insert to authenticated with check ((select auth.uid())=user_id and (select auth.jwt())->'app_metadata'->>'grd_named_account'='true');
create policy grd_season_update on public.grd_season_scores for update to authenticated using ((select auth.uid())=user_id and (select auth.jwt())->'app_metadata'->>'grd_named_account'='true') with check ((select auth.uid())=user_id and (select auth.jwt())->'app_metadata'->>'grd_named_account'='true');
create index if not exists grd_season_scores_rank on public.grd_season_scores(board,clear desc,round desc,kills desc);
