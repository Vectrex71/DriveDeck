/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize the Firebase instance securely
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();

// Request ONLY the scopes the user enabled
provider.addScope('https://www.googleapis.com/auth/drive.appdata');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
provider.addScope('https://www.googleapis.com/auth/tasks');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
provider.addScope('https://www.googleapis.com/auth/userinfo.email');

// Do not force "consent" every time to prevent annoying Google security warning emails and repetitive permission approval screens.
provider.setCustomParameters({
  prompt: 'select_account'
});

interface AuthListener {
  onSuccess: (user: User, token: string) => void;
  onFailure: () => void;
}
const listeners = new Set<AuthListener>();

let isSigningIn = false;
let cachedAccessToken: string | null = null;

const saveTokenToStorage = (token: string) => {
  try {
    sessionStorage.setItem('drive_access_token', token);
    localStorage.setItem('drive_access_token', token);
    localStorage.setItem('drive_token_timestamp', Date.now().toString());
  } catch (e) {
    console.warn('[Auth] Error writing token to storage:', e);
  }
};

const clearTokenFromStorage = () => {
  try {
    sessionStorage.removeItem('drive_access_token');
    localStorage.removeItem('drive_access_token');
    localStorage.removeItem('drive_token_timestamp');
  } catch (e) {
    console.warn('[Auth] Error clearing token from storage:', e);
  }
};

try {
  const sessionToken = sessionStorage.getItem('drive_access_token');
  const localToken = localStorage.getItem('drive_access_token');
  const tokenTimestampStr = localStorage.getItem('drive_token_timestamp');
  
  const tokenToUse = sessionToken || localToken;
  
  if (tokenToUse) {
    let isExpired = false;
    if (tokenTimestampStr) {
      const timestamp = parseInt(tokenTimestampStr, 10);
      if (!isNaN(timestamp)) {
        // Access tokens expire in 1 hour (3600s), invalidate after 50 minutes to be safe
        const ageMs = Date.now() - timestamp;
        if (ageMs > 50 * 60 * 1000) {
          isExpired = true;
        }
      }
    }
    
    if (isExpired) {
      console.log('[Auth] Cached Google access token of age has expired (> 50min). Clearing cache.');
      clearTokenFromStorage();
    } else {
      cachedAccessToken = tokenToUse;
    }
  }
} catch (e) {
  console.warn('[Auth] Storage is not fully accessible:', e);
}

// Initialize auth listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  const listener = {
    onSuccess: onAuthSuccess || (() => {}),
    onFailure: onAuthFailure || (() => {})
  };
  listeners.add(listener);

  const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        listener.onSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        listener.onFailure();
      }
    } else {
      cachedAccessToken = null;
      listener.onFailure();
    }
  });

  return () => {
    unsubscribe();
    listeners.delete(listener);
  };
};

// Initiate Google Popup Sign in (Triggered by button click interaction)
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Fehler beim Abrufen des Google Access Tokens');
    }

    cachedAccessToken = credential.accessToken;
    saveTokenToStorage(cachedAccessToken);

    // Immediately trigger all success listeners with the fresh credentials
    listeners.forEach(listener => {
      listener.onSuccess(result.user, cachedAccessToken!);
    });

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    const isCancelled = 
      error?.code === 'auth/cancelled-popup-request' ||
      error?.code === 'auth/popup-closed-by-user';
    if (isCancelled) {
      console.log('[Auth] Google Sign-In Fenster wurde vom Nutzer geschlossen oder abgebrochen.');
      return null;
    }
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Initiate Google Redirect Sign in (100% reliable workaround for popup blocker and Safari mobile)
export const googleSignInRedirect = async (): Promise<void> => {
  try {
    isSigningIn = true;
    await signInWithRedirect(auth, provider);
  } catch (error: any) {
    console.error('Google Redirect Sign-In error:', error);
    isSigningIn = false;
    throw error;
  }
};

// Handle redirect results on page load
export const handleRedirectResult = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
        saveTokenToStorage(cachedAccessToken);

        // Notify all registered listeners
        listeners.forEach(listener => {
          listener.onSuccess(result.user, cachedAccessToken!);
        });

        return { user: result.user, accessToken: cachedAccessToken };
      }
    }
  } catch (error: any) {
    console.error('getRedirectResult process error:', error);
    throw error;
  }
  return null;
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  clearTokenFromStorage();
  
  // Immediately notify all failure listeners to update UI
  listeners.forEach(listener => {
    listener.onFailure();
  });
};
