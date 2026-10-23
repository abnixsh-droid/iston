-- ==============================================================================
-- ISTON BUILDER GROUP — COMPLETE MASTER DATABASE SCHEMA
-- Run this in your Supabase Project:
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste & Click 'Run'
-- Works on any Supabase project (Free or Pro tier) safely and idempotently.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. SETTINGS TABLE (Controls Hero Section, Domain, Contacts, Hindi Overrides across all devices)
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default settings
INSERT INTO public.settings (key, value)
VALUES
  ('company_name', 'Iston Builder Group'),
  ('tagline', 'Building Better Spaces. Creating Better Futures.'),
  ('phone', '+91 84848 43391'),
  ('whatsapp', '918484843391'),
  ('hero_project_slug', 'umroli'),
  ('hero_eyebrow', 'Current Project · Umroli'),
  ('hero_title_1', 'Building Better Spaces.'),
  ('hero_title_2', 'Creating Better Futures.'),
  ('hero_subtitle', 'Curated residential & commercial spaces crafted with architectural excellence.'),
  ('hero_image_url', '/images/umroli-hero.jpg'),
  ('hero_cta_text', 'Explore Umroli'),
  ('hero_cta_link', '/projects/umroli')
ON CONFLICT (key) DO NOTHING;

-- 2. ADMIN ALLOWLIST & EMAILS
CREATE TABLE IF NOT EXISTS public.admin_allowlist (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  added_by TEXT NOT NULL DEFAULT 'system',
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.admin_allowlist (email, added_by, is_locked)
VALUES 
  ('abnixsh@gmail.com', 'system', TRUE),
  ('sitaramchaurasiya8@gmail.com', 'system', TRUE)
ON CONFLICT (email) DO NOTHING;

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

-- 3. ADVISERS TABLE (Authentication via Registration No / Mobile & MLM Referral Hierarchy)
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
  status TEXT NOT NULL DEFAULT 'pending',
  registration_fee NUMERIC(12, 2) NOT NULL DEFAULT 1100.00,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payment_status TEXT NOT NULL DEFAULT 'pending_cash',
  payment_reference TEXT,
  documents JSONB DEFAULT '{}'::jsonb,
  bank_details JSONB DEFAULT '{}'::jsonb,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advisers_reg_no ON public.advisers(registration_no);
CREATE INDEX IF NOT EXISTS idx_advisers_phone ON public.advisers(phone);
CREATE INDEX IF NOT EXISTS idx_advisers_token ON public.advisers(token_number);
CREATE INDEX IF NOT EXISTS idx_advisers_sponsor ON public.advisers(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_advisers_status ON public.advisers(status);

-- 4. ENQUIRIES TABLE (Customer Leads & Tour Requests)
CREATE TABLE IF NOT EXISTS public.enquiries (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  message TEXT,
  interest TEXT,
  item_type TEXT,
  item_id BIGINT,
  item_title TEXT,
  source_page TEXT,
  referral_code TEXT,
  partner_id TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enquiries_status ON public.enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_created ON public.enquiries(created_at DESC);

-- 5. PROPERTY LEADS & REGISTRATION REWARDS LEDGER
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

CREATE TABLE IF NOT EXISTS public.registration_rewards_ledger (
  id BIGSERIAL PRIMARY KEY,
  registration_event_id TEXT,
  new_adviser_id TEXT NOT NULL,
  beneficiary_adviser_id TEXT NOT NULL,
  level INT NOT NULL DEFAULT 1,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 300.00,
  status TEXT NOT NULL DEFAULT 'paid',
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payout_requests (
  id BIGSERIAL PRIMARY KEY,
  adviser_id TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  status TEXT NOT NULL DEFAULT 'pending',
  transaction_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PERMISSIVE ROW LEVEL SECURITY (RLS) POLICIES
-- Enables anonymous public access for reading & creating leads, settings, and advisers
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_rewards_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access to settings" ON public.settings;
CREATE POLICY "Public access to settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to advisers" ON public.advisers;
CREATE POLICY "Public access to advisers" ON public.advisers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to enquiries" ON public.enquiries;
CREATE POLICY "Public access to enquiries" ON public.enquiries FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to admin_allowlist" ON public.admin_allowlist;
CREATE POLICY "Public access to admin_allowlist" ON public.admin_allowlist FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to admin_emails" ON public.admin_emails;
CREATE POLICY "Public access to admin_emails" ON public.admin_emails FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to property_leads" ON public.property_leads;
CREATE POLICY "Public access to property_leads" ON public.property_leads FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to registration_rewards" ON public.registration_rewards_ledger;
CREATE POLICY "Public access to registration_rewards" ON public.registration_rewards_ledger FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to payout_requests" ON public.payout_requests;
CREATE POLICY "Public access to payout_requests" ON public.payout_requests FOR ALL USING (true) WITH CHECK (true);
