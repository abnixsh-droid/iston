import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { handleGoogleRedirect } from './lib/googleAuth';
import { captureReferral } from './lib/referral';

handleGoogleRedirect();
captureReferral();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
