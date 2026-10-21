-- ==============================================================================
-- ISTON BUILDER GROUP — ADVISERS & AUTH DATABASE SCHEMA
-- Run this in your Supabase Dashboard -> SQL Editor -> Click 'Run'
-- Safe and idempotent: will not erase existing data or conflict with existing tables.
-- ==============================================================================

-- 1. Ensure pgcrypto extension for UUIDs and hashes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. ADMIN ALLOWLIST TABLE
CREATE TABLE IF NOT EXISTS public.admin_allowlist (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  added_by TEXT NOT NULL DEFAULT 'system',
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed authorized administrators
INSERT INTO public.admin_allowlist (email, added_by, is_locked)
VALUES 
  ('abnixsh@gmail.com', 'system', TRUE),
  ('sitaramchaurasiya8@gmail.com', 'system', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Also seed into admin_emails if table exists
CREATE TABLE IF NOT EXISTS public.admin_emails (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO public.admin_emails (email)
VALUES 
  ('abnixsh@gmail.com'),
  ('sitaramchaurasiya8@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- 3. ADVISERS TABLE (Single Number & Token Authentication)
CREATE TABLE IF NOT EXISTS public.advisers (
  id BIGSERIAL PRIMARY KEY,
  adviser_id TEXT NOT NULL UNIQUE,
  registration_no TEXT UNIQUE,
  token_number TEXT,
  password TEXT,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  referral_code TEXT NOT NULL UNIQUE,
  sponsor_id TEXT,
  sponsor_code TEXT,
  sponsor_chain TEXT[] DEFAULT '{}',
  depth_level INT DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'active' | 'suspended' | 'rejected'
  registration_fee NUMERIC(12, 2) NOT NULL DEFAULT 1100.00,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payment_status TEXT NOT NULL DEFAULT 'pending_cash', -- 'pending_cash' | 'verified_cash' | 'pending_payment' | 'verified_paid'
  payment_reference TEXT,
  documents JSONB DEFAULT '{}'::jsonb,
  bank_details JSONB DEFAULT '{}'::jsonb,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alter table safely in case advisers table already existed with older columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='advisers' AND column_name='registration_no') THEN
    ALTER TABLE public.advisers ADD COLUMN registration_no TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='advisers' AND column_name='token_number') THEN
    ALTER TABLE public.advisers ADD COLUMN token_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='advisers' AND column_name='password') THEN
    ALTER TABLE public.advisers ADD COLUMN password TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='advisers' AND column_name='documents') THEN
    ALTER TABLE public.advisers ADD COLUMN documents JSONB DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='advisers' AND column_name='sponsor_code') THEN
    ALTER TABLE public.advisers ADD COLUMN sponsor_code TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='advisers' AND column_name='payment_method') THEN
    ALTER TABLE public.advisers ADD COLUMN payment_method TEXT DEFAULT 'cash';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_advisers_reg_no ON public.advisers(registration_no);
CREATE INDEX IF NOT EXISTS idx_advisers_phone ON public.advisers(phone);
CREATE INDEX IF NOT EXISTS idx_advisers_token ON public.advisers(token_number);
CREATE INDEX IF NOT EXISTS idx_advisers_sponsor ON public.advisers(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_advisers_status ON public.advisers(status);

-- 4. PROPERTY LEADS TABLE
CREATE TABLE IF NOT EXISTS public.property_leads (
  id BIGSERIAL PRIMARY KEY,
  adviser_id TEXT NOT NULL,
  lead_name TEXT NOT NULL,
  lead_phone TEXT NOT NULL,
  lead_email TEXT,
  property_type TEXT NOT NULL,
  property_title TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_leads_adv ON public.property_leads(adviser_id);

-- 5. PAYOUT REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id BIGSERIAL PRIMARY KEY,
  adviser_id TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'paid' | 'rejected'
  transaction_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payout_requests_adv ON public.payout_requests(adviser_id);

-- 6. REGISTRATION REWARDS & PROPERTY COMMISSIONS LEDGERS
CREATE TABLE IF NOT EXISTS public.registration_rewards_ledger (
  id BIGSERIAL PRIMARY KEY,
  registration_event_id TEXT,
  new_adviser_id TEXT NOT NULL,
  beneficiary_adviser_id TEXT NOT NULL,
  level INT NOT NULL DEFAULT 1,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 300.00,
  status TEXT NOT NULL DEFAULT 'paid', -- 'pending' | 'approved' | 'paid' | 'reversed'
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.property_commissions_ledger (
  id BIGSERIAL PRIMARY KEY,
  sale_id BIGINT,
  beneficiary_adviser_id TEXT NOT NULL,
  role_in_sale TEXT NOT NULL DEFAULT 'seller',
  level INT NOT NULL DEFAULT 0,
  rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
  amount NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved',
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  performed_by TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PERMISSIVE ROW LEVEL SECURITY (RLS) POLICIES
-- Ensure the anon and service keys can read and write adviser data smoothly
ALTER TABLE public.advisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_rewards_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_commissions_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access for application functionality
DROP POLICY IF EXISTS "Public access to advisers" ON public.advisers;
CREATE POLICY "Public access to advisers" ON public.advisers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to property_leads" ON public.property_leads;
CREATE POLICY "Public access to property_leads" ON public.property_leads FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to payout_requests" ON public.payout_requests;
CREATE POLICY "Public access to payout_requests" ON public.payout_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to registration_rewards" ON public.registration_rewards_ledger;
CREATE POLICY "Public access to registration_rewards" ON public.registration_rewards_ledger FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to property_commissions" ON public.property_commissions_ledger;
CREATE POLICY "Public access to property_commissions" ON public.property_commissions_ledger FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to admin_allowlist" ON public.admin_allowlist;
CREATE POLICY "Public access to admin_allowlist" ON public.admin_allowlist FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to admin_emails" ON public.admin_emails;
CREATE POLICY "Public access to admin_emails" ON public.admin_emails FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to audit_logs" ON public.audit_logs;
CREATE POLICY "Public access to audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
