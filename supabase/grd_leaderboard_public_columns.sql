-- Public leaderboard reads use the anon role and public columns only.
drop policy grd_scores_read on public.grd_scores;
create policy grd_scores_public_read on public.grd_scores for select to anon using(true);
create policy grd_scores_owner_read on public.grd_scores for select to authenticated using((select auth.uid())=user_id and (select auth.jwt()->'app_metadata'->>'grd_named_account')='true');
