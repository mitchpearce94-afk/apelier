-- Fix RLS policies to ensure new users can create their own data
-- Run this in the Supabase SQL Editor

-- Allow users to create their own photographer profile
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'photographers_insert_own' AND tablename = 'photographers'
  ) THEN
    CREATE POLICY "photographers_insert_own" ON photographers
      FOR INSERT WITH CHECK (auth_user_id = auth.uid());
  END IF;
END $$;

-- Allow photographers to insert their own clients
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'clients_insert' AND tablename = 'clients'
  ) THEN
    CREATE POLICY "clients_insert" ON clients
      FOR INSERT WITH CHECK (
        photographer_id IN (SELECT id FROM photographers WHERE auth_user_id = auth.uid())
      );
  END IF;
END $$;

-- Allow photographers to insert their own leads
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'leads_insert' AND tablename = 'leads'
  ) THEN
    CREATE POLICY "leads_insert" ON leads
      FOR INSERT WITH CHECK (
        photographer_id IN (SELECT id FROM photographers WHERE auth_user_id = auth.uid())
      );
  END IF;
END $$;

-- Allow photographers to insert their own jobs
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'jobs_insert' AND tablename = 'jobs'
  ) THEN
    CREATE POLICY "jobs_insert" ON jobs
      FOR INSERT WITH CHECK (
        photographer_id IN (SELECT id FROM photographers WHERE auth_user_id = auth.uid())
      );
  END IF;
END $$;

-- Allow photographers to insert their own invoices
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'invoices_insert' AND tablename = 'invoices'
  ) THEN
    CREATE POLICY "invoices_insert" ON invoices
      FOR INSERT WITH CHECK (
        photographer_id IN (SELECT id FROM photographers WHERE auth_user_id = auth.uid())
      );
  END IF;
END $$;

-- Allow photographers to update their own data
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'clients_update' AND tablename = 'clients'
  ) THEN
    CREATE POLICY "clients_update" ON clients
      FOR UPDATE USING (
        photographer_id IN (SELECT id FROM photographers WHERE auth_user_id = auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'leads_update' AND tablename = 'leads'
  ) THEN
    CREATE POLICY "leads_update" ON leads
      FOR UPDATE USING (
        photographer_id IN (SELECT id FROM photographers WHERE auth_user_id = auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'jobs_update' AND tablename = 'jobs'
  ) THEN
    CREATE POLICY "jobs_update" ON jobs
      FOR UPDATE USING (
        photographer_id IN (SELECT id FROM photographers WHERE auth_user_id = auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'invoices_update' AND tablename = 'invoices'
  ) THEN
    CREATE POLICY "invoices_update" ON invoices
      FOR UPDATE USING (
        photographer_id IN (SELECT id FROM photographers WHERE auth_user_id = auth.uid())
      );
  END IF;
END $$;

-- Allow photographers to delete their own data
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'clients_delete' AND tablename = 'clients'
  ) THEN
    CREATE POLICY "clients_delete" ON clients
      FOR DELETE USING (
        photographer_id IN (SELECT id FROM photographers WHERE auth_user_id = auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'leads_delete' AND tablename = 'leads'
  ) THEN
    CREATE POLICY "leads_delete" ON leads
      FOR DELETE USING (
        photographer_id IN (SELECT id FROM photographers WHERE auth_user_id = auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'jobs_delete' AND tablename = 'jobs'
  ) THEN
    CREATE POLICY "jobs_delete" ON jobs
      FOR DELETE USING (
        photographer_id IN (SELECT id FROM photographers WHERE auth_user_id = auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'invoices_delete' AND tablename = 'invoices'
  ) THEN
    CREATE POLICY "invoices_delete" ON invoices
      FOR DELETE USING (
        photographer_id IN (SELECT id FROM photographers WHERE auth_user_id = auth.uid())
      );
  END IF;
END $$;

-- Allow photographers to update their own profile (for settings saves)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'photographers_update_own' AND tablename = 'photographers'
  ) THEN
    CREATE POLICY "photographers_update_own" ON photographers
      FOR UPDATE USING (auth_user_id = auth.uid());
  END IF;
END $$;
