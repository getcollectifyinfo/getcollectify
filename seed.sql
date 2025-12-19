-- SEED DATA FOR DEMO TENANT
-- Run this in Supabase SQL Editor AFTER schema.sql

DO $$
DECLARE
  v_company_id uuid;
  v_user_id uuid;
  v_customer_id_1 uuid;
  v_customer_id_2 uuid;
BEGIN
  -- 1. Create Demo Company
  INSERT INTO companies (name, slug, base_currency)
  VALUES ('Demo Şirket A.Ş.', 'demo', 'TRY')
  RETURNING id INTO v_company_id;

  -- 2. Create Demo User (Simulation - in real world Auth User ID comes from Supabase Auth)
  -- IMPORTANT: You must create a user in Supabase Auth with email 'demo@collectify.com' first!
  -- This script assumes the user ID is fixed or fetched. 
  -- For this seed to work easily, we will just create a placeholder profile if we can't link to Auth.
  -- BUT RLS relies on Auth UID. 
  -- INSTRUCTION: Manually sign up 'demo@collectify.com' via the App Signup page first, then run this to populate data!
  -- OR: We just insert data for that company_id and any user viewing 'demo' tenant needs to be added to profiles.

  -- Let's populate Customers
  INSERT INTO customers (company_id, name, phone)
  VALUES 
    (v_company_id, 'Acme Lojistik', '05551112233'),
    (v_company_id, 'Yıldız Tekstil', '05554445566')
  RETURNING id INTO v_customer_id_1;
  
  -- Get second ID
  SELECT id INTO v_customer_id_2 FROM customers WHERE company_id = v_company_id AND name = 'Yıldız Tekstil';

  -- 3. Create Debts
  INSERT INTO debts (company_id, customer_id, debt_type, due_date, original_amount, currency, remaining_amount, status)
  VALUES
    (v_company_id, v_customer_id_1, 'Cari', CURRENT_DATE - 10, 15000, 'TRY', 15000, 'open'),
    (v_company_id, v_customer_id_1, 'Çek', CURRENT_DATE + 5, 50000, 'TRY', 50000, 'open'),
    (v_company_id, v_customer_id_2, 'Senet', CURRENT_DATE - 30, 2500, 'EUR', 2500, 'open');

  -- 4. Create Notes
  INSERT INTO notes (company_id, customer_id, text, contact_person)
  VALUES
    (v_company_id, v_customer_id_1, 'Ödeme sözü alındı haftaya.', 'Ahmet Bey'),
    (v_company_id, v_customer_id_2, 'Ulaşılamadı, tekrar aranacak.', 'Ayşe Hanım');

  -- 5. Create Promises
  INSERT INTO promises (company_id, customer_id, promised_date, amount, currency, status)
  VALUES
    (v_company_id, v_customer_id_1, CURRENT_DATE + 7, 15000, 'TRY', 'planned');

END $$;
