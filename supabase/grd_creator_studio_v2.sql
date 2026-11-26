-- GRD only; existing ITM objects are read, never modified.
create table private.grd_studio_admins(user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());
alter table private.grd_studio_admins enable row level security;
revoke all on private.grd_studio_admins from public,anon,authenticated;
insert into private.grd_studio_admins(user_id) select user_id from private.itm_studio_admins on conflict do nothing;
create function private.grd_is_admin() returns boolean language sql stable security definer set search_path='' as $$
select auth.uid() is not null and exists(select 1 from private.grd_studio_admins a where a.user_id=auth.uid()) and coalesce(auth.jwt()->'app_metadata'->>'itm_named_account','')='true'
$$;
revoke all on function private.grd_is_admin() from public,anon;
grant execute on function private.grd_is_admin() to authenticated;
create function public.grd_studio_is_admin() returns boolean language sql stable security invoker set search_path='' as $$select private.grd_is_admin()$$;
revoke all on function public.grd_studio_is_admin() from public,anon;
grant execute on function public.grd_studio_is_admin() to authenticated;
create table public.grd_catalog(
 id integer primary key check(id=1), revision bigint not null default 1 check(revision>0),
 payload jsonb not null check(jsonb_typeof(payload)='object' and payload ? 'groups' and jsonb_typeof(payload->'groups')='array' and jsonb_array_length(payload->'groups') between 1 and 500 and octet_length(payload::text)<=4000000),
 updated_at timestamptz not null default now()
);
alter table public.grd_catalog enable row level security;
revoke all on public.grd_catalog from public,anon,authenticated;
grant select on public.grd_catalog to anon,authenticated;
grant update(payload,revision,updated_at) on public.grd_catalog to authenticated;
create policy grd_catalog_public_read on public.grd_catalog for select to anon,authenticated using(true);
create policy grd_catalog_admin_update on public.grd_catalog for update to authenticated using((select private.grd_is_admin())) with check((select private.grd_is_admin()));
insert into public.grd_catalog(id,payload) values(1,'{"version":1,"groups":[{"id":"davichi","name":"다비치","members":["이해리","강민경"],"role":"지원","color":"#82cfae"},{"id":"2ne1","name":"2NE1","members":["박봄","산다라박","CL","공민지"],"role":"광역","color":"#f29a77"},{"id":"bp","name":"BLACKPINK","members":["지수","제니","로제","리사"],"role":"저격","color":"#ee91bb"},{"id":"ive","name":"IVE","members":["안유진","가을","레이","장원영","리즈","이서"],"role":"치명타","color":"#bca6ff"},{"id":"snsd","name":"소녀시대 (9인)","members":["태연","제시카","써니","티파니","효연","유리","수영","윤아","서현"],"role":"감속","color":"#f4a7d2"},{"id":"izone","name":"IZ*ONE","members":["권은비","사쿠라","강혜원","최예나","이채연","김채원","김민주","나코","히토미","조유리","안유진","장원영"],"role":"광역","color":"#eea4a4"},{"id":"twice","name":"TWICE","members":["나연","정연","모모","사나","지효","미나","다현","채영","쯔위"],"role":"지원","color":"#f1b980"},{"id":"tts","name":"태티서","members":["태연","티파니","서현"],"role":"저격","color":"#c9a0ee","sub":true},{"id":"misamo","name":"MISAMO","members":["미나","사나","모모"],"role":"감속","color":"#9ac8f3","sub":true}],"memberPhotos":{}}'::jsonb);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('grd-media','grd-media',true,26214400,array['image/png','image/jpeg','image/webp','image/gif','image/avif','audio/mpeg','audio/mp3','audio/mp4','audio/wav','audio/wave','audio/x-wav','audio/ogg','audio/webm','audio/aac','audio/flac']);
create policy grd_media_admin_insert on storage.objects for insert to authenticated with check(bucket_id='grd-media' and (select private.grd_is_admin()));
create policy grd_media_admin_select on storage.objects for select to authenticated using(bucket_id='grd-media' and (select private.grd_is_admin()));
