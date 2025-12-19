-- FIX FOR INFINITE RECURSION IN RLS POLICIES
-- Run this in Supabase SQL Editor

-- Simply recreate the function with SECURITY DEFINER
-- No need to drop - CREATE OR REPLACE handles it
create or replace function get_my_company_id()
returns uuid
language sql stable
security definer
set search_path = public
as $$
  select company_id from profiles where id = auth.uid();
$$;

-- Verify the fix worked
select get_my_company_id();

-- If you see a UUID, refresh your demo page: http://demo.localhost:3000
