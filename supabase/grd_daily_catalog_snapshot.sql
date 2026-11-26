-- Daily challenge freezes the published catalog at the first request each KST day.
create schema grd_internal;
revoke all on schema grd_internal from public,anon,authenticated;
grant usage on schema grd_internal to anon,authenticated;
create table grd_internal.daily_catalog(day date primary key, revision bigint not null,payload jsonb not null);
alter table grd_internal.daily_catalog enable row level security;
revoke all on grd_internal.daily_catalog from public,anon,authenticated;
create function grd_internal.daily_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$
declare d date:=(now() at time zone 'Asia/Seoul')::date; result jsonb;
begin
 insert into grd_internal.daily_catalog(day,revision,payload) select d,revision,payload from public.grd_catalog where id=1 on conflict(day) do nothing;
 select jsonb_build_object('day',day,'revision',revision,'payload',payload) into result from grd_internal.daily_catalog where day=d;
 return result;
end $$;
revoke all on function grd_internal.daily_snapshot() from public,anon,authenticated;
grant execute on function grd_internal.daily_snapshot() to anon,authenticated;
create function public.grd_daily_snapshot() returns jsonb language sql security invoker set search_path='' as $$select grd_internal.daily_snapshot()$$;
revoke all on function public.grd_daily_snapshot() from public,anon,authenticated;
grant execute on function public.grd_daily_snapshot() to anon,authenticated;
