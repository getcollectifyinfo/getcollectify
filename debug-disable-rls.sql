-- NUCLEAR OPTION: Temporarily disable RLS to verify data exists
-- Run this ONLY for debugging, then re-enable RLS after

-- 1. Disable RLS on profiles table temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Test if data loads now
-- Go to http://demo.localhost:3000 and check if customer list appears

-- 3. If data appears, the problem is definitely RLS policies
-- 4. Re-enable RLS (DO NOT FORGET THIS STEP!)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Then we'll fix the policies properly
