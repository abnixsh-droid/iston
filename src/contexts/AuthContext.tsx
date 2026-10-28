import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as fbSignOut } from 'firebase/auth';
import type { User as FbUser } from 'firebase/auth';
import { auth, firebaseReady } from '../lib/firebase';
import supabase from '../lib/supabase';
import { DEMO_EMAIL, getDemoToken, onDemoChange, demoLogout } from '../lib/demoSession';
import { api } from '../lib/api';

export type AppUser = {
  id: string;
  email: string | null;
  emailVerified: boolean;
  displayName?: string | null;
  photoURL?: string | null;
  provider: 'firebase' | 'supabase' | 'demo';
  role: 'admin' | 'user';
  isAdmin: boolean;
  isAdviser: boolean;
  adviserId?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adviser?: any;
  demo?: boolean;
};

type AuthState = {
  user: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  isAdviser: boolean;
  signInWithGoogle: () => Promise<void>;
  loginAsAdminDirect: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  isAdmin: false,
  isAdviser: false,
  signInWithGoogle: async () => {},
  loginAsAdminDirect: async () => {},
  signOut: async () => {},
  refreshUser: async () => {},
});

const getDemoUser = (): AppUser | null =>
  getDemoToken()
    ? {
        id: 'demo',
        email: DEMO_EMAIL,
        emailVerified: true,
        displayName: 'Demo Admin',
        provider: 'demo',
        role: 'admin',
        isAdmin: true,
        isAdviser: false,
        demo: true,
      }
    : null;

const CACHED_USER_KEY = 'iston_cached_auth_user';

function getCachedUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(CACHED_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCachedUser(u: AppUser | null) {
  try {
    if (u) localStorage.setItem(CACHED_USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(CACHED_USER_KEY);
  } catch {
    /* ignore */
  }
}

import { getDemoAdviserSession } from '../lib/demoSession';

function getInitialUser(): AppUser | null {
  const demoAdv = getDemoAdviserSession();
  if (demoAdv) {
    return {
      id: demoAdv.user_id,
      email: demoAdv.email,
      emailVerified: true,
      displayName: demoAdv.full_name,
      provider: 'demo',
      role: 'user',
      isAdmin: false,
      isAdviser: demoAdv.status === 'active',
      adviserId: demoAdv.adviser_id,
      adviser: demoAdv,
      demo: true,
    };
  }
  const demoAdmin = getDemoUser();
  if (demoAdmin) return demoAdmin;
  return getCachedUser();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(getInitialUser());
  const [loading, setLoading] = useState<boolean>(!getInitialUser());
  const [tick, setTick] = useState<number>(0);

  const refreshUser = useCallback(async () => {
    setTick((t) => t + 1);
  }, []);

  // Sync profile with backend API to verify server-side authorization and update DB
  const syncProfile = useCallback(async (baseUser: Partial<AppUser>) => {
    try {
      const res = await api<{ ok: boolean; user: Record<string, unknown>; adviser: Record<string, unknown> | null }>(
        '/api/user',
        { auth: true }
      );
      if (res?.ok && res.user) {
        const u = res.user;
        const appUser: AppUser = {
          id: String(u.id || baseUser.id || 'usr'),
          email: String(u.email || baseUser.email || ''),
          emailVerified: !!u.email_verified,
          displayName: (u.display_name as string) || baseUser.displayName || null,
          photoURL: (u.photo_url as string) || baseUser.photoURL || null,
          provider: (baseUser.provider as 'firebase' | 'supabase' | 'demo') || 'firebase',
          role: u.role === 'admin' ? 'admin' : 'user',
          isAdmin: !!u.isAdmin,
          isAdviser: !!u.is_adviser,
          adviserId: (u.adviser_id as string) || null,
          adviser: res.adviser || null,
          demo: !!baseUser.demo,
        };
        setUser(appUser);
        setCachedUser(appUser);
        return;
      }
    } catch {
      // If sync API fails, fallback to verified client token state
    }

    if (baseUser.email) {
      const email = baseUser.email.toLowerCase();
      const isKnownAdmin =
        email === 'abnixsh@gmail.com' ||
        email === 'sitaramchaurasiya8@gmail.com' ||
        baseUser.demo === true;

      let adv: any = null;
      try {
        const { data } = await supabase.from('advisers').select('*').eq('email', email).maybeSingle();
        if (data) adv = data;
      } catch {
        /* ignore */
      }

      // Check local cache if supabase didn't return
      if (!adv) {
        try {
          const raw = localStorage.getItem('iston_advisers_state_cache');
          if (raw) {
            const cache = JSON.parse(raw);
            adv = cache.advisers?.find((a: any) => a.email.toLowerCase() === email) || null;
          }
        } catch {
          /* ignore */
        }
      }

      const appUser: AppUser = {
        id: baseUser.id || 'user',
        email: baseUser.email,
        emailVerified: !!baseUser.emailVerified,
        displayName: baseUser.displayName || null,
        photoURL: baseUser.photoURL || null,
        provider: baseUser.provider || 'firebase',
        role: isKnownAdmin ? 'admin' : 'user',
        isAdmin: isKnownAdmin,
        isAdviser: !!adv && adv.status === 'active',
        adviserId: adv?.adviser_id || null,
        adviser: adv,
        demo: !!baseUser.demo,
      };
      setUser(appUser);
      setCachedUser(appUser);
    }
  }, []);

  // Handle Demo changes
  useEffect(() => {
    return onDemoChange(() => {
      const demoAdv = getDemoAdviserSession();
      if (demoAdv) {
        const appUser: AppUser = {
          id: demoAdv.user_id,
          email: demoAdv.email,
          emailVerified: true,
          displayName: demoAdv.full_name,
          provider: 'demo',
          role: 'user',
          isAdmin: false,
          isAdviser: demoAdv.status === 'active',
          adviserId: demoAdv.adviser_id,
          adviser: demoAdv,
          demo: true,
        };
        setUser(appUser);
        setCachedUser(appUser);
        setLoading(false);
        return;
      }
      const d = getDemoUser();
      if (d) {
        setUser(d);
        setCachedUser(d);
        setLoading(false);
      }
    });
  }, []);

  // Primary Auth Listener: Firebase or Supabase Auth
  useEffect(() => {
    let unsubFb: (() => void) | undefined;
    let cancelled = false;

    async function initAuth() {
      // 1. Check Demo Adviser
      const demoAdv = getDemoAdviserSession();
      if (demoAdv) {
        setUser({
          id: demoAdv.user_id,
          email: demoAdv.email,
          emailVerified: true,
          displayName: demoAdv.full_name,
          provider: 'demo',
          role: 'user',
          isAdmin: false,
          isAdviser: demoAdv.status === 'active',
          adviserId: demoAdv.adviser_id,
          adviser: demoAdv,
          demo: true,
        });
        setLoading(false);
        return;
      }

      // 2. Check Demo Admin
      if (getDemoToken()) {
        setUser(getDemoUser());
        setLoading(false);
        return;
      }

      async function handleNoFirebaseSession() {
        // Check Supabase Auth before resetting
        try {
          const { data } = await supabase.auth.getSession();
          if (cancelled) return;
          if (data.session?.user) {
            const su = data.session.user;
            await syncProfile({
              id: su.id,
              email: su.email,
              emailVerified: !!su.email_confirmed_at,
              displayName: (su.user_metadata?.full_name as string) || (su.user_metadata?.name as string) || null,
              photoURL: (su.user_metadata?.avatar_url as string) || (su.user_metadata?.picture as string) || null,
              provider: 'supabase',
            });
            return;
          }
        } catch {
          /* ignore */
        }

        // If neither has session and no demo active, only then clear
        if (!getDemoToken() && !getDemoAdviserSession()) {
          setCachedUser(null);
          setUser(null);
        }
      }

      // 3. Attach Firebase Auth if configured
      if (auth && firebaseReady) {
        unsubFb = onAuthStateChanged(auth, async (fbUser: FbUser | null) => {
          if (cancelled) return;
          if (fbUser) {
            await syncProfile({
              id: fbUser.uid,
              email: fbUser.email,
              emailVerified: fbUser.emailVerified,
              displayName: fbUser.displayName,
              photoURL: fbUser.photoURL,
              provider: 'firebase',
            });
          } else {
            await handleNoFirebaseSession();
          }
          setLoading(false);
        });
        return;
      }

      // 4. Supabase direct check
      await handleNoFirebaseSession();
      setLoading(false);
    }

    initAuth();

    // Listen for Supabase auth state changes
    const { data: suListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return;
      if (session?.user) {
        const su = session.user;
        await syncProfile({
          id: su.id,
          email: su.email,
          emailVerified: !!su.email_confirmed_at,
          displayName: (su.user_metadata?.full_name as string) || (su.user_metadata?.name as string) || null,
          photoURL: (su.user_metadata?.avatar_url as string) || (su.user_metadata?.picture as string) || null,
          provider: 'supabase',
        });
      }
    });

    return () => {
      cancelled = true;
      if (unsubFb) unsubFb();
      suListener.subscription.unsubscribe();
    };
  }, [syncProfile, tick]);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      if (auth && firebaseReady) {
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          await signInWithPopup(auth, provider);
          return;
        } catch (fbErr: any) {
          console.warn('Firebase Google Sign-In failed, attempting Supabase fallback:', fbErr?.code || fbErr?.message);
          if (fbErr?.code === 'auth/popup-closed-by-user') {
            return;
          }
          if (fbErr?.code === 'auth/unauthorized-domain') {
            alert(
              'Domain authorization notice:\nPlease add istongroupbuilder.in to Authorized Domains in your Firebase Console (Authentication -> Settings -> Authorized Domains).\n\nNow attempting Supabase Google OAuth fallback...'
            );
          }
        }
      }

      // Supabase OAuth Fallback
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      alert(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loginAsAdminDirect = useCallback(async (email: string) => {
    const adminUser: AppUser = {
      id: 'admin-' + Date.now(),
      email: email.toLowerCase(),
      emailVerified: true,
      displayName: email.toLowerCase() === 'sitaramchaurasiya8@gmail.com' ? 'Sitaram Chaurasiya' : 'Administrator',
      photoURL: null,
      provider: 'supabase',
      role: 'admin',
      isAdmin: true,
      isAdviser: false,
    };
    setUser(adminUser);
    setCachedUser(adminUser);
    // Also store token so backend/mock APIs accept admin requests
    try {
      localStorage.setItem('iston_demo_session', JSON.stringify({
        token: `admin.${btoa(adminUser.email || '')}.auth`,
        exp: Date.now() + 24 * 3600 * 1000,
      }));
    } catch {}
  }, []);

  const signOut = async () => {
    demoLogout();
    setCachedUser(null);
    if (auth?.currentUser) {
      try {
        await fbSignOut(auth);
      } catch {
        /* ignore */
      }
    }
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin: !!user?.isAdmin,
        isAdviser: !!user?.isAdviser,
        signInWithGoogle,
        loginAsAdminDirect,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
