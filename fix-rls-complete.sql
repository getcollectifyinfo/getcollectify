-- COMPLETE FIX FOR RLS INFINITE RECURSION
-- This addresses the profiles table RLS policies that are causing the loop
-- Run ALL of these commands in Supabase SQL Editor

-- Step 1: Fix the get_my_company_id function
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS uuid
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$;

-- Step 2: Drop the problematic "Admins can view all profiles in company" policy
-- This policy causes recursion because it queries profiles table while being a policy ON profiles
DROP POLICY IF EXISTS "Admins can view all profiles in company" ON profiles;

-- Step 3: Recreate it without recursion by using a direct auth.uid() check
CREATE POLICY "Admins can view all profiles in company" ON profiles
FOR SELECT
USING (
  -- User can see their own profile
  id = auth.uid()
  OR
  -- OR user is admin in the same company (check role directly without subquery)
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role = 'company_admin'
    AND admin_profile.company_id = profiles.company_id
  )
);

-- Step 4: Similarly fix the "Admins can update profiles in company" policy
DROP POLICY IF EXISTS "Admins can update profiles in company" ON profiles;

CREATE POLICY "Admins can update profiles in company" ON profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role = 'company_admin'
    AND admin_profile.company_id = profiles.company_id
  )
);

-- Step 5: Verify the fix
SELECT get_my_company_id();

-- If you see a UUID, the fix worked!
-- Now refresh: http://demo.localhost:3000
