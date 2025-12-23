-- Add ON DELETE CASCADE to foreign keys referencing customers table

-- debts
ALTER TABLE debts
DROP CONSTRAINT debts_customer_id_fkey,
ADD CONSTRAINT debts_customer_id_fkey
    FOREIGN KEY (customer_id)
    REFERENCES customers(id)
    ON DELETE CASCADE;

-- notes
ALTER TABLE notes
DROP CONSTRAINT notes_customer_id_fkey,
ADD CONSTRAINT notes_customer_id_fkey
    FOREIGN KEY (customer_id)
    REFERENCES customers(id)
    ON DELETE CASCADE;

-- promises
ALTER TABLE promises
DROP CONSTRAINT promises_customer_id_fkey,
ADD CONSTRAINT promises_customer_id_fkey
    FOREIGN KEY (customer_id)
    REFERENCES customers(id)
    ON DELETE CASCADE;

-- payments
ALTER TABLE payments
DROP CONSTRAINT payments_customer_id_fkey,
ADD CONSTRAINT payments_customer_id_fkey
    FOREIGN KEY (customer_id)
    REFERENCES customers(id)
    ON DELETE CASCADE;
