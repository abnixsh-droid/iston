import supabase from './supabase';
import { api } from './api';
import type { AppUser } from '../contexts/AuthContext';

export interface AdviserRecord {
  id?: string | number;
  adviser_id: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone: string;
  sponsor_id?: string | null;
  sponsor_code?: string | null;
  referral_code: string;
  depth_level?: number;
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  registration_fee?: number;
  payment_status: 'pending_payment' | 'pending_verification' | 'verified_paid';
  payment_reference?: string | null;
  bank_details?: {
    upi_id?: string;
    account_number?: string;
    ifsc?: string;
    bank_name?: string;
  };
  created_at?: string;
  activated_at?: string | null;
  updated_at?: string;
}

const LOCAL_STORAGE_KEY = 'iston_advisers_state_cache';

function getLocalCache(): { advisers: AdviserRecord[] } {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { advisers: [] };
}

function saveLocalCache(adviser: AdviserRecord) {
  try {
    const cache = getLocalCache();
    const idx = cache.advisers.findIndex((a) => a.email.toLowerCase() === adviser.email.toLowerCase());
    if (idx >= 0) {
      cache.advisers[idx] = { ...cache.advisers[idx], ...adviser };
    } else {
      cache.advisers.push(adviser);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
}

export const adviserService = {
  /**
   * Validate sponsor referral code
   */
  async getSponsor(code: string): Promise<{ ok: boolean; sponsor?: any; error?: string }> {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return { ok: false, error: 'Sponsor code is required.' };

    // 1. Try API first
    try {
      const res = await api<{ ok: boolean; sponsor: any }>(
        `/api/advisers?action=get_sponsor&code=${encodeURIComponent(normalized)}`
      );
      if (res?.ok && res.sponsor) return res;
    } catch {
      // Fallback to Supabase
    }

    // 2. Direct Supabase query
    try {
      const { data, error } = await supabase
        .from('advisers')
        .select('adviser_id, referral_code, full_name, status')
        .or(`referral_code.ilike.${normalized},adviser_id.ilike.${normalized}`)
        .maybeSingle();

      if (!error && data) {
        return {
          ok: true,
          sponsor: {
            adviser_id: data.adviser_id,
            referral_code: data.referral_code,
            full_name: data.full_name,
            status: data.status,
            isActive: data.status === 'active',
          },
        };
      }
    } catch {
      // Fallback to local cache
    }

    // 3. Check local cache
    const cached = getLocalCache().advisers.find(
      (a) => a.referral_code.toUpperCase() === normalized || a.adviser_id.toUpperCase() === normalized
    );
    if (cached) {
      return {
        ok: true,
        sponsor: {
          adviser_id: cached.adviser_id,
          referral_code: cached.referral_code,
          full_name: cached.full_name,
          status: cached.status,
          isActive: cached.status === 'active',
        },
      };
    }

    return { ok: false, error: 'Invalid or unknown sponsor referral code.' };
  },

  /**
   * Register authenticated user as an Adviser
   */
  async register(
    payload: {
      full_name: string;
      phone: string;
      sponsor_code?: string;
      bank_details?: any;
    },
    user: AppUser
  ): Promise<{ ok: boolean; adviser?: AdviserRecord; error?: string }> {
    if (!user || !user.email) {
      return { ok: false, error: 'You must be signed in with Google to apply.' };
    }

    // 1. Try API endpoint
    try {
      const res = await api<{ ok: boolean; adviser: AdviserRecord }>('/api/advisers', {
        method: 'POST',
        auth: true,
        body: {
          action: 'register',
          full_name: payload.full_name.trim(),
          phone: payload.phone.trim(),
          sponsor_code: payload.sponsor_code?.trim().toUpperCase() || undefined,
          bank_details: payload.bank_details || {},
        },
      });
      if (res?.ok && res.adviser) {
        saveLocalCache(res.adviser);
        return res;
      }
    } catch {
      // Fall through to direct Supabase write
    }

    // 2. Direct Supabase write
    const email = user.email.toLowerCase();
    const nextSeq = Math.floor(1000 + Math.random() * 9000).toString();
    const adviserId = `IST-ADV-${nextSeq}`;
    const referralCode = `ADV${nextSeq}`;

    const newAdviser: AdviserRecord = {
      adviser_id: adviserId,
      user_id: user.id,
      full_name: payload.full_name.trim(),
      phone: payload.phone.trim(),
      email,
      referral_code: referralCode,
      sponsor_code: payload.sponsor_code?.trim().toUpperCase() || null,
      status: 'pending',
      registration_fee: 1100,
      payment_status: 'pending_payment',
      payment_reference: null,
      bank_details: payload.bank_details || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await supabase.from('advisers').upsert(newAdviser, { onConflict: 'email' });
      await supabase.from('user_profiles').update({ is_adviser: true, adviser_id: adviserId }).eq('email', email);
    } catch {
      /* ignore Supabase schema errors, state is preserved in local cache */
    }

    saveLocalCache(newAdviser);
    return { ok: true, adviser: newAdviser };
  },

  /**
   * Submit UPI payment transaction reference (UTR)
   */
  async submitPayment(
    transactionId: string,
    user: AppUser
  ): Promise<{ ok: boolean; adviser?: AdviserRecord; error?: string }> {
    const utr = transactionId.trim();
    if (!utr || utr.length < 4) {
      return { ok: false, error: 'Please enter a valid UPI Transaction ID / UTR number.' };
    }

    // 1. Try API endpoint
    try {
      const res = await api<{ ok: boolean; adviser: AdviserRecord }>('/api/advisers', {
        method: 'POST',
        auth: true,
        body: {
          action: 'submit_payment',
          transaction_id: utr,
        },
      });
      if (res?.ok && res.adviser) {
        saveLocalCache(res.adviser);
        return res;
      }
    } catch {
      // Fall through to direct Supabase update
    }

    // 2. Direct Supabase update
    const email = (user.email || '').toLowerCase();
    const updatedFields = {
      payment_status: 'pending_verification' as const,
      payment_reference: utr,
      updated_at: new Date().toISOString(),
    };

    try {
      await supabase.from('advisers').update(updatedFields).eq('email', email);
    } catch {
      /* ignore */
    }

    const cached = getLocalCache().advisers.find((a) => a.email.toLowerCase() === email);
    const updatedAdviser: AdviserRecord = {
      ...(cached || {
        adviser_id: `IST-ADV-PENDING`,
        full_name: user.displayName || 'Adviser',
        email,
        phone: '',
        referral_code: 'PENDING',
        status: 'pending',
        registration_fee: 1100,
        payment_status: 'pending_verification',
      }),
      ...updatedFields,
    };

    saveLocalCache(updatedAdviser);
    return { ok: true, adviser: updatedAdviser };
  },

  /**
   * Load Adviser dashboard data
   */
  async getDashboard(user: AppUser): Promise<{
    ok: boolean;
    adviser: AdviserRecord;
    stats: { directCount: number; totalTeam: number; levelCounts: Record<string, number> };
    regRewardsSummary: { pending: number; approved: number; paid: number; reversed: number; total: number };
    commissionsSummary: { pending: number; approved: number; paid: number; reversed: number; total: number };
    availableBalance: number;
    registrationRewards: any[];
    propertyCommissions: any[];
    leads: any[];
    payouts: any[];
    error?: string;
  }> {
    if (!user || !user.email) {
      throw new Error('Not authenticated');
    }

    // 1. Try API endpoint
    try {
      const res = await api<any>('/api/advisers?action=get_dashboard', { auth: true });
      if (res?.ok && res.adviser) {
        saveLocalCache(res.adviser);
        return res;
      }
    } catch {
      // Fall through to direct Supabase / local cache
    }

    // 2. Direct Supabase query
    const email = user.email.toLowerCase();
    let adviserRecord: AdviserRecord | null = null;

    try {
      const { data } = await supabase.from('advisers').select('*').eq('email', email).maybeSingle();
      if (data) adviserRecord = data;
    } catch {
      /* ignore */
    }

    if (!adviserRecord) {
      const cached = getLocalCache().advisers.find((a) => a.email.toLowerCase() === email);
      if (cached) adviserRecord = cached;
    }

    if (!adviserRecord) {
      throw new Error('No adviser account found for this user.');
    }

    // Fallback default statistics
    return {
      ok: true,
      adviser: adviserRecord,
      stats: {
        directCount: 0,
        totalTeam: 0,
        levelCounts: { '1': 0, '2': 0, '3': 0 },
      },
      regRewardsSummary: { pending: 0, approved: 0, paid: 0, reversed: 0, total: 0 },
      commissionsSummary: { pending: 0, approved: 0, paid: 0, reversed: 0, total: 0 },
      availableBalance: 0,
      registrationRewards: [],
      propertyCommissions: [],
      leads: [],
      payouts: [],
    };
  },
};
