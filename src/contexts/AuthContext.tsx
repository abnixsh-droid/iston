import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { DEMO_EMAIL, getDemoToken, onDemoChange } from '../lib/demoSession';

export type AppUser = { email: string | null; emailVerified: boolean; demo?: boolean };
type AuthState = { user: AppUser | null; loading: boolean };
const AuthContext = createContext<AuthState>({ user: null, loading: true });

const demoUser = (): AppUser | null => (getDemoToken() ? { email: DEMO_EMAIL, emailVerified: true, demo: true } : null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [fbUser, setFbUser] = useState<User | null>(null);
  const [demo, setDemo] = useState<AppUser | null>(demoUser());
  const [loading, setLoading] = useState<boolean>(!!auth);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => {
      setFbUser(u);
      setLoading(false);
    });
  }, []);
  useEffect(() => onDemoChange(() => setDemo(demoUser())), []);

  const user: AppUser | null = fbUser ? { email: fbUser.email, emailVerified: fbUser.emailVerified } : demo;
  return <AuthContext.Provider value={{ user, loading: loading && !demo }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
