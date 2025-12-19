-- SEED DATA FOR DEMO TENANT
-- Run this in Supabase SQL Editor AFTER schema.sql

DO $$
DECLARE
  v_company_id uuid;
  v_user_id uuid;
  v_customer_id_1 uuid;
  v_customer_id_2 uuid;
BEGIN
  -- 1. Create Demo Company (if not exists)
  INSERT INTO companies (name, slug, base_currency)
  VALUES ('Collectify Demo A.Ş.', 'demo', 'TRY')
  ON CONFLICT (slug) DO UPDATE SET name = 'Collectify Demo A.Ş.'
  RETURNING id INTO v_company_id;

  -- 2. Create Profiles for Demo Users (Assuming Auth Users created manually or via script)
  -- We link these emails to the company with specific roles
  -- Note: In Supabase, the 'id' in profiles table matches auth.users.id
  -- Since we cannot know auth.users.id in advance without querying, this part is tricky in pure SQL seed.
  -- Ideally, YOU should sign up these 4 users in the app first.
  
  -- However, for the 'demo-login' server action to work, the users MUST exist in `auth.users`.
  -- The server action uses `signInWithPassword`.

  -- 3. Populate Data (Customers, Debts, etc.)
  -- Clean existing demo data first to avoid duplicates if run multiple times
  DELETE FROM debts WHERE company_id = v_company_id;
  DELETE FROM customers WHERE company_id = v_company_id;

  INSERT INTO customers (company_id, name, phone)
  VALUES 
    (v_company_id, 'Acme Lojistik', '05551112233'),
    (v_company_id, 'Yıldız Tekstil', '05554445566'),
    (v_company_id, 'Mega İnşaat', '05321112233'),
    (v_company_id, 'Beta Gıda', '02124445566')
  RETURNING id INTO v_customer_id_1;
  
  -- Re-fetch IDs for relationships
  SELECT id INTO v_customer_id_2 FROM customers WHERE company_id = v_company_id AND name = 'Yıldız Tekstil';

  -- 4. Create Debts
  INSERT INTO debts (company_id, customer_id, debt_type, due_date, original_amount, currency, remaining_amount, status)
  VALUES
    (v_company_id, v_customer_id_1, 'Cari', CURRENT_DATE - 10, 150000, 'TRY', 150000, 'open'),
    (v_company_id, v_customer_id_1, 'Çek', CURRENT_DATE + 5, 50000, 'TRY', 50000, 'open'),
    (v_company_id, v_customer_id_2, 'Senet', CURRENT_DATE - 30, 2500, 'EUR', 2500, 'open'),
    (v_company_id, v_customer_id_2, 'Cari', CURRENT_DATE + 15, 12000, 'USD', 12000, 'open');

  -- 5. Create Notes
  INSERT INTO notes (company_id, customer_id, text, contact_person)
  VALUES
    (v_company_id, v_customer_id_1, 'Ödeme sözü alındı haftaya.', 'Ahmet Bey'),
    (v_company_id, v_customer_id_2, 'Ulaşılamadı, tekrar aranacak.', 'Ayşe Hanım'),
     (v_company_id, v_customer_id_1, 'Fatura örneği gönderildi.', 'Muhasebe');

  -- 6. Create Promises
  INSERT INTO promises (company_id, customer_id, promised_date, amount, currency, status)
  VALUES
    (v_company_id, v_customer_id_1, CURRENT_DATE + 7, 150000, 'TRY', 'planned'),
    (v_company_id, v_customer_id_2, CURRENT_DATE - 2, 1000, 'EUR', 'broken');

END $$;
