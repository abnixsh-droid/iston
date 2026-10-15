-- Iston Builder Group: Advisers Program and Authentication Database Migration
-- Safe, idempotent migration script for Supabase PostgreSQL

-- 1. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id TEXT PRIMARY KEY, -- auth provider user ID or UUID
  auth_provider TEXT NOT NULL DEFAULT 'firebase',
  provider_user_id TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN DEFAULT TRUE,
  display_name TEXT,
  photo_url TEXT,
  role TEXT NOT NULL DEFAULT 'user', -- 'admin' | 'user'
  account_status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'suspended'
  is_adviser BOOLEAN DEFAULT FALSE,
  adviser_id TEXT,
  last_login_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_provider ON public.user_profiles(auth_provider, provider_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_adviser_id ON public.user_profiles(adviser_id);

-- 2. ADMIN ALLOWLIST TABLE
CREATE TABLE IF NOT EXISTS public.admin_allowlist (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  added_by TEXT NOT NULL DEFAULT 'system',
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed pre-authorized administrators
INSERT INTO public.admin_allowlist (email, added_by, is_locked)
VALUES 
  ('abnixsh@gmail.com', 'system', TRUE),
  ('sitaramchaurasiya8@gmail.com', 'system', TRUE)
ON CONFLICT (email) DO NOTHING;

-- 3. ADVISERS TABLE
CREATE TABLE IF NOT EXISTS public.advisers (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  adviser_id TEXT NOT NULL UNIQUE, -- e.g. 'IST-ADV-1001'
  referral_code TEXT NOT NULL UNIQUE, -- e.g. 'ADV1001'
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  sponsor_id TEXT REFERENCES public.advisers(adviser_id) ON DELETE SET NULL,
  sponsor_chain TEXT[] DEFAULT '{}', -- Ancestor hierarchy: [direct_sponsor, 2nd_upline, ...]
  depth_level INT DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'active' | 'suspended' | 'rejected'
  registration_fee NUMERIC(12, 2) NOT NULL DEFAULT 1100.00,
  payment_status TEXT NOT NULL DEFAULT 'demo_paid', -- 'pending' | 'demo_paid' | 'verified_paid' | 'refunded'
  payment_reference TEXT,
  activated_at TIMESTAMPTZ,
  bank_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advisers_sponsor_id ON public.advisers(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_advisers_referral_code ON public.advisers(referral_code);
CREATE INDEX IF NOT EXISTS idx_advisers_status ON public.advisers(status);
CREATE INDEX IF NOT EXISTS idx_advisers_user_id ON public.advisers(user_id);

-- 4. ADVISER POLICIES TABLE
CREATE TABLE IF NOT EXISTS public.adviser_policies (
  id BIGSERIAL PRIMARY KEY,
  policy_type TEXT NOT NULL, -- 'registration_reward' | 'property_commission'
  version INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  title TEXT NOT NULL,
  config JSONB NOT NULL,
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial default policies
INSERT INTO public.adviser_policies (policy_type, version, is_active, title, config)
VALUES 
(
  'registration_reward',
  1,
  TRUE,
  'Standard Registration Referral Reward Policy (₹1,100)',
  '{
    "registration_fee": 1100,
    "tiers": {
      "1": 300,
      "2": 200,
      "3": 100
    },
    "default_higher_level_reward": 100,
    "max_eligible_levels": 10,
    "max_total_reward_cap": 1100,
    "require_approval": true,
    "is_enabled": true
  }'::jsonb
),
(
  'property_commission',
  1,
  TRUE,
  'Standard Property-Sale Commission Policy',
  '{
    "commission_base": "company_brokerage",
    "default_brokerage_percent": 2.0,
    "seller_rate_percent": 10.0,
    "upline_rates_percent": {
      "1": 5.0,
      "2": 4.0,
      "3": 3.0,
      "4": 2.0,
      "5": 1.0
    },
    "default_higher_upline_rate_percent": 1.0,
    "max_eligible_levels": 10,
    "max_total_commission_cap_percent": 30.0,
    "require_approval": true,
    "is_enabled": true
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- 5. REGISTRATION REWARDS LEDGER (Separate from property commissions)
CREATE TABLE IF NOT EXISTS public.registration_rewards_ledger (
  id BIGSERIAL PRIMARY KEY,
  registration_event_id TEXT NOT NULL,
  new_adviser_id TEXT NOT NULL REFERENCES public.advisers(adviser_id) ON DELETE CASCADE,
  beneficiary_adviser_id TEXT NOT NULL REFERENCES public.advisers(adviser_id) ON DELETE CASCADE,
  level INT NOT NULL, -- 1 = direct, 2 = 2nd upline, etc.
  amount NUMERIC(12, 2) NOT NULL,
  policy_version INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'paid' | 'reversed'
  idempotency_key TEXT NOT NULL UNIQUE,
  notes TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  reversed_at TIMESTAMPTZ,
  reversal_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reg_rewards_beneficiary ON public.registration_rewards_ledger(beneficiary_adviser_id);
CREATE INDEX IF NOT EXISTS idx_reg_rewards_new_adviser ON public.registration_rewards_ledger(new_adviser_id);
CREATE INDEX IF NOT EXISTS idx_reg_rewards_status ON public.registration_rewards_ledger(status);

-- 6. PROPERTY LEADS (Advisers submitting customer leads for existing listings)
CREATE TABLE IF NOT EXISTS public.property_leads (
  id BIGSERIAL PRIMARY KEY,
  adviser_id TEXT NOT NULL REFERENCES public.advisers(adviser_id) ON DELETE CASCADE,
  lead_name TEXT NOT NULL,
  lead_phone TEXT NOT NULL,
  lead_email TEXT,
  property_type TEXT NOT NULL, -- 'properties' | 'plots' | 'society_houses' | 'projects'
  property_id INT,
  property_title TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new', -- 'new' | 'contacted' | 'site_visit' | 'negotiation' | 'sale_closed' | 'dropped'
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_leads_adviser ON public.property_leads(adviser_id);
CREATE INDEX IF NOT EXISTS idx_property_leads_status ON public.property_leads(status);

-- 7. PROPERTY SALES (Verified completed sales)
CREATE TABLE IF NOT EXISTS public.property_sales (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT REFERENCES public.property_leads(id) ON DELETE SET NULL,
  seller_adviser_id TEXT NOT NULL REFERENCES public.advisers(adviser_id) ON DELETE CASCADE,
  property_type TEXT NOT NULL,
  property_id INT,
  property_title TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  sale_price NUMERIC(14, 2) NOT NULL,
  company_brokerage_received NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending_verification', -- 'pending_verification' | 'verified' | 'rejected' | 'reversed'
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  policy_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_sales_seller ON public.property_sales(seller_adviser_id);
CREATE INDEX IF NOT EXISTS idx_property_sales_status ON public.property_sales(status);

-- 8. PROPERTY COMMISSIONS LEDGER (Separate from registration rewards)
CREATE TABLE IF NOT EXISTS public.property_commissions_ledger (
  id BIGSERIAL PRIMARY KEY,
  sale_id BIGINT NOT NULL REFERENCES public.property_sales(id) ON DELETE CASCADE,
  beneficiary_adviser_id TEXT NOT NULL REFERENCES public.advisers(adviser_id) ON DELETE CASCADE,
  role_in_sale TEXT NOT NULL, -- 'seller' | 'upline_1' | 'upline_2' ...
  level INT NOT NULL, -- 0 = seller, 1 = direct upline, 2 = 2nd upline ...
  rate_percent NUMERIC(5, 2) NOT NULL,
  commission_base_amount NUMERIC(14, 2) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  policy_version INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'paid' | 'reversed'
  idempotency_key TEXT NOT NULL UNIQUE,
  notes TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  reversed_at TIMESTAMPTZ,
  reversal_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prop_comm_beneficiary ON public.property_commissions_ledger(beneficiary_adviser_id);
CREATE INDEX IF NOT EXISTS idx_prop_comm_sale_id ON public.property_commissions_ledger(sale_id);
CREATE INDEX IF NOT EXISTS idx_prop_comm_status ON public.property_commissions_ledger(status);

-- 9. PAYOUT REQUESTS
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id BIGSERIAL PRIMARY KEY,
  adviser_id TEXT NOT NULL REFERENCES public.advisers(adviser_id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'combined', -- 'registration_reward' | 'property_commission' | 'combined'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'processing' | 'completed' | 'rejected'
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  payout_details JSONB DEFAULT '{}'::jsonb,
  transaction_reference TEXT,
  admin_notes TEXT,
  processed_by TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payout_requests_adviser ON public.payout_requests(adviser_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON public.payout_requests(status);

-- 10. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  performed_by TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_rewards_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_commissions_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adviser_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Anonymous / Authenticated public reads for active policies
CREATE POLICY "Public can read active policies" ON public.adviser_policies
  FOR SELECT USING (is_active = true);

-- User profiles: Users can read own profile; Service role has full access
CREATE POLICY "Users can read own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid()::text = id OR auth.uid()::text = provider_user_id);

-- Advisers: Advisers can view own profile or public referral info
CREATE POLICY "Advisers can read own record" ON public.advisers
  FOR SELECT USING (auth.uid()::text = user_id OR status = 'active');

-- Service role bypasses RLS automatically in Supabase
