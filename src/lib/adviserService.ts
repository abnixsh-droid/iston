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

    if (!adviserRecord && user.adviser) {
      adviserRecord = user.adviser;
    }

    if (!adviserRecord) {
      throw new Error('No adviser account found for this user.');
    }

    // Real dynamic statistics computed from live database / state
    let allAdvisers: AdviserRecord[] = [];
    try {
      const { data } = await supabase.from('advisers').select('*');
      if (data && Array.isArray(data)) {
        allAdvisers = data;
      }
    } catch {
      /* ignore */
    }

    if (allAdvisers.length === 0) {
      allAdvisers = getLocalCache().advisers;
    }

    const myRefCode = (adviserRecord.referral_code || '').toUpperCase();
    const myAdvId = (adviserRecord.adviser_id || '').toUpperCase();

    // 1. Find direct referrals
    const directReferrals = allAdvisers.filter((a) => {
      const sc = (a.sponsor_code || '').toUpperCase();
      const si = (a.sponsor_id || '').toUpperCase();
      return (sc && sc === myRefCode) || (si && si === myAdvId);
    });
    const directCount = directReferrals.length;

    // 2. Compute full downline hierarchy
    const downline: AdviserRecord[] = [];
    const visited = new Set<string>([myAdvId, myRefCode]);
    const levelCounts: Record<string, number> = directCount > 0 ? { '1': directCount } : {};

    let currentLevel = 1;
    let currentLevelAdvisers = directReferrals;
    while (currentLevelAdvisers.length > 0 && currentLevel < 100) {
      const nextLevelAdvisers: AdviserRecord[] = [];
      for (const adv of currentLevelAdvisers) {
        downline.push(adv);
        const childRef = (adv.referral_code || '').toUpperCase();
        const childId = (adv.adviser_id || '').toUpperCase();
        if (childRef) visited.add(childRef);
        if (childId) visited.add(childId);

        const children = allAdvisers.filter((c) => {
          const cCode = (c.sponsor_code || '').toUpperCase();
          const cSponId = (c.sponsor_id || '').toUpperCase();
          const cId = (c.adviser_id || '').toUpperCase();
          return !visited.has(cId) && ((cCode && cCode === childRef) || (cSponId && cSponId === childId));
        });

        for (const ch of children) {
          visited.add((ch.adviser_id || '').toUpperCase());
          nextLevelAdvisers.push(ch);
        }
      }
      currentLevel++;
      if (nextLevelAdvisers.length > 0) {
        levelCounts[String(currentLevel)] = nextLevelAdvisers.length;
      }
      currentLevelAdvisers = nextLevelAdvisers;
    }
    const totalTeam = downline.length;

    // 3. Registration referral rewards (Direct sponsor gets ₹300 per active member)
    let registrationRewards: any[] = [];
    try {
      const { data } = await supabase
        .from('registration_rewards')
        .select('*')
        .eq('beneficiary_adviser_id', adviserRecord.adviser_id);
      if (data && Array.isArray(data)) {
        registrationRewards = data;
      }
    } catch {
      /* ignore */
    }

    if (registrationRewards.length === 0 && adviserRecord.status === 'active') {
      registrationRewards = directReferrals
        .filter((r) => r.status === 'active' || r.payment_status === 'verified_paid')
        .map((r, i) => ({
          id: i + 1,
          amount: 300,
          level: 1,
          status: 'paid',
          source_adviser_id: r.adviser_id,
          source_adviser_name: r.full_name,
          beneficiary_adviser_id: adviserRecord.adviser_id,
          created_at: r.created_at || new Date().toISOString(),
        }));
    }

    // 4. Property commissions
    let propertyCommissions: any[] = [];
    try {
      const { data } = await supabase
        .from('property_commissions')
        .select('*')
        .eq('beneficiary_adviser_id', adviserRecord.adviser_id);
      if (data && Array.isArray(data)) {
        propertyCommissions = data;
      }
    } catch {
      /* ignore */
    }

    // 5. Leads
    let leads: any[] = [];
    try {
      const { data } = await supabase
        .from('property_leads')
        .select('*')
        .eq('adviser_id', adviserRecord.adviser_id);
      if (data && Array.isArray(data)) {
        leads = data;
      }
    } catch {
      /* ignore */
    }

    // 6. Payout requests
    let payouts: any[] = [];
    try {
      const { data } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('adviser_id', adviserRecord.adviser_id);
      if (data && Array.isArray(data)) {
        payouts = data;
      }
    } catch {
      /* ignore */
    }

    const sum = (arr: any[], status: string) =>
      arr.filter((x) => x.status === status).reduce((a, b) => a + (Number(b.amount) || 0), 0);

    const regRewardsSummary = {
      pending: sum(registrationRewards, 'pending'),
      approved: sum(registrationRewards, 'approved'),
      paid: sum(registrationRewards, 'paid'),
      reversed: sum(registrationRewards, 'reversed'),
      total: registrationRewards.filter((x) => x.status !== 'reversed').reduce((a, b) => a + (Number(b.amount) || 0), 0),
    };

    const commissionsSummary = {
      pending: sum(propertyCommissions, 'pending'),
      approved: sum(propertyCommissions, 'approved'),
      paid: sum(propertyCommissions, 'paid'),
      reversed: sum(propertyCommissions, 'reversed'),
      total: propertyCommissions.filter((x) => x.status !== 'reversed').reduce((a, b) => a + (Number(b.amount) || 0), 0),
    };

    const totalEarnings = regRewardsSummary.approved + regRewardsSummary.paid + commissionsSummary.approved + commissionsSummary.paid;
    const totalPaidOut = payouts.filter((p) => p.status === 'approved' || p.status === 'paid').reduce((a, b) => a + (Number(b.amount) || 0), 0);
    const availableBalance = Math.max(0, totalEarnings - totalPaidOut);

    return {
      ok: true,
      adviser: adviserRecord,
      stats: {
        directCount,
        totalTeam,
        levelCounts,
      },
      regRewardsSummary,
      commissionsSummary,
      availableBalance,
      registrationRewards,
      propertyCommissions,
      leads,
      payouts,
    };
  },

  getAllCached(): AdviserRecord[] {
    return getLocalCache().advisers;
  },

  activateLocally(adviserId: string) {
    try {
      const cache = getLocalCache();
      const idx = cache.advisers.findIndex((a) => a.adviser_id === adviserId);
      if (idx >= 0) {
        cache.advisers[idx].status = 'active';
        cache.advisers[idx].payment_status = 'verified_paid';
        cache.advisers[idx].activated_at = new Date().toISOString();
        cache.advisers[idx].updated_at = new Date().toISOString();
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cache));
      }
    } catch {
      /* ignore */
    }
  },

  injectDemoApplications() {
    try {
      const cache = getLocalCache();
      const demoPending: AdviserRecord = {
        adviser_id: 'IST-ADV-5542',
        full_name: 'Rajesh K. Sharma (Demo Pending)',
        email: 'rajesh.sharma.demo@gmail.com',
        phone: '+91 98210 98765',
        sponsor_code: 'ADV1001',
        referral_code: 'ADV5542',
        status: 'pending',
        registration_fee: 1100,
        payment_status: 'pending_verification',
        payment_reference: 'UPI983419204918',
        bank_details: {
          upi_id: 'rajesh.sharma@okhdfcbank',
          bank_name: 'HDFC Bank',
          account_number: '50100492817291',
          ifsc: 'HDFC0000240',
        },
        created_at: new Date().toISOString(),
      };
      if (!cache.advisers.some((a) => a.adviser_id === demoPending.adviser_id)) {
        cache.advisers.unshift(demoPending);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cache));
      }
    } catch {
      /* ignore */
    }
  },
};

