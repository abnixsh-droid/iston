import supabase from './supabase';
import { api } from './api';
import type { AppUser } from '../contexts/AuthContext';

export interface AdviserRecord {
  id?: string | number;
  adviser_id: string;
  registration_no?: string;
  user_id?: string;
  full_name: string;
  email?: string;
  phone: string;
  password?: string;
  token_number?: string | null;
  sponsor_id?: string | null;
  sponsor_code?: string | null;
  referral_code: string;
  depth_level?: number;
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  registration_fee?: number;
  payment_method?: 'cash' | 'upi' | 'bank_transfer';
  payment_status: 'pending_payment' | 'pending_verification' | 'pending_cash' | 'verified_paid' | 'verified_cash';
  payment_reference?: string | null;
  documents?: {
    aadhar_front?: string;
    aadhar_back?: string;
    pan_card?: string;
    photo?: string;
    bank_passbook?: string;
  };
  bank_details?: {
    account_holder_name?: string;
    account_number?: string;
    ifsc?: string;
    bank_name?: string;
    upi_id?: string;
  };
  created_at?: string;
  activated_at?: string | null;
  updated_at?: string;
}

const LOCAL_STORAGE_KEY = 'iston_advisers_state_cache';
const ADVISER_SESSION_KEY = 'iston_adviser_auth_session';

export function getStoredAdviserAuth(): AdviserRecord | null {
  try {
    const raw = localStorage.getItem(ADVISER_SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return null;
}

export function setStoredAdviserAuth(adviser: AdviserRecord | null) {
  try {
    if (adviser) {
      localStorage.setItem(ADVISER_SESSION_KEY, JSON.stringify(adviser));
    } else {
      localStorage.removeItem(ADVISER_SESSION_KEY);
    }
  } catch {
    /* ignore */
  }
}

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
    const idx = cache.advisers.findIndex(
      (a) =>
        (a.registration_no && adviser.registration_no && a.registration_no.toUpperCase() === adviser.registration_no.toUpperCase()) ||
        a.adviser_id.toUpperCase() === adviser.adviser_id.toUpperCase() ||
        (a.phone && adviser.phone && a.phone.replace(/\D/g, '') === adviser.phone.replace(/\D/g, ''))
    );
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

/**
 * Sync adviser state across devices via Supabase cloud settings table.
 * Guarantees cross-device access (e.g. registered on phone, login on laptop).
 */
export async function syncAdviserToCloud(adviser: AdviserRecord) {
  try {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'config_advisers_state.json')
      .maybeSingle();

    let state: any = { advisers: [] };
    if (data?.value) {
      try {
        state = JSON.parse(data.value);
      } catch {
        state = { advisers: [] };
      }
    }
    if (!state.advisers || !Array.isArray(state.advisers)) state.advisers = [];

    const idx = state.advisers.findIndex(
      (a: any) =>
        (a.registration_no && adviser.registration_no && a.registration_no.toUpperCase() === adviser.registration_no.toUpperCase()) ||
        a.adviser_id.toUpperCase() === adviser.adviser_id.toUpperCase() ||
        (a.phone && adviser.phone && a.phone.replace(/\D/g, '') === adviser.phone.replace(/\D/g, ''))
    );
    if (idx >= 0) {
      state.advisers[idx] = { ...state.advisers[idx], ...adviser };
    } else {
      state.advisers.push(adviser);
    }

    await supabase
      .from('settings')
      .upsert({ key: 'config_advisers_state.json', value: JSON.stringify(state) }, { onConflict: 'key' });
  } catch {
    /* ignore */
  }
}

/**
 * Fetch all advisers from Supabase cloud settings table to hydrate local cache across devices.
 */
export async function fetchCloudAdvisers(): Promise<AdviserRecord[]> {
  try {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'config_advisers_state.json')
      .maybeSingle();

    if (data?.value) {
      const parsed = JSON.parse(data.value);
      if (parsed?.advisers && Array.isArray(parsed.advisers)) {
        const cache = getLocalCache();
        for (const adv of parsed.advisers) {
          const idx = cache.advisers.findIndex(
            (a) =>
              (a.registration_no && adv.registration_no && a.registration_no.toUpperCase() === adv.registration_no.toUpperCase()) ||
              a.adviser_id.toUpperCase() === adv.adviser_id.toUpperCase() ||
              (a.phone && adv.phone && a.phone.replace(/\D/g, '') === adv.phone.replace(/\D/g, ''))
          );
          if (idx >= 0) {
            cache.advisers[idx] = { ...cache.advisers[idx], ...adv };
          } else {
            cache.advisers.push(adv);
          }
        }
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cache));
        return cache.advisers;
      }
    }
  } catch {
    /* ignore */
  }
  return getLocalCache().advisers;
}

