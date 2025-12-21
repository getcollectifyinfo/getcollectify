-- Add debt types and currencies configuration to companies table
-- Run this in Supabase SQL Editor

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS debt_types jsonb DEFAULT '["Cari", "Çek", "Senet"]'::jsonb,
ADD COLUMN IF NOT EXISTS currencies jsonb DEFAULT '["TRY", "USD", "EUR"]'::jsonb;

-- Update existing companies to have default values
UPDATE companies 
SET debt_types = '["Cari", "Çek", "Senet"]'::jsonb
WHERE debt_types IS NULL;

UPDATE companies 
SET currencies = '["TRY", "USD", "EUR"]'::jsonb
WHERE currencies IS NULL;
