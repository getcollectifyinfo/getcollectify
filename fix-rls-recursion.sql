-- FIX FOR INFINITE RECURSION IN RLS POLICIES
-- Run this in Supabase SQL Editor

-- Step 1: Drop and recreate get_my_company_id with SECURITY DEFINER
drop function if exists get_my_company_id();

create or replace function get_my_company_id()
returns uuid
language sql stable
security definer
set search_path = public
as $$
  select company_id from profiles where id = auth.uid();
$$;

-- Step 2: Verify the function was created correctly
-- You should see: security_type = 'definer'
select 
  proname as function_name,
  prosecdef as is_security_definer
from pg_proc 
where proname = 'get_my_company_id';

-- Step 3: Test the function
select get_my_company_id();

-- If you see a UUID, the fix worked!
-- Now refresh your demo page at http://demo.localhost:3000
