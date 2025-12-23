-- Drop existing foreign keys if they exist (assuming standard naming convention)
-- If constraints have different names, this might fail, but this is standard for Supabase/Postgres
DO $$
BEGIN
    -- For NOTES table
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'notes_debt_id_fkey') THEN
        ALTER TABLE notes DROP CONSTRAINT notes_debt_id_fkey;
    END IF;

    -- For PROMISES table
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'promises_debt_id_fkey') THEN
        ALTER TABLE promises DROP CONSTRAINT promises_debt_id_fkey;
    END IF;

    -- For PAYMENTS table
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'payments_debt_id_fkey') THEN
        ALTER TABLE payments DROP CONSTRAINT payments_debt_id_fkey;
    END IF;
END $$;

-- Re-add constraints with ON DELETE CASCADE
ALTER TABLE notes 
    ADD CONSTRAINT notes_debt_id_fkey 
    FOREIGN KEY (debt_id) 
    REFERENCES debts(id) 
    ON DELETE CASCADE;

ALTER TABLE promises 
    ADD CONSTRAINT promises_debt_id_fkey 
    FOREIGN KEY (debt_id) 
    REFERENCES debts(id) 
    ON DELETE CASCADE;

ALTER TABLE payments 
    ADD CONSTRAINT payments_debt_id_fkey 
    FOREIGN KEY (debt_id) 
    REFERENCES debts(id) 
    ON DELETE CASCADE;
