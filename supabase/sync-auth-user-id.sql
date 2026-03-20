-- Sync existing public.users rows with Supabase Auth users by email
-- Run this in Supabase SQL Editor

update public.users u
set auth_user_id = au.id
from auth.users au
where lower(u.email) = lower(au.email)
  and (u.auth_user_id is null or u.auth_user_id <> au.id);

-- Check result
select
  u.id as profile_id,
  u.username,
  u.email,
  u.role,
  u.auth_user_id,
  au.id as auth_id,
  au.email as auth_email
from public.users u
left join auth.users au on au.id = u.auth_user_id
order by u.created_at asc;