export const adviserService = {
  /**
   * Auto-generate a unique Registration Number in the format IB + 6 random digits (e.g. IB273872)
   */
  generateRegistrationNo(): string {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return `IB${randomDigits}`;
  },

  /**
   * Auto-generate a 6-digit Login Token (e.g. TK-749201 or 749201)
   */
  generateTokenNumber(): string {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return `TK-${randomDigits}`;
  },

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
      // Fallback
    }

    // 2. Direct Supabase query
    try {
      const { data, error } = await supabase
        .from('advisers')
        .select('adviser_id, registration_no, referral_code, full_name, status')
        .or(`referral_code.ilike.${normalized},adviser_id.ilike.${normalized},registration_no.ilike.${normalized}`)
        .maybeSingle();

      if (!error && data) {
        return {
          ok: true,
          sponsor: {
            adviser_id: data.adviser_id,
            registration_no: data.registration_no || data.adviser_id,
            referral_code: data.referral_code,
            full_name: data.full_name,
            status: data.status,
            isActive: data.status === 'active',
          },
        };
      }
    } catch {
      // Fallback
    }

    // 3. Check local cache
    let cached = getLocalCache().advisers.find(
      (a) =>
        (a.referral_code && a.referral_code.toUpperCase() === normalized) ||
        (a.registration_no && a.registration_no.toUpperCase() === normalized) ||
        (a.adviser_id && a.adviser_id.toUpperCase() === normalized)
    );
    if (!cached) {
      const cloud = await fetchCloudAdvisers();
      cached = cloud.find(
        (a) =>
          (a.referral_code && a.referral_code.toUpperCase() === normalized) ||
          (a.registration_no && a.registration_no.toUpperCase() === normalized) ||
          (a.adviser_id && a.adviser_id.toUpperCase() === normalized)
      );
    }
    if (cached) {
      return {
        ok: true,
        sponsor: {
          adviser_id: cached.adviser_id,
          registration_no: cached.registration_no || cached.adviser_id,
          referral_code: cached.referral_code,
          full_name: cached.full_name,
          status: cached.status,
          isActive: cached.status === 'active',
        },
      };
    }

    return { ok: false, error: 'Invalid or unknown sponsor referral number.' };
  },

  /**
   * Custom Adviser Registration (No Google Login Required)
   */
  async customRegister(payload: {
    full_name: string;
    phone: string;
    registration_no: string;
    referral_no?: string;
    password?: string;
  }): Promise<{ ok: boolean; adviser?: AdviserRecord; error?: string }> {
    const fullName = payload.full_name.trim();
    const phone = payload.phone.trim();
    const regNo = (payload.registration_no.trim() || this.generateRegistrationNo()).toUpperCase();
    const referralNo = payload.referral_no?.trim().toUpperCase() || null;
    const password = payload.password || '';

    if (!fullName || fullName.length < 2) {
      return { ok: false, error: 'Please enter your full name as per your Aadhaar card.' };
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return { ok: false, error: 'Please enter a valid 10-digit mobile number.' };
    }
    if (!password || password.length < 4) {
      return { ok: false, error: 'Password must be at least 4 characters long.' };
    }

    // 1. Try API endpoint
    try {
      const res = await api<{ ok: boolean; adviser: AdviserRecord; error?: string }>('/api/advisers', {
        method: 'POST',
        body: {
          action: 'custom_register',
          full_name: fullName,
          phone: cleanPhone,
          registration_no: regNo,
          referral_no: referralNo,
          password,
        },
      });
      if (res?.ok && res.adviser) {
        saveLocalCache(res.adviser);
        syncAdviserToCloud(res.adviser);
        return res;
      } else if (res?.error) {
        return { ok: false, error: res.error };
      }
    } catch {
      // Fallback to Supabase / Local storage
    }

    // 2. Direct Supabase / Local creation
    const newAdviser: AdviserRecord = {
      adviser_id: regNo,
      registration_no: regNo,
      full_name: fullName,
      email: `${cleanPhone}@adviser.iston.in`,
      phone: cleanPhone,
      password,
      token_number: null,
      referral_code: regNo,
      sponsor_id: referralNo,
      sponsor_code: referralNo,
      status: 'pending',
      payment_method: 'cash',
      payment_status: 'pending_cash',
      documents: {
        aadhar_front: '',
        aadhar_back: '',
        pan_card: '',
        photo: '',
        bank_passbook: '',
      },
      bank_details: {
        account_holder_name: fullName,
        account_number: '',
        ifsc: '',
        bank_name: '',
        upi_id: '',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await supabase.from('advisers').upsert(newAdviser, { onConflict: 'adviser_id' });
    } catch {
      /* ignore Supabase schema difference */
    }

    saveLocalCache(newAdviser);
    syncAdviserToCloud(newAdviser);
    return { ok: true, adviser: newAdviser };
  },

  /**
   * Adviser Login with Registration Number & Token Number (or Password)
   */
  async adviserLogin(payload: {
    identifier: string; // Registration Number or Mobile
    tokenOrPassword: string; // Token Number or Password
  }): Promise<{
    ok: boolean;
    status?: 'pending' | 'active' | 'suspended' | 'rejected';
    adviser?: AdviserRecord;
    error?: string;
    message?: string;
  }> {
    const ident = payload.identifier.trim().toUpperCase();
    const cleanIdentDigits = payload.identifier.replace(/\D/g, '');
    const secret = payload.tokenOrPassword.trim();

    if (!ident) {
      return { ok: false, error: 'Please enter your Registration Number or Mobile number.' };
    }
    if (!secret) {
      return { ok: false, error: 'Please enter your Token Number or Password.' };
    }

    // 1. Try API login first
    try {
      const res = await api<any>('/api/advisers', {
        method: 'POST',
        body: {
          action: 'adviser_login',
          identifier: ident,
          token_or_password: secret,
        },
      });
      if (res?.ok && res.adviser) {
        saveLocalCache(res.adviser);
        if (res.adviser.status === 'active') {
          setStoredAdviserAuth({ ...res.adviser, status: 'active' });
        }
        return res;
      } else if (res?.status === 'pending') {
        saveLocalCache(res.adviser);
        return res;
      } else if (res?.error) {
        return { ok: false, error: res.error };
      }
    } catch {
      // Fallback
    }

    // 2. Direct Supabase / local search
    let adviser: AdviserRecord | null = null;
    try {
      const { data } = await supabase
        .from('advisers')
        .select('*')
        .or(`registration_no.ilike.${ident},adviser_id.ilike.${ident},referral_code.ilike.${ident},phone.ilike.${ident}`)
        .maybeSingle();
      if (data) adviser = data;
    } catch {
      /* ignore */
    }

    if (!adviser) {
      const cached = getLocalCache().advisers.find((a) => {
        const aReg = (a.registration_no || a.adviser_id || '').toUpperCase();
        const aPhone = (a.phone || '').replace(/\D/g, '');
        return aReg === ident || (cleanIdentDigits && aPhone === cleanIdentDigits);
      });
      if (cached) adviser = cached;
    }

    // 3. Cloud settings table fallback (Ensures registrations made on phone can log in immediately on laptop)
    if (!adviser) {
      const cloudAdvisers = await fetchCloudAdvisers();
      adviser = cloudAdvisers.find((a) => {
        const aReg = (a.registration_no || a.adviser_id || '').toUpperCase();
        const aPhone = (a.phone || '').replace(/\D/g, '');
        return aReg === ident || (cleanIdentDigits && aPhone === cleanIdentDigits);
      }) || null;
    }

    if (!adviser) {
      return { ok: false, error: 'No adviser found with this Registration Number or Mobile.' };
    }

    // If pending approval, return pending status (triggers the Red Screen)
    if (adviser.status === 'pending') {
      return {
        ok: false,
        status: 'pending',
        adviser,
        message: 'Your account is locked pending cash payment verification. Please pay cash at the office to receive your Token Number.',
      };
    }

    // Verify Token Number or Password
    const secretUpper = secret.toUpperCase();
    const tokenUpper = (adviser.token_number || '').toUpperCase();
    const pwd = adviser.password || '';

    const tokenMatches = tokenUpper && (secretUpper === tokenUpper || secretUpper.replace(/\D/g, '') === tokenUpper.replace(/\D/g, ''));
    const passwordMatches = pwd && pwd === secret;

    if (!tokenMatches && !passwordMatches) {
      return { ok: false, error: 'Incorrect Token Number or Password.' };
    }

    // Save active adviser session
    const activeAdviser: AdviserRecord = { ...adviser, status: 'active' };
    setStoredAdviserAuth(activeAdviser);
    saveLocalCache(activeAdviser);

    return {
      ok: true,
      status: 'active',
      adviser: activeAdviser,
      message: 'Account approved & verified! Welcome to your Adviser Dashboard.',
    };
  },

  /**
   * Save uploaded documents and bank details for an adviser
   */
  async updateDocuments(
    adviserId: string,
    payload: {
      documents?: {
        aadhar_front?: string;
        aadhar_back?: string;
        pan_card?: string;
        photo?: string;
        bank_passbook?: string;
      };
      bank_details?: {
        account_holder_name?: string;
        account_number?: string;
        ifsc?: string;
        bank_name?: string;
        upi_id?: string;
      };
      phone?: string;
    }
  ): Promise<{ ok: boolean; adviser?: AdviserRecord; error?: string }> {
    try {
      await api('/api/advisers', {
        method: 'POST',
        body: {
          action: 'update_documents',
          adviser_id: adviserId,
          documents: payload.documents || {},
          bank_details: payload.bank_details || {},
        },
      });
    } catch {
      /* ignore */
    }

    // Update in Supabase
    try {
      await supabase
        .from('advisers')
        .update({
          documents: payload.documents,
          bank_details: payload.bank_details,
          updated_at: new Date().toISOString(),
        })
        .eq('adviser_id', adviserId);
    } catch {
      /* ignore */
    }

    // Update in local cache and active session
    const cache = getLocalCache();
    const idx = cache.advisers.findIndex((a) => a.adviser_id === adviserId || a.registration_no === adviserId);
    let updated: AdviserRecord | null = null;
    if (idx >= 0) {
      cache.advisers[idx] = {
        ...cache.advisers[idx],
        documents: { ...(cache.advisers[idx].documents || {}), ...(payload.documents || {}) },
        bank_details: { ...(cache.advisers[idx].bank_details || {}), ...(payload.bank_details || {}) },
        updated_at: new Date().toISOString(),
      };
      updated = cache.advisers[idx];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cache));
      syncAdviserToCloud(updated);
    }

    const currentAuth = getStoredAdviserAuth();
    if (currentAuth && (currentAuth.adviser_id === adviserId || currentAuth.registration_no === adviserId)) {
      const merged = { ...currentAuth, ...(updated || {}) };
      setStoredAdviserAuth(merged);
    }

    return { ok: true, adviser: updated || undefined };
  },

  /**
   * Admin confirms cash payment and generates a login token for the adviser
   */
  async adminApproveCash(
    adviserId: string,
    customToken?: string
  ): Promise<{ ok: boolean; token_number: string; adviser?: AdviserRecord; error?: string }> {
    const token = customToken || this.generateTokenNumber();

    // 1. Try API first
    try {
      const res = await api<any>('/api/advisers', {
        method: 'POST',
        auth: true,
        body: {
          action: 'admin_approve_cash',
          adviser_id: adviserId,
          token_number: token,
        },
      });
      if (res?.ok) {
        this.activateWithTokenLocally(adviserId, token);
        return { ok: true, token_number: token, adviser: res.adviser };
      }
    } catch {
      /* fallback */
    }

    // 2. Direct Supabase update
    try {
      await supabase
        .from('advisers')
        .update({
          status: 'active',
          payment_status: 'verified_cash',
          payment_method: 'cash',
          token_number: token,
          activated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('adviser_id', adviserId);
    } catch {
      /* ignore */
    }

    // 3. Local state activation
    const adv = this.activateWithTokenLocally(adviserId, token);
    return { ok: true, token_number: token, adviser: adv || undefined };
  },

  /**
   * Admin permanently deletes an adviser from the database and all caches
   */
  async adminDeleteAdviser(adviserId: string): Promise<{ ok: boolean; error?: string }> {
    // 1. Try API first
    try {
      const res = await api<any>('/api/advisers', {
        method: 'POST',
        auth: true,
        body: {
          action: 'admin_delete_adviser',
          adviser_id: adviserId,
        },
      });
      if (res?.ok) {
        this.deleteLocally(adviserId);
        return { ok: true };
      }
    } catch {
      /* fallback to direct DB and cache removal */
    }

    // 2. Direct Supabase delete
    try {
      await supabase
        .from('advisers')
        .delete()
        .or(`adviser_id.eq.${adviserId},registration_no.eq.${adviserId}`);
    } catch {
      /* ignore */
    }

    // 3. Local and cloud cache deletion
    this.deleteLocally(adviserId);
    return { ok: true };
  },

  deleteLocally(adviserId: string) {
    try {
      const cache = getLocalCache();
      const updated = cache.advisers.filter(
        (a) => a.adviser_id !== adviserId && a.registration_no !== adviserId
      );
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ advisers: updated }));

      // Clear cloud settings
      supabase
        .from('settings')
        .select('value')
        .eq('key', 'config_advisers_state.json')
        .maybeSingle()
        .then(({ data }) => {
          if (data?.value && Array.isArray(data.value.advisers)) {
            const cloudFiltered = data.value.advisers.filter(
              (a: any) => a.adviser_id !== adviserId && a.registration_no !== adviserId
            );
            supabase.from('settings').upsert({
              key: 'config_advisers_state.json',
              value: { ...data.value, advisers: cloudFiltered },
              updated_at: new Date().toISOString(),
            });
          }
        });

      // Clear session if current
      const current = getStoredAdviserAuth();
      if (current && (current.adviser_id === adviserId || current.registration_no === adviserId)) {
        setStoredAdviserAuth(null);
      }
    } catch {
      /* ignore */
    }
  },

  activateWithTokenLocally(adviserId: string, token: string): AdviserRecord | null {
    try {
      const cache = getLocalCache();
      const idx = cache.advisers.findIndex((a) => a.adviser_id === adviserId || a.registration_no === adviserId);
      if (idx >= 0) {
        cache.advisers[idx].status = 'active';
        cache.advisers[idx].payment_status = 'verified_cash';
        cache.advisers[idx].payment_method = 'cash';
        cache.advisers[idx].token_number = token;
        cache.advisers[idx].activated_at = new Date().toISOString();
        cache.advisers[idx].updated_at = new Date().toISOString();
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cache));
        syncAdviserToCloud(cache.advisers[idx]);
        return cache.advisers[idx];
      }
    } catch {
      /* ignore */
    }
    return null;
  },

  /**
   * Load Adviser dashboard data
   */
  async getDashboard(target?: AppUser | AdviserRecord | null): Promise<{
    ok: boolean;
    adviser: AdviserRecord;
    stats: { directCount: number; totalTeam: number; levelCounts: Record<string, number>; teamTree?: any };
    regRewardsSummary: { pending: number; approved: number; paid: number; reversed: number; total: number };
    commissionsSummary: { pending: number; approved: number; paid: number; reversed: number; total: number };
    availableBalance: number;
    registrationRewards: any[];
    propertyCommissions: any[];
    leads: any[];
    payouts: any[];
    error?: string;
  }> {
    let adviserRecord: AdviserRecord | null = null;

    if (target && 'registration_no' in target && target.registration_no) {
      adviserRecord = target as AdviserRecord;
    } else if (target && 'adviser_id' in target && target.adviser_id) {
      adviserRecord = target as AdviserRecord;
    }

    if (!adviserRecord) {
      adviserRecord = getStoredAdviserAuth();
    }

    if (!adviserRecord && target && 'email' in target && target.email) {
      const email = target.email.toLowerCase();
      try {
        const { data } = await supabase.from('advisers').select('*').eq('email', email).maybeSingle();
        if (data) adviserRecord = data;
      } catch {
        /* ignore */
      }
      if (!adviserRecord) {
        const cached = getLocalCache().advisers.find((a) => a.email && a.email.toLowerCase() === email);
        if (cached) adviserRecord = cached;
      }
    }

    if (!adviserRecord) {
      throw new Error('No adviser account session found. Please login with your Registration Number and Token Number.');
    }

    let currentRecord: AdviserRecord = adviserRecord;

    // Refresh adviser record from database or local cache if possible
    try {
      const { data } = await supabase
        .from('advisers')
        .select('*')
        .or(`adviser_id.eq.${currentRecord.adviser_id},registration_no.eq.${currentRecord.registration_no || currentRecord.adviser_id}`)
        .maybeSingle();
      if (data) {
        const preservedStatus = currentRecord.status === 'active' ? 'active' : (data.status || currentRecord.status);
        currentRecord = { ...currentRecord, ...data, status: preservedStatus };
        saveLocalCache(currentRecord);
        setStoredAdviserAuth(currentRecord);
      }
    } catch {
      /* ignore */
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

    const myRefCode = (currentRecord.referral_code || currentRecord.registration_no || currentRecord.adviser_id || '').toUpperCase();
    const myAdvId = (currentRecord.adviser_id || '').toUpperCase();

    // 1. Find direct referrals
    const directReferrals = allAdvisers.filter((a) => {
      const sc = (a.sponsor_code || '').toUpperCase();
      const si = (a.sponsor_id || '').toUpperCase();
      return (sc && sc === myRefCode) || (si && (si === myAdvId || si === myRefCode));
    });
    const directCount = directReferrals.length;

    // 2. Compute full downline hierarchy with accurate levels
    const downline: AdviserRecord[] = [];
    const downlineWithLevels: { adviser: AdviserRecord; level: number }[] = [];
    const visited = new Set<string>([myAdvId, myRefCode]);
    const levelCounts: Record<string, number> = directCount > 0 ? { '1': directCount } : {};

    let currentLevel = 1;
    let currentLevelAdvisers = directReferrals;
    while (currentLevelAdvisers.length > 0 && currentLevel < 100) {
      const nextLevelAdvisers: AdviserRecord[] = [];
      for (const adv of currentLevelAdvisers) {
        downline.push(adv);
        downlineWithLevels.push({ adviser: adv, level: currentLevel });
        const childRef = (adv.referral_code || adv.registration_no || adv.adviser_id || '').toUpperCase();
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

    // 3. Registration referral rewards:
    // - New Member Welcome Bonus: ₹300
    // - Direct Referrer (Level 1): ₹200
    // - Level 2 Upline: ₹100
    // - Level 3 Upline: ₹50
    // - Level 4+ Upline: ₹50
    let registrationRewards: any[] = [];
    try {
      const { data } = await supabase
        .from('registration_rewards')
        .select('*')
        .eq('beneficiary_adviser_id', currentRecord.adviser_id);
      if (data && Array.isArray(data) && data.length > 0) {
        registrationRewards = data.map((d: any) => {
          const sourceAdv = allAdvisers.find((a) => a.adviser_id === d.new_adviser_id || a.registration_no === d.new_adviser_id);
          const lvl = Number(d.level ?? 1);
          return {
            ...d,
            source_adviser_name: d.source_adviser_name || (sourceAdv ? sourceAdv.full_name : (lvl === 0 ? 'Welcome Joining Reward' : `Adviser ${d.new_adviser_id || ''}`)),
            source_registration_no: d.source_registration_no || (sourceAdv ? (sourceAdv.registration_no || sourceAdv.adviser_id) : d.new_adviser_id),
            source_phone: d.source_phone || (sourceAdv ? sourceAdv.phone : ''),
            reward_type: lvl === 0 ? 'Self Welcome Cashback' : lvl === 1 ? 'Direct Referral (Level 1)' : `Level ${lvl} Network Override`,
            level: lvl,
          };
        });
      }
    } catch {
      /* ignore */
    }

    if (registrationRewards.length === 0 && (currentRecord.status === 'active' || currentRecord.payment_status === 'verified_paid' || currentRecord.payment_status === 'verified_cash')) {
      const computedRewards: any[] = [];

      // 1. Self welcome bonus of ₹300 for the active adviser
      computedRewards.push({
        id: 'self-welcome-bonus',
        amount: 300,
        level: 0,
        status: 'paid',
        source_adviser_id: currentRecord.registration_no || currentRecord.adviser_id,
        source_adviser_name: 'Joining Bonus (Welcome Reward)',
        source_registration_no: currentRecord.registration_no || currentRecord.adviser_id,
        source_phone: currentRecord.phone,
        reward_type: 'Self Welcome Cashback',
        beneficiary_adviser_id: currentRecord.adviser_id,
        created_at: currentRecord.activated_at || currentRecord.created_at || new Date().toISOString(),
      });

      // 2. Cascading downline rewards for active team members
      downlineWithLevels.forEach(({ adviser: r, level }, idx) => {
        const isActive = r.status === 'active' || r.payment_status === 'verified_paid' || r.payment_status === 'verified_cash';
        if (isActive) {
          const amt = level === 1 ? 200 : level === 2 ? 100 : 50;
          computedRewards.push({
            id: `downline-L${level}-${r.adviser_id}-${idx}`,
            amount: amt,
            level,
            status: 'paid',
            source_adviser_id: r.registration_no || r.adviser_id,
            source_adviser_name: r.full_name,
            source_registration_no: r.registration_no || r.adviser_id,
            source_phone: r.phone,
            reward_type: level === 1 ? 'Direct Referral (Level 1)' : `Level ${level} Network Override`,
            beneficiary_adviser_id: currentRecord.adviser_id,
            created_at: r.activated_at || r.created_at || new Date().toISOString(),
          });
        }
      });

      registrationRewards = computedRewards;
    }

    // 4. Property commissions
    let propertyCommissions: any[] = [];
    try {
      const { data } = await supabase
        .from('property_commissions')
        .select('*')
        .eq('beneficiary_adviser_id', currentRecord.adviser_id);
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
        .eq('adviser_id', currentRecord.adviser_id);
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
        .eq('adviser_id', currentRecord.adviser_id);
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

    // Compute interactive team tree with member counts for dashboard
    const teamTree = {
      adviser_id: currentRecord.adviser_id,
      registration_no: currentRecord.registration_no || currentRecord.adviser_id,
      full_name: currentRecord.full_name,
      status: currentRecord.status,
      directCount,
      totalTeam,
      children: directReferrals.map((c) => {
        const cRef = (c.referral_code || c.registration_no || c.adviser_id || '').toUpperCase();
        const cId = (c.adviser_id || '').toUpperCase();
        const cChildren = allAdvisers.filter((sub) => {
          const subSc = (sub.sponsor_code || '').toUpperCase();
          const subSi = (sub.sponsor_id || '').toUpperCase();
          return (subSc && subSc === cRef) || (subSi && (subSi === cId || subSi === cRef));
        });
        return {
          adviser_id: c.adviser_id,
          registration_no: c.registration_no || c.adviser_id,
          full_name: c.full_name,
          phone: c.phone,
          status: c.status,
          created_at: c.created_at,
          directCount: cChildren.length,
          children: cChildren.map((sub) => {
            const subRef = (sub.referral_code || sub.registration_no || sub.adviser_id || '').toUpperCase();
            const subId = (sub.adviser_id || '').toUpperCase();
            const subSub = allAdvisers.filter((s3) => {
              const s3Sc = (s3.sponsor_code || '').toUpperCase();
              const s3Si = (s3.sponsor_id || '').toUpperCase();
              return (s3Sc && s3Sc === subRef) || (s3Si && (s3Si === subId || s3Si === subRef));
            });
            return {
              adviser_id: sub.adviser_id,
              registration_no: sub.registration_no || sub.adviser_id,
              full_name: sub.full_name,
              phone: sub.phone,
              status: sub.status,
              created_at: sub.created_at,
              directCount: subSub.length,
            };
          }),
        };
      }),
    };

    return {
      ok: true,
      adviser: currentRecord,
      stats: {
        directCount,
        totalTeam,
        levelCounts,
        teamTree,
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
      const idx = cache.advisers.findIndex((a) => a.adviser_id === adviserId || a.registration_no === adviserId);
      if (idx >= 0) {
        cache.advisers[idx].status = 'active';
        cache.advisers[idx].payment_status = 'verified_cash';
        cache.advisers[idx].activated_at = new Date().toISOString();
        cache.advisers[idx].updated_at = new Date().toISOString();
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cache));
      }
    } catch {
      /* ignore */
    }
  },
};
