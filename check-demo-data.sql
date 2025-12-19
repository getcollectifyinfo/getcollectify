-- DIAGNOSTIC QUERIES FOR DEMO DATA
-- Run these in Supabase SQL Editor to check if data exists

-- 1. Check if demo company exists
SELECT id, name, slug FROM companies WHERE slug = 'demo';

-- 2. Check if demo users have profiles
SELECT id, email, role, company_id 
FROM profiles 
WHERE email LIKE 'demo-%@collectify.com';

-- 3. Check if customers exist for demo company
SELECT c.id, c.name, c.company_id, co.slug as company_slug
FROM customers c
JOIN companies co ON c.company_id = co.id
WHERE co.slug = 'demo';

-- 4. Check if debts exist for demo company
SELECT d.id, d.debt_type, d.remaining_amount, d.currency, d.status, d.company_id
FROM debts d
JOIN companies co ON d.company_id = co.id
WHERE co.slug = 'demo';

-- 5. Test RLS as a demo user (replace USER_ID with actual demo user id from query 2)
-- SET LOCAL role = 'authenticated';
-- SET LOCAL request.jwt.claims = '{"sub": "USER_ID_HERE"}';
-- SELECT * FROM debts WHERE status = 'open';
