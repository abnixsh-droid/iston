import { initializeApp, getApps } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';

// Firebase web config — set these as environment variables (Secrets tab / Hostinger env):
// VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseReady = !!(config.apiKey && config.authDomain && config.projectId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
if (firebaseReady) {
  app = getApps()[0] || initializeApp(config);
  auth = getAuth(app);
}

export { auth };
